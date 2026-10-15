"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Sparkles,
  User,
  Shield,
  Download,
  Trash2,
  Moon,
  Sun,
  Bell,
  Scale,
  Lock,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import { FITNESS_GOALS, type FitnessGoalType, type UnitSystem } from "@/types/user";
import { calculatePersonalizedTargets } from "@/lib/fitness/calculations";
import { useTheme } from "@/components/common/ClientProviders";
import type { UserProfile } from "@/types/user";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);

  // Goal Editing State
  const [primaryGoal, setPrimaryGoal] = useState<FitnessGoalType>("muscle_gain");
  const [secondaryGoals, setSecondaryGoals] = useState<FitnessGoalType[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile Form State
  const [name, setName] = useState("");
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(75);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  useEffect(() => {
    const u = localStore.getUser();
    setUser(u);
    setPrimaryGoal(u.primaryGoal);
    setSecondaryGoals(u.secondaryGoals || []);
    setName(u.name);
    setHeightCm(u.heightCm);
    setWeightKg(u.weightKg);
    setUnitSystem(u.unitSystem);
  }, []);

  if (!user) return null;

  // Proposed target recalculation preview
  const proposedTargets = calculatePersonalizedTargets({
    weightKg,
    heightCm,
    age: user.age || 25,
    gender: user.gender,
    activityLevel: user.activityLevel,
    primaryGoal,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStore.saveUser({
      name,
      heightCm,
      weightKg,
      unitSystem,
    });
    setUser(localStore.getUser());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleConfirmGoalChange = () => {
    localStore.saveUser({
      primaryGoal,
      secondaryGoals,
      dailyCalorieTarget: proposedTargets.calories,
      dailyProteinTargetGrams: proposedTargets.proteinGrams,
      dailyCarbsTargetGrams: proposedTargets.carbsGrams,
      dailyFatTargetGrams: proposedTargets.fatGrams,
      dailyWaterGoalMl: proposedTargets.waterGoalMl,
    });

    setUser(localStore.getUser());
    setIsGoalModalOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    const fullBackup = {
      user: localStore.getUser(),
      workouts: localStore.getWorkouts(),
      prs: localStore.getPRs(),
      foodLogs: localStore.getFoodLogs(),
      waterLogs: localStore.getWaterLogs(),
      supplements: localStore.getSupplements(),
      measurements: localStore.getMeasurements(),
      exportedAt: new Date().toISOString(),
      appName: "SabFitness",
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SabFitness-UserData-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (deleteInput !== "DELETE") {
      alert("Please type DELETE to confirm account deletion.");
      return;
    }
    localStore.deleteAccount();
    router.push("/onboarding");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize your profile, edit your fitness goals, manage themes, and download backups.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* 1. Editable Fitness Goals Section */}
      <section className="glass-panel p-6 space-y-4 border-violet-500/30 bg-gradient-to-br from-violet-600/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              Active Strategy
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Primary Goal: {FITNESS_GOALS[user.primaryGoal]?.title}
            </h2>
            <p className="text-xs text-slate-500 max-w-xl">
              {FITNESS_GOALS[user.primaryGoal]?.description}
            </p>
          </div>

          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="btn-primary !text-xs !py-2 self-start sm:self-auto shadow-md shadow-violet-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Change Fitness Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] text-slate-400">Target Calories</span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              {user.dailyCalorieTarget} kcal
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] text-slate-400">Daily Protein</span>
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {user.dailyProteinTargetGrams}g
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] text-slate-400">Daily Carbs</span>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {user.dailyCarbsTargetGrams}g
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] text-slate-400">Water Target</span>
            <p className="text-base font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">
              {user.dailyWaterGoalMl}ml
            </p>
          </div>
        </div>
      </section>

      {/* 2. Profile Details Form */}
      <section className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Personal Profile
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full glass-input text-xs opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit System
              </label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value as UnitSystem)}
                className="w-full glass-input text-xs"
              >
                <option value="metric">Metric (kg, cm, ml)</option>
                <option value="imperial">Imperial (lbs, in, fl oz)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary !text-xs !py-2">
              Save Profile Changes
            </button>
          </div>
        </form>
      </section>

      {/* 3. Appearance & Theme */}
      <section className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Appearance & Glass Theme
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light", label: "Light Theme", icon: Sun },
            { id: "dark", label: "Dark Theme", icon: Moon },
            { id: "system", label: "System Default", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id as any)}
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isSelected
                    ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20"
                    : "bg-white/40 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-violet-500/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Sole Owner Admin Access */}
      {user.isAdmin && (
        <section className="glass-panel p-6 space-y-3 border-violet-500/30 bg-violet-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Owner Admin Console
                </h3>
                <p className="text-xs text-slate-500">
                  Restricted to the verified owner account: {user.email}
                </p>
              </div>
            </div>

            <Link href="/admin" className="btn-primary !text-xs !py-2">
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 5. Data Export & Account Deletion (GDPR) */}
      <section className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Data Portability & Account Erasure
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Export Complete Backup (JSON)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Download all your recorded workouts, nutrition logs, body measurements, PRs, and personal history in an open format.
            </p>
          </div>
          <button
            onClick={handleExportData}
            className="btn-secondary !text-xs !py-2 shrink-0"
          >
            <Download className="w-4 h-4 text-violet-600" />
            <span>Download All Data</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div>
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
              Permanently Delete Account
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Irreversibly delete your account, workouts, logs, and private data.
            </p>
          </div>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            <span>Delete Account</span>
          </button>
        </div>
      </section>

      {/* Change Fitness Goal Modal */}
      {isGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Update Fitness Goal
            </h3>

            {/* Zero Data Loss Guarantee */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-900 dark:text-blue-300">
              <strong>Data Protection Guarantee:</strong> Changing your fitness goal will recalculate your daily calorie, macro, and hydration targets. None of your historical workouts, meals, or measurements will be deleted.
            </div>

            <div className="space-y-2.5">
              {Object.values(FITNESS_GOALS).map((g) => {
                const isSelected = primaryGoal === g.id;

                return (
                  <div
                    key={g.id}
                    onClick={() => setPrimaryGoal(g.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-violet-600/15 border-violet-500 ring-2 ring-violet-500/30"
                        : "bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 hover:border-violet-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {g.title}
                      </h4>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Proposed Target Preview */}
            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Proposed Daily Target Preview:
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Calories</span>
                  <p className="font-bold text-violet-600">{proposedTargets.calories}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Protein</span>
                  <p className="font-bold text-blue-600">{proposedTargets.proteinGrams}g</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Carbs</span>
                  <p className="font-bold text-emerald-600">{proposedTargets.carbsGrams}g</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Water</span>
                  <p className="font-bold text-cyan-600">{proposedTargets.waterGoalMl}ml</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="btn-secondary !text-xs !py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGoalChange}
                className="btn-primary !text-xs !py-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Apply New Goal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Confirm Account Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action cannot be undone. All your workout records, nutrition logs, personal records, and private progress photos will be permanently erased.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full glass-input text-xs font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="btn-secondary !text-xs !py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
