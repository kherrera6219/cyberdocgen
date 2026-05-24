import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { questionnaireSolverService } from "../services/questionnaireSolverService";
import { logger } from "../utils/logger";

const router = Router();

// ─── Multer – local upload directory ─────────────────────────────────────────
const uploadDir = path.join(process.cwd(), "data", "questionnaire-uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: CSV, XLSX, XLS`));
    }
  },
});

// ─── Helper: extract org id ───────────────────────────────────────────────────
function getOrgId(req: Request): string | null {
  return (req as any).organizationId || req.session?.organizationId || null;
}
function getUserId(req: Request): string | null {
  const sub = req.user?.claims?.sub;
  const id = req.user?.id;
  const sessionUserId = (req.session as any)?.userId;
  const raw = sub ?? id ?? sessionUserId ?? null;
  return raw != null ? String(raw) : null;
}

// ─── GET /api/questionnaire-solver ───────────────────────────────────────────
// List all solver jobs for the current organisation
router.get("/", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrgId(req);
    if (!organizationId) {
      res.status(400).json({ message: "Organization context required" });
      return;
    }
    const jobs = await storage.getQuestionnaireSolvers(organizationId);
    res.json(jobs);
  } catch (error) {
    logger.error("[QuestionnaireRoutes] Failed to list solver jobs:", error);
    res.status(500).json({ message: "Failed to retrieve questionnaire solver jobs" });
  }
});

// ─── GET /api/questionnaire-solver/:id ───────────────────────────────────────
router.get("/:id", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await storage.getQuestionnaireSolver(req.params.id);
    if (!job) {
      res.status(404).json({ message: "Solver job not found" });
      return;
    }
    res.json(job);
  } catch (error) {
    logger.error("[QuestionnaireRoutes] Failed to get solver job:", error);
    res.status(500).json({ message: "Failed to retrieve solver job" });
  }
});

// ─── POST /api/questionnaire-solver/upload ────────────────────────────────────
// Upload a CSV/XLSX questionnaire and kick off the background solver
router.post(
  "/upload",
  isAuthenticated,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = getOrgId(req);
      const userId = getUserId(req);

      if (!organizationId || !userId) {
        res.status(400).json({ message: "Authentication context required" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      // Create a job record
      const job = await storage.createQuestionnaireSolver({
        organizationId,
        createdBy: String(userId),
        fileName: req.file.originalname,
        filePath: req.file.path,
        status: "pending",
        totalQuestionsCount: 0,
        completedQuestionsCount: 0,
        questionsData: [],
      });

      logger.info(`[QuestionnaireRoutes] Created solver job ${job.id} for file: ${req.file.originalname}`);

      // Fire-and-forget – run in background
      questionnaireSolverService.solveQuestionnaire(job.id, userId).catch((err) => {
        logger.error(`[QuestionnaireRoutes] Background solver job ${job.id} failed:`, err);
      });

      res.status(202).json({
        message: "Questionnaire uploaded and solver started",
        jobId: job.id,
        status: "pending",
      });
    } catch (error) {
      logger.error("[QuestionnaireRoutes] Upload failed:", error);
      res.status(500).json({ message: "Failed to upload questionnaire" });
    }
  }
);

// ─── GET /api/questionnaire-solver/:id/download ───────────────────────────────
// Download completed answers as a CSV
router.get("/:id/download", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await storage.getQuestionnaireSolver(req.params.id);
    if (!job) {
      res.status(404).json({ message: "Solver job not found" });
      return;
    }
    if (job.status !== "completed") {
      res.status(409).json({ message: `Job is not completed yet (status: ${job.status})` });
      return;
    }

    const rows = (job.questionsData as any[]) || [];
    const csvLines = [
      "Question,Answer,Confidence,Citation",
      ...rows.map(
        (r) =>
          `"${String(r.question || "").replace(/"/g, '""')}","${String(r.response || "").replace(/"/g, '""')}",${r.confidence ?? 0},"${String(r.citation || "").replace(/"/g, '""')}"`
      ),
    ];

    const csvContent = csvLines.join("\n");
    const filename = `solved-questionnaire-${job.id}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    logger.error("[QuestionnaireRoutes] Download failed:", error);
    res.status(500).json({ message: "Failed to download questionnaire results" });
  }
});

// ─── DELETE /api/questionnaire-solver/:id ────────────────────────────────────
router.delete("/:id", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await storage.getQuestionnaireSolver(req.params.id);
    if (!job) {
      res.status(404).json({ message: "Solver job not found" });
      return;
    }

    // Remove physical file if present
    if (job.filePath && fs.existsSync(job.filePath)) {
      fs.unlinkSync(job.filePath);
    }

    await storage.deleteQuestionnaireSolver(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error("[QuestionnaireRoutes] Delete failed:", error);
    res.status(500).json({ message: "Failed to delete solver job" });
  }
});

export default router;
