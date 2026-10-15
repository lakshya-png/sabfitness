"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: "completed_workout" | "planned_workout" | "rest_day";
  title: string;
  durationMins?: number;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-15");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "planned_workout" as "planned_workout" | "rest_day",
    durationMins: 60,
  });

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(todayStr);

    // Load real completed workouts from localStore
    const realWorkouts = localStore.getWorkouts().map((w) => ({
      id: `w_${w.id}`,
      date: w.startTime.split("T")[0],
      type: "completed_workout" as const,
      title: w.title,
      durationMins: Math.round(w.durationSeconds / 60),
    }));

    // Load any saved custom calendar plans
    let savedPlans: CalendarEvent[] = [];
    try {
      const stored = localStorage.getItem("sabfitness_calendar_plans");
      if (stored) savedPlans = JSON.parse(stored);
    } catch {}

    setEvents([...realWorkouts, ...savedPlans]);
  }, []);

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const plan: CalendarEvent = {
      id: `plan_${Date.now()}`,
      date: selectedDate,
      type: newEvent.type,
      title: newEvent.title.trim(),
      durationMins: newEvent.type === "planned_workout" ? Number(newEvent.durationMins) : undefined,
    };

    const updated = [...events, plan];
    setEvents(updated);
    try {
      const customOnly = updated.filter((ev) => ev.type !== "completed_workout");
      localStorage.setItem("sabfitness_calendar_plans", JSON.stringify(customOnly));
    } catch {}

    setIsModalOpen(false);
    setNewEvent({ title: "", type: "planned_workout", durationMins: 60 });
  };

  const selectedDateEvents = events.filter((e) => e.date === selectedDate);

  // Dynamic month days generator based on selectedDate or constant fallback
  const baseDate = new Date(selectedDate || "2026-10-15");
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const monthName = baseDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const daysInMonth = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.date === dateStr);
    return { dayNum, dateStr, dayEvents };
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Calendar & Training Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Plan your workouts, celebrate intentional rest days, and build long-term consistency.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary !text-xs !py-2.5 self-start sm:self-auto shadow-md shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Session / Rest</span>
        </button>
      </div>

      {/* Rest Day Principle Affirmation */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300 text-xs">
        <Coffee className="w-5 h-5 text-indigo-500 shrink-0" />
        <div>
          <p className="font-bold">Rest Days Fuel Growth, Not Failure</p>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5">
            Rest and sleep are when muscle repair occurs and systemic fatigue drops. Scheduled rest days never break your streak in SabFitness.
          </p>
        </div>
      </div>

      {/* Monthly Calendar View */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {monthName || "Calendar"}
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Click any day to view or plan schedule
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-200/50 dark:border-white/10">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Calendar Day Tiles */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {daysInMonth.map(({ dayNum, dateStr, dayEvents }) => {
            const isSelected = selectedDate === dateStr;
            const hasCompleted = dayEvents.some((e) => e.type === "completed_workout");
            const hasPlanned = dayEvents.some((e) => e.type === "planned_workout");
            const hasRest = dayEvents.some((e) => e.type === "rest_day");

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[70px] sm:min-h-[85px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-violet-600/15 border-violet-500 ring-2 ring-violet-500/30"
                    : "bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 hover:border-violet-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isSelected
                        ? "text-violet-600 dark:text-violet-400 font-extrabold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {hasCompleted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Completed Workout" />
                  )}
                  {hasRest && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400" title="Rest Day" />
                  )}
                  {hasPlanned && !hasCompleted && (
                    <span className="w-2 h-2 rounded-full bg-violet-500" title="Planned Session" />
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 1).map((ev) => (
                    <p
                      key={ev.id}
                      className={`text-[9px] sm:text-[10px] font-semibold truncate px-1 rounded ${
                        ev.type === "completed_workout"
                          ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                          : ev.type === "rest_day"
                          ? "bg-indigo-500/20 text-indigo-800 dark:text-indigo-300"
                          : "bg-violet-500/20 text-violet-800 dark:text-violet-300"
                      }`}
                    >
                      {ev.title}
                    </p>
                  ))}
                  {dayEvents.length > 1 && (
                    <span className="text-[9px] text-slate-400">+{dayEvents.length - 1} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Selected Day Agenda Detail */}
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Agenda for {selectedDate}
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary !text-xs !py-1.5 !px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        </div>

        {selectedDateEvents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-3 text-center">
            No events scheduled for this day yet. Click &quot;Add Event&quot; to plan a workout or rest day.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedDateEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      ev.type === "completed_workout"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : ev.type === "rest_day"
                        ? "bg-indigo-500/10 text-indigo-600"
                        : "bg-violet-500/10 text-violet-600"
                    }`}
                  >
                    {ev.type === "completed_workout" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : ev.type === "rest_day" ? (
                      <Coffee className="w-5 h-5" />
                    ) : (
                      <Dumbbell className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {ev.title}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {ev.type === "completed_workout"
                        ? `Completed • ${ev.durationMins} mins`
                        : ev.type === "rest_day"
                        ? "Rest & Recovery Day"
                        : `Target Duration: ${ev.durationMins} mins`}
                    </span>
                  </div>
                </div>

                {ev.type === "planned_workout" && (
                  <Link
                    href="/workouts/active"
                    className="btn-primary !text-xs !py-1.5 !px-3"
                  >
                    <span>Start Now</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Schedule Modal */}
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
                Schedule for {selectedDate}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEvent({ ...newEvent, type: "planned_workout" })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                      newEvent.type === "planned_workout"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white/40 dark:bg-white/5 border-slate-200/60 dark:border-white/10"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                    <span>Workout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEvent({ ...newEvent, type: "rest_day" })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                      newEvent.type === "rest_day"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white/40 dark:bg-white/5 border-slate-200/60 dark:border-white/10"
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Rest Day</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder={newEvent.type === "planned_workout" ? "e.g. Chest & Triceps" : "e.g. Active Recovery & Mobility"}
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              {newEvent.type === "planned_workout" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={newEvent.durationMins}
                    onChange={(e) => setNewEvent({ ...newEvent, durationMins: Number(e.target.value) })}
                    className="w-full glass-input text-xs"
                  />
                </div>
              )}

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
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
