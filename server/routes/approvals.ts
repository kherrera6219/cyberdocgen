import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { documents, type DocumentApproval } from "@shared/schema";

export function registerApprovalsRoutes(router: Router) {
  router.get("/", isAuthenticated, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const approvals = await storage.getDocumentApprovals(status);
      
      const enrichedApprovals = await Promise.all(
        approvals.map(async (approval) => {
          const document = await storage.getDocument(approval.documentId);
          return {
            ...approval,
            documentTitle: document?.title ?? "Unknown Document",
            documentFramework: document?.framework ?? "Unknown",
          };
        })
      );
      
      res.json(enrichedApprovals);
    } catch (error: any) {
      logger.error("Failed to fetch approvals", { error: error.message });
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });

  router.get("/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const approval = await storage.getDocumentApproval(id);
      
      if (!approval) {
        return res.status(404).json({ message: "Approval not found" });
      }
      
      const document = await storage.getDocument(approval.documentId);
      
      res.json({
        ...approval,
        documentTitle: document?.title ?? "Unknown Document",
        documentFramework: document?.framework ?? "Unknown",
      });
    } catch (error: any) {
      logger.error("Failed to fetch approval", { error: error.message, id: req.params.id });
      res.status(500).json({ message: "Failed to fetch approval" });
    }
  });

  router.post("/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      
      const approval = await storage.updateDocumentApproval(id, {
        status: "approved",
        comments: comment,
        approvedAt: new Date(),
      });
      
      if (!approval) {
        return res.status(404).json({ message: "Approval not found" });
      }
      
      logger.info("Approval approved", { id, userId: req.user?.claims?.sub });
      res.json(approval);
    } catch (error: any) {
      logger.error("Failed to approve", { error: error.message, id: req.params.id });
      res.status(500).json({ message: "Failed to approve" });
    }
  });

  router.post("/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      
      const approval = await storage.updateDocumentApproval(id, {
        status: "rejected",
        comments: comment,
        rejectedAt: new Date(),
      });
      
      if (!approval) {
        return res.status(404).json({ message: "Approval not found" });
      }
      
      logger.info("Approval rejected", { id, userId: req.user?.claims?.sub });
      res.json(approval);
    } catch (error: any) {
      logger.error("Failed to reject", { error: error.message, id: req.params.id });
      res.status(500).json({ message: "Failed to reject" });
    }
  });
}
