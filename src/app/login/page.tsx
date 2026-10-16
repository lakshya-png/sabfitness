"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore, OWNER_ADMIN_EMAIL } from "@/lib/storage/localState";
import { syncProfileFromUserMetadata } from "@/lib/supabase/profile";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (
            error.message.toLowerCase().includes("email not confirmed") ||
            error.message.toLowerCase().includes("not verified")
          ) {
            setErrorMsg(
              "Email confirmation is required. Please check your email to confirm your account before logging in."
            );
          } else {
            setErrorMsg(error.message);
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          // Requirement 5: On first login after confirmation, save name, goal and target weight into existing profiles table
          await syncProfileFromUserMetadata(data.user);

          // Set session cookie for server-side middleware redirect
          document.cookie =
            "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";

          router.replace("/");
        }
      } else {
        // Fallback for offline local exploration
        const isOwner =
          email.toLowerCase().trim() === OWNER_ADMIN_EMAIL.toLowerCase();
        localStore.saveUser({
          email: email.trim(),
          name: email.split("@")[0],
          isAdmin: isOwner,
        });
        document.cookie =
          "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";
        router.replace("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
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
    document.cookie =
      "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";
    router.replace("/");
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
        <p className="text-xs text-slate-500">
          Access your personalized workouts, nutrition diary, and telemetry.
        </p>
      </div>

      {/* Login Glass Panel */}
      <div className="glass-panel p-6 sm:p-8 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

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
              {/* Requirement 4: "Forgot password" link */}
              <Link
                href="/auth/forgot-password"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
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
            disabled={loading}
            className="btn-primary w-full shadow-lg shadow-indigo-500/25 !py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Exploration Modes */}
        <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 space-y-2">
          <p className="text-[11px] text-center text-slate-400 uppercase tracking-wider font-bold">
            Instant Exploration Modes
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("owner")}
              className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Owner Admin</span>
            </button>
            <button
              type="button"
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
            href="/signup"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
