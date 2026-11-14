import { relations } from "drizzle-orm/relations";
import { users, authAccounts, authSessions, tenants, authTwoFactor, tenantMemberships, memberServiceRoles, entitlements, accessRequests, leaseCloseRuns, leaseActualPayments, leases, leaseBooks, requestEvents, leaseDocuments, leaseImportBatches, leaseImportRows, leaseJournalBatches, leaseJournalLines, leaseVersions, supportSessions, workspaceNotes, catalog } from "./schema";

export const authAccountsRelations = relations(authAccounts, ({one}) => ({
	user: one(users, {
		fields: [authAccounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	authAccounts: many(authAccounts),
	authSessions: many(authSessions),
	authTwoFactors: many(authTwoFactor),
	entitlements: many(entitlements),
	accessRequests_requesterId: many(accessRequests, {
		relationName: "accessRequests_requesterId_users_id"
	}),
	accessRequests_assigneeId: many(accessRequests, {
		relationName: "accessRequests_assigneeId_users_id"
	}),
	requestEvents: many(requestEvents),
	supportSessions_staffId: many(supportSessions, {
		relationName: "supportSessions_staffId_users_id"
	}),
	supportSessions_decidedBy: many(supportSessions, {
		relationName: "supportSessions_decidedBy_users_id"
	}),
	supportSessions_endedBy: many(supportSessions, {
		relationName: "supportSessions_endedBy_users_id"
	}),
	workspaceNotes: many(workspaceNotes),
	tenants: many(tenants),
	catalogs: many(catalog),
}));

export const authSessionsRelations = relations(authSessions, ({one}) => ({
	user: one(users, {
		fields: [authSessions.userId],
		references: [users.id]
	}),
	tenant: one(tenants, {
		fields: [authSessions.activeOrganizationId],
		references: [tenants.id]
	}),
}));

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	authSessions: many(authSessions),
	entitlements: many(entitlements),
	accessRequests: many(accessRequests),
	supportSessions: many(supportSessions),
	workspaceNotes: many(workspaceNotes),
	user: one(users, {
		fields: [tenants.accountManagerId],
		references: [users.id]
	}),
}));

export const authTwoFactorRelations = relations(authTwoFactor, ({one}) => ({
	user: one(users, {
		fields: [authTwoFactor.userId],
		references: [users.id]
	}),
}));

export const memberServiceRolesRelations = relations(memberServiceRoles, ({one}) => ({
	tenantMembership: one(tenantMemberships, {
		fields: [memberServiceRoles.membershipId],
		references: [tenantMemberships.id]
	}),
}));

export const tenantMembershipsRelations = relations(tenantMemberships, ({many}) => ({
	memberServiceRoles: many(memberServiceRoles),
}));

export const entitlementsRelations = relations(entitlements, ({one}) => ({
	tenant: one(tenants, {
		fields: [entitlements.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [entitlements.updatedBy],
		references: [users.id]
	}),
}));

export const accessRequestsRelations = relations(accessRequests, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [accessRequests.tenantId],
		references: [tenants.id]
	}),
	user_requesterId: one(users, {
		fields: [accessRequests.requesterId],
		references: [users.id],
		relationName: "accessRequests_requesterId_users_id"
	}),
	user_assigneeId: one(users, {
		fields: [accessRequests.assigneeId],
		references: [users.id],
		relationName: "accessRequests_assigneeId_users_id"
	}),
	requestEvents: many(requestEvents),
}));

export const leaseActualPaymentsRelations = relations(leaseActualPayments, ({one}) => ({
	leaseCloseRun: one(leaseCloseRuns, {
		fields: [leaseActualPayments.closeId],
		references: [leaseCloseRuns.id]
	}),
}));

export const leaseCloseRunsRelations = relations(leaseCloseRuns, ({many}) => ({
	leaseActualPayments: many(leaseActualPayments),
}));

export const leaseBooksRelations = relations(leaseBooks, ({one}) => ({
	lease: one(leases, {
		fields: [leaseBooks.leaseId],
		references: [leases.id]
	}),
}));

export const leasesRelations = relations(leases, ({many}) => ({
	leaseBooks: many(leaseBooks),
	leaseDocuments: many(leaseDocuments),
	leaseVersions: many(leaseVersions),
}));

export const requestEventsRelations = relations(requestEvents, ({one}) => ({
	accessRequest: one(accessRequests, {
		fields: [requestEvents.requestId],
		references: [accessRequests.id]
	}),
	user: one(users, {
		fields: [requestEvents.actorId],
		references: [users.id]
	}),
}));

export const leaseDocumentsRelations = relations(leaseDocuments, ({one}) => ({
	lease: one(leases, {
		fields: [leaseDocuments.leaseId],
		references: [leases.id]
	}),
}));

export const leaseImportRowsRelations = relations(leaseImportRows, ({one}) => ({
	leaseImportBatch: one(leaseImportBatches, {
		fields: [leaseImportRows.batchId],
		references: [leaseImportBatches.id]
	}),
}));

export const leaseImportBatchesRelations = relations(leaseImportBatches, ({many}) => ({
	leaseImportRows: many(leaseImportRows),
}));

export const leaseJournalLinesRelations = relations(leaseJournalLines, ({one}) => ({
	leaseJournalBatch: one(leaseJournalBatches, {
		fields: [leaseJournalLines.batchId],
		references: [leaseJournalBatches.id]
	}),
}));

export const leaseJournalBatchesRelations = relations(leaseJournalBatches, ({many}) => ({
	leaseJournalLines: many(leaseJournalLines),
}));

export const leaseVersionsRelations = relations(leaseVersions, ({one}) => ({
	lease: one(leases, {
		fields: [leaseVersions.leaseId],
		references: [leases.id]
	}),
}));

export const supportSessionsRelations = relations(supportSessions, ({one}) => ({
	tenant: one(tenants, {
		fields: [supportSessions.tenantId],
		references: [tenants.id]
	}),
	user_staffId: one(users, {
		fields: [supportSessions.staffId],
		references: [users.id],
		relationName: "supportSessions_staffId_users_id"
	}),
	user_decidedBy: one(users, {
		fields: [supportSessions.decidedBy],
		references: [users.id],
		relationName: "supportSessions_decidedBy_users_id"
	}),
	user_endedBy: one(users, {
		fields: [supportSessions.endedBy],
		references: [users.id],
		relationName: "supportSessions_endedBy_users_id"
	}),
}));

export const workspaceNotesRelations = relations(workspaceNotes, ({one}) => ({
	tenant: one(tenants, {
		fields: [workspaceNotes.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [workspaceNotes.authorId],
		references: [users.id]
	}),
}));

export const catalogRelations = relations(catalog, ({one}) => ({
	user: one(users, {
		fields: [catalog.publishedBy],
		references: [users.id]
	}),
}));