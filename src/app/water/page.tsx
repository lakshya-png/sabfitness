"use client";

import React, { useState, useEffect } from "react";
import {
  Droplets,
  Plus,
  Trash2,
  Clock,
  Edit2,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type { WaterEntry } from "@/types/water";
import type { UserProfile } from "@/types/user";

export default function WaterTrackerPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [todayStr, setTodayStr] = useState<string>("");
  const [waterLogs, setWaterLogs] = useState<WaterEntry[]>([]);
  const [customAmount, setCustomAmount] = useState<number>(300);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(2500);

  // Inline edit state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<number>(250);

  // Undo delete state
  const [undoEntry, setUndoEntry] = useState<WaterEntry | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const u = localStore.getUser();
    setUser(u);
    setTempGoal(u.dailyWaterGoalMl || 2500);
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);
    setSelectedDate((prev) => prev || today);
    refreshLogs(selectedDate || today);
  }, [selectedDate]);

  const refreshLogs = (dateStr: string) => {
    const all = localStore.getWaterLogs(dateStr);
    setWaterLogs(all);
  };

  const handleAdd = (amount: number) => {
    if (amount <= 0) return;
    localStore.addWaterLog(amount, selectedDate);
    refreshLogs(selectedDate);
  };

  const handleSaveGoal = () => {
    localStore.saveUser({ dailyWaterGoalMl: tempGoal });
    setUser(localStore.getUser());
    setIsEditingGoal(false);
  };

  const handleStartEdit = (entry: WaterEntry) => {
    setEditingEntryId(entry.id);
    setEditingAmount(entry.amountMl);
  };

  const handleSaveEdit = (id: string) => {
    if (editingAmount <= 0) return;
    localStore.updateWaterLog(id, editingAmount);
    setEditingEntryId(null);
    refreshLogs(selectedDate);
  };

  const handleDeleteEntry = (entry: WaterEntry) => {
    if (undoTimer) clearTimeout(undoTimer);

    const deleted = localStore.deleteWaterLog(entry.id);
    refreshLogs(selectedDate);

    if (deleted) {
      setUndoEntry(deleted);
      const timer = setTimeout(() => {
        setUndoEntry(null);
      }, 6000);
      setUndoTimer(timer);
    }
  };

  const handleUndoDelete = () => {
    if (!undoEntry) return;
    if (undoTimer) clearTimeout(undoTimer);
    localStore.addWaterLog(undoEntry.amountMl, undoEntry.date);
    setUndoEntry(null);
    refreshLogs(selectedDate);
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const isToday = Boolean(selectedDate && selectedDate === todayStr);
  const targetGoal = user?.dailyWaterGoalMl || 2500;
  const totalWaterMl = waterLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
  const progressPercent = Math.min(100, Math.round((totalWaterMl / targetGoal) * 100)) || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hydration Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay properly hydrated to support muscle recovery, cellular health, and endurance.
          </p>
        </div>

        <button
          onClick={() => setIsEditingGoal(!isEditingGoal)}
          className="btn-secondary !text-xs !py-2 self-start sm:self-auto"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{isEditingGoal ? "Cancel" : "Edit Daily Goal"}</span>
        </button>
      </div>

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
          <Calendar className="w-4 h-4 text-cyan-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          />
          {isToday && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
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

      {/* Edit Goal Drawer */}
      {isEditingGoal && (
        <div className="glass-panel p-4 flex items-center justify-between gap-3 border-cyan-500/30 bg-cyan-500/5 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Daily Hydration Goal:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="100"
                min="500"
                max="8000"
                value={tempGoal}
                onChange={(e) => setTempGoal(parseInt(e.target.value) || 2500)}
                className="glass-input !py-1 w-28 text-center font-bold text-xs"
              />
              <span className="text-xs text-slate-400">ml</span>
            </div>
          </div>
          <button
            onClick={handleSaveGoal}
            className="btn-primary !py-1.5 !px-3 !text-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Goal</span>
          </button>
        </div>
      )}

      {/* Undo Toast Notification */}
      {undoEntry && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel !bg-slate-900/90 !border-cyan-500/40 p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200">
            Deleted <strong className="text-white">+{undoEntry.amountMl} ml</strong> entry
          </span>
          <button
            onClick={handleUndoDelete}
            className="ml-2 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
          <button
            onClick={() => setUndoEntry(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Circular Progress & Visual Wave Ring */}
      <section className="glass-panel p-8 text-center space-y-6 relative overflow-hidden bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent">
        <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
          {/* SVG Progress Circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-slate-200/40 dark:stroke-white/10 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-cyan-400 fill-none transition-all duration-700 ease-out"
              strokeWidth="8"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * (progressPercent || 0)) / 100}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="w-8 h-8 text-cyan-400 mb-1 animate-pulse" />
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalWaterMl}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              of {targetGoal} ml
            </span>
            <span className="text-xs font-bold text-cyan-500 dark:text-cyan-400 mt-1">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Hydration Add
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "+250 ml (Glass)", amount: 250 },
              { label: "+500 ml (Bottle)", amount: 500 },
              { label: "+750 ml (Shaker)", amount: 750 },
              { label: "+1000 ml (Jug)", amount: 1000 },
            ].map((btn) => (
              <button
                key={btn.amount}
                onClick={() => handleAdd(btn.amount)}
                className="px-4 py-2.5 rounded-xl glass-card font-semibold text-xs text-cyan-700 dark:text-cyan-300 hover:border-cyan-500/50 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-500" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Amount Logger */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <input
              type="number"
              step="50"
              min="50"
              max="5000"
              value={customAmount}
              onChange={(e) => setCustomAmount(parseInt(e.target.value) || 100)}
              className="glass-input !py-1.5 w-28 text-center text-xs font-bold"
              placeholder="Custom ml"
            />
            <button
              onClick={() => handleAdd(customAmount)}
              className="btn-primary !text-xs !py-1.5 !px-3"
            >
              Add Custom
            </button>
          </div>
        </div>
      </section>

      {/* Hydration History for Date */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Hydration Logs for {selectedDate} ({waterLogs.length})
          </h2>
          <span className="text-xs text-slate-400">
            Total: <strong className="text-cyan-400">{totalWaterMl} ml</strong>
          </span>
        </div>

        {waterLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 glass-card">
            <Droplets className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
            <p className="text-xs font-medium">No water logged for this date.</p>
            <p className="text-[11px] text-slate-500 mt-1">Use the quick add buttons above to start tracking.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/50 dark:divide-white/5">
            {waterLogs.map((entry) => {
              const isEditing = editingEntryId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="py-3 flex items-center justify-between text-xs gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                      <Droplets className="w-4 h-4" />
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="25"
                          min="1"
                          max="5000"
                          value={editingAmount}
                          onChange={(e) => setEditingAmount(parseInt(e.target.value) || 0)}
                          className="glass-input !py-1 w-24 text-xs font-bold text-center"
                          autoFocus
                        />
                        <span className="text-slate-400 text-xs">ml</span>
                        <button
                          onClick={() => handleSaveEdit(entry.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                          title="Save amount"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingEntryId(null)}
                          className="p-1.5 rounded-lg bg-slate-500/20 text-slate-400 hover:text-white border border-slate-500/30"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          +{entry.amountMl} ml
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                        title="Edit amount"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
