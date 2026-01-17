import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { asyncHandler, NotFoundError } from "../utils/routeHelpers";
import { z } from "zod";

const approvalActionSchema = z.object({
  comment: z.string().optional().default(""),
});

export function registerApprovalsRoutes(router: Router) {
  router.get("/", isAuthenticated, asyncHandler(async (req, res) => {
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
  }));

  router.get("/:id", isAuthenticated, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const approval = await storage.getDocumentApproval(id);
    
    if (!approval) {
      throw new NotFoundError("Approval not found");
    }
    
    const document = await storage.getDocument(approval.documentId);
    
    res.json({
      ...approval,
      documentTitle: document?.title ?? "Unknown Document",
      documentFramework: document?.framework ?? "Unknown",
    });
  }));

  router.post("/:id/approve", isAuthenticated, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = approvalActionSchema.parse(req.body);
    
    const existing = await storage.getDocumentApproval(id);
    if (!existing) {
      throw new NotFoundError("Approval not found");
    }
    
    const approval = await storage.updateDocumentApproval(id, {
      status: "approved",
      comments: validated.comment || existing.comments,
      approvedAt: new Date(),
    });
    
    logger.info("Approval approved", { id, userId: req.user?.claims?.sub });
    res.json(approval);
  }));

  router.post("/:id/reject", isAuthenticated, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = approvalActionSchema.parse(req.body);
    
    const existing = await storage.getDocumentApproval(id);
    if (!existing) {
      throw new NotFoundError("Approval not found");
    }
    
    const approval = await storage.updateDocumentApproval(id, {
      status: "rejected",
      comments: validated.comment || existing.comments,
      rejectedAt: new Date(),
    });
    
    logger.info("Approval rejected", { id, userId: req.user?.claims?.sub });
    res.json(approval);
  }));
}
