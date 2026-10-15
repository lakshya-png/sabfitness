"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Droplets,
  Dumbbell,
  Utensils,
  Pill,
  Trophy,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type { AppNotification, NotificationCategory } from "@/types/notifications";

const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  workout: Dumbbell,
  water: Droplets,
  meal: Utensils,
  supplement: Pill,
  milestone: Trophy,
  social: Users,
  security: Shield,
  system: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(localStore.getNotifications());
  }, []);

  const handleMarkRead = (id: string) => {
    localStore.markNotificationAsRead(id);
    setNotifications(localStore.getNotifications());
  };

  const handleMarkAllRead = () => {
    notifications.forEach((n) => localStore.markNotificationAsRead(n.id));
    setNotifications(localStore.getNotifications());
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay on track with workout alerts, hydration reminders, and milestone notices.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="btn-secondary !text-xs !py-2 self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 text-violet-600" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Notifications List */}
      <section className="glass-panel p-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-sm font-semibold">All caught up!</p>
            <p className="text-xs">No pending notifications at this moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/50 dark:divide-white/5">
            {notifications.map((notif) => {
              const Icon = CATEGORY_ICONS[notif.category] || Bell;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleMarkRead(notif.id)}
                  className={`py-4 px-3 flex items-start justify-between gap-4 rounded-xl cursor-pointer transition-colors ${
                    !notif.read
                      ? "bg-violet-500/5 hover:bg-violet-500/10"
                      : "hover:bg-slate-50/50 dark:hover:bg-white/5 opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        !notif.read
                          ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                          : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-violet-600 ring-2 ring-violet-200 dark:ring-violet-950" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1 font-medium">
                        {notif.createdAt}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-violet-600 shrink-0 self-center"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
