export enum WorkspaceRole {
  ADMIN = "ADMIN",
  DEVELOPER = "DEVELOPER",
  MEMBER = "MEMBER",
}

export enum WorkspaceRoleType {
  SYSTEM = "System",
}

export const WORKSPACE_ROLES = {
  [WorkspaceRole.ADMIN]: {
    label: "Admin",
    description:
      "Full control over workspace resources and members, including billing, user management, and organization settings.",
    type: WorkspaceRoleType.SYSTEM,
  },
  [WorkspaceRole.DEVELOPER]: {
    label: "Developer",
    description:
      "Build and test agents, view raw data, and manage analytics and settings. Cannot manage billing or workspace members.",
    type: WorkspaceRoleType.SYSTEM,
  },
  [WorkspaceRole.MEMBER]: {
    label: "Member",
    description:
      "Read-only access to agents, testing, scrubbed history, analytics, and phone numbers.",
    type: WorkspaceRoleType.SYSTEM,
  },
} as const
