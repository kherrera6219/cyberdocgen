CREATE TABLE "ai_guardrails_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar,
	"user_id" varchar,
	"request_id" varchar NOT NULL,
	"guardrail_type" varchar NOT NULL,
	"action" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"original_prompt" text,
	"sanitized_prompt" text,
	"prompt_risk_score" numeric(5, 2),
	"pii_detected" boolean DEFAULT false NOT NULL,
	"pii_types" jsonb,
	"pii_redacted" boolean DEFAULT false NOT NULL,
	"original_response" text,
	"sanitized_response" text,
	"response_risk_score" numeric(5, 2),
	"content_categories" jsonb,
	"moderation_flags" jsonb,
	"requires_human_review" boolean DEFAULT false NOT NULL,
	"human_reviewed_at" timestamp,
	"human_reviewed_by" varchar,
	"human_review_decision" varchar,
	"human_review_notes" text,
	"model_provider" varchar,
	"model_name" varchar,
	"processing_time_ms" integer,
	"ip_address" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar,
	"project_id" varchar,
	"title" varchar DEFAULT 'New Conversation' NOT NULL,
	"session_type" varchar DEFAULT 'chat',
	"context" jsonb,
	"is_active" boolean DEFAULT true,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_disclosures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar,
	"user_id" varchar NOT NULL,
	"action_type" varchar NOT NULL,
	"model_provider" varchar NOT NULL,
	"model_name" varchar NOT NULL,
	"model_card_id" varchar,
	"purpose_description" text NOT NULL,
	"data_used" jsonb,
	"data_retention_days" integer,
	"data_storage_region" varchar,
	"user_consented" boolean DEFAULT false NOT NULL,
	"consented_at" timestamp,
	"consent_version" varchar,
	"ai_contribution" varchar NOT NULL,
	"human_oversight" boolean DEFAULT false NOT NULL,
	"tokens_used" integer,
	"cost_estimate" numeric(10, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"organization_id" varchar,
	"action" varchar NOT NULL,
	"resource_type" varchar NOT NULL,
	"resource_id" varchar,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar NOT NULL,
	"user_agent" varchar,
	"risk_level" varchar DEFAULT 'low' NOT NULL,
	"additional_context" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"signature" varchar(64),
	"previous_signature" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "audit_trail" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" text NOT NULL,
	"user_id" varchar NOT NULL,
	"user_email" varchar,
	"user_name" varchar,
	"organization_id" varchar,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"ip_address" varchar,
	"user_agent" text,
	"session_id" varchar
);
--> statement-breakpoint
CREATE TABLE "cloud_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"provider_file_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"is_security_locked" boolean DEFAULT false,
	"security_level" varchar DEFAULT 'standard',
	"permissions" jsonb DEFAULT '{"canView":true,"canEdit":false,"canDownload":false,"canShare":false}'::jsonb,
	"metadata" jsonb,
	"thumbnail_url" varchar,
	"download_url" varchar,
	"web_view_url" varchar,
	"last_modified" timestamp,
	"synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"snapshot_id" varchar,
	"category" varchar,
	"file_hash" varchar,
	"processing_status" varchar DEFAULT 'pending',
	"extracted_text_path" varchar,
	"embedding_id" varchar,
	CONSTRAINT "cloud_files_integration_id_provider_file_id_unique" UNIQUE("integration_id","provider_file_id")
);
--> statement-breakpoint
CREATE TABLE "cloud_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"provider_user_id" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"sync_status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cloud_integrations_user_id_provider_unique" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"company_name" text NOT NULL,
	"industry" text NOT NULL,
	"company_size" text NOT NULL,
	"headquarters" text NOT NULL,
	"cloud_infrastructure" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"data_classification" text NOT NULL,
	"business_applications" text NOT NULL,
	"compliance_frameworks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contact_info" jsonb,
	"website_url" text,
	"organization_structure" jsonb,
	"key_personnel" jsonb,
	"products_and_services" jsonb,
	"geographic_operations" jsonb,
	"security_infrastructure" jsonb,
	"business_continuity" jsonb,
	"vendor_management" jsonb,
	"framework_configs" jsonb,
	"uploaded_docs" jsonb,
	"ai_research_data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_maturity_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"framework" varchar NOT NULL,
	"maturity_level" integer NOT NULL,
	"assessment_data" jsonb NOT NULL,
	"recommendations" jsonb,
	"next_review_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "connector_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"connector_type" varchar NOT NULL,
	"scope_config" jsonb NOT NULL,
	"sync_mode" varchar DEFAULT 'manual' NOT NULL,
	"last_snapshot_id" varchar,
	"last_synced_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"company" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"message" text NOT NULL,
	"status" varchar DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_residency_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"policy_name" varchar NOT NULL,
	"region" varchar NOT NULL,
	"data_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enforce_strict" boolean DEFAULT true NOT NULL,
	"allowed_regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"validated_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_retention_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"policy_name" varchar NOT NULL,
	"data_type" varchar NOT NULL,
	"retention_days" integer NOT NULL,
	"delete_after_expiry" boolean DEFAULT true NOT NULL,
	"archive_before_delete" boolean DEFAULT true NOT NULL,
	"archive_location" varchar,
	"compliance_framework" varchar,
	"status" varchar DEFAULT 'active' NOT NULL,
	"last_enforced_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version_id" varchar,
	"requested_by" varchar NOT NULL,
	"approver_role" varchar NOT NULL,
	"assigned_to" varchar,
	"status" varchar DEFAULT 'pending',
	"comments" text,
	"priority" varchar DEFAULT 'medium',
	"due_date" timestamp,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"framework" text NOT NULL,
	"category" text NOT NULL,
	"document_type" text NOT NULL,
	"template_content" text NOT NULL,
	"template_variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"company_name_encrypted" text,
	"industry_encrypted" text,
	"headquarters_encrypted" text,
	"encryption_version" integer,
	"encrypted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"changes" text,
	"change_type" varchar DEFAULT 'minor',
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" varchar DEFAULT 'draft',
	"file_size" integer,
	"checksum" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "document_workspace" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"workspace_data" jsonb,
	"last_edited_by" varchar,
	"last_edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_profile_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"framework" text NOT NULL,
	"sub_framework" text,
	"category" text NOT NULL,
	"document_type" text DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"template_data" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"file_name" text,
	"file_type" text,
	"file_size" integer,
	"download_url" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"ai_model" text,
	"generation_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"email" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "evidence_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"locked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fine_tuning_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" varchar NOT NULL,
	"metric_type" varchar NOT NULL,
	"value" numeric(10, 6),
	"metadata" jsonb,
	"measured_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "framework_control_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"framework" varchar NOT NULL,
	"control_id" varchar NOT NULL,
	"status" varchar DEFAULT 'not_started',
	"evidence_status" varchar DEFAULT 'none',
	"notes" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gap_analysis_findings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" varchar NOT NULL,
	"control_id" varchar NOT NULL,
	"control_title" varchar NOT NULL,
	"current_status" varchar NOT NULL,
	"risk_level" varchar NOT NULL,
	"gap_description" text NOT NULL,
	"business_impact" text NOT NULL,
	"evidence_required" text,
	"compliance_score" integer NOT NULL,
	"priority" integer NOT NULL,
	"estimated_effort" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gap_analysis_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"framework" varchar NOT NULL,
	"analysis_date" timestamp DEFAULT now(),
	"overall_score" integer NOT NULL,
	"status" varchar DEFAULT 'pending',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_profile_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"framework" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"documents_generated" integer DEFAULT 0 NOT NULL,
	"total_documents" integer DEFAULT 0 NOT NULL,
	"current_document" text,
	"error_message" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_configurations" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"primary_frameworks" text[],
	"specializations" text[],
	"risk_factors" text[],
	"compliance_requirements" text[],
	"custom_prompts" jsonb,
	"model_preferences" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mfa_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"mfa_type" text NOT NULL,
	"secret_encrypted" text,
	"phone_number_encrypted" text,
	"backup_codes_encrypted" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"authenticator_name" varchar DEFAULT 'Google Authenticator',
	"qr_code_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"failed_attempts" integer DEFAULT 0,
	"locked_until" timestamp with time zone,
	CONSTRAINT "mfa_settings_user_id_mfa_type_unique" UNIQUE("user_id","mfa_type")
);
--> statement-breakpoint
CREATE TABLE "model_cards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_provider" varchar NOT NULL,
	"model_name" varchar NOT NULL,
	"model_version" varchar NOT NULL,
	"description" text NOT NULL,
	"intended_use" text NOT NULL,
	"limitations" text NOT NULL,
	"training_data" text,
	"performance_metrics" jsonb,
	"bias_assessment" text,
	"fairness_metrics" jsonb,
	"safety_evaluations" text,
	"ethical_considerations" text,
	"privacy_features" jsonb,
	"data_retention_policy" text,
	"data_residency" text,
	"compliance_frameworks" jsonb,
	"certifications" jsonb,
	"contact_info" jsonb,
	"status" varchar DEFAULT 'active' NOT NULL,
	"published_at" timestamp,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_cards_model_provider_model_name_model_version_unique" UNIQUE("model_provider","model_name","model_version")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"link" varchar,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"display_name" varchar,
	"profile_image_url" varchar,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp,
	"is_primary" boolean DEFAULT false,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_providers_user_id_provider_unique" UNIQUE("user_id","provider"),
	CONSTRAINT "oauth_providers_provider_provider_id_unique" UNIQUE("provider","provider_id")
);
--> statement-breakpoint
CREATE TABLE "organization_fine_tuning" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"industry_id" varchar NOT NULL,
	"config_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"custom_prompts" jsonb,
	"model_settings" jsonb,
	"accuracy" numeric(5, 4),
	"requirements" text[],
	"custom_instructions" text,
	"priority" varchar DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"logo" varchar,
	"website" varchar,
	"contact_email" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "passkey_credentials" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"credential_id" varchar NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" varchar,
	"device_name" varchar,
	"transports" jsonb,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp,
	CONSTRAINT "passkey_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pdf_security_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"has_user_password" boolean DEFAULT false,
	"has_owner_password" boolean DEFAULT false,
	"user_password_encrypted" text,
	"owner_password_encrypted" text,
	"allow_printing" boolean DEFAULT false,
	"allow_copying" boolean DEFAULT false,
	"allow_modifying" boolean DEFAULT false,
	"allow_annotations" boolean DEFAULT false,
	"allow_form_filling" boolean DEFAULT false,
	"allow_assembly" boolean DEFAULT false,
	"allow_degraded_printing" boolean DEFAULT false,
	"encryption_level" varchar DEFAULT 'AES256',
	"key_length" integer DEFAULT 256,
	"has_watermark" boolean DEFAULT false,
	"watermark_text" varchar,
	"watermark_opacity" numeric DEFAULT '0.3',
	"watermark_position" varchar DEFAULT 'center',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pdf_security_settings_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
CREATE TABLE "project_memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar DEFAULT 'viewer',
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_memberships_project_id_user_id_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'active',
	"framework" varchar,
	"target_completion_date" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remediation_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finding_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"implementation" text NOT NULL,
	"resources" jsonb,
	"timeframe" varchar NOT NULL,
	"cost" varchar,
	"priority" integer NOT NULL,
	"status" varchar DEFAULT 'pending',
	"assigned_to" varchar,
	"due_date" timestamp,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repository_analysis_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" varchar NOT NULL,
	"frameworks" jsonb NOT NULL,
	"analysis_depth" varchar DEFAULT 'security_relevant' NOT NULL,
	"phase" varchar,
	"phase_status" varchar DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0,
	"files_analyzed" integer DEFAULT 0,
	"findings_generated" integer DEFAULT 0,
	"documents_generated" integer DEFAULT 0,
	"tasks_created" integer DEFAULT 0,
	"llm_calls_made" integer DEFAULT 0,
	"tokens_used" integer DEFAULT 0,
	"cost_estimate" numeric,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_log" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" varchar NOT NULL,
	"document_id" varchar NOT NULL,
	"framework" varchar NOT NULL,
	"template_id" varchar,
	"status" varchar DEFAULT 'generated' NOT NULL,
	"generated_by" varchar DEFAULT 'AI',
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" varchar,
	"approved_by_name" varchar,
	"approved_by_title" varchar,
	"approved_at" timestamp,
	"approval_notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"signature_block" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_files" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" varchar NOT NULL,
	"relative_path" text NOT NULL,
	"file_name" varchar NOT NULL,
	"file_type" varchar,
	"file_size" integer,
	"file_hash" varchar,
	"language" varchar,
	"category" varchar DEFAULT 'other',
	"is_security_relevant" boolean DEFAULT false,
	"indexed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_findings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" varchar NOT NULL,
	"control_id" varchar NOT NULL,
	"framework" varchar NOT NULL,
	"status" varchar NOT NULL,
	"confidence_level" varchar DEFAULT 'medium' NOT NULL,
	"signal_type" varchar,
	"summary" text NOT NULL,
	"details" jsonb,
	"evidence_references" jsonb DEFAULT '[]'::jsonb,
	"recommendation" text,
	"ai_model" varchar,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"human_override" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"company_profile_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"name" varchar NOT NULL,
	"status" varchar DEFAULT 'extracting' NOT NULL,
	"uploaded_file_name" varchar NOT NULL,
	"uploaded_file_hash" varchar NOT NULL,
	"extracted_path" text,
	"repository_size" integer,
	"file_count" integer DEFAULT 0,
	"manifest_hash" varchar,
	"detected_languages" jsonb DEFAULT '[]'::jsonb,
	"detected_frameworks" jsonb DEFAULT '[]'::jsonb,
	"detected_infra_tools" jsonb DEFAULT '[]'::jsonb,
	"analysis_started_at" timestamp,
	"analysis_completed_at" timestamp,
	"analysis_phase" varchar,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" varchar NOT NULL,
	"finding_id" varchar,
	"title" varchar NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"assigned_to_role" varchar DEFAULT 'user',
	"due_date" timestamp,
	"completed_at" timestamp,
	"completed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"role_id" varchar NOT NULL,
	"assigned_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_assignments_user_id_organization_id_role_id_unique" UNIQUE("user_id","organization_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"source" varchar DEFAULT 'manual' NOT NULL,
	"external_id" varchar,
	"display_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"job_title" varchar,
	"department" varchar,
	"manager_name" varchar,
	"manager_email" varchar,
	"phone" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" varchar NOT NULL,
	"config_type" varchar NOT NULL,
	"config_value_encrypted" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_configurations_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"organization_id" varchar,
	"role" varchar DEFAULT 'user' NOT NULL,
	"organization_role" varchar DEFAULT 'member',
	"invited_by" varchar NOT NULL,
	"token" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_organizations_user_id_organization_id_unique" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_token" varchar NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"device_info" jsonb,
	"location" jsonb,
	"is_active" boolean DEFAULT true,
	"last_activity_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"password_hash" varchar,
	"email_verified" boolean DEFAULT false,
	"phone_number" varchar,
	"phone_verified" boolean DEFAULT false,
	"two_factor_enabled" boolean DEFAULT false,
	"account_status" varchar DEFAULT 'pending_verification',
	"failed_login_attempts" integer DEFAULT 0,
	"account_locked_until" timestamp,
	"passkey_enabled" boolean DEFAULT false,
	"profile_preferences" jsonb DEFAULT '{}'::jsonb,
	"notification_settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_guardrails_logs" ADD CONSTRAINT "ai_guardrails_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_guardrails_logs" ADD CONSTRAINT "ai_guardrails_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_guardrails_logs" ADD CONSTRAINT "ai_guardrails_logs_human_reviewed_by_users_id_fk" FOREIGN KEY ("human_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_session_id_ai_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_disclosures" ADD CONSTRAINT "ai_usage_disclosures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_disclosures" ADD CONSTRAINT "ai_usage_disclosures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_disclosures" ADD CONSTRAINT "ai_usage_disclosures_model_card_id_model_cards_id_fk" FOREIGN KEY ("model_card_id") REFERENCES "public"."model_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cloud_files" ADD CONSTRAINT "cloud_files_integration_id_cloud_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."cloud_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cloud_files" ADD CONSTRAINT "cloud_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cloud_files" ADD CONSTRAINT "cloud_files_snapshot_id_evidence_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."evidence_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cloud_integrations" ADD CONSTRAINT "cloud_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cloud_integrations" ADD CONSTRAINT "cloud_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_configs" ADD CONSTRAINT "connector_configs_integration_id_cloud_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."cloud_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_configs" ADD CONSTRAINT "connector_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_configs" ADD CONSTRAINT "connector_configs_last_snapshot_id_evidence_snapshots_id_fk" FOREIGN KEY ("last_snapshot_id") REFERENCES "public"."evidence_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_residency_policies" ADD CONSTRAINT "data_residency_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_residency_policies" ADD CONSTRAINT "data_residency_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_version_id_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workspace" ADD CONSTRAINT "document_workspace_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workspace" ADD CONSTRAINT "document_workspace_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_workspace" ADD CONSTRAINT "document_workspace_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_profile_id_company_profiles_id_fk" FOREIGN KEY ("company_profile_id") REFERENCES "public"."company_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_snapshots" ADD CONSTRAINT "evidence_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_analysis_findings" ADD CONSTRAINT "gap_analysis_findings_report_id_gap_analysis_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."gap_analysis_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_company_profile_id_company_profiles_id_fk" FOREIGN KEY ("company_profile_id") REFERENCES "public"."company_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_settings" ADD CONSTRAINT "mfa_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_providers" ADD CONSTRAINT "oauth_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_security_settings" ADD CONSTRAINT "pdf_security_settings_file_id_cloud_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."cloud_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_security_settings" ADD CONSTRAINT "pdf_security_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_security_settings" ADD CONSTRAINT "pdf_security_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remediation_recommendations" ADD CONSTRAINT "remediation_recommendations_finding_id_gap_analysis_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."gap_analysis_findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_analysis_runs" ADD CONSTRAINT "repository_analysis_runs_snapshot_id_repository_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."repository_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_documents" ADD CONSTRAINT "repository_documents_snapshot_id_repository_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."repository_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_documents" ADD CONSTRAINT "repository_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_documents" ADD CONSTRAINT "repository_documents_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_files" ADD CONSTRAINT "repository_files_snapshot_id_repository_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."repository_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_findings" ADD CONSTRAINT "repository_findings_snapshot_id_repository_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."repository_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_findings" ADD CONSTRAINT "repository_findings_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_snapshots" ADD CONSTRAINT "repository_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_snapshots" ADD CONSTRAINT "repository_snapshots_company_profile_id_company_profiles_id_fk" FOREIGN KEY ("company_profile_id") REFERENCES "public"."company_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_snapshots" ADD CONSTRAINT "repository_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_tasks" ADD CONSTRAINT "repository_tasks_snapshot_id_repository_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."repository_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_tasks" ADD CONSTRAINT "repository_tasks_finding_id_repository_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."repository_findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_tasks" ADD CONSTRAINT "repository_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configurations" ADD CONSTRAINT "system_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configurations" ADD CONSTRAINT "system_configurations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_guardrails_org" ON "ai_guardrails_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_guardrails_user" ON "ai_guardrails_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_guardrails_type" ON "ai_guardrails_logs" USING btree ("guardrail_type");--> statement-breakpoint
CREATE INDEX "idx_guardrails_action" ON "ai_guardrails_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_guardrails_severity" ON "ai_guardrails_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_guardrails_review" ON "ai_guardrails_logs" USING btree ("requires_human_review");--> statement-breakpoint
CREATE INDEX "idx_guardrails_created" ON "ai_guardrails_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_message_session" ON "ai_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_ai_message_created" ON "ai_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_session_user" ON "ai_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_session_org" ON "ai_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_disclosure_org" ON "ai_usage_disclosures" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_disclosure_user" ON "ai_usage_disclosures" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_disclosure_action" ON "ai_usage_disclosures" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_disclosure_provider" ON "ai_usage_disclosures" USING btree ("model_provider");--> statement-breakpoint
CREATE INDEX "idx_disclosure_created" ON "ai_usage_disclosures" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_risk_level" ON "audit_logs" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_signature" ON "audit_logs" USING btree ("signature");--> statement-breakpoint
CREATE INDEX "idx_cloud_files_type" ON "cloud_files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "idx_cloud_files_security" ON "cloud_files" USING btree ("security_level");--> statement-breakpoint
CREATE INDEX "idx_cloud_files_integration" ON "cloud_files" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_cloud_files_org_id" ON "cloud_files" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_cloud_integrations_provider" ON "cloud_integrations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_cloud_integrations_user_id" ON "cloud_integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cloud_integrations_org_id" ON "cloud_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_connector_configs_integration" ON "connector_configs" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_connector_configs_org" ON "connector_configs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_residency_org" ON "data_residency_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_residency_status" ON "data_residency_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_retention_org" ON "data_retention_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_retention_status" ON "data_retention_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_retention_type" ON "data_retention_policies" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "idx_mfa_settings_user_id" ON "mfa_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mfa_settings_enabled" ON "mfa_settings" USING btree ("user_id","is_enabled");--> statement-breakpoint
CREATE INDEX "idx_model_provider" ON "model_cards" USING btree ("model_provider");--> statement-breakpoint
CREATE INDEX "idx_model_name" ON "model_cards" USING btree ("model_name");--> statement-breakpoint
CREATE INDEX "idx_model_status" ON "model_cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_oauth_providers_provider" ON "oauth_providers" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_oauth_providers_user_id" ON "oauth_providers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pdf_security_file_id" ON "pdf_security_settings" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "idx_pdf_security_org_id" ON "pdf_security_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pdf_security_encryption" ON "pdf_security_settings" USING btree ("encryption_level");--> statement-breakpoint
CREATE INDEX "idx_project_member_project" ON "project_memberships" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_member_user" ON "project_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_org" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_repo_run_snapshot" ON "repository_analysis_runs" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "idx_repo_run_status" ON "repository_analysis_runs" USING btree ("phase_status");--> statement-breakpoint
CREATE INDEX "idx_repo_doc_snapshot" ON "repository_documents" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "idx_repo_doc_document" ON "repository_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_repo_doc_status" ON "repository_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_repo_file_snapshot" ON "repository_files" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "idx_repo_file_category" ON "repository_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_repo_file_security" ON "repository_files" USING btree ("is_security_relevant");--> statement-breakpoint
CREATE INDEX "idx_repo_finding_snapshot" ON "repository_findings" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "idx_repo_finding_framework" ON "repository_findings" USING btree ("framework");--> statement-breakpoint
CREATE INDEX "idx_repo_finding_control" ON "repository_findings" USING btree ("control_id");--> statement-breakpoint
CREATE INDEX "idx_repo_finding_status" ON "repository_findings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_repo_snapshot_org" ON "repository_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_repo_snapshot_profile" ON "repository_snapshots" USING btree ("company_profile_id");--> statement-breakpoint
CREATE INDEX "idx_repo_snapshot_status" ON "repository_snapshots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_repo_task_snapshot" ON "repository_tasks" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "idx_repo_task_finding" ON "repository_tasks" USING btree ("finding_id");--> statement-breakpoint
CREATE INDEX "idx_repo_task_status" ON "repository_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_repo_task_priority" ON "repository_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_role_assignment_user" ON "role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_role_assignment_org" ON "role_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_stakeholder_org" ON "stakeholders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_stakeholder_email" ON "stakeholders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_stakeholder_source" ON "stakeholders" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_system_config_key" ON "system_configurations" USING btree ("config_key");--> statement-breakpoint
CREATE INDEX "idx_system_config_type" ON "system_configurations" USING btree ("config_type");