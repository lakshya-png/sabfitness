"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Target,
  Scale,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore } from "@/lib/storage/localState";
import { mapFitnessGoalToPrimaryGoal } from "@/lib/supabase/profile";

const FITNESS_GOALS = [
  "Lose weight",
  "Build muscle",
  "Stay fit",
  "Improve endurance",
] as const;

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState<string>("Lose weight");
  const [targetWeight, setTargetWeight] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !email.trim() || !password || !targetWeight) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    const weightNum = parseFloat(targetWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setErrorMsg("Please enter a valid target weight in kg.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              name: fullName.trim(),
              fitness_goal: fitnessGoal,
              target_weight_kg: weightNum,
            },
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        // Email confirmation is required by Supabase auth
        setConfirmationSent(true);
      } else {
        // Fallback for local demo mode without configured Supabase credentials
        const primaryGoal = mapFitnessGoalToPrimaryGoal(fitnessGoal);
        localStore.saveUser({
          name: fullName.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          fitnessGoal,
          targetWeightKg: weightNum,
          weightKg: weightNum,
          primaryGoal,
          isAdmin: false,
        });

        setConfirmationSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="text-center space-y-2 flex flex-col items-center">
        <Link href="/">
          <Logo size="lg" showTagline />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 pt-1">
          Create Your Athlete Account
        </h1>
        <p className="text-xs text-slate-500">
          Personalized training, nutrition tracking, and daily accountability.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 space-y-5">
        {confirmationSent ? (
          /* Requirement 3: Email confirmation must be required. Show exact message */
          <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Mail className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Check your email to confirm your account.
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                We sent a verification link to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {email}
                </span>
                . Please click the link to confirm your account and activate your
                fitness profile.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 text-left space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Next Steps</span>
              </div>
              <p>
                1. Open the confirmation email from SabFitness.
                <br />
                2. Click &ldquo;Confirm your email&rdquo; to complete activation.
                <br />
                3. You will be automatically redirected to your dashboard!
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full glass-input !pl-9 text-xs"
                />
              </div>
            </div>

            {/* 2. Email Address */}
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

            {/* 3. Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input !pl-9 text-xs"
                />
              </div>
            </div>

            {/* 4. Fitness Goal (Dropdown: Lose weight, Build muscle, Stay fit, Improve endurance) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Fitness Goal
              </label>
              <div className="relative">
                <Target className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                <select
                  required
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="w-full glass-input !pl-9 pr-8 text-xs appearance-none cursor-pointer bg-slate-900/60 text-slate-100"
                >
                  {FITNESS_GOALS.map((goal) => (
                    <option
                      key={goal}
                      value={goal}
                      className="bg-slate-900 text-white"
                    >
                      {goal}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* 5. Target Weight (kg) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Weight (kg)
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="number"
                  required
                  step="0.5"
                  min="20"
                  max="300"
                  placeholder="e.g. 70"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="w-full glass-input !pl-9 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full shadow-lg shadow-indigo-500/25 !py-2.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {!confirmationSent && (
          <p className="text-center text-xs text-slate-500 pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
