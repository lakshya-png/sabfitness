"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setErrorMsg("");
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=/settings`
            : undefined;

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }
      }
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset instructions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2 flex flex-col items-center">
        <Link href="/">
          <Logo size="lg" showTagline />
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white pt-2">
          Reset Password
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 space-y-5">
        {submitted ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recovery Link Sent
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              If an account exists for <strong>{email}</strong>, you will receive password reset instructions shortly.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="btn-primary !text-xs !py-2.5 inline-flex items-center justify-center gap-1.5 w-full"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Email
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full shadow-lg shadow-indigo-500/25 !py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Instructions...</span>
                </>
              ) : (
                <span>Send Recovery Instructions</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
