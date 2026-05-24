import { Router, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { 
  secureHandler
} from '../utils/errorHandling';
import { auditService, AuditAction } from '../services/auditService';
import { type MultiTenantRequest } from '../middleware/multiTenant';
import { controlTestsService } from '../services/controlTestsService';
import { policySyncService } from '../services/policySyncService';

export function registerRisksRoutes(router: Router) {
  /**
   * Get all risks for current organization
   */
  router.get("/", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const risks = await storage.getRisks(organizationId);
    res.json({ success: true, data: risks });
  }));

  /**
   * Run and fetch all Continuous Control Test results
   */
  router.get("/control-tests", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const results = await controlTestsService.runAllTests(organizationId);
    res.json({ success: true, data: results });
  }));

  /**
   * AI policy proposal generation from codebase signal
   */
  router.post("/policy-sync/propose", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const { documentId, signalType, evidenceText } = req.body;

    if (!documentId || !signalType || !evidenceText) {
      res.status(400).json({ success: false, message: "Missing required params: documentId, signalType, or evidenceText" });
      return;
    }

    const proposal = await policySyncService.generatePolicyProposal(
      documentId,
      signalType,
      evidenceText,
      userId,
      organizationId
    );

    res.status(201).json({ success: true, data: proposal });
  }));

  /**
   * Fetch all pending AI self-healing policy proposals
   */
  router.get("/policy-sync/proposals", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const proposals = policySyncService.getPendingProposals();
    res.json({ success: true, data: proposals });
  }));

  /**
   * 1-Click Approve AI policy proposal and commit new version
   */
  router.post("/policy-sync/approve/:proposalId", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const proposalId = req.params.proposalId;

    const newVersion = await policySyncService.approveProposal(proposalId, userId);

    // Log GRC audit trail
    await auditService.logAction({
      action: AuditAction.CREATE,
      entityType: 'policy_version',
      entityId: newVersion.id,
      userId,
      organizationId,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'policy_proposal_approval',
        proposalId,
        documentId: newVersion.documentId,
        versionNumber: newVersion.versionNumber
      }
    });

    res.json({ success: true, message: "AI policy proposal approved and version committed successfully.", data: newVersion });
  }));

  /**
   * Reject and discard AI policy proposal
   */
  router.post("/policy-sync/reject/:proposalId", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const proposalId = req.params.proposalId;

    const success = policySyncService.rejectProposal(proposalId);

    if (!success) {
      res.status(404).json({ success: false, message: "AI proposal not found or already processed" });
      return;
    }

    // Log GRC audit trail
    await auditService.logAction({
      action: AuditAction.UPDATE,
      entityType: 'policy_proposal',
      entityId: proposalId,
      userId,
      organizationId,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'policy_proposal_rejection',
        proposalId
      }
    });

    res.json({ success: true, message: "AI policy proposal rejected and discarded." });
  }));

  /**
   * Get specific risk details
   */
  router.get("/:id", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.organizationId!;
    const risk = await storage.getRisk(req.params.id);

    if (!risk || risk.organizationId !== organizationId) {
      res.status(404).json({ success: false, message: "Risk not found or unauthorized access" });
      return;
    }

    res.json({ success: true, data: risk });
  }));

  /**
   * Create new risk entry
   */
  router.post("/", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const riskData = req.body;

    const newRisk = await storage.createRisk({
      ...riskData,
      organizationId,
      createdBy: userId,
    });

    // Log GRC audit trail
    await auditService.logAction({
      action: AuditAction.CREATE,
      entityType: 'risk',
      entityId: newRisk.id,
      userId,
      organizationId,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'risk_creation',
        title: newRisk.title,
        inherentScore: newRisk.inherentScore,
        residualScore: newRisk.residualScore
      }
    });

    res.status(201).json({ success: true, data: newRisk });
  }));

  /**
   * Update existing risk entry
   */
  router.put("/:id", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const riskId = req.params.id;

    const existingRisk = await storage.getRisk(riskId);
    if (!existingRisk || existingRisk.organizationId !== organizationId) {
      res.status(404).json({ success: false, message: "Risk not found or unauthorized access" });
      return;
    }

    const updatedRisk = await storage.updateRisk(riskId, req.body);

    if (!updatedRisk) {
      res.status(500).json({ success: false, message: "Failed to update risk" });
      return;
    }

    // Log GRC audit trail
    await auditService.logAction({
      action: AuditAction.UPDATE,
      entityType: 'risk',
      entityId: updatedRisk.id,
      userId,
      organizationId,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'risk_update',
        title: updatedRisk.title,
        inherentScore: updatedRisk.inherentScore,
        residualScore: updatedRisk.residualScore
      }
    });

    res.json({ success: true, data: updatedRisk });
  }));

  /**
   * Delete risk entry
   */
  router.delete("/:id", isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
    const userId = getRequiredUserId(req);
    const organizationId = req.organizationId!;
    const riskId = req.params.id;

    const existingRisk = await storage.getRisk(riskId);
    if (!existingRisk || existingRisk.organizationId !== organizationId) {
      res.status(404).json({ success: false, message: "Risk not found or unauthorized access" });
      return;
    }

    const deleted = await storage.deleteRisk(riskId);

    if (!deleted) {
      res.status(500).json({ success: false, message: "Failed to delete risk" });
      return;
    }

    // Log GRC audit trail
    await auditService.logAction({
      action: AuditAction.DELETE,
      entityType: 'risk',
      entityId: riskId,
      userId,
      organizationId,
      ipAddress: req.ip ?? '',
      metadata: {
        action: 'risk_deletion',
        title: existingRisk.title
      }
    });

    res.json({ success: true, message: "Risk deleted successfully" });
  }));
}
