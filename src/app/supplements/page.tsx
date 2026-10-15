"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Pill,
  Plus,
  Trash2,
  Clock,
  ShieldAlert,
  X,
  Check,
  Edit2,
  Pause,
  Play,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type {
  SupplementDefinition,
  SupplementLogEntry,
  SupplementTiming,
  SupplementScheduleType,
} from "@/types/supplements";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<SupplementDefinition[]>([]);
  const [logs, setLogs] = useState<SupplementLogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [todayStr, setTodayStr] = useState<string>("");
  const [adherenceRange, setAdherenceRange] = useState<7 | 14 | 30>(7);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    name: string;
    dosage: string;
    timing: SupplementTiming;
    scheduleType: SupplementScheduleType;
    scheduleDays: number[];
    reminderTime: string;
    notes: string;
  }>({
    name: "",
    dosage: "",
    timing: "morning",
    scheduleType: "daily",
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: "08:00",
    notes: "",
  });

  // Inline Daily Quantity Override State
  const [overrideSupId, setOverrideSupId] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);
    setSelectedDate(today);
    refreshData();
  }, []);

  const refreshData = () => {
    setSupplements(localStore.getSupplements(false));
    setLogs(localStore.getSupplementLogs());
  };

  const shiftDate = (days: number) => {
    const base = selectedDate || todayStr || new Date().toISOString().split("T")[0];
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const isToday = Boolean(selectedDate && selectedDate === todayStr);
  const dayOfWeek = selectedDate ? new Date(selectedDate).getDay() : 0;

  // Handle setting status directly: taken, skipped, pending
  const handleSetStatus = (supplementId: string, status: "taken" | "skipped" | "pending") => {
    localStore.toggleSupplementStatus(supplementId, status, selectedDate);
    refreshData();
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormState({
      name: "",
      dosage: "",
      timing: "morning",
      scheduleType: "daily",
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
      reminderTime: "08:00",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sup: SupplementDefinition) => {
    setEditingId(sup.id);
    setFormState({
      name: sup.name,
      dosage: sup.dosage || "",
      timing: sup.timing,
      scheduleType: sup.scheduleType || "daily",
      scheduleDays: sup.scheduleDays || [0, 1, 2, 3, 4, 5, 6],
      reminderTime: sup.reminderTime || "08:00",
      notes: sup.notes || "",
    });
    setIsModalOpen(true);
  };

  // Toggle Pause / Resume
  const handleTogglePause = (sup: SupplementDefinition) => {
    localStore.pauseSupplement(sup.id, !sup.isPaused);
    refreshData();
  };

  // Soft Delete Supplement (preserves historical logs)
  const handleDelete = (sup: SupplementDefinition) => {
    if (
      confirm(
        `Remove "${sup.name}" from your active supplement routine?\n\nYour past check-in logs and adherence history will remain safely preserved.`
      )
    ) {
      localStore.deleteSupplement(sup.id);
      refreshData();
    }
  };

  // Save Add or Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    let days = formState.scheduleDays;
    if (formState.scheduleType === "daily") {
      days = [0, 1, 2, 3, 4, 5, 6];
    } else if (formState.scheduleType === "weekdays") {
      days = [1, 2, 3, 4, 5];
    }

    if (editingId) {
      // Update existing
      const existing = supplements.find((s) => s.id === editingId);
      if (existing) {
        const updated: SupplementDefinition = {
          ...existing,
          name: formState.name.trim(),
          dosage: formState.dosage.trim() || undefined,
          timing: formState.timing,
          scheduleType: formState.scheduleType,
          scheduleDays: days,
          reminderTime: formState.reminderTime.trim() || undefined,
          notes: formState.notes.trim() || undefined,
        };
        localStore.saveSupplement(updated);
      }
    } else {
      // Create new
      const created: SupplementDefinition = {
        id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: localStore.getUser().id,
        name: formState.name.trim(),
        dosage: formState.dosage.trim() || undefined,
        timing: formState.timing,
        scheduleType: formState.scheduleType,
        scheduleDays: days,
        reminderTime: formState.reminderTime.trim() || undefined,
        notes: formState.notes.trim() || undefined,
        isActive: true,
        isPaused: false,
        createdAt: new Date().toISOString(),
      };
      localStore.saveSupplement(created);
    }

    refreshData();
    setIsModalOpen(false);
  };

  // Save Daily Quantity Override
  const handleSaveDailyOverride = (supplementId: string) => {
    localStore.updateSupplementLogQuantity(supplementId, overrideValue.trim(), selectedDate);
    setOverrideSupId(null);
    setOverrideValue("");
    refreshData();
  };

  // Adherence Calculation over date range
  const adherenceStats = useMemo(() => {
    if (!todayStr) {
      return { percentage: 0, takenCount: 0, totalScheduledCount: 0, days: adherenceRange };
    }
    let totalScheduledCount = 0;
    let takenCount = 0;

    for (let i = 0; i < adherenceRange; i++) {
      const d = new Date(todayStr);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dow = d.getDay();

      const allSups = localStore.getSupplements(true); // include archived so history is accurate
      for (const s of allSups) {
        // Skip if archived before this date
        if (s.isArchived && s.archivedAt && s.archivedAt.split("T")[0] < dateStr) {
          continue;
        }
        // Skip if created after this date
        if (s.createdAt && s.createdAt.split("T")[0] > dateStr) {
          continue;
        }
        // Check if scheduled on this day of week
        const scheduledDays = s.scheduleDays || [0, 1, 2, 3, 4, 5, 6];
        if (scheduledDays.includes(dow) && !s.isPaused) {
          totalScheduledCount++;
          const log = logs.find((l) => l.supplementId === s.id && l.date === dateStr);
          if (log && log.status === "taken") {
            takenCount++;
          }
        }
      }
    }

    const percentage =
      totalScheduledCount > 0 ? Math.round((takenCount / totalScheduledCount) * 100) : 0;

    return {
      percentage,
      takenCount,
      totalScheduledCount,
      days: adherenceRange,
    };
  }, [todayStr, adherenceRange, supplements, logs]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Daily Supplements & Routine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize persistent supplement routines, optional dosages, daily check-ins, and adherence.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary !text-xs !py-2.5 self-start sm:self-auto shadow-md shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplement</span>
        </button>
      </div>

      {/* Health & Safety Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold">Important Health & Dosage Notice</p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-300">
            SabFitness provides personal lifestyle tracking and does not prescribe medical supplements or diagnose health conditions. Dosage fields are strictly optional. Consult a certified medical doctor before starting any supplementation regimen.
          </p>
        </div>
      </div>

      {/* Adherence Card */}
      <section className="glass-panel p-6 space-y-4 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Routine Adherence
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setAdherenceRange(r)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                  adherenceRange === r
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Last {r}d
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {adherenceStats.percentage}%
            </span>
            <span className="text-xs text-slate-400">
              {adherenceStats.takenCount} of {adherenceStats.totalScheduledCount} scheduled doses taken
            </span>
          </div>
          <div className="w-full bg-slate-200/50 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, adherenceStats.percentage)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Date Navigation */}
      <div className="flex items-center justify-between glass-panel px-4 py-3">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 transition-colors"
          title="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          />
          {isToday && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Today
            </span>
          )}
        </div>

        <button
          onClick={() => shiftDate(1)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 transition-colors"
          title="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Check-in Checklist */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Daily Checklist for {selectedDate} ({supplements.length})
          </h2>
          <span className="text-xs text-slate-400">
            Select Taken, Skipped, or Pending
          </span>
        </div>

        <div className="space-y-3">
          {supplements.length === 0 ? (
            <div className="p-8 text-center text-slate-500 glass-card">
              <Pill className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No supplements in your routine yet.
              </p>
              <p className="text-xs mt-1 text-slate-400">
                Click &quot;Add Supplement&quot; above to create your custom daily schedule.
              </p>
            </div>
          ) : (
            supplements.map((sup) => {
              const log = logs.find((l) => l.supplementId === sup.id && l.date === selectedDate);
              const status = log?.status || "pending";
              const isScheduledToday = (sup.scheduleDays || [0, 1, 2, 3, 4, 5, 6]).includes(dayOfWeek);
              const isOverriding = overrideSupId === sup.id;

              return (
                <div
                  key={sup.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    status === "taken"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100"
                      : status === "skipped"
                      ? "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-100"
                      : "bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`font-bold text-sm ${
                            status === "taken" ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {sup.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                          {sup.timing.replace("_", " ")}
                        </span>
                        {sup.isPaused && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Paused
                          </span>
                        )}
                        {!isScheduledToday && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400">
                            Not scheduled for {DAY_LABELS[dayOfWeek]}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {sup.dosage ? (
                          <>
                            Serving: <strong className="text-slate-800 dark:text-slate-200">{sup.dosage}</strong>
                          </>
                        ) : (
                          <span className="italic">No default dosage set</span>
                        )}
                        {sup.reminderTime ? ` • Reminder: ${sup.reminderTime}` : ""}
                        {log?.actualQuantity && (
                          <span className="ml-2 text-violet-600 dark:text-violet-300 font-semibold">
                            (Today&apos;s intake: {log.actualQuantity})
                          </span>
                        )}
                      </p>

                      {sup.notes && (
                        <p className="text-[11px] text-slate-400 italic">&quot;{sup.notes}&quot;</p>
                      )}
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sup.id, "taken")}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          status === "taken"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Taken</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(sup.id, "skipped")}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          status === "skipped"
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-red-500/20"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Skipped</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(sup.id, "pending")}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                          status === "pending"
                            ? "bg-slate-300 dark:bg-white/20 text-slate-900 dark:text-white"
                            : "bg-white/40 dark:bg-white/5 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </button>
                    </div>
                  </div>

                  {/* Daily Quantity Override Control */}
                  <div className="pt-2 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-between text-xs">
                    {isOverriding ? (
                      <div className="flex items-center gap-2 w-full">
                        <label className="text-slate-400 text-[11px]">Today&apos;s Actual Intake:</label>
                        <input
                          type="text"
                          placeholder={sup.dosage || "e.g. 10g or 2 caps"}
                          value={overrideValue}
                          onChange={(e) => setOverrideValue(e.target.value)}
                          className="glass-input !py-1 text-xs w-40"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveDailyOverride(sup.id)}
                          className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverrideSupId(null)}
                          className="px-2 py-1 rounded-md bg-slate-500/20 text-slate-400 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400">
                          {log?.actualQuantity
                            ? `Logged intake: ${log.actualQuantity}`
                            : sup.dosage
                            ? `Default intake: ${sup.dosage}`
                            : "No dosage specified"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOverrideSupId(sup.id);
                            setOverrideValue(log?.actualQuantity || sup.dosage || "");
                          }}
                          className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Adjust today&apos;s quantity</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Routine Management Section */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Manage Saved Supplements ({supplements.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Edit, pause routine, or delete
          </span>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/5">
          {supplements.map((sup) => (
            <div
              key={sup.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {sup.name}
                  </span>
                  {sup.dosage && (
                    <span className="text-slate-400">({sup.dosage})</span>
                  )}
                  {sup.isPaused && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      Paused
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Schedule: {sup.scheduleType || "daily"}</span>
                  <span>•</span>
                  <span>Timing: {sup.timing.replace("_", " ")}</span>
                  {sup.scheduleDays && sup.scheduleDays.length < 7 && (
                    <>
                      <span>•</span>
                      <span>Days: {sup.scheduleDays.map((d) => DAY_LABELS[d]).join(", ")}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePause(sup)}
                  className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                    sup.isPaused
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                  }`}
                  title={sup.isPaused ? "Resume supplement" : "Pause supplement"}
                >
                  {sup.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{sup.isPaused ? "Resume" : "Pause"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(sup)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(sup)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete supplement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add / Edit Supplement Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit Supplement" : "Add New Supplement"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplement Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Creatine Monohydrate or Omega 3"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dosage <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5g or 2 capsules"
                    value={formState.dosage}
                    onChange={(e) => setFormState({ ...formState, dosage: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Timing
                  </label>
                  <select
                    value={formState.timing}
                    onChange={(e) =>
                      setFormState({ ...formState, timing: e.target.value as SupplementTiming })
                    }
                    className="w-full glass-input text-xs"
                  >
                    <option value="morning">Morning</option>
                    <option value="with_meal">With Meal</option>
                    <option value="pre_workout">Pre-Workout</option>
                    <option value="post_workout">Post-Workout</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>

              {/* Schedule Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Schedule Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "daily", label: "Every Day" },
                    { key: "weekdays", label: "Weekdays" },
                    { key: "custom", label: "Custom Days" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() =>
                        setFormState({
                          ...formState,
                          scheduleType: s.key as SupplementScheduleType,
                        })
                      }
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        formState.scheduleType === s.key
                          ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                          : "glass-card text-slate-300 hover:border-violet-500/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Days Picker */}
              {formState.scheduleType === "custom" && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Select Days of Week
                  </label>
                  <div className="flex items-center justify-between gap-1">
                    {DAY_LABELS.map((label, idx) => {
                      const isSelected = formState.scheduleDays.includes(idx);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            const newDays = isSelected
                              ? formState.scheduleDays.filter((d) => d !== idx)
                              : [...formState.scheduleDays, idx];
                            setFormState({ ...formState, scheduleDays: newDays });
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-sm"
                              : "bg-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          {label[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Reminder Time <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="time"
                  value={formState.reminderTime}
                  onChange={(e) => setFormState({ ...formState, reminderTime: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with 500ml water before workout"
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
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
                  {editingId ? "Update Supplement" : "Save Supplement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

