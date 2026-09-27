/**
 * Architecture Diagram Analysis API Routes
 */

import { Router, Response } from "express";
import multer from "multer";
import { isAuthenticated } from "../replitAuth";
import { requireOrganization, type MultiTenantRequest } from "../middleware/multiTenant";
import { secureHandler, ValidationError } from "../utils/errorHandling";
import { diagramArchitectureService } from "../services/diagramArchitectureService";

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

export function registerDiagramRoutes(app: Router) {
  const router = Router();

  /**
   * POST /api/diagrams/analyze
   * Accepts uploaded architecture diagram image and extracts graph & NIST narratives
   */
  router.post(
    "/analyze",
    isAuthenticated,
    requireOrganization,
    upload.single("diagram"),
    secureHandler(async (req: MultiTenantRequest, res: Response) => {
      const file = (req as any).file;
      const { systemName, environment } = req.body;

      if (!file) {
        throw new ValidationError("Diagram image file must be provided under field 'diagram'.");
      }

      const graph = await diagramArchitectureService.extractArchitectureFromImage(
        file.buffer,
        file.mimetype || "image/png",
        { systemName, environment }
      );

      res.json({
        success: true,
        data: graph,
      });
    })
  );

  app.use("/api/diagrams", router);
}
