import type { Lead, RoleKey, User } from "./types";

export type Permission =
  | "dashboard.read"
  | "leads.read.all"
  | "leads.read.own"
  | "leads.write"
  | "leads.create"
  | "leads.assign"
  | "pipeline.move"
  | "pipeline.manage"
  | "tasks.read"
  | "tasks.manage"
  | "messages.read"
  | "messages.manage"
  | "reports.read"
  | "tags.manage"
  | "users.manage"
  | "integrations.manage"
  | "branding.manage"
  | "developer.manage";

const permissions: Record<RoleKey, Permission[]> = {
  super_admin: [
    "dashboard.read",
    "leads.read.all",
    "leads.write",
    "leads.create",
    "leads.assign",
    "pipeline.move",
    "pipeline.manage",
    "tasks.read",
    "tasks.manage",
    "messages.read",
    "messages.manage",
    "reports.read",
    "tags.manage",
    "users.manage",
    "integrations.manage",
    "branding.manage",
    "developer.manage",
  ],
  manager: [
    "dashboard.read",
    "leads.read.all",
    "tasks.read",
    "messages.read",
    "reports.read",
  ],
  sales: [
    "dashboard.read",
    "leads.read.own",
    "leads.write",
    "leads.create",
    "pipeline.move",
    "tasks.read",
    "tasks.manage",
    "messages.read",
    "messages.manage",
    "reports.read",
    "tags.manage",
  ],
  sdr: [
    "dashboard.read",
    "leads.read.own",
    "leads.write",
    "leads.create",
    "leads.assign",
    "pipeline.move",
    "tasks.read",
    "tasks.manage",
    "messages.read",
    "messages.manage",
    "tags.manage",
  ],
};

export const can = (user: User | null, permission: Permission) =>
  Boolean(user && permissions[user.role].includes(permission));

export function canAccessLead(
  user: User | null,
  lead: Lead,
  initialStageIds: string[],
) {
  if (!user || user.organizationId !== lead.organizationId) return false;
  if (can(user, "leads.read.all")) return true;
  if (!user.pipelineIds.includes(lead.pipelineId)) return false;
  if (lead.ownerId === user.id) return true;
  return user.role === "sdr" && initialStageIds.includes(lead.stageId);
}
