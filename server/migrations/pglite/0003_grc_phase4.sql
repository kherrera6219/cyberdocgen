-- Phase 4: Vision Auditing, Gated Trust Centers & AI Auditor Twins DDL Migration

CREATE TABLE IF NOT EXISTS "evidence_analyses" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "evidence_id" varchar NOT NULL REFERENCES "cloud_files"("id") ON DELETE CASCADE,
  "organization_id" varchar NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "verified" boolean NOT NULL DEFAULT false,
  "confidence_score" integer NOT NULL DEFAULT 0,
  "analysis_text" text NOT NULL,
  "auditor_notes" text,
  "reviewed_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_evidence_analyses_evidence" ON "evidence_analyses"("evidence_id");
CREATE INDEX IF NOT EXISTS "idx_evidence_analyses_org" ON "evidence_analyses"("organization_id");

CREATE TABLE IF NOT EXISTS "trust_center_ndas" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" varchar NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "full_name" varchar NOT NULL,
  "email" varchar NOT NULL,
  "company_name" varchar NOT NULL,
  "signed_at" timestamp NOT NULL DEFAULT now(),
  "signature_hash" varchar NOT NULL,
  "status" varchar NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS "idx_trust_center_ndas_org" ON "trust_center_ndas"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_trust_center_ndas_email" ON "trust_center_ndas"("email");

CREATE TABLE IF NOT EXISTS "trust_center_downloads" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "nda_id" varchar NOT NULL REFERENCES "trust_center_ndas"("id") ON DELETE CASCADE,
  "file_id" varchar NOT NULL REFERENCES "cloud_files"("id") ON DELETE CASCADE,
  "downloaded_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" varchar
);

CREATE INDEX IF NOT EXISTS "idx_trust_center_downloads_nda" ON "trust_center_downloads"("nda_id");
CREATE INDEX IF NOT EXISTS "idx_trust_center_downloads_file" ON "trust_center_downloads"("file_id");

CREATE TABLE IF NOT EXISTS "mock_audits" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" varchar NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "framework" varchar NOT NULL,
  "status" varchar NOT NULL DEFAULT 'pending',
  "auditor_personality" varchar NOT NULL DEFAULT 'strict',
  "transcript" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "compliance_score" integer,
  "report_markdown" text,
  "created_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_mock_audits_org" ON "mock_audits"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_mock_audits_framework" ON "mock_audits"("framework");
CREATE INDEX IF NOT EXISTS "idx_mock_audits_status" ON "mock_audits"("status");
