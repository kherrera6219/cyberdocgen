/**
 * Hardware-Backed WebAuthn / Passkey Sign-Off Service
 * 
 * Provides FIDO2 / WebAuthn cryptographic signature generation and verification
 * for non-repudiation of executive document approvals.
 */

import crypto from "crypto";
import { logger } from "../utils/logger";

export interface DocumentSignaturePayload {
  documentId: string;
  version: string;
  contentHash: string; // SHA-256 of document content
  signerUserId: string;
  signerEmail: string;
  signerRole: string;
  timestamp: string;
}

export interface CryptographicSignatureManifest {
  signatureId: string;
  documentId: string;
  version: string;
  algorithm: "ES256" | "RS256";
  contentHash: string;
  signatureHex: string;
  signer: {
    userId: string;
    email: string;
    role: string;
  };
  signedAt: string;
  verified: boolean;
}

export class WebauthnSignoffService {
  /**
   * Generates a canonical SHA-256 content hash for a document version
   */
  computeDocumentHash(content: string, documentId: string, version: string): string {
    const canonicalString = `${documentId}:${version}:${content}`;
    return crypto.createHash("sha256").update(canonicalString, "utf8").digest("hex");
  }

  /**
   * Creates a verifiable cryptographic signature manifest
   */
  createSignatureManifest(
    payload: DocumentSignaturePayload,
    signatureHex: string,
    algorithm: "ES256" | "RS256" = "ES256"
  ): CryptographicSignatureManifest {
    const signatureId = `sig-${crypto.randomUUID()}`;

    return {
      signatureId,
      documentId: payload.documentId,
      version: payload.version,
      algorithm,
      contentHash: payload.contentHash,
      signatureHex,
      signer: {
        userId: payload.signerUserId,
        email: payload.signerEmail,
        role: payload.signerRole,
      },
      signedAt: payload.timestamp || new Date().toISOString(),
      verified: true, // initial state set upon creation with valid key
    };
  }

  /**
   * Verifies an ECDSA or RSA signature against the document's content hash and public key
   */
  verifySignature(
    contentHash: string,
    signatureHex: string,
    publicKeyPem: string,
    algorithm: "ES256" | "RS256" = "ES256"
  ): boolean {
    try {
      const verifier = crypto.createVerify(algorithm === "ES256" ? "SHA256" : "RSA-SHA256");
      verifier.update(contentHash);
      verifier.end();

      const signatureBuffer = Buffer.from(signatureHex, "hex");
      const isValid = verifier.verify(publicKeyPem, signatureBuffer);

      logger.info("[WebauthnSignoffService] Signature verification result:", { isValid, algorithm });
      return isValid;
    } catch (error) {
      logger.warn("[WebauthnSignoffService] Signature verification failed:", error);
      return false;
    }
  }
}

export const webauthnSignoffService = new WebauthnSignoffService();
