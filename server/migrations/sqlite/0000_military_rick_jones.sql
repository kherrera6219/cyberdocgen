CREATE TABLE `ai_guardrails_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`user_id` text,
	`request_id` text NOT NULL,
	`guardrail_type` text NOT NULL,
	`action` text NOT NULL,
	`severity` text NOT NULL,
	`original_prompt` text,
	`sanitized_prompt` text,
	`prompt_risk_score` real,
	`pii_detected` integer DEFAULT false NOT NULL,
	`pii_types` text,
	`pii_redacted` integer DEFAULT false NOT NULL,
	`original_response` text,
	`sanitized_response` text,
	`response_risk_score` real,
	`content_categories` text,
	`moderation_flags` text,
	`requires_human_review` integer DEFAULT false NOT NULL,
	`human_reviewed_at` integer,
	`human_reviewed_by` text,
	`human_review_decision` text,
	`human_review_notes` text,
	`model_provider` text,
	`model_name` text,
	`processing_time_ms` integer,
	`ip_address` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`human_reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_guardrails_org` ON `ai_guardrails_logs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_guardrails_user` ON `ai_guardrails_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_guardrails_type` ON `ai_guardrails_logs` (`guardrail_type`);--> statement-breakpoint
CREATE INDEX `idx_guardrails_action` ON `ai_guardrails_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_guardrails_severity` ON `ai_guardrails_logs` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_guardrails_review` ON `ai_guardrails_logs` (`requires_human_review`);--> statement-breakpoint
CREATE INDEX `idx_guardrails_created` ON `ai_guardrails_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `ai_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_ai_message_session` ON `ai_messages` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_message_created` ON `ai_messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `ai_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`project_id` text,
	`title` text DEFAULT 'New Conversation' NOT NULL,
	`session_type` text DEFAULT 'chat',
	`context` text,
	`is_active` integer DEFAULT true,
	`last_message_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_ai_session_user` ON `ai_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_session_org` ON `ai_sessions` (`organization_id`);--> statement-breakpoint
CREATE TABLE `ai_usage_disclosures` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`user_id` text NOT NULL,
	`action_type` text NOT NULL,
	`model_provider` text NOT NULL,
	`model_name` text NOT NULL,
	`model_card_id` text,
	`purpose_description` text NOT NULL,
	`data_used` text,
	`data_retention_days` integer,
	`data_storage_region` text,
	`user_consented` integer DEFAULT false NOT NULL,
	`consented_at` integer,
	`consent_version` text,
	`ai_contribution` text NOT NULL,
	`human_oversight` integer DEFAULT false NOT NULL,
	`tokens_used` integer,
	`cost_estimate` real,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`model_card_id`) REFERENCES `model_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_disclosure_org` ON `ai_usage_disclosures` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_disclosure_user` ON `ai_usage_disclosures` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_disclosure_action` ON `ai_usage_disclosures` (`action_type`);--> statement-breakpoint
CREATE INDEX `idx_disclosure_provider` ON `ai_usage_disclosures` (`model_provider`);--> statement-breakpoint
CREATE INDEX `idx_disclosure_created` ON `ai_usage_disclosures` (`created_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`organization_id` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`old_values` text,
	`new_values` text,
	`ip_address` text NOT NULL,
	`user_agent` text,
	`risk_level` text DEFAULT 'low' NOT NULL,
	`additional_context` text,
	`timestamp` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`signature` text,
	`previous_signature` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_user_id` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_timestamp` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_risk_level` ON `audit_logs` (`risk_level`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_signature` ON `audit_logs` (`signature`);--> statement-breakpoint
CREATE TABLE `audit_trail` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`user_id` text NOT NULL,
	`user_email` text,
	`user_name` text,
	`organization_id` text,
	`old_values` text,
	`new_values` text,
	`metadata` text,
	`timestamp` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`ip_address` text,
	`user_agent` text,
	`session_id` text
);
--> statement-breakpoint
CREATE TABLE `cloud_files` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`provider_file_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`is_security_locked` integer DEFAULT false,
	`security_level` text DEFAULT 'standard',
	`permissions` text DEFAULT '{"canView":true,"canEdit":false,"canDownload":false,"canShare":false}',
	`metadata` text,
	`thumbnail_url` text,
	`download_url` text,
	`web_view_url` text,
	`last_modified` integer,
	`synced_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`snapshot_id` text,
	`category` text,
	`file_hash` text,
	`processing_status` text DEFAULT 'pending',
	`extracted_text_path` text,
	`embedding_id` text,
	FOREIGN KEY (`integration_id`) REFERENCES `cloud_integrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshot_id`) REFERENCES `evidence_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_cloud_files_type` ON `cloud_files` (`file_type`);--> statement-breakpoint
CREATE INDEX `idx_cloud_files_security` ON `cloud_files` (`security_level`);--> statement-breakpoint
CREATE INDEX `idx_cloud_files_integration` ON `cloud_files` (`integration_id`);--> statement-breakpoint
CREATE INDEX `idx_cloud_files_org_id` ON `cloud_files` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cloud_files_integration_id_provider_file_id_unique` ON `cloud_files` (`integration_id`,`provider_file_id`);--> statement-breakpoint
CREATE TABLE `cloud_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text,
	`token_expires_at` integer,
	`scopes` text DEFAULT '[]',
	`is_active` integer DEFAULT true NOT NULL,
	`last_sync_at` integer,
	`sync_status` text DEFAULT 'pending',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_cloud_integrations_provider` ON `cloud_integrations` (`provider`);--> statement-breakpoint
CREATE INDEX `idx_cloud_integrations_user_id` ON `cloud_integrations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cloud_integrations_org_id` ON `cloud_integrations` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cloud_integrations_user_id_provider_unique` ON `cloud_integrations` (`user_id`,`provider`);--> statement-breakpoint
CREATE TABLE `company_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_by` text NOT NULL,
	`company_name` text NOT NULL,
	`industry` text NOT NULL,
	`company_size` text NOT NULL,
	`headquarters` text NOT NULL,
	`cloud_infrastructure` text DEFAULT '[]' NOT NULL,
	`data_classification` text NOT NULL,
	`business_applications` text NOT NULL,
	`compliance_frameworks` text DEFAULT '[]' NOT NULL,
	`contact_info` text,
	`website_url` text,
	`organization_structure` text,
	`key_personnel` text,
	`products_and_services` text,
	`geographic_operations` text,
	`security_infrastructure` text,
	`business_continuity` text,
	`vendor_management` text,
	`framework_configs` text,
	`uploaded_docs` text,
	`ai_research_data` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `compliance_maturity_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`framework` text NOT NULL,
	`maturity_level` integer NOT NULL,
	`assessment_data` text NOT NULL,
	`recommendations` text,
	`next_review_date` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `connector_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`connector_type` text NOT NULL,
	`scope_config` text NOT NULL,
	`sync_mode` text DEFAULT 'manual' NOT NULL,
	`last_snapshot_id` text,
	`last_synced_at` integer,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `cloud_integrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`last_snapshot_id`) REFERENCES `evidence_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_connector_configs_integration` ON `connector_configs` (`integration_id`);--> statement-breakpoint
CREATE INDEX `idx_connector_configs_org` ON `connector_configs` (`organization_id`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `data_residency_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`policy_name` text NOT NULL,
	`region` text NOT NULL,
	`data_types` text DEFAULT '[]' NOT NULL,
	`enforce_strict` integer DEFAULT true NOT NULL,
	`allowed_regions` text DEFAULT '[]' NOT NULL,
	`blocked_regions` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`validated_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_residency_org` ON `data_residency_policies` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_residency_status` ON `data_residency_policies` (`status`);--> statement-breakpoint
CREATE TABLE `data_retention_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`policy_name` text NOT NULL,
	`data_type` text NOT NULL,
	`retention_days` integer NOT NULL,
	`delete_after_expiry` integer DEFAULT true NOT NULL,
	`archive_before_delete` integer DEFAULT true NOT NULL,
	`archive_location` text,
	`compliance_framework` text,
	`status` text DEFAULT 'active' NOT NULL,
	`last_enforced_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_retention_org` ON `data_retention_policies` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_retention_status` ON `data_retention_policies` (`status`);--> statement-breakpoint
CREATE INDEX `idx_retention_type` ON `data_retention_policies` (`data_type`);--> statement-breakpoint
CREATE TABLE `document_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`version_id` text,
	`requested_by` text NOT NULL,
	`approver_role` text NOT NULL,
	`assigned_to` text,
	`status` text DEFAULT 'pending',
	`comments` text,
	`priority` text DEFAULT 'medium',
	`due_date` integer,
	`approved_at` integer,
	`rejected_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`version_id`) REFERENCES `document_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`framework` text NOT NULL,
	`category` text NOT NULL,
	`document_type` text NOT NULL,
	`template_content` text NOT NULL,
	`template_variables` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`company_name_encrypted` text,
	`industry_encrypted` text,
	`headquarters_encrypted` text,
	`encryption_version` integer,
	`encrypted_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`changes` text,
	`change_type` text DEFAULT 'minor',
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`status` text DEFAULT 'draft',
	`file_size` integer,
	`checksum` text,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `document_workspace` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`workspace_data` text,
	`last_edited_by` text,
	`last_edited_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_edited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`company_profile_id` text NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`framework` text NOT NULL,
	`sub_framework` text,
	`category` text NOT NULL,
	`document_type` text DEFAULT 'text' NOT NULL,
	`content` text NOT NULL,
	`template_data` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`tags` text DEFAULT '[]',
	`file_name` text,
	`file_type` text,
	`file_size` integer,
	`download_url` text,
	`reviewed_by` text,
	`reviewed_at` integer,
	`approved_by` text,
	`approved_at` integer,
	`ai_generated` integer DEFAULT false NOT NULL,
	`ai_model` text,
	`generation_prompt` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`company_profile_id`) REFERENCES `company_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`verified_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_token_unique` ON `email_verification_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `evidence_control_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`evidence_id` text NOT NULL,
	`framework` text NOT NULL,
	`control_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`mapped_by` text,
	`mapping_source` text DEFAULT 'manual' NOT NULL,
	`confidence_score` real,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`evidence_id`) REFERENCES `cloud_files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mapped_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_mappings_org` ON `evidence_control_mappings` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_evidence_mappings_evidence` ON `evidence_control_mappings` (`evidence_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_control_mappings_evidence_id_framework_control_id_unique` ON `evidence_control_mappings` (`evidence_id`,`framework`,`control_id`);--> statement-breakpoint
CREATE TABLE `evidence_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`locked_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fine_tuning_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`config_id` text NOT NULL,
	`metric_type` text NOT NULL,
	`value` real,
	`metadata` text,
	`measured_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `framework_control_statuses` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`framework` text NOT NULL,
	`control_id` text NOT NULL,
	`status` text DEFAULT 'not_started',
	`evidence_status` text DEFAULT 'none',
	`notes` text,
	`updated_by` text,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `gap_analysis_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`control_id` text NOT NULL,
	`control_title` text NOT NULL,
	`current_status` text NOT NULL,
	`risk_level` text NOT NULL,
	`gap_description` text NOT NULL,
	`business_impact` text NOT NULL,
	`evidence_required` text,
	`compliance_score` integer NOT NULL,
	`priority` integer NOT NULL,
	`estimated_effort` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`report_id`) REFERENCES `gap_analysis_reports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gap_analysis_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`framework` text NOT NULL,
	`analysis_date` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`overall_score` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `generation_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_profile_id` text NOT NULL,
	`created_by` text NOT NULL,
	`framework` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`documents_generated` integer DEFAULT 0 NOT NULL,
	`total_documents` integer DEFAULT 0 NOT NULL,
	`current_document` text,
	`error_message` text,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`company_profile_id`) REFERENCES `company_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `industry_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`primary_frameworks` text,
	`specializations` text,
	`risk_factors` text,
	`compliance_requirements` text,
	`custom_prompts` text,
	`model_preferences` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `mfa_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mfa_type` text NOT NULL,
	`secret_encrypted` text,
	`phone_number_encrypted` text,
	`backup_codes_encrypted` text,
	`is_enabled` integer DEFAULT false NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`authenticator_name` text DEFAULT 'Google Authenticator',
	`qr_code_url` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_used_at` integer,
	`failed_attempts` integer DEFAULT 0,
	`locked_until` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mfa_settings_user_id` ON `mfa_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_mfa_settings_enabled` ON `mfa_settings` (`user_id`,`is_enabled`);--> statement-breakpoint
CREATE UNIQUE INDEX `mfa_settings_user_id_mfa_type_unique` ON `mfa_settings` (`user_id`,`mfa_type`);--> statement-breakpoint
CREATE TABLE `model_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`model_provider` text NOT NULL,
	`model_name` text NOT NULL,
	`model_version` text NOT NULL,
	`description` text NOT NULL,
	`intended_use` text NOT NULL,
	`limitations` text NOT NULL,
	`training_data` text,
	`performance_metrics` text,
	`bias_assessment` text,
	`fairness_metrics` text,
	`safety_evaluations` text,
	`ethical_considerations` text,
	`privacy_features` text,
	`data_retention_policy` text,
	`data_residency` text,
	`compliance_frameworks` text,
	`certifications` text,
	`contact_info` text,
	`status` text DEFAULT 'active' NOT NULL,
	`published_at` integer,
	`last_reviewed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_model_provider` ON `model_cards` (`model_provider`);--> statement-breakpoint
CREATE INDEX `idx_model_name` ON `model_cards` (`model_name`);--> statement-breakpoint
CREATE INDEX `idx_model_status` ON `model_cards` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `model_cards_model_provider_model_name_model_version_unique` ON `model_cards` (`model_provider`,`model_name`,`model_version`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`is_read` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_id` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_is_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_notifications_created_at` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE TABLE `oauth_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`profile_image_url` text,
	`access_token_encrypted` text,
	`refresh_token_encrypted` text,
	`token_expires_at` integer,
	`is_primary` integer DEFAULT false,
	`last_used_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_oauth_providers_provider` ON `oauth_providers` (`provider`);--> statement-breakpoint
CREATE INDEX `idx_oauth_providers_user_id` ON `oauth_providers` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_providers_user_id_provider_unique` ON `oauth_providers` (`user_id`,`provider`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_providers_provider_provider_id_unique` ON `oauth_providers` (`provider`,`provider_id`);--> statement-breakpoint
CREATE TABLE `organization_fine_tuning` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`industry_id` text NOT NULL,
	`config_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`custom_prompts` text,
	`model_settings` text,
	`accuracy` real,
	`requirements` text,
	`custom_instructions` text,
	`priority` text DEFAULT 'medium',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`logo` text,
	`website` text,
	`contact_email` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `passkey_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`credential_id` text NOT NULL,
	`public_key` text NOT NULL,
	`counter` integer DEFAULT 0 NOT NULL,
	`device_type` text,
	`device_name` text,
	`transports` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`last_used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passkey_credentials_credential_id_unique` ON `passkey_credentials` (`credential_id`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `pdf_security_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_by` text NOT NULL,
	`has_user_password` integer DEFAULT false,
	`has_owner_password` integer DEFAULT false,
	`user_password_encrypted` text,
	`owner_password_encrypted` text,
	`allow_printing` integer DEFAULT false,
	`allow_copying` integer DEFAULT false,
	`allow_modifying` integer DEFAULT false,
	`allow_annotations` integer DEFAULT false,
	`allow_form_filling` integer DEFAULT false,
	`allow_assembly` integer DEFAULT false,
	`allow_degraded_printing` integer DEFAULT false,
	`encryption_level` text DEFAULT 'AES256',
	`key_length` integer DEFAULT 256,
	`has_watermark` integer DEFAULT false,
	`watermark_text` text,
	`watermark_opacity` real DEFAULT 0.3,
	`watermark_position` text DEFAULT 'center',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `cloud_files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_pdf_security_file_id` ON `pdf_security_settings` (`file_id`);--> statement-breakpoint
CREATE INDEX `idx_pdf_security_org_id` ON `pdf_security_settings` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_pdf_security_encryption` ON `pdf_security_settings` (`encryption_level`);--> statement-breakpoint
CREATE UNIQUE INDEX `pdf_security_settings_file_id_unique` ON `pdf_security_settings` (`file_id`);--> statement-breakpoint
CREATE TABLE `project_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'viewer',
	`joined_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_project_member_project` ON `project_memberships` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_project_member_user` ON `project_memberships` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_memberships_project_id_user_id_unique` ON `project_memberships` (`project_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active',
	`framework` text,
	`target_completion_date` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_org` ON `projects` (`organization_id`);--> statement-breakpoint
CREATE TABLE `remediation_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`finding_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`implementation` text NOT NULL,
	`resources` text,
	`timeframe` text NOT NULL,
	`cost` text,
	`priority` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`assigned_to` text,
	`due_date` integer,
	`completed_date` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`finding_id`) REFERENCES `gap_analysis_findings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `repository_analysis_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`frameworks` text NOT NULL,
	`analysis_depth` text DEFAULT 'security_relevant' NOT NULL,
	`phase` text,
	`phase_status` text DEFAULT 'pending' NOT NULL,
	`progress` integer DEFAULT 0,
	`files_analyzed` integer DEFAULT 0,
	`findings_generated` integer DEFAULT 0,
	`documents_generated` integer DEFAULT 0,
	`tasks_created` integer DEFAULT 0,
	`llm_calls_made` integer DEFAULT 0,
	`tokens_used` integer DEFAULT 0,
	`cost_estimate` real,
	`started_at` integer,
	`completed_at` integer,
	`error_log` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `repository_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_repo_run_snapshot` ON `repository_analysis_runs` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_run_status` ON `repository_analysis_runs` (`phase_status`);--> statement-breakpoint
CREATE TABLE `repository_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`document_id` text NOT NULL,
	`framework` text NOT NULL,
	`template_id` text,
	`status` text DEFAULT 'generated' NOT NULL,
	`generated_by` text DEFAULT 'AI',
	`generated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`approved_by` text,
	`approved_by_name` text,
	`approved_by_title` text,
	`approved_at` integer,
	`approval_notes` text,
	`version` integer DEFAULT 1 NOT NULL,
	`signature_block` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `repository_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_repo_doc_snapshot` ON `repository_documents` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_doc_document` ON `repository_documents` (`document_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_doc_status` ON `repository_documents` (`status`);--> statement-breakpoint
CREATE TABLE `repository_files` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`relative_path` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text,
	`file_size` integer,
	`file_hash` text,
	`language` text,
	`category` text DEFAULT 'other',
	`is_security_relevant` integer DEFAULT false,
	`indexed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `repository_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_repo_file_snapshot` ON `repository_files` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_file_category` ON `repository_files` (`category`);--> statement-breakpoint
CREATE INDEX `idx_repo_file_security` ON `repository_files` (`is_security_relevant`);--> statement-breakpoint
CREATE TABLE `repository_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`control_id` text NOT NULL,
	`framework` text NOT NULL,
	`status` text NOT NULL,
	`confidence_level` text DEFAULT 'medium' NOT NULL,
	`signal_type` text,
	`summary` text NOT NULL,
	`details` text,
	`evidence_references` text DEFAULT '[]',
	`recommendation` text,
	`ai_model` text,
	`generated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`human_override` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `repository_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_repo_finding_snapshot` ON `repository_findings` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_finding_framework` ON `repository_findings` (`framework`);--> statement-breakpoint
CREATE INDEX `idx_repo_finding_control` ON `repository_findings` (`control_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_finding_status` ON `repository_findings` (`status`);--> statement-breakpoint
CREATE TABLE `repository_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`company_profile_id` text NOT NULL,
	`created_by` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'extracting' NOT NULL,
	`uploaded_file_name` text NOT NULL,
	`uploaded_file_hash` text NOT NULL,
	`extracted_path` text,
	`repository_size` integer,
	`file_count` integer DEFAULT 0,
	`manifest_hash` text,
	`detected_languages` text DEFAULT '[]',
	`detected_frameworks` text DEFAULT '[]',
	`detected_infra_tools` text DEFAULT '[]',
	`analysis_started_at` integer,
	`analysis_completed_at` integer,
	`analysis_phase` text,
	`error_message` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_profile_id`) REFERENCES `company_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_repo_snapshot_org` ON `repository_snapshots` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_snapshot_profile` ON `repository_snapshots` (`company_profile_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_snapshot_status` ON `repository_snapshots` (`status`);--> statement-breakpoint
CREATE TABLE `repository_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`finding_id` text,
	`title` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`assigned_to_role` text DEFAULT 'user',
	`due_date` integer,
	`completed_at` integer,
	`completed_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `repository_snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`finding_id`) REFERENCES `repository_findings`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_repo_task_snapshot` ON `repository_tasks` (`snapshot_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_task_finding` ON `repository_tasks` (`finding_id`);--> statement-breakpoint
CREATE INDEX `idx_repo_task_status` ON `repository_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_repo_task_priority` ON `repository_tasks` (`priority`);--> statement-breakpoint
CREATE TABLE `role_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_role_assignment_user` ON `role_assignments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_role_assignment_org` ON `role_assignments` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_assignments_user_id_organization_id_role_id_unique` ON `role_assignments` (`user_id`,`organization_id`,`role_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`permissions` text DEFAULT '{}' NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `stakeholders` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`external_id` text,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`job_title` text,
	`department` text,
	`manager_name` text,
	`manager_email` text,
	`phone` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stakeholder_org` ON `stakeholders` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_stakeholder_email` ON `stakeholders` (`email`);--> statement-breakpoint
CREATE INDEX `idx_stakeholder_source` ON `stakeholders` (`source`);--> statement-breakpoint
CREATE TABLE `system_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`config_key` text NOT NULL,
	`config_type` text NOT NULL,
	`config_value_encrypted` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true,
	`created_by` text NOT NULL,
	`updated_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_configurations_config_key_unique` ON `system_configurations` (`config_key`);--> statement-breakpoint
CREATE INDEX `idx_system_config_key` ON `system_configurations` (`config_key`);--> statement-breakpoint
CREATE INDEX `idx_system_config_type` ON `system_configurations` (`config_type`);--> statement-breakpoint
CREATE TABLE `user_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`organization_id` text,
	`role` text DEFAULT 'user' NOT NULL,
	`organization_role` text DEFAULT 'member',
	`invited_by` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending',
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_invitations_token_unique` ON `user_invitations` (`token`);--> statement-breakpoint
CREATE TABLE `user_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_organizations_user_id_organization_id_unique` ON `user_organizations` (`user_id`,`organization_id`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`device_info` text,
	`location` text,
	`is_active` integer DEFAULT true,
	`last_activity_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_session_token_unique` ON `user_sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`role` text DEFAULT 'user' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`password_hash` text,
	`email_verified` integer DEFAULT false,
	`phone_number` text,
	`phone_verified` integer DEFAULT false,
	`two_factor_enabled` integer DEFAULT false,
	`account_status` text DEFAULT 'pending_verification',
	`failed_login_attempts` integer DEFAULT 0,
	`account_locked_until` integer,
	`passkey_enabled` integer DEFAULT false,
	`profile_preferences` text DEFAULT '{}',
	`notification_settings` text DEFAULT '{}',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);