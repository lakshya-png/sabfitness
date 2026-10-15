"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { localStore } from "@/lib/storage/localState";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    // Strict security guarantee: Public registration NEVER grants administrator privileges
    localStore.saveUser({
      name: name.trim(),
      email: email.trim(),
      isAdmin: false,
      onboardingCompleted: false,
    });

    // Send to interactive onboarding
    router.push("/onboarding");
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2 flex flex-col items-center">
        <Link href="/">
          <Logo size="lg" showTagline />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 pt-1">
          Create Your Account
        </h1>
      </div>

      <div className="glass-panel p-6 sm:p-8 space-y-5">
        <form onSubmit={handleRegister} className="space-y-4">
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input !pl-9 text-xs"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input !pl-9 text-xs"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-violet-700 dark:text-violet-300">
              Private by default:
            </span>{" "}
            Your profile, workouts, and photos are completely private.
          </div>

          <button
            type="submit"
            className="btn-primary w-full shadow-lg shadow-violet-500/25 !py-2.5"
          >
            <span>Create Account & Setup Goals</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-2">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
