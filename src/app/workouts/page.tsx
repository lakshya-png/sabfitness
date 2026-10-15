"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Plus,
  Clock,
  Trophy,
  Search,
  Calendar,
  ChevronRight,
  Flame,
  ArrowRight,
  Play,
  Copy,
  Trash2,
  CheckCircle2,
  Moon,
  Target,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import { DEFAULT_EXERCISES } from "@/lib/fitness/defaultExercises";
import type { WorkoutSession, WorkoutTemplate, ResolvedDayPlan } from "@/types/fitness";

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "tpl_push",
    name: "Push Day (Chest, Shoulders, Triceps)",
    description: "Compound presses and accessory tricep work for maximum hypertrophy.",
    split: "push",
    exercises: [
      { exerciseId: "ex_bench_press", exerciseName: "Barbell Bench Press", targetSets: 4, targetReps: 8 },
      { exerciseId: "ex_incline_db_press", exerciseName: "Incline Dumbbell Press", targetSets: 3, targetReps: 10 },
      { exerciseId: "ex_overhead_press", exerciseName: "Standing Overhead Press", targetSets: 3, targetReps: 8 },
      { exerciseId: "ex_tricep_pushdown", exerciseName: "Cable Tricep Pushdown", targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: "tpl_pull",
    name: "Pull Day (Back, Rear Delts, Biceps)",
    description: "Vertical and horizontal pulls with bicep isolation.",
    split: "pull",
    exercises: [
      { exerciseId: "ex_deadlift", exerciseName: "Conventional Deadlift", targetSets: 3, targetReps: 5 },
      { exerciseId: "ex_lat_pulldown", exerciseName: "Lat Pulldown", targetSets: 4, targetReps: 10 },
      { exerciseId: "ex_barbell_row", exerciseName: "Bent-Over Barbell Row", targetSets: 3, targetReps: 8 },
      { exerciseId: "ex_barbell_curl", exerciseName: "Barbell Bicep Curl", targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: "tpl_legs",
    name: "Leg Day (Quads, Hamstrings, Calves)",
    description: "Heavy squats, posterior chain hinge, and calf extensions.",
    split: "legs",
    exercises: [
      { exerciseId: "ex_barbell_squat", exerciseName: "Barbell Back Squat", targetSets: 4, targetReps: 6 },
      { exerciseId: "ex_leg_press", exerciseName: "45° Leg Press", targetSets: 3, targetReps: 12 },
      { exerciseId: "ex_romanian_deadlift", exerciseName: "Romanian Deadlift (RDL)", targetSets: 3, targetReps: 10 },
      { exerciseId: "ex_standing_calf_raise", exerciseName: "Standing Calf Raise", targetSets: 4, targetReps: 15 },
    ],
  },
];

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [todayPlan, setTodayPlan] = useState<ResolvedDayPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setWorkouts(localStore.getWorkouts());
    setActiveWorkout(localStore.getActiveWorkout());
    const todayStr = new Date().toISOString().split("T")[0];
    setTodayPlan(localStore.getResolvedDayPlan(todayStr));
  }, []);

  const handleDeleteWorkout = (id: string) => {
    if (confirm("Are you sure you want to delete this workout log?")) {
      localStore.deleteWorkout(id);
      setWorkouts(localStore.getWorkouts());
    }
  };

  const filteredWorkouts = workouts.filter((w) =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Active Workout Notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workouts & Training
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your progressive overload, personal records, and exercise history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/workouts/planner"
            className="btn-secondary !py-2.5 !px-4 flex items-center gap-1.5 shadow-sm text-xs sm:text-sm font-semibold"
          >
            <Calendar className="w-4 h-4 text-violet-600" />
            <span>Weekly Planner & Splits</span>
          </Link>

          <Link
            href="/goals"
            className="btn-secondary !py-2.5 !px-4 flex items-center gap-1.5 shadow-sm text-xs sm:text-sm font-semibold"
          >
            <Target className="w-4 h-4 text-purple-400" />
            <span>Goal Split & Calculator</span>
          </Link>

          <Link
            href="/workouts/active"
            className="btn-primary !py-2.5 !px-5 self-start sm:self-auto shadow-lg shadow-violet-500/25 text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{activeWorkout ? "Resume In-Progress Workout" : "Start Empty Workout"}</span>
          </Link>
        </div>
      </div>

      {/* Today's Scheduled Routine Banner from Planner */}
      {todayPlan && (
        <div className="glass-card p-5 relative overflow-hidden group border-violet-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Today's Scheduled Routine
                </span>
                {todayPlan.isRestDay ? (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <Moon className="w-2.5 h-2.5" />
                    <span>Rest & Recovery</span>
                  </span>
                ) : todayPlan.status === "completed" ? (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Completed Today</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Ready to Train
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {todayPlan.workoutName}
              </h3>

              {!todayPlan.isRestDay ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                  <span>{todayPlan.exercises.length} planned exercises</span>
                  {todayPlan.muscleGroups.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                        {todayPlan.muscleGroups.map((m) => m.replace("_", " ")).join(", ")}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 pt-0.5">
                  {todayPlan.restNotes || "Active recovery day. Rest, hydrate, and prepare for your next session."}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/workouts/planner"
                className="btn-secondary !text-xs !py-2 !px-3.5"
              >
                <span>View 7-Day Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              {!todayPlan.isRestDay && todayPlan.status !== "completed" && (
                <Link
                  href={`/workouts/active?planDate=${todayPlan.date}`}
                  className="btn-primary !text-xs !py-2 !px-4 shadow-md shadow-violet-500/25 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Today's Plan</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Workout Notice Banner */}
      {activeWorkout && (
        <div className="glass-panel p-4 bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border-violet-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-violet-600 animate-pulse" />
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-violet-700 dark:text-violet-300">
                Workout in progress
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {activeWorkout.title}
              </h3>
            </div>
          </div>
          <Link
            href="/workouts/active"
            className="btn-primary !text-xs !py-1.5 !px-3"
          >
            <span>Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Workout Templates Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Quick Start Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKOUT_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="glass-card p-5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {tpl.split.toUpperCase()} SPLIT
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {tpl.description}
                </p>
                <div className="mt-3 space-y-1">
                  {tpl.exercises.map((ex) => (
                    <div
                      key={ex.exerciseId}
                      className="text-[11px] text-slate-600 dark:text-slate-300 flex justify-between"
                    >
                      <span>• {ex.exerciseName}</span>
                      <span className="text-slate-400 font-mono">{ex.targetSets} sets</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/workouts/active?template=${tpl.id}`}
                className="btn-secondary !text-xs !py-2 w-full mt-2"
              >
                <span>Start Template</span>
                <Play className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Workout History Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Workout History ({workouts.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search past workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input !py-1.5 !pl-9 w-full text-xs"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredWorkouts.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-500">
              <Dumbbell className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="text-sm font-medium">No workouts found.</p>
              <p className="text-xs mt-1">Start your first workout above to log sets and track progress!</p>
            </div>
          ) : (
            filteredWorkouts.map((w) => (
              <div
                key={w.id}
                className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {w.title}
                    </h3>
                    {w.personalRecordsHit > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Trophy className="w-3 h-3" />
                        <span>{w.personalRecordsHit} PR</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(w.startTime).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.round(w.durationSeconds / 60)} mins
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      Total Volume: {w.totalVolumeKg.toLocaleString()} kg
                    </span>
                  </div>
                  {w.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      &quot;{w.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleDeleteWorkout(w.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
