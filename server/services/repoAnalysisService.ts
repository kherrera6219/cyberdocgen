/**
 * Repository Analysis Service
 * 
 * Orchestrates the complete repository analysis workflow:
 * 1. Repository Overview - Extract system description
 * 2. Build & CI/CD - Analyze deployment pipeline
 * 3. Configuration & Secrets - Review configs and secrets management
 * 4. Authentication & Authorization - Analyze access controls
 * 5. Data Handling - Review encryption and data protection
 * 6. Operational Controls - Check logging, monitoring, backups
 * 7. Gap Identification - Identify missing controls
 * 
 * Features:
 * - Multi-phase execution with progress tracking
 * - LLM integration for deep code analysis
 * - Automatic finding generation
 * - Pause/resume capability
 * - Error recovery and retry logic
 */

import { db } from '../db';
import { 
  repositorySnapshots, 
  repositoryAnalysisRuns,
  repositoryFiles 
} from '@shared/schema';
import type { 
  InsertRepositoryAnalysisRun,
  RepositoryAnalysisRun 
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ConflictError } from '../utils/errorHandling';
import { auditService } from './auditService';
import { repoParserService } from './repoParserService';
import { codeSignalDetectorService } from './codeSignalDetectorService';
import type { CodeSignals } from './codeSignalDetectorService';
import { controlMappingService } from './controlMappingService';
import { repositoryFindingsService } from './repositoryFindingsService';

export type AnalysisDepth = 'structure_only' | 'security_relevant' | 'full';
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AnalysisPhase {
  name: string;
  description: string;
  execute: (context: AnalysisContext) => Promise<void>;
}

export interface AnalysisContext {
  snapshotId: string;
  runId: string;
  extractedPath: string;
  frameworks: string[];
  depth: AnalysisDepth;
  organizationId: string;
  userId: string;
  signals: CodeSignals;
  metrics: {
    filesAnalyzed: number;
    findingsGenerated: number;
    llmCallsMade: number;
    tokensUsed: number;
    costEstimate: number;
  };
}

export class RepoAnalysisService {
  private readonly phases: AnalysisPhase[] = [
    {
      name: 'Repository Overview',
      description: 'Extract system description and architecture',
      execute: this.executeOverviewPhase.bind(this),
    },
    {
      name: 'Build & CI/CD',
      description: 'Analyze build process and deployment pipeline',
      execute: this.executeBuildPhase.bind(this),
    },
    {
      name: 'Configuration & Secrets',
      description: 'Review configuration management and secrets handling',
      execute: this.executeConfigPhase.bind(this),
    },
    {
      name: 'Authentication & Authorization',
      description: 'Analyze access controls and user management',
      execute: this.executeAuthPhase.bind(this),
    },
    {
      name: 'Data Handling',
      description: 'Review data encryption and protection',
      execute: this.executeDataPhase.bind(this),
    },
    {
      name: 'Operational Controls',
      description: 'Check logging, monitoring, and backups',
      execute: this.executeOperationsPhase.bind(this),
    },
    {
      name: 'Gap Identification',
      description: 'Identify missing or partial controls',
      execute: this.executeGapPhase.bind(this),
    },
  ];

  /**
   * Start a new analysis run
   */
  async startAnalysis(
    snapshotId: string,
    frameworks: string[],
    depth: AnalysisDepth,
    organizationId: string,
    userId: string
  ): Promise<{ runId: string }> {
    try {
      // Verify snapshot exists and is indexed
      const [snapshot] = await db.select()
        .from(repositorySnapshots)
        .where(and(
          eq(repositorySnapshots.id, snapshotId),
          eq(repositorySnapshots.organizationId, organizationId)
        ));

      if (!snapshot) {
        throw new NotFoundError('Repository snapshot not found');
      }

      if (snapshot.status !== 'indexed') {
        throw new ConflictError('Repository must be indexed before analysis');
      }

      // Check for existing running analysis
      const [existingRun] = await db.select()
        .from(repositoryAnalysisRuns)
        .where(and(
          eq(repositoryAnalysisRuns.snapshotId, snapshotId),
          eq(repositoryAnalysisRuns.phaseStatus, 'running')
        ));

      if (existingRun) {
        throw new ConflictError('An analysis is already running for this repository');
      }

      // Create analysis run
      const [run] = await db.insert(repositoryAnalysisRuns).values({
        snapshotId,
        frameworks,
        analysisDepth: depth,
        phase: this.phases[0].name,
        phaseStatus: 'pending',
        progress: 0,
        startedAt: new Date(),
      } as InsertRepositoryAnalysisRun).returning();

      // Update snapshot status
      await db.update(repositorySnapshots)
        .set({
          status: 'analyzing',
          analysisPhase: this.phases[0].name,
          analysisStartedAt: new Date(),
        })
        .where(eq(repositorySnapshots.id, snapshotId));

      // Audit log
      await auditService.logAction({
        action: 'create',
        entityType: 'repository_analysis_run',
        entityId: run.id,
        userId,
        organizationId,
        ipAddress: 'system',
        metadata: {
          snapshotId,
          frameworks,
          depth,
        },
      });

      logger.info('Analysis run started', {
        runId: run.id,
        snapshotId,
        frameworks,
        depth,
      });

      // Execute analysis asynchronously (don't await)
      this.executeAnalysis(run.id, snapshot.extractedPath!, organizationId, userId)
        .catch(error => {
          logger.error('Analysis execution failed', {
            runId: run.id,
            error: error instanceof Error ? error.message : String(error),
          });
        });

      return { runId: run.id };

    } catch (error) {
      logger.error('Failed to start analysis', {
        snapshotId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to start analysis',
        500,
        'ANALYSIS_START_ERROR'
      );
    }
  }

  /**
   * Execute the complete analysis workflow
   */
  private async executeAnalysis(
    runId: string,
    extractedPath: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get run details
      const [run] = await db.select()
        .from(repositoryAnalysisRuns)
        .where(eq(repositoryAnalysisRuns.id, runId));

      if (!run) {
        throw new NotFoundError('Analysis run not found');
      }

      // Initialize context
      const context: AnalysisContext = {
        snapshotId: run.snapshotId,
        runId: run.id,
        extractedPath,
        frameworks: run.frameworks as string[],
        depth: run.analysisDepth as AnalysisDepth,
        organizationId,
        userId,
        signals: {
          auth: [],
          encryption: [],
          logging: [],
          accessControl: [],
          cicd: [],
          secretsWarnings: [],
          scannedFiles: 0,
          skippedFiles: 0,
        },
        metrics: {
          filesAnalyzed: 0,
          findingsGenerated: 0,
          llmCallsMade: 0,
          tokensUsed: 0,
          costEstimate: 0,
        },
      };

      // Execute phases sequentially
      for (let i = 0; i < this.phases.length; i++) {
        const phase = this.phases[i];
        
        // Update phase status
        await this.updateRunStatus(runId, {
          phase: phase.name,
          phaseStatus: 'running',
          progress: Math.round((i / this.phases.length) * 100),
        });

        try {
          // Execute phase
          await phase.execute(context);

          // Mark phase complete
          await this.updateRunStatus(runId, {
            phaseStatus: 'completed',
          });

          logger.info('Phase completed', {
            runId,
            phase: phase.name,
            progress: Math.round(((i + 1) / this.phases.length) * 100),
          });

        } catch (error) {
          logger.error('Phase failed', {
            runId,
            phase: phase.name,
            error: error instanceof Error ? error.message : String(error),
          });

          // Mark phase as failed
          await this.updateRunStatus(runId, {
            phaseStatus: 'failed',
            errorLog: {
              phase: phase.name,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
            },
          });

          throw error;
        }
      }

      // Analysis complete
      await this.completeAnalysis(runId, context);

    } catch (error) {
      logger.error('Analysis execution failed', {
        runId,
        error: error instanceof Error ? error.message : String(error),
      });

      await this.failAnalysis(runId, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Phase 1: Repository Overview
   */
  private async executeOverviewPhase(context: AnalysisContext): Promise<void> {
    logger.info('Executing overview phase', { runId: context.runId });

    // Read key documentation files
    const docFiles = await db.select()
      .from(repositoryFiles)
      .where(and(
        eq(repositoryFiles.snapshotId, context.snapshotId),
        eq(repositoryFiles.category, 'docs')
      ));

    context.metrics.filesAnalyzed += docFiles.length;

    // For now, just log - will add LLM analysis later
    logger.info('Overview phase: found documentation files', {
      count: docFiles.length,
      files: docFiles.map(f => f.fileName),
    });
  }

  /**
   * Phase 2: Build & CI/CD
   */
  private async executeBuildPhase(context: AnalysisContext): Promise<void> {
    logger.info('Executing build phase', { runId: context.runId });

    // Scan for CI/CD configurations
    const cicdSignals = await codeSignalDetectorService.scanForCICD(
      context.snapshotId,
      context.extractedPath
    );

    context.signals.cicd = cicdSignals;
    context.metrics.filesAnalyzed += cicdSignals.reduce((sum, s) => sum + s.files.length, 0);

    logger.info('Build phase: CI/CD analysis complete', {
      cicdPipelinesFound: cicdSignals.length,
    });
  }

  /**
   * Phase 3: Configuration & Secrets
   */
  private async executeConfigPhase(context: AnalysisContext): Promise<void> {
    logger.info('Executing config phase', { runId: context.runId });

    // Scan for hardcoded secrets
    const secretsWarnings = await codeSignalDetectorService.scanForSecrets(
      context.snapshotId,
      context.extractedPath
    );

    context.signals.secretsWarnings = secretsWarnings;

    if (secretsWarnings.length > 0) {
      logger.warn('Secrets detected in repository', {
        count: secretsWarnings.length,
        criticalCount: secretsWarnings.filter(w => w.severity === 'critical').length,
      });
    }
  }

  /**
   * Phase 4: Authentication & Authorization
   */
  private async executeAuthPhase(context: AnalysisContext): Promise<void> {
    logger.info('Executing auth phase', { runId: context.runId });

    // Scan for authentication patterns
    const authSignals = await codeSignalDetectorService.scanForAuthPatterns(
      context.snapshotId,
      context.extractedPath
    );

    context.signals.auth = authSignals;

    // Scan for access control
    const accessSignals = await codeSignalDetectorService.scanForAccessControl(
      context.snapshotId,
      context.extractedPath
    );

    context.signals.accessControl = accessSignals;

    logger.info('Auth phase complete', {
      authSignals: authSignals.length,
      accessControlSignals: accessSignals.length,
    });
  }

  /**
   * Phase 5: Data Handling
   */
  private async executeDataPhase(context: AnalysisContext): Promise<void> {
    logger.info('Executing data phase', { runId: context.runId });

    // Scan for encryption
    const encryptionSignals = await codeSignalDetectorService.scanForEncryption(
      context.snapshotId,
      context.extractedPath
    );

    context.signals.encryption = encryptionSignals;

    logger.info('Data phase complete', {
      encryptionSignals: encryptionSignals.length,
    });
  }

  /**
   * Phase 6: Operational Controls
   */
  private async executeOperationsPhase(context: AnalysisContext): Promise<void> {
    logger.info('Executing operations phase', { runId: context.runId });

    // Scan for logging
    const loggingSignals = await codeSignalDetectorService.scanForLogging(
      context.snapshotId,
      context.extractedPath
    );

    context.signals.logging = loggingSignals;

    logger.info('Operations phase complete', {
      loggingSignals: loggingSignals.length,
    });
  }

  /**
   * Phase 7: Gap Identification & Finding Generation
   */
  private async executeGapPhase(context: AnalysisContext): Promise<void> {
    logger.info('Executing gap identification phase', { runId: context.runId });

    // Generate findings for each framework
    for (const framework of context.frameworks) {
      const controlFindings = await controlMappingService.mapSignalsToControls(
        context.signals,
        framework
      );

      // Create findings in database
      const findings = await repositoryFindingsService.createFindings(
        context.snapshotId,
        context.organizationId,
        controlFindings,
        context.userId
      );

      context.metrics.findingsGenerated += findings.length;

      logger.info('Findings generated for framework', {
        framework,
        count: findings.length,
      });
    }
  }

  /**
   * Update analysis run status
   */
  private async updateRunStatus(
    runId: string,
    updates: {
      phase?: string;
      phaseStatus?: PhaseStatus;
      progress?: number;
      errorLog?: any;
    }
  ): Promise<void> {
    await db.update(repositoryAnalysisRuns)
      .set(updates)
      .where(eq(repositoryAnalysisRuns.id, runId));
  }

  /**
   * Complete analysis successfully
   */
  private async completeAnalysis(
    runId: string,
    context: AnalysisContext
  ): Promise<void> {
    // Update run metrics
    await db.update(repositoryAnalysisRuns)
      .set({
        phaseStatus: 'completed',
        progress: 100,
        filesAnalyzed: context.metrics.filesAnalyzed,
        findingsGenerated: context.metrics.findingsGenerated,
        llmCallsMade: context.metrics.llmCallsMade,
        tokensUsed: context.metrics.tokensUsed,
        costEstimate: context.metrics.costEstimate.toString(),
        completedAt: new Date(),
      })
      .where(eq(repositoryAnalysisRuns.id, runId));

    // Update snapshot
    await db.update(repositorySnapshots)
      .set({
        status: 'completed',
        analysisCompletedAt: new Date(),
      })
      .where(eq(repositorySnapshots.id, context.snapshotId));

    logger.info('Analysis completed successfully', {
      runId,
      snapshotId: context.snapshotId,
      metrics: context.metrics,
    });
  }

  /**
   * Mark analysis as failed
   */
  private async failAnalysis(runId: string, errorMessage: string): Promise<void> {
    const [run] = await db.select()
      .from(repositoryAnalysisRuns)
      .where(eq(repositoryAnalysisRuns.id, runId));

    if (!run) return;

    await db.update(repositoryAnalysisRuns)
      .set({
        phaseStatus: 'failed',
        errorLog: {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      })
      .where(eq(repositoryAnalysisRuns.id, runId));

    await db.update(repositorySnapshots)
      .set({
        status: 'failed',
        errorMessage,
      })
      .where(eq(repositorySnapshots.id, run.snapshotId));

    logger.error('Analysis failed', {
      runId,
      snapshotId: run.snapshotId,
      error: errorMessage,
    });
  }

  /**
   * Get analysis run status
   */
  async getAnalysisStatus(
    runId: string,
    organizationId: string
  ): Promise<RepositoryAnalysisRun> {
    try {
      const [run] = await db.select()
        .from(repositoryAnalysisRuns)
        .innerJoin(
          repositorySnapshots,
          eq(repositoryAnalysisRuns.snapshotId, repositorySnapshots.id)
        )
        .where(and(
          eq(repositoryAnalysisRuns.id, runId),
          eq(repositorySnapshots.organizationId, organizationId)
        ));

      if (!run) {
        throw new NotFoundError('Analysis run not found');
      }

      return run.repository_analysis_runs;

    } catch (error) {
      logger.error('Failed to get analysis status', {
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AppError ? error : new AppError(
        'Failed to get analysis status',
        500,
        'ANALYSIS_STATUS_ERROR'
      );
    }
  }
}

export const repoAnalysisService = new RepoAnalysisService();
