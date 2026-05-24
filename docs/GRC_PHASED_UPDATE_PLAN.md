# CyberDocGen: Unified On-Prem, GRC & AI-Agent Phased Master Plan

This master plan details the complete strategic roadmap to evolve **CyberDocGen** into the world’s first **Zero-Knowledge, AI-Agent-Powered local-first GRC (Governance, Risk, and Compliance) Platform**. It integrates on-premises Windows/VM administration, database systems for AI Agents, standard GRC automation, and advanced AI-native compliance pipelines inside CyberDocGen's in-process PGlite database and local-first architecture.

---

## The Unified 4-Phase Roadmap

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 1: Personnel, Local Privacy, Identity Sync & Agent Foundations   │
  │ Status: COMPLETED (May 2026)                                           │
  │ - Employee Dashboard, E-Signatures (HMAC Cryptography) & policy table  │
  │ - Identity Provider & HRIS Sync (Okta, Entra ID, Gusto, Rippling)       │
  │ - Local WASM Vector Embeddings & Local pgvector Agent Memory           │
  │ - Host C-Drive Disk Telemetry & Winston Log Rotation (10MB size cap)   │
  │ - SQL-Based Multi-Agent Message Queue (agent_message_inbox in PGlite)  │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 2: Risk Register, Live Controls, Local Network & AI Policy Sync  │
  │ Status: COMPLETED (May 2026)                                           │
  │ - Interactive Risk Register Board (Inherent vs. Residual Treatment)    │
  │ - Continuous Control Tests Engine (Live DB/Backup Checks + Alerting)    │
  │ - Local Port/IP LAN Binding & TLS CA Certificate HTTPS Uploader        │
  │ - AI Code-to-Policy "Self-Healing" Sync Engine (codeSignalDetector)   │
  │ - Durable Agent State Store (agent_state_store crash-recovery table)   │
  │ - System Diagnostic Bundler for 1-click zipped, encrypted supports     │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 3: AI Questionnaire Solver, Vendor GRC, LDAP & Autonomous PRs    │
  │ Status: COMPLETED (May 2026)                                           │
  │ - RAG-based Excel/CSV Questionnaire Auto-Filler (pgvector Citations)  │
  │ - Third-Party Vendor Risk Management & Security Report Vault           │
  │ - Active Directory / LDAP authentication integration configuration     │
  │ - Autonomous Git Pull Request (PR) Creator (Direct secure code fixes)  │
  │ - Agent Tool Audit Trail logging (agent_tool_log security ledger)      │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 4: Vision Auditing, Gated Trust Centers & AI Auditor Twins       │
  │ Status: PLANNED                                                        │
  │ - Multimodal Evidence Screenshot Auditor (Gemini Vision Verification)  │
  │ - Gated Customer Trust Center Portal & Secure Watermarked PDFs         │
  │ - Windows Event Viewer integration (critical security events piping)   │
  │ - AI Auditor "Digital Twin" Simulator & AI Compliance Telemetry Engine │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Personnel, Local Privacy, Identity Sync & Agent Foundations
**Status**: `✅ COMPLETED (May 2026)`

### 📋 Delivered Technical Components

1. **Employee Policy Dashboard & Cryptographic E-Signatures**:
   *   Created `generateSignatureEnvelope` and `verifySignatureEnvelope` inside `encryption.ts` to compute an immutable, cryptographically sealed signature receipt.
   *   Created `policyAcknowledgmentsRepository.ts` to manage attestation records and integrated it into the local PGlite storage engine.
   *   Exposed POST `/api/documents/:id/acknowledge` and GET `/api/documents/acknowledgments` endpoints with multi-tenant isolation.
   *   Designed a premium Glassmorphic Attestation Portal UI (`employee-portal.tsx`) complete with dynamic AI takeaways and cryptographic badges.

2. **HRIS & Identity Provider (IdP) Connectors**:
   *   Built `directorySyncService.ts` supporting Okta, Microsoft Entra ID, Gusto, and Rippling.
   *   Implements automatic employee directory comparisons, user auto-provisioning, and terminated employee access-revocation checks.
   *   Exposed and registered administrative endpoints under `/api/admin/directory-sync`.

3. **Zero-Knowledge Local Vector RAG & Agent Memory**:
   *   Built `localEmbeddingsService.ts` running local, deterministic offline-first 1536-dimension embeddings.
   *   Implemented `agentMemoryService.ts` using PGlite's native pgvector distance operator (`<=>`) to run semantic queries against agent experiences.
   *   Added local PII/Secrets scrubbing to ensure complete off-grid safety.

4. **Local Storage Resilience (Windows/VM)**:
   *   Implemented Winston log rotation capping logs at 10MB per day, zipping older files, and keeping a max of 5 archives.
   *   Developed C-Drive Disk Telemetry to query host system specs (PowerShell on Windows, `df` on Unix) and alert if free space drops below 10GB.

5. **SQL-Based Multi-Agent Message Queue**:
   *   Built `agentQueueService.ts` utilizing the `agent_message_inbox` table in PGlite to coordinate background, asynchronous multi-agent task execution without external brokers.

---

## Phase 2: Risk Register, Live Controls, Local Network & AI Policy Sync
**Status**: `✅ COMPLETED (May 2026)`

### 📋 Delivered Technical Components

1. **Interactive Risk Register Board**:
   *   Created `risks` table schema tracking risk factors, mitigation mapping, inherent vs. residual scores.
   *   Built custom `risksRepository` logic computing inherent (likelihood * impact) and residual (inherent * mitigation) compliance scoring.
   *   Designed a high-end glassmorphic Kanban Board UI complete with slide-over panels, score matrices, and control linking.

2. **Continuous Control Tests Engine**:
   *   Implemented a resilient, modular backend engine checking database state, encryption keys, snapshots, Winston log cap, and local disk limits.
   *   Wired failures directly to the centralized compliance `alertingService` for immediate operational response.

3. **Local Network binding & HTTPS Security**:
   *   Added secure, custom settings saving configurations locally at `%APPDATA%/CyberDocGen/settings/network.json` and SSL certs under the `/security/` subdirectory.
   *   Enabled LAN-sharing toggles (127.0.0.1 vs 0.0.0.0) and private CA SSL upload options inside Admin Settings.

4. **1-Click Redacted Diagnostic Bundler**:
   *   Built a local diagnostic bundler gathering system specs, database stats, and Winston log streams into encrypted, secret-redacted support zip files.

5. **AI Self-Healing Policy Sync Engine**:
   *   Engineered a compliance diff engine translating code-level signal alerts into proposed Markdown policy adjustments.
   *   Allowed compliance managers to review, reject, or approve proposals to commit a new version in `documentVersions` under full audit logging.

---

## Phase 3: AI Questionnaire Solver, Vendor GRC, LDAP & Autonomous PRs
**Status**: `✅ COMPLETED (May 2026)`

### 📋 Technical Components
1. **AI Security Questionnaire Solver**:
   *   Ingests custom questionnaire spreadsheets (XLSX, CSV) sent by prospective clients.
   *   Runs local pgvector queries against policies, codebase signals, and company data, auto-drafting responses complete with confidence scores and policy citations.
2. **Third-Party Vendor Risk Management (VRM)**:
   *   A dashboard to inventory SaaS sub-processors and vault their security credentials (SOC 2, ISO certs).
   *   **AI Questionnaire Dispatcher**: Automatically email and compile security questionnaires directly into the vendor vault.
3. **Active Directory / LDAP Authentication Sync**:
   *   Introduce an on-premises **AD / LDAP Authentication Provider** panel (with `LDAP URL`, `Bind DN`, and search criteria) inside `enterpriseAuthService.ts` so corporate VM users can authenticate automatically using their existing domain credentials.
4. **Autonomous Git Pull Request (PR) Creator**:
   *   Integrate the compliance chatbot `chatbot.ts` directly with `repositoryFindingsService.ts` scan findings.
   *   When a code-level compliance gap is identified, the developer can chat with the AI to generate the exact secure code fix and, with 1-click, push a **secure Pull Request** directly to the GitHub/GitLab codebase.
5. **Agent Tool Audit Trail (GRC Compliance Ledger)**:
   *   Deploy `agent_tool_log` to record every automated agent tool execution (inputs, outputs, status, duration) to serve as a vital GRC ledger.

---

## Phase 4: Vision Auditing, Gated Trust Centers & AI Auditor Twins
**Status**: `📅 PLANNED`

### 📋 Technical Components
1. **Gemini Vision Evidence Auditor**:
   *   Use `geminiVision.ts` to inspect uploaded evidence files (screenshots of security panels, server configs).
   *   Verify that the image shows the correct compliance proof (e.g., "MFA is active") and auto-write descriptive auditor notes.
2. **Gated Customer Trust Center**:
   *   A public or restricted security portal showing certification status.
   *   Prospective buyers sign NDAs online and gain self-service download access to security documents, which are watermarked and encrypted via `pdfSecurityService.ts` automatically.
3. **Windows Event Log Integration**:
   *   Pipe critical security logs (failed logins, backup failures, and compliance breaches) directly to the native **Windows Event Viewer (Application log)** via PowerShell scripts.
4. **AI Auditor "Digital Twin" Simulator**:
   *   Spins up a multi-agent simulation where an **AI Auditor Agent** challenges the evidence and policies, and an **Admin Agent** defends them, helping companies mock-audit their compliance program.
5. **AI Compliance Telemetry Engine**:
   *   Continuously reads `auditTrail` events. If a user action violates an active security policy, the AI raises an alert in `alertingService.ts` and auto-drafts an incident report.
