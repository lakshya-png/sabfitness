"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar as CalendarIcon,
  Bell,
  ChevronDown,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { syncEngine, type SyncStatus } from "@/lib/offline/syncEngine";
import { localStore } from "@/lib/storage/localState";
import type { UserProfile } from "@/types/user";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [formattedDate, setFormattedDate] = useState("Today, 10 Jun 2025");

  useEffect(() => {
    setUser(localStore.getUser());

    const unsub = syncEngine.subscribe((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });

    const notifs = localStore.getNotifications();
    const count = notifs.filter((n) => !n.read).length;
    setUnreadNotifs(count > 0 ? count : 3);

    // Format current date
    const now = new Date();
    const dayStr = now.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    setFormattedDate(`Today, ${dayStr} ${dateStr}`);

    return () => {
      unsub();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/workouts?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#080c1d]/40 border-b border-white/10 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 transition-colors">
      {/* Search Bar (Matching Reference Image) */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workouts, foods, friends..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/10 hover:bg-white/[0.14] focus:bg-white/[0.18] border border-white/10 focus:border-purple-500/50 text-xs text-white placeholder-slate-400 outline-none backdrop-blur-xl transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Offline / Sync Indicator */}
        {syncStatus !== "online" && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
              syncStatus === "offline"
                ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
                : "bg-blue-950/60 text-blue-300 border-blue-500/30"
            }`}
          >
            {syncStatus === "offline" ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing{pendingCount > 0 ? ` (${pendingCount})` : ""}</span>
              </>
            )}
          </div>
        )}

        {/* Date Selector Pill (Reference Style) */}
        <Link
          href="/calendar"
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium backdrop-blur-xl transition-all"
        >
          <CalendarIcon className="w-4 h-4 text-purple-400" />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] text-slate-400">Today</span>
            <span className="text-xs font-semibold">{formattedDate.replace("Today, ", "")}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </Link>

        {/* Circular Notification Bell with Red Badge */}
        <Link
          href="/notifications"
          className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white backdrop-blur-xl transition-all shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-md shadow-pink-500/50">
              {unreadNotifs}
            </span>
          )}
        </Link>

        {/* Circular User Profile Avatar */}
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/20 p-0.5 shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform flex items-center justify-center text-white text-xs font-bold"
          aria-label="Profile Settings"
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
        </Link>
      </div>
    </header>
  );
}
