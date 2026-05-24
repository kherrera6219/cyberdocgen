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
CREATE TABLE "questionnaire_solvers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"total_questions_count" integer DEFAULT 0 NOT NULL,
	"completed_questions_count" integer DEFAULT 0 NOT NULL,
	"average_confidence_score" numeric(5, 2) DEFAULT 0.00,
	"questions_data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"file_path" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vendor_questionnaires" ADD CONSTRAINT "vendor_questionnaires_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vendor_questionnaires" ADD CONSTRAINT "vendor_questionnaires_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "questionnaire_solvers" ADD CONSTRAINT "questionnaire_solvers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "questionnaire_solvers" ADD CONSTRAINT "questionnaire_solvers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agent_tool_logs" ADD CONSTRAINT "agent_tool_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
