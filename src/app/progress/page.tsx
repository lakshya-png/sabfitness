"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Scale,
  Camera,
  Trophy,
  Plus,
  Calendar,
  Sparkles,
  ArrowRight,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type { BodyMeasurement } from "@/types/progress";
import type { PersonalRecord } from "@/types/fitness";
import type { UserProfile } from "@/types/user";

export default function ProgressPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Measurement Form
  const [newLog, setNewLog] = useState({
    date: "",
    weightKg: 78.5,
    waistCm: 82.0,
    chestCm: 105.0,
    leftArmCm: 38.0,
    rightArmCm: 38.2,
    notes: "",
  });

  useEffect(() => {
    setUser(localStore.getUser());
    setMeasurements(localStore.getMeasurements());
    setPRs(localStore.getPRs());
    setNewLog((prev) => ({ ...prev, date: new Date().toISOString().split("T")[0] }));
  }, []);

  if (!user) return null;

  const latest = measurements[measurements.length - 1];
  const earliest = measurements[0];
  const weightChange = latest && earliest && latest.weightKg && earliest.weightKg
    ? Math.round((latest.weightKg - earliest.weightKg) * 10) / 10
    : 0;

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: BodyMeasurement = {
      id: `bm_${Date.now()}`,
      userId: user.id,
      date: newLog.date,
      weightKg: Number(newLog.weightKg),
      waistCm: Number(newLog.waistCm),
      chestCm: Number(newLog.chestCm),
      leftArmCm: Number(newLog.leftArmCm),
      rightArmCm: Number(newLog.rightArmCm),
      notes: newLog.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    localStore.addMeasurement(entry);
    setMeasurements(localStore.getMeasurements());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Progress & Body Metrics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze your body recomposition, strength gains, and personal record progression.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/progress/photos"
            className="btn-secondary !text-xs !py-2.5"
          >
            <Camera className="w-4 h-4" />
            <span>Private Photos</span>
          </Link>
          <Link
            href="/progress/cards"
            className="btn-primary !text-xs !py-2.5 shadow-md shadow-violet-500/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Progress Card</span>
          </Link>
        </div>
      </div>

      {/* Snapshot Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Current Weight</span>
            <Scale className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latest?.weightKg ?? user.weightKg}{" "}
            <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <p className="text-xs text-slate-400">
            Total delta: {weightChange > 0 ? `+${weightChange}` : weightChange} kg
          </p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Waist Circumference</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latest?.waistCm ? `${latest.waistCm} cm` : "--"}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {latest && earliest && latest.waistCm && earliest.waistCm && latest.id !== earliest.id
              ? `${latest.waistCm - earliest.waistCm > 0 ? "+" : ""}${Math.round((latest.waistCm - earliest.waistCm) * 10) / 10} cm delta`
              : "Log 2+ entries to track delta"}
          </p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Arm Measurement</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latest?.rightArmCm ? `${latest.rightArmCm} cm` : "--"}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {latest && earliest && latest.rightArmCm && earliest.rightArmCm && latest.id !== earliest.id
              ? `${latest.rightArmCm - earliest.rightArmCm > 0 ? "+" : ""}${Math.round((latest.rightArmCm - earliest.rightArmCm) * 10) / 10} cm delta`
              : "Log 2+ entries to track delta"}
          </p>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Verified PRs</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {prs.length}
          </div>
          <p className="text-xs text-slate-400">Peak lifts across exercises</p>
        </div>
      </section>

      {/* Interactive Trend Chart Visualization (Pure SVG Glassmorphism) */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Bodyweight Progression (kg)
            </h2>
            <p className="text-xs text-slate-500">Historical trend over time</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary !text-xs !py-1.5 !px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Measurement</span>
          </button>
        </div>

        {/* SVG Chart or Empty State */}
        {measurements.length < 2 ? (
          <div className="h-44 w-full flex flex-col items-center justify-center rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center p-6">
            <Scale className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Not enough data points yet
            </p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
              Log at least 2 bodyweight entries to visualize your personal trend line over time.
            </p>
          </div>
        ) : (
          <div className="h-56 w-full relative pt-4">
            {(() => {
              const weights = measurements.map((m) => m.weightKg).filter((w): w is number => typeof w === "number");
              const minW = Math.min(...weights) - 1;
              const maxW = Math.max(...weights) + 1;
              const range = maxW - minW || 1;
              const width = 480;
              const height = 120;
              const stepX = width / (weights.length - 1);
              const points = weights.map((w, i) => {
                const x = 20 + i * stepX;
                const y = height - ((w - minW) / range) * (height - 30) + 10;
                return { x, y, w };
              });
              const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
              const polygonPoints = `20,${height + 20} ${polylinePoints} ${points[points.length - 1].x},${height + 20}`;

              return (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 520 160">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="10" y1="20" x2="510" y2="20" stroke="rgba(148,163,184,0.15)" strokeDasharray="4" />
                  <line x1="10" y1="70" x2="510" y2="70" stroke="rgba(148,163,184,0.15)" strokeDasharray="4" />
                  <line x1="10" y1="120" x2="510" y2="120" stroke="rgba(148,163,184,0.15)" strokeDasharray="4" />

                  <polygon points={polygonPoints} fill="url(#chartGradient)" />
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                      <text x={p.x} y={p.y - 10} fill="#64748b" fontSize="10" textAnchor="middle" fontWeight="bold">
                        {p.w}kg
                      </text>
                    </g>
                  ))}
                </svg>
              );
            })()}
          </div>
        )}
      </section>

      {/* Measurement History Table */}
      <section className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Measurement Logs
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-200/50 dark:border-white/10 pb-2">
                <th className="py-2 px-3">DATE</th>
                <th className="py-2 px-3">WEIGHT</th>
                <th className="py-2 px-3">WAIST</th>
                <th className="py-2 px-3">CHEST</th>
                <th className="py-2 px-3">ARMS (R/L)</th>
                <th className="py-2 px-3">NOTES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
              {measurements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                    No body measurements recorded yet. Click &quot;Log Measurement&quot; above to add your first entry.
                  </td>
                </tr>
              ) : (
                measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {m.date}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-violet-600 dark:text-violet-400">
                      {m.weightKg} kg
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {m.waistCm ? `${m.waistCm} cm` : "--"}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {m.chestCm ? `${m.chestCm} cm` : "--"}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {m.rightArmCm ? `${m.rightArmCm} / ${m.leftArmCm} cm` : "--"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">
                      {m.notes || "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log Measurement Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log Body Measurements
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newLog.date}
                  onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newLog.weightKg}
                    onChange={(e) => setNewLog({ ...newLog, weightKg: Number(e.target.value) })}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Waist (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newLog.waistCm}
                    onChange={(e) => setNewLog({ ...newLog, waistCm: Number(e.target.value) })}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chest (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newLog.chestCm}
                    onChange={(e) => setNewLog({ ...newLog, chestCm: Number(e.target.value) })}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Arm (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newLog.rightArmCm}
                    onChange={(e) =>
                      setNewLog({
                        ...newLog,
                        rightArmCm: Number(e.target.value),
                        leftArmCm: Number(e.target.value),
                      })
                    }
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Measured fasted in the morning"
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary !text-xs !py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary !text-xs !py-2"
                >
                  Save Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
