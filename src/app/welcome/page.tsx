"use client";

import React from "react";
import Link from "next/link";
import {
  Dumbbell,
  Droplets,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Flame,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useTheme } from "@/components/common/ClientProviders";
import { Sun, Moon } from "lucide-react";

export default function WelcomePage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between -m-4 lg:-m-8 overflow-hidden">
      {/* ======================================================== */}
      {/* SCENIC MOUNTAIN SUNSET BACKDROP (Apple Sonoma Aesthetic) */}
      {/* ======================================================== */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Sky Sunset Mesh Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-purple-600/10 to-amber-500/15 dark:from-slate-950 dark:via-purple-950/40 dark:to-slate-900" />

        {/* Radiant Sunset Sun Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-amber-400/25 via-pink-500/25 to-purple-600/20 blur-[130px]" />

        {/* Layered Scenic Mountain Silhouette SVG */}
        <svg
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 inset-x-0 w-full h-[380px] lg:h-[480px] object-cover opacity-60 dark:opacity-40"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Distant mountain ridge gradient */}
            <linearGradient id="mountDist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.05" />
            </linearGradient>
            {/* Mid mountain ridge gradient */}
            <linearGradient id="mountMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.1" />
            </linearGradient>
            {/* Foreground mountain ridge gradient */}
            <linearGradient id="mountFore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4338ca" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Distant Ridge */}
          <path
            d="M0 320L120 280L240 310L380 230L520 290L660 210L800 270L940 190L1080 260L1220 200L1340 270L1440 240V600H0V320Z"
            fill="url(#mountDist)"
          />

          {/* Mid Ridge */}
          <path
            d="M0 380L160 330L320 370L480 300L640 360L820 280L980 350L1140 290L1300 370L1440 330V600H0V380Z"
            fill="url(#mountMid)"
          />

          {/* Foreground Peaks */}
          <path
            d="M0 450L200 400L400 460L600 380L800 440L1000 370L1200 430L1440 390V600H0V450Z"
            fill="url(#mountFore)"
          />
        </svg>
      </div>

      {/* Top Welcome Bar */}
      <header className="px-6 lg:px-12 py-6 flex items-center justify-between">
        <Logo size="md" showTagline />

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform"
            aria-label="Toggle Theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <Link
            href="/auth/login"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-white hover:bg-white/90 dark:hover:bg-slate-700/80 transition-all shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Presentation Section */}
      <div className="px-6 lg:px-12 py-8 max-w-5xl mx-auto w-full text-center space-y-6">
        {/* Apple-style floating pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm text-xs font-semibold text-indigo-700 dark:text-indigo-300 animate-in fade-in zoom-in-95 duration-500">
          <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
          <span>Next-Gen Apple Liquid Glass Experience</span>
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Your fitness journey. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Your goals.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
          The refined, transparent fitness companion. Effortless set logging,
          smart 1RM estimations, visual nutrition macro rings, and private
          sharing—crafted with iOS Liquid Glass clarity.
        </p>

        {/* Action Callouts */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/80 dark:border-white/10 text-slate-800 dark:text-white font-semibold text-sm shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Flame className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Explore Dashboard</span>
          </Link>
        </div>

        {/* Micro Confidence Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            100% Free &amp; Offline PWA
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            Private &amp; Local Storage
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            Sole Owner Admin Security
          </span>
        </div>
      </div>

      {/* Feature Showcase Grid (Floating Frosted Glass Cards) */}
      <div className="px-6 lg:px-12 py-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Feature 1 */}
          <div className="glass-card p-5 space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Workouts &amp; 1RM
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Track sets, reps, and RPE with automated rest timer bells and
              real-time 1RM strength curves.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-5 space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 dark:bg-purple-400/20 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Macro &amp; Calorie Diary
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Visual nutrient rings for protein, carbs, and fats with personalized
              daily energy target gauges.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-5 space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 dark:bg-sky-400/20 text-sky-600 dark:text-sky-400 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <Droplets className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Hydration &amp; Supplements
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Quick vessel buttons (glass, bottle, shaker) plus daily supplement
              checklist with quiet hour notices.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-5 space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/15 dark:bg-pink-400/20 text-pink-600 dark:text-pink-400 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Progress &amp; Photo Cards
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Compare side-by-side photo milestones and generate privacy-masked
              shareable cards for friends.
            </p>
          </div>
        </div>
      </div>

      {/* Scenic Sunset Horizon Footer */}
      <footer className="px-6 lg:px-12 py-5 border-t border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200">SabFitness</span>
          <span>•</span>
          <span className="italic">Your fitness journey. Your goals.</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/onboarding" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Onboarding
          </Link>
          <Link href="/settings" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Privacy &amp; Security
          </Link>
          <Link href="/auth/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Sign In
          </Link>
        </div>
      </footer>
    </div>
  );
}
