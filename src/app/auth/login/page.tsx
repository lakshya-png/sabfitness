"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { localStore, OWNER_ADMIN_EMAIL } from "@/lib/storage/localState";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Save or switch active user session
    const isOwner = email.toLowerCase().trim() === OWNER_ADMIN_EMAIL.toLowerCase();
    localStore.saveUser({
      email: email.trim(),
      name: email.split("@")[0],
      isAdmin: isOwner,
    });

    router.push("/");
  };

  const handleQuickDemoLogin = (role: "owner" | "athlete") => {
    if (role === "owner") {
      localStore.saveUser({
        email: OWNER_ADMIN_EMAIL,
        name: "SabFitness Owner",
        isAdmin: true,
      });
    } else {
      localStore.saveUser({
        email: "athlete@sabfitness.app",
        name: "New Athlete",
        isAdmin: false,
      });
    }
    router.push("/");
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Brand Monogram */}
      <div className="text-center space-y-2 flex flex-col items-center">
        <Link href="/">
          <Logo size="lg" showTagline />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 pt-1">
          Sign In to Your Account
        </h1>
      </div>

      {/* Login Glass Panel */}
      <div className="glass-panel p-6 sm:p-8 space-y-5">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input !pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input !pl-9 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full shadow-lg shadow-violet-500/25 !py-2.5"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Profiles */}
        <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 space-y-2">
          <p className="text-[11px] text-center text-slate-400 uppercase tracking-wider font-bold">
            Instant Exploration Modes
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin("owner")}
              className="p-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Owner Admin</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin("athlete")}
              className="p-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Standard User</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 pt-2">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
