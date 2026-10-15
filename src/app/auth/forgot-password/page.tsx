"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Flame, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/30">
          <Flame className="w-8 h-8 fill-white/20" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
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
            <p className="text-xs text-slate-500">
              If an account exists for <strong>{email}</strong>, you will receive password reset instructions shortly.
            </p>
            <Link
              href="/auth/login"
              className="btn-secondary !text-xs !py-2 inline-flex items-center gap-1.5 mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="btn-primary w-full shadow-lg shadow-violet-500/25 !py-2.5"
            >
              <span>Send Recovery Instructions</span>
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="text-xs text-slate-500 hover:text-violet-600 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
