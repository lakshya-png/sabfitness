"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Droplets,
  Link as LinkIcon,
  TrendingUp,
  CalendarDays,
  Users,
  Trophy,
  UserCheck,
  Bell,
  Settings,
  ShieldCheck,
  Moon,
  ChevronRight,
  User,
  Target,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { localStore } from "@/lib/storage/localState";
import { useTheme } from "@/components/common/ClientProviders";
import type { UserProfile } from "@/types/user";

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUser(localStore.getUser());
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Workouts", href: "/workouts", icon: Dumbbell },
    { label: "Planner & Splits", href: "/workouts/planner", icon: CalendarDays },
    { label: "Goals & Calculator", href: "/goals", icon: Target },
    { label: "Nutrition", href: "/nutrition", icon: Apple },
    { label: "Water", href: "/water", icon: Droplets },
    { label: "Progress", href: "/progress", icon: TrendingUp },
    { label: "Supplements", href: "/supplements", icon: LinkIcon },
    { label: "Calendar", href: "/calendar", icon: CalendarDays },
    { label: "Community", href: "/community", icon: Users },
    { label: "Challenges", href: "/challenges", icon: Trophy },
    { label: "Friends", href: "/community", icon: UserCheck },
    { label: "Notifications", href: "/notifications", icon: Bell, badge: 3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: "Admin Console", href: "/admin", icon: ShieldCheck });
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#0c1024]/75 backdrop-blur-2xl min-h-screen sticky top-0 z-30 p-4 justify-between transition-colors">
      <div>
        {/* Brand Header */}
        <Link href="/" className="block px-2 py-3 mb-4 group">
          <Logo size="md" showTagline />
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all duration-150 relative ${
                  isActive
                    ? "bg-white/10 text-white font-semibold shadow-lg shadow-indigo-500/10 border border-white/15"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r" />
                )}

                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive
                      ? "text-indigo-400 scale-105"
                      : "text-slate-400 group-hover:text-slate-300"
                  }`}
                />
                <span className="flex-1">{item.label}</span>

                {item.badge && (
                  <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-pink-500/50">
                    {item.badge}
                  </span>
                )}

                {item.href === "/admin" && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-400 border border-indigo-500/20">
                    Owner
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Dark Mode Section */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {/* Account Profile Card */}
        <Link
          href="/settings"
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white">
              My Account
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              View Profile
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </Link>

        {/* Dark Mode Switch */}
        <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-xs">Dark Mode</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
              resolvedTheme === "dark" || true
                ? "bg-purple-600 shadow-sm shadow-purple-500/50"
                : "bg-slate-700"
            }`}
            aria-label="Toggle dark mode"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                resolvedTheme === "dark" || true ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
