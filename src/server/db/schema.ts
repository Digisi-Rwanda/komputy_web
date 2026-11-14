import { pgTable, varchar, index, foreignKey, text, timestamp, unique, boolean, uniqueIndex, numeric, integer, bigint, json, date, jsonb, serial, check, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const alembicVersion = pgTable("alembic_version", {
	versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const authAccounts = pgTable("auth_accounts", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: 'date' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: 'date' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_auth_accounts_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth_accounts_user_id_fkey"
		}).onDelete("cascade"),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	unique("password_reset_tokens_token_hash_key").on(table.tokenHash),
]);

export const emailVerificationTokens = pgTable("email_verification_tokens", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	unique("email_verification_tokens_token_hash_key").on(table.tokenHash),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	tokenFamilyId: varchar("token_family_id", { length: 26 }).notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	isRevoked: boolean("is_revoked").default(false).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	unique("refresh_tokens_token_hash_key").on(table.tokenHash),
]);

export const sessions = pgTable("sessions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	refreshTokenId: varchar("refresh_token_id", { length: 26 }).notNull(),
	deviceType: varchar("device_type", { length: 16 }).notNull(),
	deviceName: text("device_name"),
	browser: text(),
	ipAddressHash: varchar("ip_address_hash", { length: 64 }).notNull(),
	country: varchar({ length: 8 }),
	lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	activeOrganizationId: varchar("active_organization_id", { length: 26 }),
	impersonatedBy: varchar("impersonated_by", { length: 26 }),
	device: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_auth_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth_sessions_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.activeOrganizationId],
			foreignColumns: [tenants.id],
			name: "auth_sessions_active_organization_id_fkey"
		}).onDelete("set null"),
	unique("auth_sessions_token_key").on(table.token),
]);

export const collateralTypes = pgTable("collateral_types", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	name: text().notNull(),
	haircut: numeric({ precision: 5, scale:  2 }).notNull(),
	timeToRealize: integer("time_to_realize").notNull(),
	createdByUserId: varchar("created_by_user_id", { length: 26 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
}, (table) => [
	index("collateral_types_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("collateral_types_tenant_name_unique_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const tokenBlacklist = pgTable("token_blacklist", {
	jti: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	reason: varchar({ length: 32 }).notNull(),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("token_blacklist_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("token_blacklist_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const authVerifications = pgTable("auth_verifications", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_auth_verifications_identifier").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const uploads = pgTable("uploads", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	kind: text().notNull(),
	originalFilename: text("original_filename").notNull(),
	sha256: varchar({ length: 64 }).notNull(),
	storagePath: text("storage_path").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
	sheetCount: integer("sheet_count"),
	rowCount: integer("row_count"),
	validationStatus: text("validation_status"),
	warningsAccepted: boolean("warnings_accepted").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("uploads_run_idx").using("btree", table.runId.asc().nullsLast().op("text_ops")),
	index("uploads_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const pdResults = pgTable("pd_results", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	segment: text().notNull(),
	month: integer().notNull(),
	transition: text().notNull(),
	s1Prob: numeric("s1_prob", { precision: 10, scale:  8 }).notNull(),
	s2Prob: numeric("s2_prob", { precision: 10, scale:  8 }).notNull(),
	s3Prob: numeric("s3_prob", { precision: 10, scale:  8 }).notNull(),
	marginalPd: numeric("marginal_pd", { precision: 10, scale:  8 }).notNull(),
	cureRate: numeric("cure_rate", { precision: 10, scale:  8 }).notNull(),
}, (table) => [
	index("pd_results_run_idx").using("btree", table.runId.asc().nullsLast().op("text_ops")),
	index("pd_results_run_segment_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.segment.asc().nullsLast().op("text_ops")),
	unique("pd_results_unique").on(table.runId, table.segment, table.month, table.transition),
]);

export const lgdResults = pgTable("lgd_results", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	loanId: text("loan_id").notNull(),
	customerId: text("customer_id").notNull(),
	eir: numeric({ precision: 10, scale:  8 }).notNull(),
	sumDiscountedCollat: numeric("sum_discounted_collat", { precision: 20, scale:  6 }).notNull(),
}, (table) => [
	index("lgd_results_run_idx").using("btree", table.runId.asc().nullsLast().op("text_ops")),
	index("lgd_results_run_tenant_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.tenantId.asc().nullsLast().op("text_ops")),
	unique("lgd_results_unique").on(table.runId, table.loanId),
]);

export const outputArtifacts = pgTable("output_artifacts", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	kind: text().notNull(),
	storagePath: text("storage_path").notNull(),
	sha256: varchar({ length: 64 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("output_artifacts_run_idx").using("btree", table.runId.asc().nullsLast().op("text_ops")),
]);

export const segments = pgTable("segments", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	name: text().notNull(),
	code: text(),
	createdByUserId: varchar("created_by_user_id", { length: 26 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	index("segments_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("segments_tenant_name_unique_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const users = pgTable("users", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	hashedPassword: text("hashed_password").default('').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	isEmailVerified: boolean("is_email_verified").default(false).notNull(),
	isPlatformAdmin: boolean("is_platform_admin").default(false).notNull(),
	failedLoginCount: integer("failed_login_count").default(0).notNull(),
	lockedUntil: timestamp("locked_until", { withTimezone: true, mode: 'date' }),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
	totpSecretEncrypted: text("totp_secret_encrypted"),
	totpEnabled: boolean("totp_enabled").default(false).notNull(),
	totpBackupCodes: json("totp_backup_codes"),
	title: text(),
	avatarStoragePath: text("avatar_storage_path"),
	platformRole: varchar("platform_role", { length: 16 }),
	phone: varchar({ length: 32 }),
	locale: varchar({ length: 8 }).default('en').notNull(),
	timeZone: varchar("time_zone", { length: 64 }).default('Africa/Kigali').notNull(),
	numberFormat: varchar("number_format", { length: 16 }).default('1,234.56').notNull(),
	image: text(),
	avatarData: text("avatar_data"),
}, (table) => [
	uniqueIndex("users_email_active_idx").using("btree", table.email.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const authTwoFactor = pgTable("auth_two_factor", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	secret: text().notNull(),
	backupCodes: text("backup_codes").notNull(),
	verified: boolean().default(true).notNull(),
	failedVerificationCount: integer("failed_verification_count").default(0).notNull(),
	lockedUntil: timestamp("locked_until", { withTimezone: true, mode: 'date' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth_two_factor_user_id_fkey"
		}).onDelete("cascade"),
	unique("auth_two_factor_user_id_key").on(table.userId),
]);

export const authJwks = pgTable("auth_jwks", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	alg: text(),
	crv: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }),
});

export const auditLogs = pgTable("audit_logs", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	status: varchar({ length: 20 }).default('success').notNull(),
	ipAddressHash: varchar("ip_address_hash", { length: 64 }),
	userAgentHash: varchar("user_agent_hash", { length: 64 }),
	details: json(),
	errorCode: varchar("error_code", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }),
}, (table) => [
	index("audit_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("audit_event_type_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("audit_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("audit_user_event_time_idx").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.eventType.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("audit_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const tenantMemberships = pgTable("tenant_memberships", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	role: varchar({ length: 32 }).default('analyst').notNull(),
	status: varchar({ length: 32 }).default('active').notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	workspaceRole: varchar("workspace_role", { length: 16 }).default('member').notNull(),
}, (table) => [
	index("memberships_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("memberships_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("memberships_unique").on(table.userId, table.tenantId),
]);

export const engineVersions = pgTable("engine_versions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	version: text().notNull(),
	isCurrent: boolean("is_current").default(false).notNull(),
	releaseDate: date("release_date").notNull(),
	changelog: jsonb().default([]).notNull(),
	createdByUserId: varchar("created_by_user_id", { length: 26 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("engine_versions_is_current_idx").using("btree", table.isCurrent.asc().nullsLast().op("bool_ops")),
	unique("engine_versions_version_key").on(table.version),
]);

export const impersonationSessions = pgTable("impersonation_sessions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	platformUserId: varchar("platform_user_id", { length: 26 }).notNull(),
	targetTenantId: varchar("target_tenant_id", { length: 26 }).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'date' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("impersonation_platform_active_idx").using("btree", table.platformUserId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	index("impersonation_target_tenant_idx").using("btree", table.targetTenantId.asc().nullsLast().op("text_ops")),
]);

export const emailOutbox = pgTable("email_outbox", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	taskName: varchar("task_name", { length: 100 }).notNull(),
	payload: json().notNull(),
	status: varchar({ length: 20 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	dispatchedAt: timestamp("dispatched_at", { withTimezone: true, mode: 'date' }),
	dispatchAttempts: integer("dispatch_attempts").notNull(),
	lastDispatchError: text("last_dispatch_error"),
}, (table) => [
	index("ix_email_outbox_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("ix_email_outbox_status_created").using("btree", table.status.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
]);

export const invitations = pgTable("invitations", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	email: text().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	invitedByUserId: varchar("invited_by_user_id", { length: 26 }).notNull(),
	role: varchar({ length: 32 }).default('analyst').notNull(),
	tokenHash: varchar("token_hash", { length: 64 }),
	status: varchar({ length: 32 }).default('pending').notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	workspaceRole: varchar("workspace_role", { length: 16 }).default('member').notNull(),
	serviceRoles: json("service_roles").default({}).notNull(),
	message: text(),
}, (table) => [
	unique("invitations_token_hash_key").on(table.tokenHash),
]);

export const pdValidationThresholds = pgTable("pd_validation_thresholds", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	maxMonthGap: integer("max_month_gap").default(1).notNull(),
	minTransitions: integer("min_transitions").default(3).notNull(),
	stage3ShareMin: numeric("stage3_share_min", { precision: 6, scale:  4 }).default('0').notNull(),
	stage3ShareMax: numeric("stage3_share_max", { precision: 6, scale:  4 }).default('0.4').notNull(),
	cureRateMin: numeric("cure_rate_min", { precision: 6, scale:  4 }).default('0.02').notNull(),
	cureRateMax: numeric("cure_rate_max", { precision: 6, scale:  4 }).default('0.9').notNull(),
	offbooksAbsBand: numeric("offbooks_abs_band", { precision: 6, scale:  4 }).default('0.1').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
}, (table) => [
	index("ix_pd_validation_thresholds_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("pd_validation_thresholds_tenant_uniq").using("btree", table.tenantId.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const pdObservationSnapshots = pgTable("pd_observation_snapshots", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	engineVersion: text("engine_version").notNull(),
	payload: json().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("ix_pd_observation_snapshots_run_id").using("btree", table.runId.asc().nullsLast().op("text_ops")),
	index("ix_pd_observation_snapshots_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const eadResults = pgTable("ead_results", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	loanId: text("loan_id").notNull(),
	customerId: text("customer_id").notNull(),
	segment: text().notNull(),
	stage: text().notNull(),
	snapshotDate: date("snapshot_date").notNull(),
	periodSinceOrig: integer("period_since_orig").notNull(),
	periodToDiscount: integer("period_to_discount").notNull(),
	monthlyInstalment: numeric("monthly_instalment", { precision: 20, scale:  6 }).notNull(),
	balAfterRepayment: numeric("bal_after_repayment", { precision: 20, scale:  6 }).notNull(),
	balAfterMissed: numeric("bal_after_missed", { precision: 20, scale:  6 }).notNull(),
	marginalPd: numeric("marginal_pd", { precision: 10, scale:  8 }),
	lgw: numeric({ precision: 10, scale:  8 }).notNull(),
	lgd: numeric({ precision: 10, scale:  8 }).notNull(),
	creditLoss: numeric("credit_loss", { precision: 20, scale:  6 }).notNull(),
	discountedEcl: numeric("discounted_ecl", { precision: 20, scale:  6 }).notNull(),
	cureRate: numeric("cure_rate", { precision: 10, scale:  8 }),
	treatment: text(),
	pdRule: text("pd_rule"),
}, (table) => [
	index("ead_results_run_idx").using("btree", table.runId.asc().nullsLast().op("text_ops")),
	index("ead_results_run_loan_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.loanId.asc().nullsLast().op("text_ops")),
	index("ead_results_run_segment_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.segment.asc().nullsLast().op("text_ops")),
]);

export const eclLoanSummaries = pgTable("ecl_loan_summaries", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	loanId: text("loan_id").notNull(),
	customerId: text("customer_id").notNull(),
	segment: text().notNull(),
	stage: text().notNull(),
	reportingDate: date("reporting_date").notNull(),
	outstanding: numeric({ precision: 20, scale:  6 }).notNull(),
	discountedCollateral: numeric("discounted_collateral", { precision: 20, scale:  6 }).notNull(),
	eclBeforeCap: numeric("ecl_before_cap", { precision: 20, scale:  6 }).notNull(),
	eclCapped: boolean("ecl_capped").notNull(),
	totalEcl: numeric("total_ecl", { precision: 20, scale:  6 }).notNull(),
}, (table) => [
	index("ecl_loan_summaries_run_segment_idx").using("btree", table.runId.asc().nullsLast().op("text_ops"), table.segment.asc().nullsLast().op("text_ops")),
	index("ix_ecl_loan_summaries_run_id").using("btree", table.runId.asc().nullsLast().op("text_ops")),
	index("ix_ecl_loan_summaries_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const runExceptions = pgTable("run_exceptions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	runId: varchar("run_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	seq: integer().notNull(),
	category: text().notNull(),
	dataset: text().notNull(),
	loanId: text("loan_id").default('').notNull(),
	customerId: text("customer_id").default('').notNull(),
	field: text().notNull(),
	value: text().default('').notNull(),
	issue: text().notNull(),
	action: text().notNull(),
}, (table) => [
	index("ix_run_exceptions_run_id").using("btree", table.runId.asc().nullsLast().op("text_ops")),
	index("ix_run_exceptions_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const memberServiceRoles = pgTable("member_service_roles", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	membershipId: varchar("membership_id", { length: 26 }).notNull(),
	service: varchar({ length: 16 }).notNull(),
	role: varchar({ length: 16 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.membershipId],
			foreignColumns: [tenantMemberships.id],
			name: "member_service_roles_membership_id_fkey"
		}).onDelete("cascade"),
	unique("member_service_roles_membership_id_service_key").on(table.membershipId, table.service),
]);

export const runs = pgTable("runs", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	createdByUserId: varchar("created_by_user_id", { length: 26 }).notNull(),
	name: text().notNull(),
	reportingPeriod: text("reporting_period"),
	status: text().default('draft').notNull(),
	engineVersion: text("engine_version").default('v1.0.0').notNull(),
	engineProgress: json("engine_progress"),
	combinePdFiles: boolean("combine_pd_files").default(true).notNull(),
	failureStage: text("failure_stage"),
	failureMessage: text("failure_message"),
	failureRef: text("failure_ref"),
	totalEcl: numeric("total_ecl", { precision: 20, scale:  6 }),
	totalOutstanding: numeric("total_outstanding", { precision: 20, scale:  6 }),
	coverageRatio: numeric("coverage_ratio", { precision: 10, scale:  6 }),
	runWarnings: json("run_warnings"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'date' }),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
	deletedByUserId: varchar("deleted_by_user_id", { length: 26 }),
	reportingDate: date("reporting_date"),
	reconciliation: json(),
	currency: varchar({ length: 8 }).default('USD').notNull(),
}, (table) => [
	index("runs_tenant_created_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("runs_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("runs_tenant_status_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
]);

export const leaseCounterparties = pgTable("lease_counterparties", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	name: text().notNull(),
	vendorRef: text("vendor_ref"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_lease_counterparties_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("lease_cp_tenant_name_uq").using("btree", sql`tenant_id`, sql`lower(name)`),
]);

export const leaseEntities = pgTable("lease_entities", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	name: text().notNull(),
	currency: varchar({ length: 8 }).notNull(),
	country: text().default('').notNull(),
	fyStartMonth: integer("fy_start_month").default(1).notNull(),
	bookName: text("book_name").notNull(),
	framework: varchar({ length: 16 }).default('IFRS16').notNull(),
	standardVersion: text("standard_version").default('IFRS 16 (2016, as amended)').notNull(),
	leaseSeq: integer("lease_seq").default(0).notNull(),
	batchSeq: integer("batch_seq").default(0).notNull(),
	importSeq: integer("import_seq").default(0).notNull(),
	importMapping: json("import_mapping"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	unique("lease_entities_tenant_id_key").on(table.tenantId),
]);

export const entitlements = pgTable("entitlements", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	service: varchar({ length: 16 }).notNull(),
	state: varchar({ length: 16 }).notNull(),
	trialEndsAt: timestamp("trial_ends_at", { withTimezone: true, mode: 'date' }),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'date' }),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'date' }),
	limits: json().default({}).notNull(),
	watermark: boolean().default(false).notNull(),
	contractRef: text("contract_ref"),
	priceNote: text("price_note"),
	clientMessage: text("client_message"),
	updatedBy: varchar("updated_by", { length: 26 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "entitlements_tenant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "entitlements_updated_by_fkey"
		}).onDelete("set null"),
	unique("entitlements_tenant_id_service_key").on(table.tenantId, table.service),
]);

export const leasePeriods = pgTable("lease_periods", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	key: varchar({ length: 7 }).notNull(),
	status: varchar({ length: 16 }).default('open').notNull(),
	lockedBy: varchar("locked_by", { length: 26 }),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'date' }),
	reopenLog: json("reopen_log").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_lease_periods_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	unique("lease_periods_tenant_id_key_key").on(table.tenantId, table.key),
]);

export const leaseSavedViews = pgTable("lease_saved_views", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	name: text().notNull(),
	query: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_lease_saved_views_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
]);

export const leaseSetupVersions = pgTable("lease_setup_versions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	kind: varchar({ length: 16 }).notNull(),
	version: integer().notNull(),
	effectiveFrom: date("effective_from").notNull(),
	status: varchar({ length: 16 }).notNull(),
	reason: text().notNull(),
	data: json().notNull(),
	createdBy: varchar("created_by", { length: 26 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	approvedBy: varchar("approved_by", { length: 26 }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'date' }),
}, (table) => [
	index("ix_lease_setup_versions_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("lease_setup_one_pending").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.kind.asc().nullsLast().op("text_ops")).where(sql`((status)::text = 'in_review'::text)`),
	unique("lease_setup_versions_tenant_id_kind_version_key").on(table.tenantId, table.kind, table.version),
]);

export const accessRequests = pgTable("access_requests", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	code: varchar({ length: 16 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }),
	requesterId: varchar("requester_id", { length: 26 }),
	kind: varchar({ length: 16 }).notNull(),
	service: varchar({ length: 16 }),
	scope: varchar({ length: 8 }).notNull(),
	status: varchar({ length: 16 }).default('open').notNull(),
	details: json().default({}).notNull(),
	assigneeId: varchar("assignee_id", { length: 26 }),
	source: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_access_requests_scope_status").using("btree", table.scope.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("ix_access_requests_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "access_requests_tenant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.requesterId],
			foreignColumns: [users.id],
			name: "access_requests_requester_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "access_requests_assignee_id_fkey"
		}).onDelete("set null"),
	unique("access_requests_code_key").on(table.code),
]);

export const leaseCloseRuns = pgTable("lease_close_runs", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	period: varchar({ length: 7 }).notNull(),
	steps: json().notNull(),
	batchId: varchar("batch_id", { length: 26 }),
	startedBy: varchar("started_by", { length: 26 }).notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_lease_close_runs_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	unique("lease_close_runs_tenant_id_period_key").on(table.tenantId, table.period),
]);

export const leaseActualPayments = pgTable("lease_actual_payments", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	closeId: varchar("close_id", { length: 26 }).notNull(),
	date: date().notNull(),
	vendor: text().notNull(),
	amount: numeric({ precision: 20, scale:  2 }).notNull(),
	reference: text().notNull(),
	leaseId: varchar("lease_id", { length: 26 }),
	expected: numeric({ precision: 20, scale:  2 }),
	match: varchar({ length: 16 }).notNull(),
	resolution: varchar({ length: 16 }),
	resolutionNote: text("resolution_note"),
	resolvedBy: varchar("resolved_by", { length: 26 }),
}, (table) => [
	index("ix_lease_actual_payments_close_id").using("btree", table.closeId.asc().nullsLast().op("text_ops")),
	index("ix_lease_actual_payments_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.closeId],
			foreignColumns: [leaseCloseRuns.id],
			name: "lease_actual_payments_close_id_fkey"
		}).onDelete("cascade"),
]);

export const leases = pgTable("leases", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	code: varchar({ length: 16 }).notNull(),
	name: text().notNull(),
	assetClass: varchar("asset_class", { length: 16 }).notNull(),
	counterpartyId: varchar("counterparty_id", { length: 26 }).default('').notNull(),
	entityId: varchar("entity_id", { length: 26 }).notNull(),
	location: text().default('').notNull(),
	currency: varchar({ length: 8 }).notNull(),
	ownerId: varchar("owner_id", { length: 26 }).notNull(),
	costCentre: text("cost_centre").default('').notNull(),
	contractTotal: numeric("contract_total", { precision: 20, scale:  2 }),
	signatureDate: date("signature_date"),
	contractEndDate: date("contract_end_date"),
	wizardStep: integer("wizard_step").default(0).notNull(),
	rev: integer().default(1).notNull(),
	importBatchId: varchar("import_batch_id", { length: 26 }),
	verificationFailed: boolean("verification_failed").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_leases_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("leases_tenant_updated_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.updatedAt.asc().nullsLast().op("timestamptz_ops")),
	unique("leases_tenant_id_code_key").on(table.tenantId, table.code),
]);

export const leaseBooks = pgTable("lease_books", {
	leaseId: varchar("lease_id", { length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	chainChecksum: varchar("chain_checksum", { length: 64 }).notNull(),
	engineVersion: varchar("engine_version", { length: 32 }).notNull(),
	exempt: boolean().notNull(),
	rows: json().notNull(),
	journals: json().notNull(),
	segments: json().notNull(),
	computedAt: timestamp("computed_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_lease_books_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.leaseId],
			foreignColumns: [leases.id],
			name: "lease_books_lease_id_fkey"
		}).onDelete("cascade"),
]);

export const requestEvents = pgTable("request_events", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	requestId: varchar("request_id", { length: 26 }).notNull(),
	actorId: varchar("actor_id", { length: 26 }),
	kind: varchar({ length: 16 }).notNull(),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_request_events_request_id").using("btree", table.requestId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.requestId],
			foreignColumns: [accessRequests.id],
			name: "request_events_request_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [users.id],
			name: "request_events_actor_id_fkey"
		}).onDelete("set null"),
]);

export const leaseDocuments = pgTable("lease_documents", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	leaseId: varchar("lease_id", { length: 26 }).notNull(),
	versionN: integer("version_n").notNull(),
	name: text().notNull(),
	size: integer().notNull(),
	contentType: text("content_type").notNull(),
	sha256: varchar({ length: 64 }).notNull(),
	kind: varchar({ length: 16 }).notNull(),
	storageKey: text("storage_key").notNull(),
	uploadedBy: varchar("uploaded_by", { length: 26 }).notNull(),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_lease_documents_lease_id").using("btree", table.leaseId.asc().nullsLast().op("text_ops")),
	index("ix_lease_documents_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.leaseId],
			foreignColumns: [leases.id],
			name: "lease_documents_lease_id_fkey"
		}).onDelete("cascade"),
	unique("lease_documents_tenant_id_sha256_key").on(table.tenantId, table.sha256),
]);

export const leaseImportBatches = pgTable("lease_import_batches", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	code: varchar({ length: 16 }).notNull(),
	fileName: text("file_name").notNull(),
	sha256: varchar({ length: 64 }).notNull(),
	size: integer().notNull(),
	status: varchar({ length: 16 }).notNull(),
	progress: integer().default(0).notNull(),
	retryOnly: boolean("retry_only").default(false).notNull(),
	headers: json().notNull(),
	mapping: json().notNull(),
	warningsAccepted: boolean("warnings_accepted").default(false).notNull(),
	warningsAcceptedBy: varchar("warnings_accepted_by", { length: 26 }),
	templateVersion: text("template_version").notNull(),
	createdBy: varchar("created_by", { length: 26 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	committedBy: varchar("committed_by", { length: 26 }),
	committedAt: timestamp("committed_at", { withTimezone: true, mode: 'date' }),
}, (table) => [
	index("ix_lease_import_batches_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("lease_imports_committed_sha_uq").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.sha256.asc().nullsLast().op("text_ops")).where(sql`((status)::text = 'committed'::text)`),
	unique("lease_import_batches_tenant_id_code_key").on(table.tenantId, table.code),
]);

export const leaseImportRows = pgTable("lease_import_rows", {
	id: serial().primaryKey().notNull(),
	batchId: varchar("batch_id", { length: 26 }).notNull(),
	row: integer().notNull(),
	ref: text().default('').notNull(),
	name: text().default('').notNull(),
	values: json().notNull(),
	issues: json().notNull(),
	action: varchar({ length: 16 }).default('create').notNull(),
	leaseId: varchar("lease_id", { length: 26 }),
	outcome: varchar({ length: 16 }),
	outcomeMessage: text("outcome_message"),
}, (table) => [
	index("ix_lease_import_rows_batch_id").using("btree", table.batchId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [leaseImportBatches.id],
			name: "lease_import_rows_batch_id_fkey"
		}).onDelete("cascade"),
]);

export const leaseJournalBatches = pgTable("lease_journal_batches", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	code: varchar({ length: 32 }).notNull(),
	period: varchar({ length: 7 }).notNull(),
	type: varchar({ length: 16 }).notNull(),
	status: varchar({ length: 16 }).notNull(),
	sourceChecksum: varchar("source_checksum", { length: 64 }).default('').notNull(),
	idempotencyKey: text("idempotency_key").notNull(),
	createdBy: varchar("created_by", { length: 26 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	approvedBy: varchar("approved_by", { length: 26 }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'date' }),
	exportedAt: timestamp("exported_at", { withTimezone: true, mode: 'date' }),
	erpRef: text("erp_ref"),
	postedBy: varchar("posted_by", { length: 26 }),
	postedAt: timestamp("posted_at", { withTimezone: true, mode: 'date' }),
	reversalOf: varchar("reversal_of", { length: 26 }),
	reversedBy: varchar("reversed_by", { length: 26 }),
}, (table) => [
	index("ix_lease_journal_batches_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("lease_batches_erp_ref_uq").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.erpRef.asc().nullsLast().op("text_ops")).where(sql`(erp_ref IS NOT NULL)`),
	unique("lease_journal_batches_tenant_id_code_key").on(table.tenantId, table.code),
	unique("lease_journal_batches_idempotency_key_key").on(table.idempotencyKey),
]);

export const leaseJournalLines = pgTable("lease_journal_lines", {
	id: serial().primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	batchId: varchar("batch_id", { length: 26 }).notNull(),
	leaseId: varchar("lease_id", { length: 26 }).notNull(),
	account: varchar({ length: 32 }).notNull(),
	kind: varchar({ length: 16 }).notNull(),
	debit: numeric({ precision: 20, scale:  2 }).notNull(),
	credit: numeric({ precision: 20, scale:  2 }).notNull(),
	catchUp: boolean("catch_up").default(false).notNull(),
}, (table) => [
	index("ix_lease_journal_lines_batch_id").using("btree", table.batchId.asc().nullsLast().op("text_ops")),
	index("ix_lease_journal_lines_lease_id").using("btree", table.leaseId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [leaseJournalBatches.id],
			name: "lease_journal_lines_batch_id_fkey"
		}).onDelete("cascade"),
]);

export const leaseVersions = pgTable("lease_versions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	leaseId: varchar("lease_id", { length: 26 }).notNull(),
	n: integer().notNull(),
	status: varchar({ length: 16 }).notNull(),
	event: varchar({ length: 16 }).notNull(),
	effectiveDate: date("effective_date"),
	reason: text().default('').notNull(),
	terms: json().notNull(),
	assessment: json().notNull(),
	rate: json().notNull(),
	scopeDecrease: numeric("scope_decrease", { precision: 12, scale:  8 }),
	terminationPenalty: numeric("termination_penalty", { precision: 20, scale:  2 }),
	comments: json().notNull(),
	createdBy: varchar("created_by", { length: 26 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	submittedBy: varchar("submitted_by", { length: 26 }),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'date' }),
	approverId: varchar("approver_id", { length: 26 }),
	decidedBy: varchar("decided_by", { length: 26 }),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'date' }),
	calcLiability: numeric("calc_liability", { precision: 20, scale:  2 }),
	calcRou: numeric("calc_rou", { precision: 20, scale:  2 }),
	calcChecksOk: boolean("calc_checks_ok"),
	calcAt: timestamp("calc_at", { withTimezone: true, mode: 'date' }),
	inputChecksum: varchar("input_checksum", { length: 64 }),
	engineVersion: varchar("engine_version", { length: 32 }),
}, (table) => [
	index("ix_lease_versions_lease_id").using("btree", table.leaseId.asc().nullsLast().op("text_ops")),
	index("ix_lease_versions_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("lease_versions_one_pending").using("btree", table.leaseId.asc().nullsLast().op("text_ops")).where(sql`((status)::text = ANY ((ARRAY['draft'::character varying, 'in_review'::character varying, 'returned'::character varying])::text[]))`),
	foreignKey({
			columns: [table.leaseId],
			foreignColumns: [leases.id],
			name: "lease_versions_lease_id_fkey"
		}).onDelete("cascade"),
	unique("lease_versions_lease_id_n_key").on(table.leaseId, table.n),
]);

export const supportSessions = pgTable("support_sessions", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	staffId: varchar("staff_id", { length: 26 }).notNull(),
	reason: text().notNull(),
	minutes: integer().notNull(),
	status: varchar({ length: 12 }).default('requested').notNull(),
	decidedBy: varchar("decided_by", { length: 26 }),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'date' }),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'date' }),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'date' }),
	endedBy: varchar("ended_by", { length: 26 }),
	actionsLogged: integer("actions_logged").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_support_sessions_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "support_sessions_tenant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [users.id],
			name: "support_sessions_staff_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.decidedBy],
			foreignColumns: [users.id],
			name: "support_sessions_decided_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.endedBy],
			foreignColumns: [users.id],
			name: "support_sessions_ended_by_fkey"
		}).onDelete("set null"),
	check("ck_support_sessions_minutes", sql`(minutes >= 15) AND (minutes <= 120)`),
]);

export const workspaceNotes = pgTable("workspace_notes", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	authorId: varchar("author_id", { length: 26 }),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("ix_workspace_notes_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workspace_notes_tenant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "workspace_notes_author_id_fkey"
		}).onDelete("set null"),
]);

export const tenants = pgTable("tenants", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	plan: varchar({ length: 32 }).default('trial').notNull(),
	status: varchar({ length: 32 }).default('trial').notNull(),
	currency: varchar({ length: 8 }).default('USD').notNull(),
	reportingCadence: varchar("reporting_cadence", { length: 16 }).default('monthly').notNull(),
	timezone: varchar({ length: 64 }).default('Africa/Kigali').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
	region: text(),
	mrrCents: integer("mrr_cents").default(0).notNull(),
	engineVersionPin: text("engine_version_pin"),
	closeRequestedAt: timestamp("close_requested_at", { withTimezone: true, mode: 'date' }),
	closeRequestedBy: varchar("close_requested_by", { length: 26 }),
	logo: text(),
	metadata: text(),
	legalName: text("legal_name"),
	country: varchar({ length: 64 }),
	fiscalYearEnd: varchar("fiscal_year_end", { length: 5 }).default('12-31').notNull(),
	requireMfa: boolean("require_mfa").default(false).notNull(),
	allowedDomains: text("allowed_domains").array().default([""]).notNull(),
	sessionTimeoutHours: integer("session_timeout_hours").default(8).notNull(),
	idleSignout: boolean("idle_signout").default(true).notNull(),
	supportPolicy: varchar("support_policy", { length: 8 }).default('ask').notNull(),
	accountManagerId: varchar("account_manager_id", { length: 26 }),
	authzVersion: integer("authz_version").default(1).notNull(),
}, (table) => [
	uniqueIndex("tenants_slug_active_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.accountManagerId],
			foreignColumns: [users.id],
			name: "tenants_account_manager_id_fkey"
		}).onDelete("set null"),
]);

export const catalog = pgTable("catalog", {
	id: varchar({ length: 16 }).primaryKey().notNull(),
	draft: json().notNull(),
	published: json().notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'date' }),
	publishedBy: varchar("published_by", { length: 26 }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.publishedBy],
			foreignColumns: [users.id],
			name: "catalog_published_by_fkey"
		}).onDelete("set null"),
]);

export const notificationPreferences = pgTable("notification_preferences", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	runCompleted: boolean("run_completed").default(true).notNull(),
	runFailed: boolean("run_failed").default(true).notNull(),
	weeklySummary: boolean("weekly_summary").default(false).notNull(),
	memberJoined: boolean("member_joined").default(true).notNull(),
	productUpdates: boolean("product_updates").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	matrix: json().default({}).notNull(),
	mutedKinds: text("muted_kinds").array().default([""]).notNull(),
	digest: varchar({ length: 8 }).default('daily').notNull(),
}, (table) => [
	index("notification_preferences_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("notification_preferences_user_id_key").on(table.userId),
]);

export const userNotifications = pgTable("user_notifications", {
	id: varchar({ length: 26 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 26 }).notNull(),
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	kind: varchar({ length: 32 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'date' }),
	href: text(),
	action: varchar({ length: 32 }),
}, (table) => [
	index("ix_user_notifications_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("ix_user_notifications_user_created").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("ix_user_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const leaseAlertsSent = pgTable("lease_alerts_sent", {
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	leaseId: varchar("lease_id", { length: 26 }).notNull(),
	key: varchar({ length: 64 }).notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.leaseId, table.key], name: "lease_alerts_sent_pkey"}),
]);

export const leasePostedBalances = pgTable("lease_posted_balances", {
	tenantId: varchar("tenant_id", { length: 26 }).notNull(),
	leaseId: varchar("lease_id", { length: 26 }).notNull(),
	account: varchar({ length: 32 }).notNull(),
	amount: numeric({ precision: 20, scale:  2 }).notNull(),
}, (table) => [
	index("ix_lease_posted_balances_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.leaseId, table.account], name: "lease_posted_balances_pkey"}),
]);
