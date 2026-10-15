export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: "admin_login" | "user_suspended" | "content_moderated" | "settings_changed" | "data_export" | "account_deletion";
  targetType: "user" | "content" | "system";
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ModerationReport {
  id: string;
  reportedByUserId: string;
  contentType: "comment" | "progress_card" | "user_profile";
  contentId: string;
  contentSnippet: string;
  reason: string;
  status: "pending" | "resolved_removed" | "dismissed";
  createdAt: string;
}

export interface SystemHealthMetrics {
  totalUsers: number;
  activeWorkoutsToday: number;
  totalWorkoutsCompleted: number;
  databaseStatus: "healthy" | "degraded" | "offline";
  storageUsedMb: number;
  lastBackupAt: string;
}
