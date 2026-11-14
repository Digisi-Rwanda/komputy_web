// Data access used by pages. Swap these bodies for API calls later; signatures stay.
import * as d from "@/data/mock/data";

export const getWorkspace = (id = "ws-kivu") => d.workspaces.find((w) => w.id === id)!;
export const getWorkspaces = () => d.workspaces;
export const getMe = () => d.me;
export const getMembers = () => d.members;
export const getRuns = () => d.runs;
export const getRun = (id: string) => d.run(id);
export const getSegments = () => d.segments;
export const getEclTrend = () => d.eclTrend;
export const getMovement = () => d.movement;
export const getPdMatrix = () => d.pdMatrix;
export const getLeases = () => d.leases;
export const getNotifications = () => d.notifications;
export const getAudit = () => d.audit;
export const getLeaseSummary = () => d.leaseSummary;
export const getAttention = () => d.attention;
export const getSegmentsSetup = () => d.segmentsSetup;
export const getCollateralSetup = () => d.collateralSetup;
export const getThresholds = () => d.thresholds;
export { TODAY } from "@/data/mock/data";
export type { Segment, CollateralType, Threshold } from "@/data/mock/data";
export type { AttentionItem } from "@/data/mock/data";
export * as results from "@/data/mock/results";
export * as leaseData from "@/data/mock/leases";
export * as adminData from "@/data/mock/admin";
export * as platformData from "@/data/mock/platform";
