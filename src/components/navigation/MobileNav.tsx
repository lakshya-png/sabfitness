"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  Menu,
  X,
  Droplets,
  Pill,
  CalendarDays,
  Users,
  Bell,
  Settings,
  ShieldCheck,
  Flame,
  Target,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";

export function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    setIsAdmin(Boolean(localStore.getUser()?.isAdmin));
  }, [pathname]);

  const mainTabs = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Workout", href: "/workouts", icon: Dumbbell },
    { label: "Nutrition", href: "/nutrition", icon: Utensils },
    { label: "Progress", href: "/progress", icon: TrendingUp },
  ];

  const moreItems = [
    { label: "Goals & Calculator", href: "/goals", icon: Target },
    { label: "Weekly Workout Planner", href: "/workouts/planner", icon: CalendarDays },
    { label: "Challenges & Streaks", href: "/challenges", icon: Flame },
    { label: "Hydration Tracker", href: "/water", icon: Droplets },
    { label: "Supplements", href: "/supplements", icon: Pill },
    { label: "Calendar & Schedule", href: "/calendar", icon: CalendarDays },
    { label: "Community & Friends", href: "/community", icon: Users },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Settings & Goals", href: "/settings", icon: Settings },
  ];

  if (isAdmin) {
    moreItems.push({ label: "Admin Console", href: "/admin", icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="fixed bottom-0 inset-x-0 glass-panel !rounded-b-none p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/10">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                More Features
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActive
                        ? "bg-violet-600/15 border-violet-500/40 text-violet-700 dark:text-violet-300"
                        : "bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Apple Liquid Glass Bottom Dock */}
      <div className="lg:hidden fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto pointer-events-none">
        <nav className="pointer-events-auto rounded-2xl bg-[#0c1024]/85 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)] px-3 py-2 flex items-center justify-around">
          {mainTabs.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? "text-purple-400 font-semibold scale-105"
                    : "text-slate-400 font-medium hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              drawerOpen ? "text-purple-400 font-semibold" : "text-slate-400 font-medium hover:text-white"
            }`}
          >
            <Menu className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </nav>
      </div>
    </>
  );
}
