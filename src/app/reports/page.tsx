"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Dumbbell,
  Utensils,
  Droplets,
  TrendingUp,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type { WorkoutSession } from "@/types/fitness";
import type { LoggedFoodItem } from "@/types/nutrition";
import type { BodyMeasurement } from "@/types/progress";

export default function ReportsPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [foodLogs, setFoodLogs] = useState<LoggedFoodItem[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  // Selection checkboxes
  const [includeWorkouts, setIncludeWorkouts] = useState(true);
  const [includeNutrition, setIncludeNutrition] = useState(true);
  const [includeHydration, setIncludeHydration] = useState(true);
  const [includeMeasurements, setIncludeMeasurements] = useState(true);

  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    setWorkouts(localStore.getWorkouts());
    setFoodLogs(localStore.getFoodLogs());
    setMeasurements(localStore.getMeasurements());
    setReportDate(new Date().toLocaleDateString());
  }, []);

  const totalVolume = workouts.reduce((acc, curr) => acc + curr.totalVolumeKg, 0);
  const totalWorkoutMinutes = Math.round(
    workouts.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60
  );

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (includeWorkouts) {
      csvContent += "=== WORKOUT SESSIONS ===\n";
      csvContent += "ID,Title,Date,Duration(mins),TotalVolume(kg),PRs\n";
      workouts.forEach((w) => {
        csvContent += `"${w.id}","${w.title}","${w.startTime}",${Math.round(w.durationSeconds / 60)},${w.totalVolumeKg},${w.personalRecordsHit}\n`;
      });
      csvContent += "\n";
    }

    if (includeMeasurements) {
      csvContent += "=== BODY MEASUREMENTS ===\n";
      csvContent += "Date,Weight(kg),Waist(cm),Chest(cm),RightArm(cm)\n";
      measurements.forEach((m) => {
        csvContent += `"${m.date}",${m.weightKg || ""},${m.waistCm || ""},${m.chestCm || ""},${m.rightArmCm || ""}\n`;
      });
      csvContent += "\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SabFitness_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reports & Analytical Summaries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate custom weekly digests, download CSV archives, or print formal summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="btn-secondary !text-xs !py-2.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-primary !text-xs !py-2.5 shadow-md shadow-violet-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Customization Filter Box */}
      <section className="glass-panel p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Data Modules to Include in Report
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            <input
              type="checkbox"
              checked={includeWorkouts}
              onChange={(e) => setIncludeWorkouts(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-200">Workouts & Volume</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            <input
              type="checkbox"
              checked={includeNutrition}
              onChange={(e) => setIncludeNutrition(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-200">Macro Nutrition</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            <input
              type="checkbox"
              checked={includeHydration}
              onChange={(e) => setIncludeHydration(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-200">Daily Hydration</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
            <input
              type="checkbox"
              checked={includeMeasurements}
              onChange={(e) => setIncludeMeasurements(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-200">Body Metrics</span>
          </label>
        </div>
      </section>

      {/* Formatted Report Preview */}
      <section className="glass-panel p-8 space-y-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xl print:shadow-none print:border-none">
        {/* Report Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              SabFitness Comprehensive Fitness Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Athlete: <strong>{localStore.getUser()?.name}</strong> • Primary Goal:{" "}
              <span className="capitalize">{localStore.getUser()?.primaryGoal.replace("_", " ")}</span>
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            Generated: {reportDate || "Today"}
          </div>
        </div>

        {/* Aggregated Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Workouts Logged</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {workouts.length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Volume Lifted</span>
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">
              {totalVolume.toLocaleString()} kg
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Time Under Tension</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {totalWorkoutMinutes} mins
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total PRs Verified</span>
            <p className="text-2xl font-black text-amber-500 mt-1">
              {localStore.getPRs().length}
            </p>
          </div>
        </div>

        {/* Workouts Table */}
        {includeWorkouts && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Completed Training Sessions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400">
                    <th className="py-2">TITLE</th>
                    <th className="py-2">DATE</th>
                    <th className="py-2">DURATION</th>
                    <th className="py-2">VOLUME</th>
                    <th className="py-2">PRS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                  {workouts.map((w) => (
                    <tr key={w.id}>
                      <td className="py-2 font-sans font-semibold text-slate-800 dark:text-slate-200">
                        {w.title}
                      </td>
                      <td className="py-2 text-slate-500">
                        {new Date(w.startTime).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-slate-500">
                        {Math.round(w.durationSeconds / 60)}m
                      </td>
                      <td className="py-2 text-violet-600 dark:text-violet-400 font-bold">
                        {w.totalVolumeKg.toLocaleString()} kg
                      </td>
                      <td className="py-2 text-amber-500 font-bold">
                        {w.personalRecordsHit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Body Measurements Table */}
        {includeMeasurements && (
          <div className="space-y-2 pt-4 border-t border-slate-200/60 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Body Composition Trajectory
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400">
                    <th className="py-2 font-sans">DATE</th>
                    <th className="py-2">WEIGHT</th>
                    <th className="py-2">WAIST</th>
                    <th className="py-2">CHEST</th>
                    <th className="py-2">ARM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {measurements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 font-sans text-slate-800 dark:text-slate-200">
                        {m.date}
                      </td>
                      <td className="py-2 text-violet-600 dark:text-violet-400 font-bold">
                        {m.weightKg} kg
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">
                        {m.waistCm ? `${m.waistCm} cm` : "--"}
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">
                        {m.chestCm ? `${m.chestCm} cm` : "--"}
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">
                        {m.rightArmCm ? `${m.rightArmCm} cm` : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
