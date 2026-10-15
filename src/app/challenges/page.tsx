"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Trophy,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  Droplets,
  Dumbbell,
  Clock,
  ArrowRight,
  Plus,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type { UserProfile } from "@/types/user";

interface Challenge {
  id: string;
  title: string;
  category: "consistency" | "strength" | "hydration" | "cardio";
  description: string;
  targetCount: number;
  unit: string;
  durationDays: number;
  badgeName: string;
  badgeIcon: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  participants: number;
}

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "ch_30day_streak",
    title: "30-Day Consistency Streak",
    category: "consistency",
    description: "Complete any workout or log all meals for 30 consecutive days without missing a single day.",
    targetCount: 30,
    unit: "Days",
    durationDays: 30,
    badgeName: "Iron Will",
    badgeIcon: "🔥",
    difficulty: "Intermediate",
    participants: 1420,
  },
  {
    id: "ch_10k_steps",
    title: "10,000 Daily Steps Quest",
    category: "cardio",
    description: "Hit at least 10,000 steps daily for 14 days straight to optimize cardiovascular recovery.",
    targetCount: 14,
    unit: "Days",
    durationDays: 14,
    badgeName: "Pavement Master",
    badgeIcon: "👟",
    difficulty: "Beginner",
    participants: 980,
  },
  {
    id: "ch_hydration_titan",
    title: "3-Liter Hydration Mastery",
    category: "hydration",
    description: "Meet or exceed your 3,000 ml daily water target for 21 days.",
    targetCount: 21,
    unit: "Days",
    durationDays: 21,
    badgeName: "Hydration Titan",
    badgeIcon: "💧",
    difficulty: "Beginner",
    participants: 2150,
  },
  {
    id: "ch_100_pushups",
    title: "Century Push-Up Challenge",
    category: "strength",
    description: "Accumulate 100 push-ups throughout your training session for 7 workout days.",
    targetCount: 7,
    unit: "Sessions",
    durationDays: 14,
    badgeName: "Push-Up Century",
    badgeIcon: "💪",
    difficulty: "Intermediate",
    participants: 760,
  },
  {
    id: "ch_progressive_overload",
    title: "Progressive Overload Ascent",
    category: "strength",
    description: "Hit a new estimated 1RM personal record or add weight to compound lifts over 4 weeks.",
    targetCount: 4,
    unit: "Milestones",
    durationDays: 28,
    badgeName: "Apex Lifter",
    badgeIcon: "⚡",
    difficulty: "Advanced",
    participants: 610,
  },
];

interface UserChallengeProgress {
  joined: boolean;
  currentCount: number;
  completed: boolean;
  lastLoggedDate?: string;
}

const STORAGE_KEY = "sabfitness_user_challenges_v1";

export default function ChallengesPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [progressMap, setProgressMap] = useState<Record<string, UserChallengeProgress>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setUser(localStore.getUser());

    // Load challenge progress
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProgressMap(JSON.parse(saved));
      } else {
        // Default clean state
        setProgressMap({
          ch_30day_streak: { joined: true, currentCount: 3, completed: false },
          ch_hydration_titan: { joined: true, currentCount: 4, completed: false },
        });
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveProgress = (newMap: Record<string, UserChallengeProgress>) => {
    setProgressMap(newMap);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
    } catch {
      // Storage error ignored
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleJoin = (challengeId: string) => {
    const current = progressMap[challengeId] || { joined: false, currentCount: 0, completed: false };
    const updated = {
      ...progressMap,
      [challengeId]: {
        ...current,
        joined: !current.joined,
      },
    };
    saveProgress(updated);
    showToast(!current.joined ? "Challenge joined! Let's crush this." : "Left challenge.");
  };

  const logDailyProgress = (challenge: Challenge) => {
    const current = progressMap[challenge.id] || { joined: true, currentCount: 0, completed: false };
    const nextCount = Math.min(challenge.targetCount, current.currentCount + 1);
    const completed = nextCount >= challenge.targetCount;

    const updated = {
      ...progressMap,
      [challenge.id]: {
        ...current,
        joined: true,
        currentCount: nextCount,
        completed,
        lastLoggedDate: new Date().toISOString().split("T")[0],
      },
    };
    saveProgress(updated);

    if (completed && !current.completed) {
      showToast(`🏆 Congratulations! You unlocked the "${challenge.badgeName}" Badge!`);
    } else {
      showToast(`Milestone logged! Progress: ${nextCount}/${challenge.targetCount} ${challenge.unit}`);
    }
  };

  const filteredChallenges = DEFAULT_CHALLENGES.filter((ch) => {
    if (activeCategory === "all") return true;
    return ch.category === activeCategory;
  });

  const activeJoinedCount = Object.values(progressMap).filter((p) => p.joined && !p.completed).length;
  const completedBadgesCount = Object.values(progressMap).filter((p) => p.completed).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 glass-card !bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-2">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Athletic Discipline &amp; Consistency</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Challenges &amp; Streaks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Opt into community milestones, maintain daily streaks, and earn permanent Apple-styled achievement badges.
          </p>
        </div>

        <Link
          href="/progress/cards"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Share Progress Card</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {user?.streakDays || 5} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active streak in progress
          </p>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Quests</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {activeJoinedCount} <span className="text-xs font-semibold text-slate-400">Joined</span>
          </p>
          <p className="text-[10px] text-slate-400">In pursuit of glory</p>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Badges Earned</span>
            <Trophy className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {completedBadgesCount} <span className="text-xs font-semibold text-slate-400">Unlocked</span>
          </p>
          <p className="text-[10px] text-slate-400">5 Available to conquer</p>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Discipline Score</span>
            <ShieldCheck className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            94%
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            Top 10% consistency
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Challenges" },
          { id: "consistency", label: "Consistency" },
          { id: "strength", label: "Strength & Power" },
          { id: "hydration", label: "Hydration" },
          { id: "cardio", label: "Cardio & Steps" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeCategory === tab.id
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {filteredChallenges.map((challenge) => {
          const state = progressMap[challenge.id] || { joined: false, currentCount: 0, completed: false };
          const percent = Math.min(100, Math.round((state.currentCount / challenge.targetCount) * 100));

          return (
            <div
              key={challenge.id}
              className={`glass-panel p-5 sm:p-6 transition-all ${
                state.completed
                  ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/5"
                  : state.joined
                  ? "border-indigo-500/30"
                  : ""
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Challenge Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">{challenge.badgeIcon}</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {challenge.title}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        challenge.difficulty === "Beginner"
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : challenge.difficulty === "Intermediate"
                          ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                          : "bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300"
                      }`}
                    >
                      {challenge.difficulty}
                    </span>
                    {state.completed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    {challenge.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {challenge.durationDays} Days duration
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Badge: {challenge.badgeName}
                    </span>
                    <span className="hidden sm:inline text-slate-400">
                      {challenge.participants.toLocaleString()} athletes
                    </span>
                  </div>
                </div>

                {/* Actions & Progress */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  {state.joined ? (
                    <>
                      <button
                        onClick={() => logDailyProgress(challenge)}
                        disabled={state.completed}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
                          state.completed
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            : "btn-primary shadow-indigo-500/20"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Today</span>
                      </button>

                      <button
                        onClick={() => toggleJoin(challenge.id)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        Leave
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleJoin(challenge.id)}
                      className="btn-primary !bg-white/80 dark:!bg-white/10 !text-indigo-600 dark:!text-indigo-300 border border-indigo-200/60 dark:border-white/10 shadow-sm"
                    >
                      <span>Join Challenge</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar (Visible if Joined) */}
              {state.joined && (
                <div className="mt-4 pt-4 border-t border-slate-200/40 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">
                      Progress: {state.currentCount} / {challenge.targetCount} {challenge.unit}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">{percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        state.completed
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apple-style Trophy Shelf / Badges Showcase */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Apple-Grade Achievement Badges</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Refined metallic emblems earned through authentic sweat and physical consistency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {DEFAULT_CHALLENGES.map((ch) => {
            const isUnlocked = progressMap[ch.id]?.completed;

            return (
              <div
                key={ch.id}
                className={`glass-card p-4 text-center space-y-2.5 transition-all ${
                  isUnlocked
                    ? "border-amber-400/50 bg-amber-500/5 shadow-md shadow-amber-500/10 scale-105"
                    : "opacity-60 grayscale hover:grayscale-0 hover:opacity-90"
                }`}
              >
                {/* Metallic Badge Orb */}
                <div
                  className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl shadow-inner transition-transform ${
                    isUnlocked
                      ? "bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-200 shadow-amber-300/40"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {ch.badgeIcon}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {ch.badgeName}
                  </h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {ch.title}
                  </p>
                </div>

                <div className="pt-1">
                  <span
                    className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isUnlocked
                        ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
