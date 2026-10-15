"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Dumbbell,
  Apple,
  Droplets,
  Scale,
  Plus,
  ChevronRight,
  Trophy,
  BarChart3,
  Link as LinkIcon,
  Mountain,
  ArrowRight,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type { UserProfile } from "@/types/user";
import type { WorkoutSession, ResolvedDayPlan } from "@/types/fitness";
import type { LoggedFoodItem } from "@/types/nutrition";
import type { WaterEntry } from "@/types/water";
import type { SupplementLogEntry, SupplementDefinition } from "@/types/supplements";

type ProgressTab = "Calories" | "Protein" | "Water" | "Weight";

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [foodLogs, setFoodLogs] = useState<LoggedFoodItem[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterEntry[]>([]);
  const [supplements, setSupplements] = useState<SupplementDefinition[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLogEntry[]>([]);
  const [todayPlan, setTodayPlan] = useState<ResolvedDayPlan | null>(null);
  const [activeTab, setActiveTab] = useState<ProgressTab>("Calories");
  const [dateString, setDateString] = useState("Tue, 10 Jun");

  useEffect(() => {
    setUser(localStore.getUser());
    setWorkouts(localStore.getWorkouts());
    setFoodLogs(localStore.getFoodLogs());
    setWaterLogs(localStore.getWaterLogs());
    setSupplements(localStore.getSupplements());
    setSupplementLogs(localStore.getSupplementLogs());

    const now = new Date();
    const dayStr = now.toLocaleDateString("en-US", { weekday: "short" });
    const dateNum = now.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    setDateString(`${dayStr}, ${dateNum}`);

    const todayDateStr = now.toISOString().split("T")[0];
    setTodayPlan(localStore.getResolvedDayPlan(todayDateStr));
  }, []);

  if (!user) return null;

  // Genuine metrics
  const totalCalories = foodLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const targetCalories = user.dailyCalorieTarget || 2000;
  const caloriePercent = Math.min(100, Math.round((totalCalories / targetCalories) * 100));

  const totalProtein = foodLogs.reduce((acc, curr) => acc + curr.proteinGrams, 0);
  const targetProtein = user.dailyProteinTargetGrams || 150;
  const proteinPercent = Math.min(100, Math.round((totalProtein / targetProtein) * 100));

  const totalWaterMl = waterLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
  const targetWaterMl = user.dailyWaterGoalMl || 2500;
  const waterLiters = (totalWaterMl / 1000).toFixed(1);
  const targetWaterLiters = (targetWaterMl / 1000).toFixed(1);
  const waterPercent = Math.min(100, Math.round((totalWaterMl / targetWaterMl) * 100));

  const completedSupps = supplementLogs.filter((s) => s.status === "taken").length;
  const totalSupps = supplements.length;

  const currentStreak = user.streakDays || 0;
  const dailyAverageKcal = foodLogs.length > 0 ? Math.round(totalCalories / Math.max(1, foodLogs.length)) : 0;

  // 7-day progress columns calculation
  const daysOfWeek = [
    { label: "Mon", dateStr: "9 Jun", value: 0 },
    { label: "Tue", dateStr: "10 Jun", value: totalCalories > 0 ? totalCalories : 0, isToday: true },
    { label: "Wed", dateStr: "11 Jun", value: 0 },
    { label: "Thu", dateStr: "12 Jun", value: 0 },
    { label: "Fri", dateStr: "13 Jun", value: 0 },
    { label: "Sat", dateStr: "14 Jun", value: 0 },
    { label: "Sun", dateStr: "15 Jun", value: 0 },
  ];

  const handleAddWaterQuick = () => {
    localStore.addWaterLog(250);
    setWaterLogs(localStore.getWaterLogs());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* 1. WELCOME SECTION (Matching Reference Image)            */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Welcome back!</span>
            <span>👋</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-normal">
            Stay consistent. A stronger you is coming.
          </p>
        </div>

        {/* Motivational Floating Glass Pill (Reference Style) */}
        <div className="self-start md:self-auto glass-panel px-5 py-3 flex items-center gap-4 bg-white/10 hover:bg-white/15 border border-white/15 transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-white/20 flex items-center justify-center text-white shrink-0">
            <Mountain className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Keep going!</h2>
            <p className="text-xs text-slate-300">Discipline today. Results tomorrow.</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-white/20 transition-all ml-2">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP METRIC CARDS (4 Columns Matching Reference)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-white/10 border border-white/15 hover:border-white/25 transition-all">
          {/* Progress Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="url(#calorieGrad)"
                strokeWidth="5"
                strokeDasharray="163.36"
                strokeDashoffset={163.36 - (163.36 * caloriePercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-300">Calories</p>
            <p className="text-lg font-black text-white leading-tight">
              {totalCalories} <span className="text-xs font-normal text-slate-400">/ {targetCalories.toLocaleString()} kcal</span>
            </p>
            <p className="text-xs font-bold text-slate-400">{caloriePercent}%</p>
          </div>
        </div>

        {/* Protein Card */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-white/10 border border-white/15 hover:border-white/25 transition-all">
          {/* Progress Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="url(#proteinGrad)"
                strokeWidth="5"
                strokeDasharray="163.36"
                strokeDashoffset={163.36 - (163.36 * proteinPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="proteinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-300">Protein</p>
            <p className="text-lg font-black text-white leading-tight">
              {totalProtein} <span className="text-xs font-normal text-slate-400">/ {targetProtein} g</span>
            </p>
            <p className="text-xs font-bold text-slate-400">{proteinPercent}%</p>
          </div>
        </div>

        {/* Water Card */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-white/10 border border-white/15 hover:border-white/25 transition-all">
          {/* Progress Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="url(#waterGrad)"
                strokeWidth="5"
                strokeDasharray="163.36"
                strokeDashoffset={163.36 - (163.36 * waterPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-300">Water</p>
            <p className="text-lg font-black text-white leading-tight">
              {waterLiters} <span className="text-xs font-normal text-slate-400">/ {targetWaterLiters} L</span>
            </p>
            <p className="text-xs font-bold text-slate-400">{waterPercent}%</p>
          </div>
        </div>

        {/* Weight Card */}
        <div className="glass-panel p-4 flex items-center gap-4 bg-white/10 border border-white/15 hover:border-white/25 transition-all">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-white/15 flex items-center justify-center shrink-0">
            <Scale className="w-7 h-7 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-300">Weight & Goal</p>
              {user.goalWeightKg && user.goalWeightKg > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                  Target: {user.goalWeightKg} kg
                </span>
              )}
            </div>
            <p className="text-lg font-black text-white leading-tight">
              {user.weightKg ? `${user.weightKg} kg` : "Not set"}
            </p>
            <Link
              href="/goals"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition-colors pt-0.5"
            >
              <span>{user.goalWeightKg ? "Goal Roadmap" : "Set Goal & Calculator"}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MIDDLE SECTION (3 Columns Matching Reference)         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Today's Plan */}
        <div className="glass-panel p-5 space-y-4 bg-white/10 border border-white/15">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-white tracking-tight">Today&apos;s Plan</h2>
            <Link
              href="/calendar"
              className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>{dateString}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {/* Workout Item */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Log Workout</h3>
                  <p className="text-[11px] text-slate-400">
                    {workouts.length > 0 ? `${workouts.length} workout logged` : "No workout logged today"}
                  </p>
                </div>
              </div>
              <Link
                href="/workouts/active"
                className="w-7 h-7 rounded-full bg-purple-600/70 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-sm shadow-purple-600/30"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            {/* Nutrition Item */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Apple className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Log Nutrition</h3>
                  <p className="text-[11px] text-slate-400">
                    {foodLogs.length > 0 ? `${foodLogs.length} items logged` : "No meals logged today"}
                  </p>
                </div>
              </div>
              <Link
                href="/nutrition"
                className="w-7 h-7 rounded-full bg-purple-600/70 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-sm shadow-purple-600/30"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            {/* Water Item */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Log Water</h3>
                  <p className="text-[11px] text-slate-400">
                    {waterLiters} / {targetWaterLiters} L
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddWaterQuick}
                className="w-7 h-7 rounded-full bg-purple-600/70 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-sm shadow-purple-600/30"
                title="Quick Add 250ml Water"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Supplements Item */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Take Supplements</h3>
                  <p className="text-[11px] text-slate-400">
                    {completedSupps > 0 ? `${completedSupps}/${totalSupps} completed` : "No supplements logged"}
                  </p>
                </div>
              </div>
              <Link
                href="/supplements"
                className="w-7 h-7 rounded-full bg-purple-600/70 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-sm shadow-purple-600/30"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Column 2: Weekly Progress (Interactive Chart & Stats) */}
        <div className="glass-panel p-5 space-y-4 bg-white/10 border border-white/15">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-white tracking-tight">Weekly Progress</h2>
            <Link
              href="/progress"
              className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/20 border border-white/10">
            {(["Calories", "Protein", "Water", "Weight"] as ProgressTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Weekly Bar Chart Canvas (Matching Reference Image) */}
          <div className="relative pt-2 pb-1">
            <div className="h-32 flex items-end justify-between gap-2 px-2 relative border-b border-white/10">
              {/* Horizontal Grid Lines */}
              <div className="absolute inset-x-0 top-0 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                <span>2K</span>
              </div>
              <div className="absolute inset-x-0 top-1/2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                <span>1K</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 text-[10px] text-slate-500">
                <span>0</span>
              </div>

              {/* Day Bars */}
              {daysOfWeek.map((day) => (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-1.5 z-10">
                  <div className="w-full flex justify-center items-end h-24">
                    <div
                      className={`w-4 rounded-t-lg transition-all duration-500 ${
                        day.isToday
                          ? "bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/30"
                          : day.value > 0
                          ? "bg-purple-600/60"
                          : "bg-white/5 h-1.5"
                      }`}
                      style={{
                        height: day.value > 0 ? `${Math.min(95, Math.max(15, (day.value / 2500) * 100))}%` : "4px",
                      }}
                    />
                  </div>
                  <div
                    className={`text-[10px] text-center leading-tight py-0.5 px-1 rounded-lg ${
                      day.isToday ? "bg-purple-600/40 text-white font-bold" : "text-slate-400 font-medium"
                    }`}
                  >
                    <span>{day.label}</span>
                    <span className="block text-[8px] text-slate-500">{day.dateStr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Mini Metrics inside Weekly Progress Card */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{dailyAverageKcal} kcal</p>
                <p className="text-[10px] text-slate-400">Daily Average</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{currentStreak} days</p>
                <p className="text-[10px] text-slate-400">Current Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Recent Activity (Clean Empty States) */}
        <div className="glass-panel p-5 space-y-4 bg-white/10 border border-white/15">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-white tracking-tight">Recent Activity</h2>
            <Link
              href="/workouts"
              className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {/* Activity 1: Today's Plan */}
            <Link
              href={
                todayPlan && !todayPlan.isRestDay && todayPlan.status !== "completed"
                  ? `/workouts/active?planDate=${todayPlan.date}`
                  : "/workouts/planner"
              }
              className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {todayPlan ? todayPlan.workoutName : workouts.length > 0 ? workouts[0].title : "Today's Workout Plan"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {todayPlan
                      ? todayPlan.isRestDay
                        ? "Scheduled Rest & Recovery"
                        : todayPlan.status === "completed"
                        ? "✓ Completed Today"
                        : `${todayPlan.exercises.length} exercises planned`
                      : "Plan your weekly routine"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            {/* Activity 2 */}
            <Link
              href="/nutrition"
              className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Apple className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {foodLogs.length > 0 ? `${foodLogs[foodLogs.length - 1].foodName}` : "No meals logged"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {foodLogs.length > 0 ? `${foodLogs[foodLogs.length - 1].calories} kcal` : "Track your nutrition"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            {/* Activity 3 */}
            <Link
              href="/water"
              className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {waterLogs.length > 0 ? `${totalWaterMl} ml logged` : "No water logged"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Stay hydrated</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            {/* Activity 4 */}
            <Link
              href="/supplements"
              className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {completedSupps > 0 ? `${completedSupps} supplements taken` : "No supplements logged"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Track your supplements</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM ROW (3 Large Visual Quick-Action Cards)        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
        {/* Card 1: Start a Workout */}
        <Link
          href={
            todayPlan && !todayPlan.isRestDay && todayPlan.status !== "completed"
              ? `/workouts/active?planDate=${todayPlan.date}`
              : "/workouts/planner"
          }
          className="group relative h-40 rounded-3xl overflow-hidden glass-panel border border-white/15 p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-white/30 transition-all shadow-xl"
        >
          {/* Background Image with Dark Navy Gradient Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
            style={{ backgroundImage: "url('/images/action-workout.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d20]/90 via-[#0d122e]/60 to-transparent" />

          {/* Card Content */}
          <div className="relative z-10 space-y-1">
            <h3 className="text-lg font-black text-white tracking-tight">
              {todayPlan && !todayPlan.isRestDay && todayPlan.status !== "completed"
                ? "Start Today's Workout"
                : "Weekly Workout Split"}
            </h3>
            <p className="text-xs text-slate-300 max-w-[210px] leading-relaxed">
              {todayPlan
                ? todayPlan.isRestDay
                  ? "Scheduled rest day • View 7-day routine"
                  : todayPlan.status === "completed"
                  ? "✓ Completed today • View weekly plan"
                  : `${todayPlan.workoutName} (${todayPlan.exercises.length} exercises)`
                : "Follow your progressive overload plan"}
            </p>
          </div>

          <div className="relative z-10 self-end w-9 h-9 rounded-full bg-white/15 group-hover:bg-purple-600 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg">
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>

        {/* Card 2: Add a Meal */}
        <Link
          href="/nutrition"
          className="group relative h-40 rounded-3xl overflow-hidden glass-panel border border-white/15 p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-white/30 transition-all shadow-xl"
        >
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
            style={{ backgroundImage: "url('/images/action-meal.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d20]/90 via-[#0d122e]/60 to-transparent" />

          <div className="relative z-10 space-y-1">
            <h3 className="text-lg font-black text-white tracking-tight">Add a Meal</h3>
            <p className="text-xs text-slate-300 max-w-[210px] leading-relaxed">
              Log your meals and track nutrition.
            </p>
          </div>

          <div className="relative z-10 self-end w-9 h-9 rounded-full bg-white/15 group-hover:bg-purple-600 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg">
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>

        {/* Card 3: View Progress */}
        <Link
          href="/progress"
          className="group relative h-40 rounded-3xl overflow-hidden glass-panel border border-white/15 p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-white/30 transition-all shadow-xl"
        >
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
            style={{ backgroundImage: "url('/images/action-progress.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d20]/90 via-[#0d122e]/60 to-transparent" />

          <div className="relative z-10 space-y-1">
            <h3 className="text-lg font-black text-white tracking-tight">View Progress</h3>
            <p className="text-xs text-slate-300 max-w-[210px] leading-relaxed">
              See your transformation.
            </p>
          </div>

          <div className="relative z-10 self-end w-9 h-9 rounded-full bg-white/15 group-hover:bg-purple-600 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg">
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
