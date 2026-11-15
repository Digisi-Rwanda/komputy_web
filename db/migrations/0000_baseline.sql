-- Baseline: the 57 web tables as they stood on 2026-11-15 (previously created by ECL-Server Alembic).
-- Generated with pg_dump --schema-only; do not edit. New changes go in later numbered files.
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $function$;

CREATE TABLE public.access_requests (
    id character varying(26) NOT NULL,
    code character varying(16) NOT NULL,
    tenant_id character varying(26),
    requester_id character varying(26),
    kind character varying(16) NOT NULL,
    service character varying(16),
    scope character varying(8) NOT NULL,
    status character varying(16) DEFAULT 'open'::character varying NOT NULL,
    details json DEFAULT '{}'::json NOT NULL,
    assignee_id character varying(26),
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);

CREATE TABLE public.audit_logs (
    id character varying(26) NOT NULL,
    user_id character varying(26),
    event_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'success'::character varying NOT NULL,
    ip_address_hash character varying(64),
    user_agent_hash character varying(64),
    details json,
    error_code character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id character varying(26)
);

CREATE TABLE public.auth_accounts (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    scope text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.auth_jwks (
    id character varying(26) NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    alg text,
    crv text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);

CREATE TABLE public.auth_sessions (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    ip_address text,
    user_agent text,
    active_organization_id character varying(26),
    impersonated_by character varying(26),
    device text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.auth_two_factor (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    secret text NOT NULL,
    backup_codes text NOT NULL,
    verified boolean DEFAULT true NOT NULL,
    failed_verification_count integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone
);

CREATE TABLE public.auth_verifications (
    id character varying(26) NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.catalog (
    id character varying(16) NOT NULL,
    draft json NOT NULL,
    published json NOT NULL,
    published_at timestamp with time zone,
    published_by character varying(26),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.collateral_types (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    name text NOT NULL,
    haircut numeric(5,2) NOT NULL,
    time_to_realize integer NOT NULL,
    created_by_user_id character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);

CREATE TABLE public.ead_results (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    loan_id text NOT NULL,
    customer_id text NOT NULL,
    segment text NOT NULL,
    stage text NOT NULL,
    snapshot_date date NOT NULL,
    period_since_orig integer NOT NULL,
    period_to_discount integer NOT NULL,
    monthly_instalment numeric(20,6) NOT NULL,
    bal_after_repayment numeric(20,6) NOT NULL,
    bal_after_missed numeric(20,6) NOT NULL,
    marginal_pd numeric(10,8),
    lgw numeric(10,8) NOT NULL,
    lgd numeric(10,8) NOT NULL,
    credit_loss numeric(20,6) NOT NULL,
    discounted_ecl numeric(20,6) NOT NULL,
    cure_rate numeric(10,8),
    treatment text,
    pd_rule text
);

CREATE TABLE public.ecl_loan_summaries (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    loan_id text NOT NULL,
    customer_id text NOT NULL,
    segment text NOT NULL,
    stage text NOT NULL,
    reporting_date date NOT NULL,
    outstanding numeric(20,6) NOT NULL,
    discounted_collateral numeric(20,6) NOT NULL,
    ecl_before_cap numeric(20,6) NOT NULL,
    ecl_capped boolean NOT NULL,
    total_ecl numeric(20,6) NOT NULL
);

CREATE TABLE public.email_outbox (
    id character varying(26) NOT NULL,
    task_name character varying(100) NOT NULL,
    payload json NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    dispatched_at timestamp with time zone,
    dispatch_attempts integer NOT NULL,
    last_dispatch_error text
);

CREATE TABLE public.email_verification_tokens (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.engine_versions (
    id character varying(26) NOT NULL,
    version text NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    release_date date NOT NULL,
    changelog jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by_user_id character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.entitlements (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    service character varying(16) NOT NULL,
    state character varying(16) NOT NULL,
    trial_ends_at timestamp with time zone,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    limits json DEFAULT '{}'::json NOT NULL,
    watermark boolean DEFAULT false NOT NULL,
    contract_ref text,
    price_note text,
    client_message text,
    updated_by character varying(26),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.impersonation_sessions (
    id character varying(26) NOT NULL,
    platform_user_id character varying(26) NOT NULL,
    target_tenant_id character varying(26) NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.invitations (
    id character varying(26) NOT NULL,
    email text NOT NULL,
    tenant_id character varying(26) NOT NULL,
    invited_by_user_id character varying(26) NOT NULL,
    role character varying(32) DEFAULT 'analyst'::character varying NOT NULL,
    token_hash character varying(64),
    status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    workspace_role character varying(16) DEFAULT 'member'::character varying NOT NULL,
    service_roles json DEFAULT '{}'::json NOT NULL,
    message text
);

CREATE TABLE public.lease_actual_payments (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    close_id character varying(26) NOT NULL,
    date date NOT NULL,
    vendor text NOT NULL,
    amount numeric(20,2) NOT NULL,
    reference text NOT NULL,
    lease_id character varying(26),
    expected numeric(20,2),
    match character varying(16) NOT NULL,
    resolution character varying(16),
    resolution_note text,
    resolved_by character varying(26)
);

CREATE TABLE public.lease_alerts_sent (
    tenant_id character varying(26) NOT NULL,
    lease_id character varying(26) NOT NULL,
    key character varying(64) NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_books (
    lease_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    chain_checksum character varying(64) NOT NULL,
    engine_version character varying(32) NOT NULL,
    exempt boolean NOT NULL,
    rows json NOT NULL,
    journals json NOT NULL,
    segments json NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_close_runs (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    period character varying(7) NOT NULL,
    steps json NOT NULL,
    batch_id character varying(26),
    started_by character varying(26) NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_counterparties (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    name text NOT NULL,
    vendor_ref text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_documents (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    lease_id character varying(26) NOT NULL,
    version_n integer NOT NULL,
    name text NOT NULL,
    size integer NOT NULL,
    content_type text NOT NULL,
    sha256 character varying(64) NOT NULL,
    kind character varying(16) NOT NULL,
    storage_key text NOT NULL,
    uploaded_by character varying(26) NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_entities (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    name text NOT NULL,
    currency character varying(8) NOT NULL,
    country text DEFAULT ''::text NOT NULL,
    fy_start_month integer DEFAULT 1 NOT NULL,
    book_name text NOT NULL,
    framework character varying(16) DEFAULT 'IFRS16'::character varying NOT NULL,
    standard_version text DEFAULT 'IFRS 16 (2016, as amended)'::text NOT NULL,
    lease_seq integer DEFAULT 0 NOT NULL,
    batch_seq integer DEFAULT 0 NOT NULL,
    import_seq integer DEFAULT 0 NOT NULL,
    import_mapping json,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_import_batches (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    code character varying(16) NOT NULL,
    file_name text NOT NULL,
    sha256 character varying(64) NOT NULL,
    size integer NOT NULL,
    status character varying(16) NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    retry_only boolean DEFAULT false NOT NULL,
    headers json NOT NULL,
    mapping json NOT NULL,
    warnings_accepted boolean DEFAULT false NOT NULL,
    warnings_accepted_by character varying(26),
    template_version text NOT NULL,
    created_by character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    committed_by character varying(26),
    committed_at timestamp with time zone
);

CREATE TABLE public.lease_import_rows (
    id integer NOT NULL,
    batch_id character varying(26) NOT NULL,
    "row" integer NOT NULL,
    ref text DEFAULT ''::text NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    "values" json NOT NULL,
    issues json NOT NULL,
    action character varying(16) DEFAULT 'create'::character varying NOT NULL,
    lease_id character varying(26),
    outcome character varying(16),
    outcome_message text
);

CREATE SEQUENCE public.lease_import_rows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.lease_import_rows_id_seq OWNED BY public.lease_import_rows.id;

CREATE TABLE public.lease_journal_batches (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    code character varying(32) NOT NULL,
    period character varying(7) NOT NULL,
    type character varying(16) NOT NULL,
    status character varying(16) NOT NULL,
    source_checksum character varying(64) DEFAULT ''::character varying NOT NULL,
    idempotency_key text NOT NULL,
    created_by character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_by character varying(26),
    approved_at timestamp with time zone,
    exported_at timestamp with time zone,
    erp_ref text,
    posted_by character varying(26),
    posted_at timestamp with time zone,
    reversal_of character varying(26),
    reversed_by character varying(26)
);

CREATE TABLE public.lease_journal_lines (
    id integer NOT NULL,
    tenant_id character varying(26) NOT NULL,
    batch_id character varying(26) NOT NULL,
    lease_id character varying(26) NOT NULL,
    account character varying(32) NOT NULL,
    kind character varying(16) NOT NULL,
    debit numeric(20,2) NOT NULL,
    credit numeric(20,2) NOT NULL,
    catch_up boolean DEFAULT false NOT NULL
);

CREATE SEQUENCE public.lease_journal_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.lease_journal_lines_id_seq OWNED BY public.lease_journal_lines.id;

CREATE TABLE public.lease_periods (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    key character varying(7) NOT NULL,
    status character varying(16) DEFAULT 'open'::character varying NOT NULL,
    locked_by character varying(26),
    locked_at timestamp with time zone,
    reopen_log json NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_posted_balances (
    tenant_id character varying(26) NOT NULL,
    lease_id character varying(26) NOT NULL,
    account character varying(32) NOT NULL,
    amount numeric(20,2) NOT NULL
);

CREATE TABLE public.lease_saved_views (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    name text NOT NULL,
    query text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lease_setup_versions (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    kind character varying(16) NOT NULL,
    version integer NOT NULL,
    effective_from date NOT NULL,
    status character varying(16) NOT NULL,
    reason text NOT NULL,
    data json NOT NULL,
    created_by character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_by character varying(26),
    approved_at timestamp with time zone
);

CREATE TABLE public.lease_versions (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    lease_id character varying(26) NOT NULL,
    n integer NOT NULL,
    status character varying(16) NOT NULL,
    event character varying(16) NOT NULL,
    effective_date date,
    reason text DEFAULT ''::text NOT NULL,
    terms json NOT NULL,
    assessment json NOT NULL,
    rate json NOT NULL,
    scope_decrease numeric(12,8),
    termination_penalty numeric(20,2),
    comments json NOT NULL,
    created_by character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_by character varying(26),
    submitted_at timestamp with time zone,
    approver_id character varying(26),
    decided_by character varying(26),
    decided_at timestamp with time zone,
    calc_liability numeric(20,2),
    calc_rou numeric(20,2),
    calc_checks_ok boolean,
    calc_at timestamp with time zone,
    input_checksum character varying(64),
    engine_version character varying(32)
);

CREATE TABLE public.leases (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    code character varying(16) NOT NULL,
    name text NOT NULL,
    asset_class character varying(16) NOT NULL,
    counterparty_id character varying(26) DEFAULT ''::character varying NOT NULL,
    entity_id character varying(26) NOT NULL,
    location text DEFAULT ''::text NOT NULL,
    currency character varying(8) NOT NULL,
    owner_id character varying(26) NOT NULL,
    cost_centre text DEFAULT ''::text NOT NULL,
    contract_total numeric(20,2),
    signature_date date,
    contract_end_date date,
    wizard_step integer DEFAULT 0 NOT NULL,
    rev integer DEFAULT 1 NOT NULL,
    import_batch_id character varying(26),
    verification_failed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.lgd_results (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    loan_id text NOT NULL,
    customer_id text NOT NULL,
    eir numeric(10,8) NOT NULL,
    sum_discounted_collat numeric(20,6) NOT NULL
);

CREATE TABLE public.member_service_roles (
    id character varying(26) NOT NULL,
    membership_id character varying(26) NOT NULL,
    service character varying(16) NOT NULL,
    role character varying(16) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notification_preferences (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    run_completed boolean DEFAULT true NOT NULL,
    run_failed boolean DEFAULT true NOT NULL,
    weekly_summary boolean DEFAULT false NOT NULL,
    member_joined boolean DEFAULT true NOT NULL,
    product_updates boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    matrix json DEFAULT '{}'::json NOT NULL,
    muted_kinds text[] DEFAULT '{}'::text[] NOT NULL,
    digest character varying(8) DEFAULT 'daily'::character varying NOT NULL
);

CREATE TABLE public.output_artifacts (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    kind text NOT NULL,
    storage_path text NOT NULL,
    sha256 character varying(64) NOT NULL,
    file_size_bytes bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.password_reset_tokens (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pd_observation_snapshots (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    engine_version text NOT NULL,
    payload json NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pd_results (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    segment text NOT NULL,
    month integer NOT NULL,
    transition text NOT NULL,
    s1_prob numeric(10,8) NOT NULL,
    s2_prob numeric(10,8) NOT NULL,
    s3_prob numeric(10,8) NOT NULL,
    marginal_pd numeric(10,8) NOT NULL,
    cure_rate numeric(10,8) NOT NULL
);

CREATE TABLE public.pd_validation_thresholds (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    max_month_gap integer DEFAULT 1 NOT NULL,
    min_transitions integer DEFAULT 3 NOT NULL,
    stage3_share_min numeric(6,4) DEFAULT 0 NOT NULL,
    stage3_share_max numeric(6,4) DEFAULT 0.4 NOT NULL,
    cure_rate_min numeric(6,4) DEFAULT 0.02 NOT NULL,
    cure_rate_max numeric(6,4) DEFAULT 0.9 NOT NULL,
    offbooks_abs_band numeric(6,4) DEFAULT 0.1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);

CREATE TABLE public.refresh_tokens (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    token_family_id character varying(26) NOT NULL,
    token_hash character varying(64) NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.request_events (
    id character varying(26) NOT NULL,
    request_id character varying(26) NOT NULL,
    actor_id character varying(26),
    kind character varying(16) NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.run_exceptions (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    seq integer NOT NULL,
    category text NOT NULL,
    dataset text NOT NULL,
    loan_id text DEFAULT ''::text NOT NULL,
    customer_id text DEFAULT ''::text NOT NULL,
    field text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    issue text NOT NULL,
    action text NOT NULL
);

CREATE TABLE public.runs (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    created_by_user_id character varying(26) NOT NULL,
    name text NOT NULL,
    reporting_period text,
    status text DEFAULT 'draft'::text NOT NULL,
    engine_version text DEFAULT 'v1.0.0'::text NOT NULL,
    engine_progress json,
    combine_pd_files boolean DEFAULT true NOT NULL,
    failure_stage text,
    failure_message text,
    failure_ref text,
    total_ecl numeric(20,6),
    total_outstanding numeric(20,6),
    coverage_ratio numeric(10,6),
    run_warnings json,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by_user_id character varying(26),
    reporting_date date,
    reconciliation json,
    currency character varying(8) DEFAULT 'USD'::character varying NOT NULL
);

CREATE TABLE public.segments (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    name text NOT NULL,
    code text,
    created_by_user_id character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.sessions (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    refresh_token_id character varying(26) NOT NULL,
    device_type character varying(16) NOT NULL,
    device_name text,
    browser text,
    ip_address_hash character varying(64) NOT NULL,
    country character varying(8),
    last_active_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.support_sessions (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    staff_id character varying(26) NOT NULL,
    reason text NOT NULL,
    minutes integer NOT NULL,
    status character varying(12) DEFAULT 'requested'::character varying NOT NULL,
    decided_by character varying(26),
    decided_at timestamp with time zone,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    ended_by character varying(26),
    actions_logged integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_support_sessions_minutes CHECK (((minutes >= 15) AND (minutes <= 120)))
);

CREATE TABLE public.tenant_memberships (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    role character varying(32) DEFAULT 'analyst'::character varying NOT NULL,
    status character varying(32) DEFAULT 'active'::character varying NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    workspace_role character varying(16) DEFAULT 'member'::character varying NOT NULL
);

CREATE TABLE public.tenants (
    id character varying(26) NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    plan character varying(32) DEFAULT 'trial'::character varying NOT NULL,
    status character varying(32) DEFAULT 'trial'::character varying NOT NULL,
    currency character varying(8) DEFAULT 'USD'::character varying NOT NULL,
    reporting_cadence character varying(16) DEFAULT 'monthly'::character varying NOT NULL,
    timezone character varying(64) DEFAULT 'Africa/Kigali'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    region text,
    mrr_cents integer DEFAULT 0 NOT NULL,
    engine_version_pin text,
    close_requested_at timestamp with time zone,
    close_requested_by character varying(26),
    logo text,
    metadata text,
    legal_name text,
    country character varying(64),
    fiscal_year_end character varying(5) DEFAULT '12-31'::character varying NOT NULL,
    require_mfa boolean DEFAULT false NOT NULL,
    allowed_domains text[] DEFAULT '{}'::text[] NOT NULL,
    session_timeout_hours integer DEFAULT 8 NOT NULL,
    idle_signout boolean DEFAULT true NOT NULL,
    support_policy character varying(8) DEFAULT 'ask'::character varying NOT NULL,
    account_manager_id character varying(26),
    authz_version integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.token_blacklist (
    jti character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    reason character varying(32) NOT NULL,
    revoked_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.uploads (
    id character varying(26) NOT NULL,
    run_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    kind text NOT NULL,
    original_filename text NOT NULL,
    sha256 character varying(64) NOT NULL,
    storage_path text NOT NULL,
    file_size_bytes bigint NOT NULL,
    sheet_count integer,
    row_count integer,
    validation_status text,
    warnings_accepted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_notifications (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    kind character varying(32) NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    href text,
    action character varying(32)
);

CREATE TABLE public.users (
    id character varying(26) NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    hashed_password text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    is_platform_admin boolean DEFAULT false NOT NULL,
    failed_login_count integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    totp_secret_encrypted text,
    totp_enabled boolean DEFAULT false NOT NULL,
    totp_backup_codes json,
    title text,
    avatar_storage_path text,
    platform_role character varying(16),
    phone character varying(32),
    locale character varying(8) DEFAULT 'en'::character varying NOT NULL,
    time_zone character varying(64) DEFAULT 'Africa/Kigali'::character varying NOT NULL,
    number_format character varying(16) DEFAULT '1,234.56'::character varying NOT NULL,
    image text,
    avatar_data text
);

CREATE TABLE public.workspace_notes (
    id character varying(26) NOT NULL,
    tenant_id character varying(26) NOT NULL,
    author_id character varying(26),
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.lease_import_rows ALTER COLUMN id SET DEFAULT nextval('public.lease_import_rows_id_seq'::regclass);

ALTER TABLE ONLY public.lease_journal_lines ALTER COLUMN id SET DEFAULT nextval('public.lease_journal_lines_id_seq'::regclass);

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_code_key UNIQUE (code);

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.auth_accounts
    ADD CONSTRAINT auth_accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.auth_jwks
    ADD CONSTRAINT auth_jwks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_token_key UNIQUE (token);

ALTER TABLE ONLY public.auth_two_factor
    ADD CONSTRAINT auth_two_factor_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.auth_two_factor
    ADD CONSTRAINT auth_two_factor_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.auth_verifications
    ADD CONSTRAINT auth_verifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.catalog
    ADD CONSTRAINT catalog_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.collateral_types
    ADD CONSTRAINT collateral_types_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ead_results
    ADD CONSTRAINT ead_results_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ecl_loan_summaries
    ADD CONSTRAINT ecl_loan_summaries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.email_outbox
    ADD CONSTRAINT email_outbox_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_hash_key UNIQUE (token_hash);

ALTER TABLE ONLY public.engine_versions
    ADD CONSTRAINT engine_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.engine_versions
    ADD CONSTRAINT engine_versions_version_key UNIQUE (version);

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_tenant_id_service_key UNIQUE (tenant_id, service);

ALTER TABLE ONLY public.impersonation_sessions
    ADD CONSTRAINT impersonation_sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_hash_key UNIQUE (token_hash);

ALTER TABLE ONLY public.lease_actual_payments
    ADD CONSTRAINT lease_actual_payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_alerts_sent
    ADD CONSTRAINT lease_alerts_sent_pkey PRIMARY KEY (lease_id, key);

ALTER TABLE ONLY public.lease_books
    ADD CONSTRAINT lease_books_pkey PRIMARY KEY (lease_id);

ALTER TABLE ONLY public.lease_close_runs
    ADD CONSTRAINT lease_close_runs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_close_runs
    ADD CONSTRAINT lease_close_runs_tenant_id_period_key UNIQUE (tenant_id, period);

ALTER TABLE ONLY public.lease_counterparties
    ADD CONSTRAINT lease_counterparties_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_documents
    ADD CONSTRAINT lease_documents_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_documents
    ADD CONSTRAINT lease_documents_tenant_id_sha256_key UNIQUE (tenant_id, sha256);

ALTER TABLE ONLY public.lease_entities
    ADD CONSTRAINT lease_entities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_entities
    ADD CONSTRAINT lease_entities_tenant_id_key UNIQUE (tenant_id);

ALTER TABLE ONLY public.lease_import_batches
    ADD CONSTRAINT lease_import_batches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_import_batches
    ADD CONSTRAINT lease_import_batches_tenant_id_code_key UNIQUE (tenant_id, code);

ALTER TABLE ONLY public.lease_import_rows
    ADD CONSTRAINT lease_import_rows_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_journal_batches
    ADD CONSTRAINT lease_journal_batches_idempotency_key_key UNIQUE (idempotency_key);

ALTER TABLE ONLY public.lease_journal_batches
    ADD CONSTRAINT lease_journal_batches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_journal_batches
    ADD CONSTRAINT lease_journal_batches_tenant_id_code_key UNIQUE (tenant_id, code);

ALTER TABLE ONLY public.lease_journal_lines
    ADD CONSTRAINT lease_journal_lines_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_periods
    ADD CONSTRAINT lease_periods_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_periods
    ADD CONSTRAINT lease_periods_tenant_id_key_key UNIQUE (tenant_id, key);

ALTER TABLE ONLY public.lease_posted_balances
    ADD CONSTRAINT lease_posted_balances_pkey PRIMARY KEY (lease_id, account);

ALTER TABLE ONLY public.lease_saved_views
    ADD CONSTRAINT lease_saved_views_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_setup_versions
    ADD CONSTRAINT lease_setup_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lease_setup_versions
    ADD CONSTRAINT lease_setup_versions_tenant_id_kind_version_key UNIQUE (tenant_id, kind, version);

ALTER TABLE ONLY public.lease_versions
    ADD CONSTRAINT lease_versions_lease_id_n_key UNIQUE (lease_id, n);

ALTER TABLE ONLY public.lease_versions
    ADD CONSTRAINT lease_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT leases_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT leases_tenant_id_code_key UNIQUE (tenant_id, code);

ALTER TABLE ONLY public.lgd_results
    ADD CONSTRAINT lgd_results_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lgd_results
    ADD CONSTRAINT lgd_results_unique UNIQUE (run_id, loan_id);

ALTER TABLE ONLY public.member_service_roles
    ADD CONSTRAINT member_service_roles_membership_id_service_key UNIQUE (membership_id, service);

ALTER TABLE ONLY public.member_service_roles
    ADD CONSTRAINT member_service_roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT memberships_unique UNIQUE (user_id, tenant_id);

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.output_artifacts
    ADD CONSTRAINT output_artifacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);

ALTER TABLE ONLY public.pd_observation_snapshots
    ADD CONSTRAINT pd_observation_snapshots_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pd_results
    ADD CONSTRAINT pd_results_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pd_results
    ADD CONSTRAINT pd_results_unique UNIQUE (run_id, segment, month, transition);

ALTER TABLE ONLY public.pd_validation_thresholds
    ADD CONSTRAINT pd_validation_thresholds_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);

ALTER TABLE ONLY public.request_events
    ADD CONSTRAINT request_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.run_exceptions
    ADD CONSTRAINT run_exceptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.segments
    ADD CONSTRAINT segments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.token_blacklist
    ADD CONSTRAINT token_blacklist_pkey PRIMARY KEY (jti);

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.workspace_notes
    ADD CONSTRAINT workspace_notes_pkey PRIMARY KEY (id);

CREATE INDEX audit_created_at_idx ON public.audit_logs USING btree (created_at);

CREATE INDEX audit_event_type_idx ON public.audit_logs USING btree (event_type);

CREATE INDEX audit_tenant_id_idx ON public.audit_logs USING btree (tenant_id);

CREATE INDEX audit_user_event_time_idx ON public.audit_logs USING btree (user_id, event_type, created_at);

CREATE INDEX audit_user_idx ON public.audit_logs USING btree (user_id);

CREATE INDEX collateral_types_tenant_idx ON public.collateral_types USING btree (tenant_id);

CREATE UNIQUE INDEX collateral_types_tenant_name_unique_idx ON public.collateral_types USING btree (tenant_id, name) WHERE (deleted_at IS NULL);

CREATE INDEX ead_results_run_idx ON public.ead_results USING btree (run_id);

CREATE INDEX ead_results_run_loan_idx ON public.ead_results USING btree (run_id, loan_id);

CREATE INDEX ead_results_run_segment_idx ON public.ead_results USING btree (run_id, segment);

CREATE INDEX ecl_loan_summaries_run_segment_idx ON public.ecl_loan_summaries USING btree (run_id, segment);

CREATE INDEX engine_versions_is_current_idx ON public.engine_versions USING btree (is_current);

CREATE INDEX impersonation_platform_active_idx ON public.impersonation_sessions USING btree (platform_user_id, is_active);

CREATE INDEX impersonation_target_tenant_idx ON public.impersonation_sessions USING btree (target_tenant_id);

CREATE INDEX ix_access_requests_scope_status ON public.access_requests USING btree (scope, status);

CREATE INDEX ix_access_requests_tenant_id ON public.access_requests USING btree (tenant_id);

CREATE INDEX ix_auth_accounts_user_id ON public.auth_accounts USING btree (user_id);

CREATE INDEX ix_auth_sessions_user_id ON public.auth_sessions USING btree (user_id);

CREATE INDEX ix_auth_verifications_identifier ON public.auth_verifications USING btree (identifier);

CREATE INDEX ix_ecl_loan_summaries_run_id ON public.ecl_loan_summaries USING btree (run_id);

CREATE INDEX ix_ecl_loan_summaries_tenant_id ON public.ecl_loan_summaries USING btree (tenant_id);

CREATE INDEX ix_email_outbox_status ON public.email_outbox USING btree (status);

CREATE INDEX ix_email_outbox_status_created ON public.email_outbox USING btree (status, created_at);

CREATE INDEX ix_lease_actual_payments_close_id ON public.lease_actual_payments USING btree (close_id);

CREATE INDEX ix_lease_actual_payments_tenant_id ON public.lease_actual_payments USING btree (tenant_id);

CREATE INDEX ix_lease_books_tenant_id ON public.lease_books USING btree (tenant_id);

CREATE INDEX ix_lease_close_runs_tenant_id ON public.lease_close_runs USING btree (tenant_id);

CREATE INDEX ix_lease_counterparties_tenant_id ON public.lease_counterparties USING btree (tenant_id);

CREATE INDEX ix_lease_documents_lease_id ON public.lease_documents USING btree (lease_id);

CREATE INDEX ix_lease_documents_tenant_id ON public.lease_documents USING btree (tenant_id);

CREATE INDEX ix_lease_import_batches_tenant_id ON public.lease_import_batches USING btree (tenant_id);

CREATE INDEX ix_lease_import_rows_batch_id ON public.lease_import_rows USING btree (batch_id);

CREATE INDEX ix_lease_journal_batches_tenant_id ON public.lease_journal_batches USING btree (tenant_id);

CREATE INDEX ix_lease_journal_lines_batch_id ON public.lease_journal_lines USING btree (batch_id);

CREATE INDEX ix_lease_journal_lines_lease_id ON public.lease_journal_lines USING btree (lease_id);

CREATE INDEX ix_lease_periods_tenant_id ON public.lease_periods USING btree (tenant_id);

CREATE INDEX ix_lease_posted_balances_tenant_id ON public.lease_posted_balances USING btree (tenant_id);

CREATE INDEX ix_lease_saved_views_tenant_id ON public.lease_saved_views USING btree (tenant_id);

CREATE INDEX ix_lease_setup_versions_tenant_id ON public.lease_setup_versions USING btree (tenant_id);

CREATE INDEX ix_lease_versions_lease_id ON public.lease_versions USING btree (lease_id);

CREATE INDEX ix_lease_versions_tenant_id ON public.lease_versions USING btree (tenant_id);

CREATE INDEX ix_leases_tenant_id ON public.leases USING btree (tenant_id);

CREATE UNIQUE INDEX ix_pd_observation_snapshots_run_id ON public.pd_observation_snapshots USING btree (run_id);

CREATE INDEX ix_pd_observation_snapshots_tenant_id ON public.pd_observation_snapshots USING btree (tenant_id);

CREATE INDEX ix_pd_validation_thresholds_tenant_id ON public.pd_validation_thresholds USING btree (tenant_id);

CREATE INDEX ix_request_events_request_id ON public.request_events USING btree (request_id);

CREATE INDEX ix_run_exceptions_run_id ON public.run_exceptions USING btree (run_id);

CREATE INDEX ix_run_exceptions_tenant_id ON public.run_exceptions USING btree (tenant_id);

CREATE INDEX ix_support_sessions_tenant_id ON public.support_sessions USING btree (tenant_id);

CREATE INDEX ix_user_notifications_tenant_id ON public.user_notifications USING btree (tenant_id);

CREATE INDEX ix_user_notifications_user_created ON public.user_notifications USING btree (user_id, created_at);

CREATE INDEX ix_user_notifications_user_id ON public.user_notifications USING btree (user_id);

CREATE INDEX ix_workspace_notes_tenant_id ON public.workspace_notes USING btree (tenant_id);

CREATE UNIQUE INDEX lease_batches_erp_ref_uq ON public.lease_journal_batches USING btree (tenant_id, erp_ref) WHERE (erp_ref IS NOT NULL);

CREATE UNIQUE INDEX lease_cp_tenant_name_uq ON public.lease_counterparties USING btree (tenant_id, lower(name));

CREATE UNIQUE INDEX lease_imports_committed_sha_uq ON public.lease_import_batches USING btree (tenant_id, sha256) WHERE ((status)::text = 'committed'::text);

CREATE UNIQUE INDEX lease_setup_one_pending ON public.lease_setup_versions USING btree (tenant_id, kind) WHERE ((status)::text = 'in_review'::text);

CREATE UNIQUE INDEX lease_versions_one_pending ON public.lease_versions USING btree (lease_id) WHERE ((status)::text = ANY ((ARRAY['draft'::character varying, 'in_review'::character varying, 'returned'::character varying])::text[]));

CREATE INDEX leases_tenant_updated_idx ON public.leases USING btree (tenant_id, updated_at);

CREATE INDEX lgd_results_run_idx ON public.lgd_results USING btree (run_id);

CREATE INDEX lgd_results_run_tenant_idx ON public.lgd_results USING btree (run_id, tenant_id);

CREATE INDEX memberships_tenant_idx ON public.tenant_memberships USING btree (tenant_id);

CREATE INDEX memberships_user_idx ON public.tenant_memberships USING btree (user_id);

CREATE INDEX notification_preferences_user_id_idx ON public.notification_preferences USING btree (user_id);

CREATE INDEX output_artifacts_run_idx ON public.output_artifacts USING btree (run_id);

CREATE INDEX pd_results_run_idx ON public.pd_results USING btree (run_id);

CREATE INDEX pd_results_run_segment_idx ON public.pd_results USING btree (run_id, segment);

CREATE UNIQUE INDEX pd_validation_thresholds_tenant_uniq ON public.pd_validation_thresholds USING btree (tenant_id) WHERE (deleted_at IS NULL);

CREATE INDEX runs_tenant_created_idx ON public.runs USING btree (tenant_id, created_at);

CREATE INDEX runs_tenant_idx ON public.runs USING btree (tenant_id);

CREATE INDEX runs_tenant_status_idx ON public.runs USING btree (tenant_id, status);

CREATE INDEX segments_tenant_idx ON public.segments USING btree (tenant_id);

CREATE UNIQUE INDEX segments_tenant_name_unique_idx ON public.segments USING btree (tenant_id, name) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX tenants_slug_active_idx ON public.tenants USING btree (slug) WHERE (deleted_at IS NULL);

CREATE INDEX token_blacklist_expires_idx ON public.token_blacklist USING btree (expires_at);

CREATE INDEX token_blacklist_user_idx ON public.token_blacklist USING btree (user_id);

CREATE INDEX uploads_run_idx ON public.uploads USING btree (run_id);

CREATE INDEX uploads_tenant_idx ON public.uploads USING btree (tenant_id);

CREATE UNIQUE INDEX users_email_active_idx ON public.users USING btree (email) WHERE (deleted_at IS NULL);

CREATE TRIGGER collateral_types_updated_at BEFORE UPDATE ON public.collateral_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER engine_versions_updated_at BEFORE UPDATE ON public.engine_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER pd_validation_thresholds_updated_at BEFORE UPDATE ON public.pd_validation_thresholds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER runs_updated_at BEFORE UPDATE ON public.runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER segments_updated_at BEFORE UPDATE ON public.segments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tenant_memberships_updated_at BEFORE UPDATE ON public.tenant_memberships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.auth_accounts
    ADD CONSTRAINT auth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_active_organization_id_fkey FOREIGN KEY (active_organization_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.auth_two_factor
    ADD CONSTRAINT auth_two_factor_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.catalog
    ADD CONSTRAINT catalog_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.lease_actual_payments
    ADD CONSTRAINT lease_actual_payments_close_id_fkey FOREIGN KEY (close_id) REFERENCES public.lease_close_runs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.lease_books
    ADD CONSTRAINT lease_books_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.lease_documents
    ADD CONSTRAINT lease_documents_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.lease_import_rows
    ADD CONSTRAINT lease_import_rows_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.lease_import_batches(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.lease_journal_lines
    ADD CONSTRAINT lease_journal_lines_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.lease_journal_batches(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.lease_versions
    ADD CONSTRAINT lease_versions_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.member_service_roles
    ADD CONSTRAINT member_service_roles_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.tenant_memberships(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.request_events
    ADD CONSTRAINT request_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.request_events
    ADD CONSTRAINT request_events_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.access_requests(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_ended_by_fkey FOREIGN KEY (ended_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.support_sessions
    ADD CONSTRAINT support_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_account_manager_id_fkey FOREIGN KEY (account_manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.workspace_notes
    ADD CONSTRAINT workspace_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.workspace_notes
    ADD CONSTRAINT workspace_notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

