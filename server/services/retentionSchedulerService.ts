import { db } from "../db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { dataRetentionService } from "./dataRetentionService";
import { logger } from "../utils/logger";

interface RetentionRunSummary {
  runAt: string;
  organizationsScanned: number;
  archived: number;
  deleted: number;
  errors: number;
}

class RetentionSchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private lastRun: RetentionRunSummary | null = null;
  private readonly intervalMs: number;

  constructor() {
    const configured = Number(process.env.RETENTION_SCHEDULER_INTERVAL_MS || 6 * 60 * 60 * 1000);
    this.intervalMs = Number.isFinite(configured) && configured >= 60_000 ? configured : 6 * 60 * 60 * 1000;
  }

  start(): void {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    if (process.env.DISABLE_RETENTION_SCHEDULER === "true") {
      logger.info("Retention scheduler disabled via environment flag");
      return;
    }
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.runNow().catch((error) => {
        logger.error("Retention scheduler run failed", { error });
      });
    }, this.intervalMs);
    this.timer.unref?.();
    logger.info("Retention scheduler started", { intervalMs: this.intervalMs });
  }

  stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
    logger.info("Retention scheduler stopped");
  }

  async runNow(): Promise<RetentionRunSummary> {
    const activeOrgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.isActive, true));

    let archived = 0;
    let deleted = 0;
    let errors = 0;

    for (const org of activeOrgs) {
      try {
        const result = await dataRetentionService.enforceRetentionPolicies(org.id);
        archived += result.archived;
        deleted += result.deleted;
        errors += result.errors;
      } catch (error) {
        errors += 1;
        logger.error("Retention policy enforcement failed for organization", {
          organizationId: org.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const summary: RetentionRunSummary = {
      runAt: new Date().toISOString(),
      organizationsScanned: activeOrgs.length,
      archived,
      deleted,
      errors,
    };

    this.lastRun = summary;
    logger.info("Retention scheduler run completed", summary);
    return summary;
  }

  getStatus(): {
    running: boolean;
    intervalMs: number;
    lastRun: RetentionRunSummary | null;
  } {
    return {
      running: Boolean(this.timer),
      intervalMs: this.intervalMs,
      lastRun: this.lastRun,
    };
  }
}

export const retentionSchedulerService = new RetentionSchedulerService();
