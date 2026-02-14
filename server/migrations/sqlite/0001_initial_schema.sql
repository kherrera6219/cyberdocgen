-- SQLite baseline schema generated from shared/schema.ts

-- This migration is permissive by design for local desktop bootstrap.

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" TEXT,
  "sess" TEXT,
  "expire" TEXT,
  PRIMARY KEY ("sid")
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT,
  "email" TEXT,
  "first_name" TEXT,
  "last_name" TEXT,
  "profile_image_url" TEXT,
  "role" TEXT,
  "is_active" TEXT,
  "last_login_at" TEXT,
  "password_hash" TEXT,
  "email_verified" TEXT,
  "phone_number" TEXT,
  "phone_verified" TEXT,
  "two_factor_enabled" TEXT,
  "account_status" TEXT,
  "failed_login_attempts" TEXT,
  "account_locked_until" TEXT,
  "passkey_enabled" TEXT,
  "profile_preferences" TEXT,
  "notification_settings" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "organizations" (
  "id" TEXT,
  "name" TEXT,
  "slug" TEXT,
  "description" TEXT,
  "logo" TEXT,
  "website" TEXT,
  "contact_email" TEXT,
  "is_active" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_organizations" (
  "id" TEXT,
  "user_id" TEXT,
  "organization_id" TEXT,
  "role" TEXT,
  "joined_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_invitations" (
  "id" TEXT,
  "email" TEXT,
  "organization_id" TEXT,
  "role" TEXT,
  "organization_role" TEXT,
  "invited_by" TEXT,
  "token" TEXT,
  "status" TEXT,
  "expires_at" TEXT,
  "accepted_at" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" TEXT,
  "user_id" TEXT,
  "session_token" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "device_info" TEXT,
  "location" TEXT,
  "is_active" TEXT,
  "last_activity_at" TEXT,
  "created_at" TEXT,
  "expires_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "company_profiles" (
  "id" TEXT,
  "organization_id" TEXT,
  "created_by" TEXT,
  "company_name" TEXT,
  "industry" TEXT,
  "company_size" TEXT,
  "headquarters" TEXT,
  "cloud_infrastructure" TEXT,
  "data_classification" TEXT,
  "business_applications" TEXT,
  "compliance_frameworks" TEXT,
  "contact_info" TEXT,
  "website_url" TEXT,
  "organization_structure" TEXT,
  "key_personnel" TEXT,
  "products_and_services" TEXT,
  "geographic_operations" TEXT,
  "security_infrastructure" TEXT,
  "business_continuity" TEXT,
  "vendor_management" TEXT,
  "framework_configs" TEXT,
  "uploaded_docs" TEXT,
  "ai_research_data" TEXT,
  "is_active" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" TEXT,
  "company_profile_id" TEXT,
  "created_by" TEXT,
  "title" TEXT,
  "description" TEXT,
  "framework" TEXT,
  "sub_framework" TEXT,
  "category" TEXT,
  "document_type" TEXT,
  "content" TEXT,
  "template_data" TEXT,
  "status" TEXT,
  "version" TEXT,
  "tags" TEXT,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_size" TEXT,
  "download_url" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TEXT,
  "approved_by" TEXT,
  "approved_at" TEXT,
  "ai_generated" TEXT,
  "ai_model" TEXT,
  "generation_prompt" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "document_templates" (
  "id" TEXT,
  "name" TEXT,
  "description" TEXT,
  "framework" TEXT,
  "category" TEXT,
  "document_type" TEXT,
  "template_content" TEXT,
  "template_variables" TEXT,
  "is_active" TEXT,
  "created_by" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  "company_name_encrypted" TEXT,
  "industry_encrypted" TEXT,
  "headquarters_encrypted" TEXT,
  "encryption_version" TEXT,
  "encrypted_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" TEXT,
  "user_id" TEXT,
  "token" TEXT,
  "expires_at" TEXT,
  "used_at" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id" TEXT,
  "user_id" TEXT,
  "token" TEXT,
  "email" TEXT,
  "expires_at" TEXT,
  "verified_at" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "passkey_credentials" (
  "id" TEXT,
  "user_id" TEXT,
  "credential_id" TEXT,
  "public_key" TEXT,
  "counter" TEXT,
  "device_type" TEXT,
  "device_name" TEXT,
  "transports" TEXT,
  "created_at" TEXT,
  "last_used_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mfa_settings" (
  "id" TEXT,
  "user_id" TEXT,
  "mfa_type" TEXT,
  "secret_encrypted" TEXT,
  "phone_number_encrypted" TEXT,
  "backup_codes_encrypted" TEXT,
  "is_enabled" TEXT,
  "is_verified" TEXT,
  "authenticator_name" TEXT,
  "qr_code_url" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  "last_used_at" TEXT,
  "failed_attempts" TEXT,
  "locked_until" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "system_configurations" (
  "id" TEXT,
  "config_key" TEXT,
  "config_type" TEXT,
  "config_value_encrypted" TEXT,
  "description" TEXT,
  "is_active" TEXT,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cloud_integrations" (
  "id" TEXT,
  "user_id" TEXT,
  "organization_id" TEXT,
  "provider" TEXT,
  "provider_user_id" TEXT,
  "display_name" TEXT,
  "email" TEXT,
  "access_token_encrypted" TEXT,
  "refresh_token_encrypted" TEXT,
  "token_expires_at" TEXT,
  "scopes" TEXT,
  "is_active" TEXT,
  "last_sync_at" TEXT,
  "sync_status" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "evidence_snapshots" (
  "id" TEXT,
  "organization_id" TEXT,
  "name" TEXT,
  "status" TEXT,
  "created_at" TEXT,
  "locked_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "connector_configs" (
  "id" TEXT,
  "integration_id" TEXT,
  "organization_id" TEXT,
  "name" TEXT,
  "connector_type" TEXT,
  "scope_config" TEXT,
  "sync_mode" TEXT,
  "last_snapshot_id" TEXT,
  "last_synced_at" TEXT,
  "is_active" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cloud_files" (
  "id" TEXT,
  "integration_id" TEXT,
  "organization_id" TEXT,
  "provider_file_id" TEXT,
  "file_name" TEXT,
  "file_path" TEXT,
  "file_type" TEXT,
  "file_size" TEXT,
  "mime_type" TEXT,
  "is_security_locked" TEXT,
  "security_level" TEXT,
  "permissions" TEXT,
  "metadata" TEXT,
  "thumbnail_url" TEXT,
  "download_url" TEXT,
  "web_view_url" TEXT,
  "last_modified" TEXT,
  "synced_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  "snapshot_id" TEXT,
  "category" TEXT,
  "file_hash" TEXT,
  "processing_status" TEXT,
  "extracted_text_path" TEXT,
  "embedding_id" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "oauth_providers" (
  "id" TEXT,
  "user_id" TEXT,
  "provider" TEXT,
  "provider_id" TEXT,
  "email" TEXT,
  "display_name" TEXT,
  "profile_image_url" TEXT,
  "access_token_encrypted" TEXT,
  "refresh_token_encrypted" TEXT,
  "token_expires_at" TEXT,
  "is_primary" TEXT,
  "last_used_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pdf_security_settings" (
  "id" TEXT,
  "file_id" TEXT,
  "organization_id" TEXT,
  "created_by" TEXT,
  "has_user_password" TEXT,
  "has_owner_password" TEXT,
  "user_password_encrypted" TEXT,
  "owner_password_encrypted" TEXT,
  "allow_printing" TEXT,
  "allow_copying" TEXT,
  "allow_modifying" TEXT,
  "allow_annotations" TEXT,
  "allow_form_filling" TEXT,
  "allow_assembly" TEXT,
  "allow_degraded_printing" TEXT,
  "encryption_level" TEXT,
  "key_length" TEXT,
  "has_watermark" TEXT,
  "watermark_text" TEXT,
  "watermark_opacity" TEXT,
  "watermark_position" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "document_workspace" (
  "id" TEXT,
  "document_id" TEXT,
  "organization_id" TEXT,
  "workspace_data" TEXT,
  "last_edited_by" TEXT,
  "last_edited_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "generation_jobs" (
  "id" TEXT,
  "company_profile_id" TEXT,
  "created_by" TEXT,
  "framework" TEXT,
  "status" TEXT,
  "progress" TEXT,
  "documents_generated" TEXT,
  "total_documents" TEXT,
  "current_document" TEXT,
  "error_message" TEXT,
  "completed_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "industry_configurations" (
  "id" TEXT,
  "name" TEXT,
  "description" TEXT,
  "primary_frameworks" TEXT,
  "specializations" TEXT,
  "risk_factors" TEXT,
  "compliance_requirements" TEXT,
  "custom_prompts" TEXT,
  "model_preferences" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "organization_fine_tuning" (
  "id" TEXT,
  "organization_id" TEXT,
  "industry_id" TEXT,
  "config_id" TEXT,
  "status" TEXT,
  "custom_prompts" TEXT,
  "model_settings" TEXT,
  "accuracy" TEXT,
  "requirements" TEXT,
  "custom_instructions" TEXT,
  "priority" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fine_tuning_metrics" (
  "id" TEXT,
  "config_id" TEXT,
  "metric_type" TEXT,
  "value" TEXT,
  "metadata" TEXT,
  "measured_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "gap_analysis_reports" (
  "id" TEXT,
  "organization_id" TEXT,
  "framework" TEXT,
  "analysis_date" TEXT,
  "overall_score" TEXT,
  "status" TEXT,
  "metadata" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "gap_analysis_findings" (
  "id" TEXT,
  "report_id" TEXT,
  "control_id" TEXT,
  "control_title" TEXT,
  "current_status" TEXT,
  "risk_level" TEXT,
  "gap_description" TEXT,
  "business_impact" TEXT,
  "evidence_required" TEXT,
  "compliance_score" TEXT,
  "priority" TEXT,
  "estimated_effort" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "remediation_recommendations" (
  "id" TEXT,
  "finding_id" TEXT,
  "title" TEXT,
  "description" TEXT,
  "implementation" TEXT,
  "resources" TEXT,
  "timeframe" TEXT,
  "cost" TEXT,
  "priority" TEXT,
  "status" TEXT,
  "assigned_to" TEXT,
  "due_date" TEXT,
  "completed_date" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "compliance_maturity_assessments" (
  "id" TEXT,
  "organization_id" TEXT,
  "framework" TEXT,
  "maturity_level" TEXT,
  "assessment_data" TEXT,
  "recommendations" TEXT,
  "next_review_date" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "framework_control_statuses" (
  "id" TEXT,
  "organization_id" TEXT,
  "framework" TEXT,
  "control_id" TEXT,
  "status" TEXT,
  "evidence_status" TEXT,
  "notes" TEXT,
  "updated_by" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "document_versions" (
  "id" TEXT,
  "document_id" TEXT,
  "version_number" TEXT,
  "title" TEXT,
  "content" TEXT,
  "changes" TEXT,
  "change_type" TEXT,
  "created_by" TEXT,
  "created_at" TEXT,
  "status" TEXT,
  "file_size" TEXT,
  "checksum" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT,
  "user_id" TEXT,
  "organization_id" TEXT,
  "action" TEXT,
  "resource_type" TEXT,
  "resource_id" TEXT,
  "old_values" TEXT,
  "new_values" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "risk_level" TEXT,
  "additional_context" TEXT,
  "timestamp" TEXT,
  "signature" TEXT,
  "previous_signature" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_trail" (
  "id" TEXT,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "action" TEXT,
  "user_id" TEXT,
  "user_email" TEXT,
  "user_name" TEXT,
  "organization_id" TEXT,
  "old_values" TEXT,
  "new_values" TEXT,
  "metadata" TEXT,
  "timestamp" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "session_id" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "document_approvals" (
  "id" TEXT,
  "document_id" TEXT,
  "version_id" TEXT,
  "requested_by" TEXT,
  "approver_role" TEXT,
  "assigned_to" TEXT,
  "status" TEXT,
  "comments" TEXT,
  "priority" TEXT,
  "due_date" TEXT,
  "approved_at" TEXT,
  "rejected_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT,
  "user_id" TEXT,
  "organization_id" TEXT,
  "type" TEXT,
  "title" TEXT,
  "message" TEXT,
  "link" TEXT,
  "is_read" TEXT,
  "metadata" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "data_residency_policies" (
  "id" TEXT,
  "organization_id" TEXT,
  "policy_name" TEXT,
  "region" TEXT,
  "data_types" TEXT,
  "enforce_strict" TEXT,
  "allowed_regions" TEXT,
  "blocked_regions" TEXT,
  "status" TEXT,
  "validated_at" TEXT,
  "created_by" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "data_retention_policies" (
  "id" TEXT,
  "organization_id" TEXT,
  "policy_name" TEXT,
  "data_type" TEXT,
  "retention_days" TEXT,
  "delete_after_expiry" TEXT,
  "archive_before_delete" TEXT,
  "archive_location" TEXT,
  "compliance_framework" TEXT,
  "status" TEXT,
  "last_enforced_at" TEXT,
  "created_by" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_guardrails_logs" (
  "id" TEXT,
  "organization_id" TEXT,
  "user_id" TEXT,
  "request_id" TEXT,
  "guardrail_type" TEXT,
  "action" TEXT,
  "severity" TEXT,
  "original_prompt" TEXT,
  "sanitized_prompt" TEXT,
  "prompt_risk_score" TEXT,
  "pii_detected" TEXT,
  "pii_types" TEXT,
  "pii_redacted" TEXT,
  "original_response" TEXT,
  "sanitized_response" TEXT,
  "response_risk_score" TEXT,
  "content_categories" TEXT,
  "moderation_flags" TEXT,
  "requires_human_review" TEXT,
  "human_reviewed_at" TEXT,
  "human_reviewed_by" TEXT,
  "human_review_decision" TEXT,
  "human_review_notes" TEXT,
  "model_provider" TEXT,
  "model_name" TEXT,
  "processing_time_ms" TEXT,
  "ip_address" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "model_cards" (
  "id" TEXT,
  "model_provider" TEXT,
  "model_name" TEXT,
  "model_version" TEXT,
  "description" TEXT,
  "intended_use" TEXT,
  "limitations" TEXT,
  "training_data" TEXT,
  "performance_metrics" TEXT,
  "bias_assessment" TEXT,
  "fairness_metrics" TEXT,
  "safety_evaluations" TEXT,
  "ethical_considerations" TEXT,
  "privacy_features" TEXT,
  "data_retention_policy" TEXT,
  "data_residency" TEXT,
  "compliance_frameworks" TEXT,
  "certifications" TEXT,
  "contact_info" TEXT,
  "status" TEXT,
  "published_at" TEXT,
  "last_reviewed_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_usage_disclosures" (
  "id" TEXT,
  "organization_id" TEXT,
  "user_id" TEXT,
  "action_type" TEXT,
  "model_provider" TEXT,
  "model_name" TEXT,
  "model_card_id" TEXT,
  "purpose_description" TEXT,
  "data_used" TEXT,
  "data_retention_days" TEXT,
  "data_storage_region" TEXT,
  "user_consented" TEXT,
  "consented_at" TEXT,
  "consent_version" TEXT,
  "ai_contribution" TEXT,
  "human_oversight" TEXT,
  "tokens_used" TEXT,
  "cost_estimate" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" TEXT,
  "first_name" TEXT,
  "last_name" TEXT,
  "email" TEXT,
  "company" TEXT,
  "subject" TEXT,
  "message" TEXT,
  "status" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "roles" (
  "id" TEXT,
  "name" TEXT,
  "display_name" TEXT,
  "description" TEXT,
  "permissions" TEXT,
  "is_system" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "role_assignments" (
  "id" TEXT,
  "user_id" TEXT,
  "organization_id" TEXT,
  "role_id" TEXT,
  "assigned_by" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" TEXT,
  "organization_id" TEXT,
  "name" TEXT,
  "description" TEXT,
  "status" TEXT,
  "framework" TEXT,
  "target_completion_date" TEXT,
  "created_by" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "project_memberships" (
  "id" TEXT,
  "project_id" TEXT,
  "user_id" TEXT,
  "role" TEXT,
  "joined_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_sessions" (
  "id" TEXT,
  "user_id" TEXT,
  "organization_id" TEXT,
  "project_id" TEXT,
  "title" TEXT,
  "session_type" TEXT,
  "context" TEXT,
  "is_active" TEXT,
  "last_message_at" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_messages" (
  "id" TEXT,
  "session_id" TEXT,
  "role" TEXT,
  "content" TEXT,
  "metadata" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "repository_snapshots" (
  "id" TEXT,
  "organization_id" TEXT,
  "company_profile_id" TEXT,
  "created_by" TEXT,
  "name" TEXT,
  "status" TEXT,
  "uploaded_file_name" TEXT,
  "uploaded_file_hash" TEXT,
  "extracted_path" TEXT,
  "repository_size" TEXT,
  "file_count" TEXT,
  "manifest_hash" TEXT,
  "detected_languages" TEXT,
  "detected_frameworks" TEXT,
  "detected_infra_tools" TEXT,
  "analysis_started_at" TEXT,
  "analysis_completed_at" TEXT,
  "analysis_phase" TEXT,
  "error_message" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "repository_files" (
  "id" TEXT,
  "snapshot_id" TEXT,
  "relative_path" TEXT,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_size" TEXT,
  "file_hash" TEXT,
  "language" TEXT,
  "category" TEXT,
  "is_security_relevant" TEXT,
  "indexed_at" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "repository_findings" (
  "id" TEXT,
  "snapshot_id" TEXT,
  "control_id" TEXT,
  "framework" TEXT,
  "status" TEXT,
  "confidence_level" TEXT,
  "signal_type" TEXT,
  "summary" TEXT,
  "details" TEXT,
  "evidence_references" TEXT,
  "recommendation" TEXT,
  "ai_model" TEXT,
  "generated_at" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TEXT,
  "human_override" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "repository_tasks" (
  "id" TEXT,
  "snapshot_id" TEXT,
  "finding_id" TEXT,
  "title" TEXT,
  "description" TEXT,
  "category" TEXT,
  "priority" TEXT,
  "status" TEXT,
  "assigned_to_role" TEXT,
  "due_date" TEXT,
  "completed_at" TEXT,
  "completed_by" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "repository_analysis_runs" (
  "id" TEXT,
  "snapshot_id" TEXT,
  "frameworks" TEXT,
  "analysis_depth" TEXT,
  "phase" TEXT,
  "phase_status" TEXT,
  "progress" TEXT,
  "files_analyzed" TEXT,
  "findings_generated" TEXT,
  "documents_generated" TEXT,
  "tasks_created" TEXT,
  "llm_calls_made" TEXT,
  "tokens_used" TEXT,
  "cost_estimate" TEXT,
  "started_at" TEXT,
  "completed_at" TEXT,
  "error_log" TEXT,
  "created_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "repository_documents" (
  "id" TEXT,
  "snapshot_id" TEXT,
  "document_id" TEXT,
  "framework" TEXT,
  "template_id" TEXT,
  "status" TEXT,
  "generated_by" TEXT,
  "generated_at" TEXT,
  "approved_by" TEXT,
  "approved_by_name" TEXT,
  "approved_by_title" TEXT,
  "approved_at" TEXT,
  "approval_notes" TEXT,
  "version" TEXT,
  "signature_block" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "stakeholders" (
  "id" TEXT,
  "organization_id" TEXT,
  "source" TEXT,
  "external_id" TEXT,
  "display_name" TEXT,
  "email" TEXT,
  "job_title" TEXT,
  "department" TEXT,
  "manager_name" TEXT,
  "manager_email" TEXT,
  "phone" TEXT,
  "is_active" TEXT,
  "last_synced_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  PRIMARY KEY ("id")
);

PRAGMA foreign_keys = ON;
