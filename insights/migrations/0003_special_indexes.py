from django.db import migrations


class Migration(migrations.Migration):
    """
    Schema-parity tail: RunSQL-added columns + special indexes (GIN/partial/
    unique-partial) that makemigrations cannot express. Captured verbatim from
    live insights so a fresh migrate reaches EXACT schema parity. Depends on all
    app leaves so every target table exists. Columns first, then their indexes.
    """

    dependencies = [
        ('admin', '0003_logentry_add_action_flag_choices'),
        ('analytics_platform', '0002_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
        ('axes', '0009_add_session_hash'),
        ('contenttypes', '0002_remove_content_type_name'),
        ('conversations', '0002_initial'),
        ('customer_analytics', '0002_initial'),
        ('data_modeling', '0002_initial'),
        ('data_warehouse', '0002_initial'),
        ('desktop_recordings', '0002_initial'),
        ('early_access_features', '0002_initial'),
        ('endpoints', '0002_initial'),
        ('error_tracking', '0002_initial'),
        ('insights', '0002_managed_tables'),
        ('insights_ai', '0001_initial'),
        ('live_debugger', '0001_initial'),
        ('llm_analytics', '0001_initial'),
        ('marketing_analytics', '0001_initial'),
        ('notebooks', '0001_initial'),
        ('oauth2_provider', '0012_add_token_checksum'),
        ('otp_static', '0003_add_timestamps'),
        ('otp_totp', '0003_add_timestamps'),
        ('product_tours', '0001_initial'),
        ('sessions', '0001_initial'),
        ('signals', '0001_initial'),
        ('social_django', '0016_alter_usersocialauth_extra_data'),
        ('tasks', '0001_initial'),
        ('two_factor', '0001_squashed_0008_delete_phonedevice'),
        ('user_interviews', '0001_initial'),
        ('workflows', '0001_initial')
    ]

    operations = [
        migrations.RunSQL(sql=r"""
ALTER TABLE public.endpoints_endpoint ADD COLUMN IF NOT EXISTS "cache_age_seconds" integer;
ALTER TABLE public.endpoints_endpoint ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE public.endpoints_endpoint ADD COLUMN IF NOT EXISTS "parameters" jsonb;
ALTER TABLE public.endpoints_endpoint ADD COLUMN IF NOT EXISTS "query" jsonb;
ALTER TABLE public.endpoints_endpoint ADD COLUMN IF NOT EXISTS "saved_query_id" uuid;
ALTER TABLE public.insights_conversations_ticket ADD COLUMN IF NOT EXISTS "assigned_to_id" integer;
ALTER TABLE public.insights_task_run ADD COLUMN IF NOT EXISTS "current_stage_id" uuid;
ALTER TABLE public.insights_task_run ADD COLUMN IF NOT EXISTS "log" jsonb;
ALTER TABLE public.insights_task_run ADD COLUMN IF NOT EXISTS "log_storage_path" varchar(500);
ALTER TABLE public.insights_task ADD COLUMN IF NOT EXISTS "current_stage_id" uuid;
ALTER TABLE public.insights_task ADD COLUMN IF NOT EXISTS "github_branch" varchar(255);
ALTER TABLE public.insights_task ADD COLUMN IF NOT EXISTS "github_pr_url" varchar(200);
ALTER TABLE public.insights_task ADD COLUMN IF NOT EXISTS "position" integer;
ALTER TABLE public.insights_task ADD COLUMN IF NOT EXISTS "repository_config" jsonb;
ALTER TABLE public.insights_task ADD COLUMN IF NOT EXISTS "workflow_id" uuid;

CREATE INDEX IF NOT EXISTS endpoints_endpoint_saved_query_id_23649aa9 ON public.endpoints_endpoint USING btree (saved_query_id);
CREATE INDEX IF NOT EXISTS idx_activitylog_featureflag_updates ON public.insights_activitylog USING btree (team_id, item_id, created_at DESC) WHERE (((scope)::text = 'FeatureFlag'::text) AND ((activity)::text = 'updated'::text));
CREATE INDEX IF NOT EXISTS idx_alog_detail_gin_path_ops ON public.insights_activitylog USING gin (detail jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_alog_org_detail_exists ON public.insights_activitylog USING btree (organization_id) WHERE ((detail IS NOT NULL) AND (jsonb_typeof(detail) = 'object'::text));
CREATE INDEX IF NOT EXISTS idx_alog_org_scope_created_at ON public.insights_activitylog USING btree (organization_id, scope, created_at DESC) WHERE ((detail IS NOT NULL) AND (jsonb_typeof(detail) = 'object'::text));
CREATE UNIQUE INDEX IF NOT EXISTS idx_messagingrecord_unique_on_email_hash_campaign_key_campaign_ ON public.insights_messagingrecord USING btree (email_hash, campaign_key, campaign_count);
CREATE INDEX IF NOT EXISTS insights_conversations_ticket_assigned_to_id_fc931cbd ON public.insights_conversations_ticket USING btree (assigned_to_id);
CREATE INDEX IF NOT EXISTS insights_dashboarditem_query_gin ON public.insights_dashboarditem USING gin (query);
CREATE INDEX IF NOT EXISTS insights_err_team_id_dc6a7f_idx ON public.insights_errortrackingstackframe USING btree (team_id, raw_id);
CREATE INDEX IF NOT EXISTS insights_errortrackingassignmentrule_role_id_5faac145 ON public.insights_errortrackingassignmentrule USING btree (role_id);
CREATE INDEX IF NOT EXISTS insights_errortrackingissueassignment_role_id_f84c52d3 ON public.insights_errortrackingissueassignment USING btree (role_id);
CREATE INDEX IF NOT EXISTS insights_insightcachingstate_lookup ON public.insights_insightcachingstate USING btree (last_refresh DESC NULLS LAST, last_refresh_queued_at DESC NULLS LAST, target_cache_age_seconds, refresh_attempt, team_id, cache_key, id) WHERE ((target_cache_age_seconds IS NOT NULL) AND (refresh_attempt < 2));
CREATE UNIQUE INDEX IF NOT EXISTS insights_insightviewed_null_team_user_unique ON public.insights_insightviewed USING btree (insight_id) WHERE ((team_id IS NULL) AND (user_id IS NULL));
CREATE INDEX IF NOT EXISTS insights_organization_default_role_id_03bcd28b ON public.insights_organization USING btree (default_role_id);
CREATE INDEX IF NOT EXISTS insights_task_current_stage_id_9723ac8d ON public.insights_task USING btree (current_stage_id);
CREATE INDEX IF NOT EXISTS insights_task_run_current_stage_id_db968787 ON public.insights_task_run USING btree (current_stage_id);
CREATE INDEX IF NOT EXISTS insights_task_workflow_id_34ce9690 ON public.insights_task USING btree (workflow_id);
CREATE UNIQUE INDEX IF NOT EXISTS team_secret_api_token_backup_unique_idx ON public.insights_team USING btree (secret_api_token_backup);
CREATE UNIQUE INDEX IF NOT EXISTS team_secret_api_token_unique_idx ON public.insights_team USING btree (secret_api_token);
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_job_per_range ON public.analytics_platform_preaggregationjob USING btree (team_id, query_hash, time_range_start, time_range_end) WHERE ((status)::text = 'pending'::text);
""", reverse_sql=r"""
DROP INDEX IF EXISTS endpoints_endpoint_saved_query_id_23649aa9;
DROP INDEX IF EXISTS idx_activitylog_featureflag_updates;
DROP INDEX IF EXISTS idx_alog_detail_gin_path_ops;
DROP INDEX IF EXISTS idx_alog_org_detail_exists;
DROP INDEX IF EXISTS idx_alog_org_scope_created_at;
DROP INDEX IF EXISTS idx_messagingrecord_unique_on_email_hash_campaign_key_campaign_;
DROP INDEX IF EXISTS insights_conversations_ticket_assigned_to_id_fc931cbd;
DROP INDEX IF EXISTS insights_dashboarditem_query_gin;
DROP INDEX IF EXISTS insights_err_team_id_dc6a7f_idx;
DROP INDEX IF EXISTS insights_errortrackingassignmentrule_role_id_5faac145;
DROP INDEX IF EXISTS insights_errortrackingissueassignment_role_id_f84c52d3;
DROP INDEX IF EXISTS insights_insightcachingstate_lookup;
DROP INDEX IF EXISTS insights_insightviewed_null_team_user_unique;
DROP INDEX IF EXISTS insights_organization_default_role_id_03bcd28b;
DROP INDEX IF EXISTS insights_task_current_stage_id_9723ac8d;
DROP INDEX IF EXISTS insights_task_run_current_stage_id_db968787;
DROP INDEX IF EXISTS insights_task_workflow_id_34ce9690;
DROP INDEX IF EXISTS team_secret_api_token_backup_unique_idx;
DROP INDEX IF EXISTS team_secret_api_token_unique_idx;
DROP INDEX IF EXISTS unique_pending_job_per_range;
"""),
    ]
