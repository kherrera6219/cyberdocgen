import { Router, Response, NextFunction } from "express";
import { storage } from "../storage";
import { isAuthenticated, getRequiredUserId } from "../replitAuth";
import { logger } from "../utils/logger";
import { 
  secureHandler, 
  validateInput, 
  NotFoundError,
  ForbiddenError
} from "../utils/errorHandling";
import { z } from "zod";
import { 
  type MultiTenantRequest, 
  requireOrganization,
  getDocumentWithOrgCheck 
} from "../middleware/multiTenant";

const approvalActionSchema = z.object({
  comment: z.string().optional().default(""),
});

export function registerApprovalsRoutes(router: Router) {
  router.get("/", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const status = req.query.status as string | undefined;
    const organizationId = req.organizationId!;
    
    // Get all approvals - storage doesn't seem to support org filter directly in this call, 
    // so we get all and filter by document ownership.
    const approvals = await storage.getDocumentApprovals(status);
    
    const enrichedApprovals = [];
    for (const approval of approvals) {
      const { document, authorized } = await getDocumentWithOrgCheck(approval.documentId, organizationId);
      if (authorized && document) {
        enrichedApprovals.push({
          ...approval,
          documentTitle: document.title,
          documentFramework: document.framework,
        });
      }
    }
    
    res.json({ success: true, data: enrichedApprovals });
  }));

  router.get("/:id", isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;
    const approval = await storage.getDocumentApproval(id);
    
    if (!approval) {
      throw new NotFoundError("Approval not found");
    }
    
    const { document, authorized } = await getDocumentWithOrgCheck(approval.documentId, organizationId);
    if (!authorized || !document) {
      throw new NotFoundError("Approval not found");
    }
    
    res.json({
      success: true,
      data: {
        ...approval,
        documentTitle: document.title,
        documentFramework: document.framework,
      }
    });
  }));

  router.post("/:id/approve", isAuthenticated, requireOrganization, validateInput(approvalActionSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;
    const userId = getRequiredUserId(req);
    const validated = req.body;
    
    const existing = await storage.getDocumentApproval(id);
    if (!existing) {
      throw new NotFoundError("Approval not found");
    }
    
    const { authorized } = await getDocumentWithOrgCheck(existing.documentId, organizationId);
    if (!authorized) {
      throw new NotFoundError("Approval not found");
    }
    
    const approval = await storage.updateDocumentApproval(id, {
      status: "approved",
      comments: validated.comment || existing.comments,
      approvedAt: new Date(),
    });
    
    res.json({ success: true, data: approval });
  }, { audit: { action: 'update', entityType: 'approval', getEntityId: (req) => req.params.id } }));

  router.post("/:id/reject", isAuthenticated, requireOrganization, validateInput(approvalActionSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const organizationId = req.organizationId!;
    const userId = getRequiredUserId(req);
    const validated = req.body;
    
    const existing = await storage.getDocumentApproval(id);
    if (!existing) {
      throw new NotFoundError("Approval not found");
    }
    
    const { authorized } = await getDocumentWithOrgCheck(existing.documentId, organizationId);
    if (!authorized) {
      throw new NotFoundError("Approval not found");
    }
    
    const approval = await storage.updateDocumentApproval(id, {
      status: "rejected",
      comments: validated.comment || existing.comments,
      rejectedAt: new Date(),
    });
    
    res.json({ success: true, data: approval });
  }, { audit: { action: 'update', entityType: 'approval', getEntityId: (req) => req.params.id } }));
}
