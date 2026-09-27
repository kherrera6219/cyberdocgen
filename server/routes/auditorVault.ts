/**
 * Auditor Vault & WebAuthn Sign-Off API Routes
 */

import { Router, Response } from "express";
import { isAuthenticated, getRequiredUserId } from "../replitAuth";
import { requireOrganization, type MultiTenantRequest } from "../middleware/multiTenant";
import { secureHandler, ValidationError } from "../utils/errorHandling";
import { auditorVaultService, type AuditorVaultData } from "../services/auditorVaultService";
import { webauthnSignoffService, type DocumentSignaturePayload } from "../services/webauthnSignoffService";

export function registerAuditorVaultRoutes(app: Router) {
  const router = Router();

  /**
   * POST /api/auditor-vault/export
   * Generates a self-contained, interactive HTML package (.cyberdoc)
   */
  router.post(
    "/export",
    isAuthenticated,
    requireOrganization,
    secureHandler(async (req: MultiTenantRequest, res: Response) => {
      const vaultData: AuditorVaultData = req.body;

      if (!vaultData.documentId || !vaultData.documentTitle || !vaultData.contentMarkdown) {
        throw new ValidationError("Missing required vault parameters: documentId, documentTitle, contentMarkdown.");
      }

      const html = auditorVaultService.generateStandaloneVaultHtml(vaultData);

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="auditor-vault-${vaultData.documentId}.html"`);
      res.send(html);
    })
  );

  /**
   * POST /api/auditor-vault/sign
   * Signs a document version hash using WebAuthn / cryptographic signature
   */
  router.post(
    "/sign",
    isAuthenticated,
    requireOrganization,
    secureHandler(async (req: MultiTenantRequest, res: Response) => {
      const { documentId, version, content, signatureHex, signerRole, algorithm } = req.body;

      if (!documentId || !version || !content || !signatureHex) {
        throw new ValidationError("Missing required parameters: documentId, version, content, and signatureHex.");
      }

      const userId = getRequiredUserId(req);
      const contentHash = webauthnSignoffService.computeDocumentHash(content, documentId, version);

      const payload: DocumentSignaturePayload = {
        documentId,
        version,
        contentHash,
        signerUserId: userId,
        signerEmail: (req.user as any)?.email || "approver@cyberdocgen.local",
        signerRole: signerRole || "Chief Information Security Officer",
        timestamp: new Date().toISOString(),
      };

      const manifest = webauthnSignoffService.createSignatureManifest(
        payload,
        signatureHex,
        algorithm || "ES256"
      );

      res.status(201).json({
        success: true,
        data: manifest,
      });
    })
  );

  app.use("/api/auditor-vault", router);
}
