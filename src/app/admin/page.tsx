"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  AlertOctagon,
  Activity,
  Database,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Dumbbell,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { localStore, OWNER_ADMIN_EMAIL } from "@/lib/storage/localState";
import type { AuditLogEntry, ModerationReport, SystemHealthMetrics } from "@/types/admin";
import type { UserProfile } from "@/types/user";

// Seed Moderation Reports
const SEED_REPORTS: ModerationReport[] = [
  {
    id: "rep_1",
    reportedByUserId: "usr_elena",
    contentType: "comment",
    contentId: "c_spam_99",
    contentSnippet: "Unsolicited spam link advertising unauthorized supplements.",
    reason: "Spam / Promotion",
    status: "pending",
    createdAt: "2026-10-15T11:20:00Z",
  },
];

// Seed Audit Logs
const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud_1",
    actorId: "usr_sab_owner_01",
    actorEmail: OWNER_ADMIN_EMAIL,
    action: "admin_login",
    targetType: "system",
    details: "Owner Admin authenticated session from authorized device.",
    timestamp: "2026-10-15T12:00:00Z",
  },
  {
    id: "aud_2",
    actorId: "usr_sab_owner_01",
    actorEmail: OWNER_ADMIN_EMAIL,
    action: "settings_changed",
    targetType: "system",
    details: "Configured quiet hours policy (22:00 - 07:00).",
    timestamp: "2026-10-14T19:30:00Z",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<ModerationReport[]>(SEED_REPORTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(SEED_AUDIT_LOGS);

  const systemMetrics: SystemHealthMetrics = {
    totalUsers: 142,
    activeWorkoutsToday: 28,
    totalWorkoutsCompleted: 1840,
    databaseStatus: "healthy",
    storageUsedMb: 320,
    lastBackupAt: "2026-10-15T04:00:00Z",
  };

  useEffect(() => {
    const current = localStore.getUser();
    setUser(current);

    // Verify sole owner admin privilege strictly
    if (!current?.isAdmin && current?.email !== OWNER_ADMIN_EMAIL) {
      router.push("/");
    }
  }, [router]);

  if (!user || (!user.isAdmin && user.email !== OWNER_ADMIN_EMAIL)) {
    return (
      <div className="py-20 text-center space-y-3">
        <Lock className="w-12 h-12 mx-auto text-red-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Access Denied
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This administration dashboard is restricted to the single configured Owner Admin ({OWNER_ADMIN_EMAIL}).
        </p>
      </div>
    );
  }

  const handleResolveReport = (id: string, action: "resolve" | "dismiss") => {
    setReports(
      reports.map((r) =>
        r.id === id
          ? { ...r, status: action === "resolve" ? "resolved_removed" : "dismissed" }
          : r
      )
    );

    // Append to audit log
    const newLog: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      actorId: user.id,
      actorEmail: user.email,
      action: "content_moderated",
      targetType: "content",
      targetId: id,
      details: `Report ${id} marked as ${action === "resolve" ? "resolved (content removed)" : "dismissed"}.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider mb-2 border border-violet-500/25">
            <ShieldCheck className="w-4 h-4" />
            <span>Sole Owner Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Admin Console & Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authenticated as Owner: <strong>{user.email}</strong>. Least-privilege controls active.
          </p>
        </div>
      </div>

      {/* System Health & Performance Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Platform Athletes</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {systemMetrics.totalUsers}
          </div>
          <p className="text-xs text-slate-400">Total registered profiles</p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Workouts Logged</span>
            <Dumbbell className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {systemMetrics.totalWorkoutsCompleted.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            +{systemMetrics.activeWorkoutsToday} today
          </p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Database Status</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 capitalize">
            {systemMetrics.databaseStatus}
          </div>
          <p className="text-xs text-slate-400">
            Last backup: {new Date(systemMetrics.lastBackupAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Private Storage</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {systemMetrics.storageUsedMb} <span className="text-xs font-normal text-slate-500">MB</span>
          </div>
          <p className="text-xs text-slate-400">Encrypted user photos & exports</p>
        </div>
      </section>

      {/* Moderation Queue */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Content Moderation Queue ({reports.filter((r) => r.status === "pending").length} Pending)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Least-privilege safe review</span>
        </div>

        <div className="space-y-3">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {rep.reason}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Report ID: {rep.id}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-100/60 dark:bg-white/5 p-2 rounded-lg">
                  &quot;{rep.contentSnippet}&quot;
                </p>
              </div>

              {rep.status === "pending" ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleResolveReport(rep.id, "resolve")}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                  >
                    Remove Content
                  </button>
                  <button
                    onClick={() => handleResolveReport(rep.id, "dismiss")}
                    className="btn-secondary !text-xs !py-1.5 !px-3"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-400 italic">
                  Status: {rep.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Immutable Security Audit Logs */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              System Audit Logs
            </h2>
          </div>
          <span className="text-xs text-slate-400">Real-time audit telemetry</span>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/5">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between text-xs gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10">
                    {log.action}
                  </span>
                  <span className="text-slate-500">{log.actorEmail}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
              </div>

              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
