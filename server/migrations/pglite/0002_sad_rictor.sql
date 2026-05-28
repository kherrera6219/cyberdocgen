CREATE TABLE "agent_memory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"episode_summary" text NOT NULL,
	"embedding" vector(1536),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_tool_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"agent_id" varchar NOT NULL,
	"agent_name" varchar NOT NULL,
	"tool_name" varchar NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"outputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar DEFAULT 'success' NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"ip_address" varchar,
	"hmac_seal" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_idp_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"provider_type" varchar NOT NULL,
	"domain" varchar NOT NULL,
	"client_id_encrypted" text NOT NULL,
	"client_secret_encrypted" text NOT NULL,
	"sync_settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enterprise_idp_configs_organization_id_provider_type_unique" UNIQUE("organization_id","provider_type")
);
--> statement-breakpoint
CREATE TABLE "evidence_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"confidence_score" integer DEFAULT 0 NOT NULL,
	"analysis_text" text NOT NULL,
	"auditor_notes" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_audits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"framework" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"auditor_personality" varchar DEFAULT 'strict' NOT NULL,
	"transcript" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compliance_score" integer,
	"report_markdown" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_solvers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"total_questions_count" integer DEFAULT 0 NOT NULL,
	"completed_questions_count" integer DEFAULT 0 NOT NULL,
	"average_confidence_score" numeric(5, 2) DEFAULT '0.00',
	"questions_data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"file_path" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_center_downloads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nda_id" varchar NOT NULL,
	"file_id" varchar NOT NULL,
	"downloaded_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar
);
--> statement-breakpoint
CREATE TABLE "trust_center_ndas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"company_name" varchar NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	"signature_hash" varchar NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_questionnaires" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"score" integer,
	"questions_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sent_at" timestamp,
	"received_at" timestamp,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"service_description" text,
	"data_classification" varchar DEFAULT 'public' NOT NULL,
	"security_status" varchar DEFAULT 'pending' NOT NULL,
	"last_assessment_date" timestamp,
	"soc2_status" varchar DEFAULT 'not_provided' NOT NULL,
	"iso27001_status" varchar DEFAULT 'not_provided' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_memory" ADD CONSTRAINT "agent_memory_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tool_logs" ADD CONSTRAINT "agent_tool_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_idp_configs" ADD CONSTRAINT "enterprise_idp_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_analyses" ADD CONSTRAINT "evidence_analyses_evidence_id_cloud_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."cloud_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_analyses" ADD CONSTRAINT "evidence_analyses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_analyses" ADD CONSTRAINT "evidence_analyses_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_audits" ADD CONSTRAINT "mock_audits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_audits" ADD CONSTRAINT "mock_audits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_solvers" ADD CONSTRAINT "questionnaire_solvers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_solvers" ADD CONSTRAINT "questionnaire_solvers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_center_downloads" ADD CONSTRAINT "trust_center_downloads_nda_id_trust_center_ndas_id_fk" FOREIGN KEY ("nda_id") REFERENCES "public"."trust_center_ndas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_center_downloads" ADD CONSTRAINT "trust_center_downloads_file_id_cloud_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."cloud_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_center_ndas" ADD CONSTRAINT "trust_center_ndas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_questionnaires" ADD CONSTRAINT "vendor_questionnaires_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_questionnaires" ADD CONSTRAINT "vendor_questionnaires_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;