/**
 * Git Pull Request Creator Service
 *
 * Generates autonomous, compliance-focused pull requests directly from
 * repository findings. When a code-level compliance gap is identified,
 * this service:
 *   1. Uses the AI orchestrator to generate a targeted code fix
 *   2. Creates a sanitised patch (no credential exposure)
 *   3. Stores the draft PR payload in repository_tasks for human review
 *   4. Optionally pushes the branch via the GitHub/GitLab API if credentials
 *      are configured in SystemConfigService
 *
 * Architecture note: The service is deliberately "human-in-the-loop" by
 * default. Draft PR payloads are always stored locally first; the remote push
 * is an opt-in step requiring explicit user approval from the UI.
 */

import crypto from 'crypto';
import { db } from '../db';
import {
  repositoryFindings,
  repositoryTasks,
  repositorySnapshots,
  type RepositoryFinding,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errorHandling';
import { auditService } from './auditService';
import { aiOrchestrator } from './aiOrchestrator';
import { agentToolLoggerService } from './agentToolLoggerService';
import { systemConfigService } from './systemConfigService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GitPrDraft {
  /** Unique draft ID stored in repository_tasks.description as JSON reference */
  draftId: string;
  findingId: string;
  snapshotId: string;
  organizationId: string;

  /** Proposed branch name, e.g. fix/soc2-cc6-1-input-validation */
  branchName: string;
  /** Human-readable PR title */
  title: string;
  /** Markdown PR body with control context, evidence, and fix rationale */
  body: string;

  /**
   * Map of filePath → proposed patch content (unified diff format).
   * Only populated when the AI produced a concrete file-level fix.
   */
  patches: Record<string, string>;

  /** Confidence score 0–1 from the AI model */
  confidence: number;
  /** AI model that generated the fix */
  aiModel: string;

  createdAt: Date;
  status: 'draft' | 'pushed' | 'merged' | 'rejected';

  /** Set when pushed to a remote VCS provider */
  remoteUrl?: string;
}

export interface GeneratePrOptions {
  /** Additional context from the user to guide the AI fix */
  userContext?: string;
  /** Target branch to merge into (default: main) */
  baseBranch?: string;
  /** Whether to attempt a remote push after generation */
  pushRemote?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Sanitises a finding summary into a valid git branch segment */
function toBranchSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/** Redacts common secret patterns from generated patch content */
function redactSecrets(content: string): string {
  // API keys, tokens, passwords in assignment/env patterns
  return content
    .replace(/(?:api[_-]?key|token|password|secret|credential)['":\s=]+["']?[\w\-./+]{8,}["']?/gi,
      (m) => m.replace(/["']?[\w\-./+]{8,}["']?$/, '"[REDACTED]"'))
    .replace(/(?:Bearer|Basic)\s+[\w\-./+=]{8,}/gi, (m) =>
      m.replace(/[\w\-./+=]{8,}$/, '[REDACTED]'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class GitPrCreatorService {
  /**
   * Generate a pull request draft from a repository finding.
   *
   * The AI is given the full finding context (control, framework, evidence
   * references, recommendation) and asked to produce:
   *   - A concrete code fix (where applicable)
   *   - A compliant PR title and body
   *   - A unified diff patch per affected file
   */
  async generateDraft(
    findingId: string,
    organizationId: string,
    userId: string,
    options: GeneratePrOptions = {}
  ): Promise<GitPrDraft> {
    const toolStart = Date.now();

    try {
      // 1. Load finding and verify org ownership
      const finding = await this.loadFinding(findingId, organizationId);

      // 2. Build AI prompt
      const prompt = this.buildPrompt(finding, options);

      // 3. Call AI orchestrator
      const aiResponse = await aiOrchestrator.generateContent({
        prompt,
        maxTokens: 4096,
        temperature: 0.2, // Low temp for deterministic code generation
      });

      // 4. Parse structured response (result is wrapped in GuardrailedResult)
      const rawContent = aiResponse.result.content;
      const parsed = this.parseAiResponse(rawContent);

      // 5. Build branch name
      const controlSlug = toBranchSlug(finding.controlId);
      const frameworkSlug = toBranchSlug(finding.framework);
      const draftId = crypto.randomUUID();
      const branchName = `fix/${frameworkSlug}-${controlSlug}-${draftId.slice(0, 8)}`;

      // 6. Redact any accidentally generated secrets from patches
      const sanitisedPatches: Record<string, string> = {};
      for (const [filePath, patch] of Object.entries(parsed.patches ?? {})) {
        sanitisedPatches[filePath] = redactSecrets(String(patch));
      }

      // 7. Build draft
      const draft: GitPrDraft = {
        draftId,
        findingId,
        snapshotId: finding.snapshotId,
        organizationId,
        branchName,
        title: parsed.title ?? `fix(${finding.framework}): Remediate ${finding.controlId}`,
        body: this.buildPrBody(finding, parsed, options.baseBranch ?? 'main'),
        patches: sanitisedPatches,
        confidence: aiResponse.blocked ? 0.5 : 0.75,
        aiModel: aiResponse.result.model ?? 'unknown',
        createdAt: new Date(),
        status: 'draft',
      };

      // 8. Persist as a repository task for human review
      await this.persistDraftAsTask(draft, userId);

      // 9. Audit log + agent tool log
      await auditService.logAction({
        action: 'create',
        entityType: 'git_pr_draft',
        entityId: draftId,
        userId,
        organizationId,
        ipAddress: 'system',
        metadata: {
          findingId,
          controlId: finding.controlId,
          framework: finding.framework,
          branchName,
          patchCount: Object.keys(sanitisedPatches).length,
        },
      });

      await agentToolLoggerService.logToolCall({
        organizationId,
        agentId: 'repo-compliance-agent',
        agentName: 'Git PR Creator',
        toolName: 'git_pr_creator',
        inputs: { findingId, controlId: finding.controlId },
        outputs: { draftId, branchName, patchCount: Object.keys(sanitisedPatches).length },
        status: 'success',
        durationMs: Date.now() - toolStart,
      });

      // 10. Optionally push to remote
      if (options.pushRemote) {
        await this.pushToRemote(draft, organizationId);
      }

      logger.info('Git PR draft generated', {
        draftId,
        findingId,
        branchName,
        aiModel: draft.aiModel,
        organizationId,
      });

      return draft;

    } catch (error) {
      const durationMs = Date.now() - toolStart;
      logger.error('Failed to generate PR draft', {
        findingId,
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      });

      await agentToolLoggerService.logToolCall({
        organizationId,
        agentId: 'repo-compliance-agent',
        agentName: 'Git PR Creator',
        toolName: 'git_pr_creator',
        inputs: { findingId },
        outputs: { error: error instanceof Error ? error.message : String(error) },
        status: 'error',
        durationMs,
      }).catch(() => {/* best-effort */});

      throw error instanceof AppError ? error : new AppError(
        'Failed to generate PR draft',
        500,
        'GIT_PR_GENERATION_ERROR'
      );
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private async loadFinding(findingId: string, organizationId: string): Promise<RepositoryFinding> {
    const [row] = await db
      .select({ finding: repositoryFindings })
      .from(repositoryFindings)
      .innerJoin(repositorySnapshots, eq(repositoryFindings.snapshotId, repositorySnapshots.id))
      .where(
        and(
          eq(repositoryFindings.id, findingId),
          eq(repositorySnapshots.organizationId, organizationId)
        )
      );

    if (!row) throw new NotFoundError('Repository finding not found');
    return row.finding;
  }

  private buildPrompt(finding: RepositoryFinding, options: GeneratePrOptions): string {
    const evidenceList = (finding.evidenceReferences as Array<{ filePath: string; lineNumbers?: number[] }> ?? [])
      .map(r => `  - ${r.filePath}${r.lineNumbers ? `:${r.lineNumbers.join(',')}` : ''}`)
      .join('\n');

    return `You are remediating a compliance finding in a codebase.

FINDING DETAILS:
- Control ID: ${finding.controlId}
- Framework: ${finding.framework}
- Status: ${finding.status}
- Confidence: ${finding.confidenceLevel}
- Summary: ${finding.summary}
- Recommendation: ${finding.recommendation ?? 'No specific recommendation provided.'}
- Affected files:
${evidenceList || '  (no specific files identified)'}

${options.userContext ? `ADDITIONAL CONTEXT FROM USER:\n${options.userContext}\n` : ''}

Generate a pull request to fix this compliance gap. Respond with ONLY valid JSON:
{
  "title": "<concise PR title, ≤72 chars>",
  "summary": "<2-3 sentence plain English explanation of the fix>",
  "patches": {
    "<relative/file/path.ts>": "<unified diff or full replacement code if file is short>"
  },
  "testingNotes": "<how to verify the fix works>",
  "breakingChanges": false
}

Rules:
- patches may be empty {} if the fix requires infrastructure or policy changes rather than code edits
- Never include secrets, credentials, or API keys in patches
- Keep patches minimal and focused on the compliance gap
- Use TypeScript/JavaScript idioms matching the project style`;
  }

  private parseAiResponse(content: string): {
    title?: string;
    summary?: string;
    patches?: Record<string, string>;
    testingNotes?: string;
    breakingChanges?: boolean;
  } {
    try {
      // Strip any accidental markdown fences
      const clean = content.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      return JSON.parse(clean);
    } catch {
      logger.warn('AI response was not valid JSON — using defaults');
      return { title: undefined, summary: content.slice(0, 200), patches: {} };
    }
  }

  private buildPrBody(
    finding: RepositoryFinding,
    parsed: { summary?: string; testingNotes?: string; breakingChanges?: boolean },
    baseBranch: string
  ): string {
    return `## Compliance Remediation: ${finding.controlId}

### Framework
**${finding.framework}** — Control \`${finding.controlId}\`

### Finding Summary
${finding.summary}

### AI-Generated Fix Summary
${parsed.summary ?? finding.recommendation ?? '_No description available._'}

### Affected Evidence
${(finding.evidenceReferences as Array<{ filePath: string }> ?? []).map(r => `- \`${r.filePath}\``).join('\n') || '_No specific file evidence recorded._'}

### Testing Notes
${parsed.testingNotes ?? '_Verify that the relevant compliance control now passes in the repository analysis scan._'}

### Review Checklist
- [ ] Fix correctly addresses the \`${finding.controlId}\` control requirement
- [ ] No secrets or credentials were introduced
- [ ] Existing tests still pass
- [ ] New tests added where applicable
${parsed.breakingChanges ? '- [ ] Breaking change documentation updated' : ''}

---
*This PR was auto-generated by CyberDocGen's AI Compliance Engine.*
*Base branch: \`${baseBranch}\` · Finding confidence: **${finding.confidenceLevel}***`;
  }

  private async persistDraftAsTask(draft: GitPrDraft, userId: string): Promise<void> {
    await db.insert(repositoryTasks).values({
      snapshotId: draft.snapshotId,
      findingId: draft.findingId,
      title: `🤖 PR Draft: ${draft.title}`,
      description: JSON.stringify({
        type: 'git_pr_draft',
        draftId: draft.draftId,
        branchName: draft.branchName,
        body: draft.body,
        patches: draft.patches,
        confidence: draft.confidence,
        aiModel: draft.aiModel,
        status: draft.status,
        createdAt: draft.createdAt.toISOString(),
      }),
      category: 'code_change',
      priority: 'high',
      status: 'open',
      assignedToRole: 'user',
    });
  }

  /**
   * Push the draft branch to a remote VCS provider.
   * Reads GitHub/GitLab credentials from SystemConfigService.
   * This is intentionally a separate step — the user must opt in.
   */
  private async pushToRemote(draft: GitPrDraft, organizationId: string): Promise<void> {
    try {
      const githubToken = await systemConfigService.get('github_access_token');
      const repoUrl = await systemConfigService.get('github_repo_url');

      if (!githubToken || !repoUrl) {
        logger.warn('Remote push skipped — GitHub credentials not configured', {
          organizationId,
          draftId: draft.draftId,
        });
        return;
      }

      // Extract owner/repo from URL
      const match = String(repoUrl).match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (!match) {
        logger.warn('Remote push skipped — could not parse GitHub repo URL', { repoUrl });
        return;
      }

      const [, owner, repo] = match;

      // Get default branch SHA
      const headRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
        { headers: { Authorization: `token ${String(githubToken)}`, 'User-Agent': 'CyberDocGen/1.0' } }
      );

      if (!headRes.ok) {
        logger.warn('Remote push skipped — could not get main branch SHA', {
          status: headRes.status,
        });
        return;
      }

      const headData = await headRes.json() as { object: { sha: string } };
      const mainSha: string = headData.object.sha;

      // Create branch
      const branchRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs`,
        {
          method: 'POST',
          headers: {
            Authorization: `token ${String(githubToken)}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CyberDocGen/1.0',
          },
          body: JSON.stringify({
            ref: `refs/heads/${draft.branchName}`,
            sha: mainSha,
          }),
        }
      );

      if (!branchRes.ok) {
        logger.warn('Remote branch creation failed', { status: branchRes.status, draftId: draft.draftId });
        return;
      }

      // Create PR
      const prRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: {
            Authorization: `token ${String(githubToken)}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CyberDocGen/1.0',
          },
          body: JSON.stringify({
            title: draft.title,
            body: draft.body,
            head: draft.branchName,
            base: 'main',
            draft: true,
          }),
        }
      );

      if (prRes.ok) {
        const prData = await prRes.json() as { html_url: string };
        draft.remoteUrl = prData.html_url;
        draft.status = 'pushed';
        logger.info('PR pushed to GitHub', { url: draft.remoteUrl, draftId: draft.draftId });
      } else {
        logger.warn('PR creation on GitHub failed', { status: prRes.status, draftId: draft.draftId });
      }

    } catch (error) {
      // Non-fatal — draft is still stored locally
      logger.warn('Remote push failed (non-fatal)', {
        error: error instanceof Error ? error.message : String(error),
        draftId: draft.draftId,
      });
    }
  }
}

export const gitPrCreatorService = new GitPrCreatorService();
