"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Clock,
  Dumbbell,
  AlertCircle,
  Trophy,
  ChevronDown,
  X,
  Volume2,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import { DEFAULT_EXERCISES } from "@/lib/fitness/defaultExercises";
import { searchExercises, getExerciseById } from "@/lib/fitness/exerciseLibrary";
import { calculateEstimated1RM } from "@/lib/fitness/calculations";
import type {
  WorkoutSession,
  WorkoutExerciseItem,
  WorkoutSet,
  ExerciseDefinition,
  PersonalRecord,
  PlannedExerciseTarget,
} from "@/types/fitness";

function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const planDate = searchParams.get("planDate");

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Sticky Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [restTotalDuration, setRestTotalDuration] = useState(90);
  const [isRestRunning, setIsRestRunning] = useState(false);

  // Exercise Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  // Summary / Celebration Modal
  const [finishedSummary, setFinishedSummary] = useState<{
    totalVolume: number;
    newPRs: PersonalRecord[];
  } | null>(null);

  // Initialize or Recover Session
  useEffect(() => {
    const existing = localStore.getActiveWorkout();

    if (existing) {
      setSession(existing);
      setElapsedSeconds(existing.durationSeconds || 0);
    } else if (planDate) {
      // Started from Weekly Workout Planner for a specific day
      const resolved = localStore.getResolvedDayPlan(planDate);
      const plannedExercises: WorkoutExerciseItem[] = [];

      for (const target of resolved.exercises) {
        const sets: WorkoutSet[] = [];
        const numSets = target.targetSets || 3;
        const defaultReps = target.targetRepsMin || 10;
        const defaultWeight = target.targetWeightKg || 0;

        for (let s = 1; s <= numSets; s++) {
          sets.push({
            id: `set_${Date.now()}_${s}_${Math.random().toString(36).slice(2, 6)}`,
            setNumber: s,
            type: s <= (target.warmupSets || 0) ? "warmup" : "normal",
            weightKg: defaultWeight,
            reps: defaultReps,
            durationSeconds: target.targetDurationSeconds,
            distanceMeters: target.targetDistanceMeters,
            completed: false,
          });
        }

        plannedExercises.push({
          id: `we_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          exerciseId: target.exerciseId,
          exerciseName: target.exerciseName,
          muscleGroup: target.muscleGroup,
          category: target.category,
          restTimerSeconds: target.restTimerSeconds || 90,
          targetSets: target.targetSets,
          targetReps: target.targetRepsMin,
          targetWeightKg: target.targetWeightKg,
          notes: target.notes,
          sets,
        });
      }

      const newSession: WorkoutSession = {
        id: `wk_${Date.now()}`,
        userId: localStore.getUser().id,
        title: resolved.workoutName || "Scheduled Workout",
        planDate,
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        status: "in_progress",
        exercises:
          plannedExercises.length > 0
            ? plannedExercises
            : [createExerciseItem(DEFAULT_EXERCISES[0])],
        totalVolumeKg: 0,
        personalRecordsHit: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSession(newSession);
      localStore.saveActiveWorkout(newSession);
    } else {
      // Create new session
      const newSession: WorkoutSession = {
        id: `wk_${Date.now()}`,
        userId: localStore.getUser().id,
        title: templateId ? `${templateId.replace("tpl_", "").toUpperCase()} Session` : "Today's Strength Workout",
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        status: "in_progress",
        exercises: [],
        totalVolumeKg: 0,
        personalRecordsHit: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // If template was selected, pre-populate default exercises
      if (templateId === "tpl_push") {
        newSession.title = "Push Day Workout";
        newSession.exercises = [
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_bench_press")!),
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_incline_db_press")!),
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_overhead_press")!),
        ];
      } else if (templateId === "tpl_pull") {
        newSession.title = "Pull Day Workout";
        newSession.exercises = [
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_deadlift")!),
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_lat_pulldown")!),
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_barbell_row")!),
        ];
      } else if (templateId === "tpl_legs") {
        newSession.title = "Leg Day Workout";
        newSession.exercises = [
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_barbell_squat")!),
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_leg_press")!),
          createExerciseItem(DEFAULT_EXERCISES.find((e) => e.id === "ex_romanian_deadlift")!),
        ];
      } else {
        // default 1 exercise
        newSession.exercises = [createExerciseItem(DEFAULT_EXERCISES[0])];
      }

      setSession(newSession);
      localStore.saveActiveWorkout(newSession);
    }
  }, [templateId, planDate]);

  function createExerciseItem(ex: ExerciseDefinition): WorkoutExerciseItem {
    return {
      id: `we_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      category: ex.category,
      restTimerSeconds: 90,
      sets: [
        { id: `set_${Date.now()}_1`, setNumber: 1, type: "normal", weightKg: 60, reps: 10, completed: false },
        { id: `set_${Date.now()}_2`, setNumber: 2, type: "normal", weightKg: 60, reps: 10, completed: false },
        { id: `set_${Date.now()}_3`, setNumber: 3, type: "normal", weightKg: 60, reps: 10, completed: false },
      ],
    };
  }

  // Workout Duration Timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (session && next % 5 === 0) {
            // Autosave to storage every 5 seconds
            localStore.saveActiveWorkout({ ...session, durationSeconds: next });
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, session]);

  // Rest Timer Countdown
  useEffect(() => {
    let interval: any;
    if (isRestRunning && restSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRestRunning(false);
            // Play subtle audio/vibration feedback
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restSecondsLeft]);

  const startRestTimer = (seconds: number = 90) => {
    setRestTotalDuration(seconds);
    setRestSecondsLeft(seconds);
    setIsRestRunning(true);
  };

  // Add Exercise to Session
  const handleSelectExercise = (ex: ExerciseDefinition) => {
    if (!session) return;
    const newItem = createExerciseItem(ex);
    const updated: WorkoutSession = {
      ...session,
      exercises: [...session.exercises, newItem],
    };
    setSession(updated);
    localStore.saveActiveWorkout(updated);
    setIsPickerOpen(false);
  };

  // Add Set to Exercise
  const handleAddSet = (exerciseId: string) => {
    if (!session) return;
    const updatedExercises = session.exercises.map((item) => {
      if (item.id === exerciseId) {
        const lastSet = item.sets[item.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `set_${Date.now()}`,
          setNumber: item.sets.length + 1,
          type: "normal",
          weightKg: lastSet ? lastSet.weightKg : 60,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        };
        return { ...item, sets: [...item.sets, newSet] };
      }
      return item;
    });

    const updated = { ...session, exercises: updatedExercises };
    setSession(updated);
    localStore.saveActiveWorkout(updated);
  };

  // Toggle Set Completion & Trigger Rest Timer
  const handleToggleSet = (exerciseId: string, setId: string) => {
    if (!session) return;
    let autoTriggerRest = false;

    const updatedExercises = session.exercises.map((item) => {
      if (item.id === exerciseId) {
        const updatedSets = item.sets.map((set) => {
          if (set.id === setId) {
            const nextCompleted = !set.completed;
            if (nextCompleted) autoTriggerRest = true;
            return { ...set, completed: nextCompleted };
          }
          return set;
        });
        return { ...item, sets: updatedSets };
      }
      return item;
    });

    const updated = { ...session, exercises: updatedExercises };
    setSession(updated);
    localStore.saveActiveWorkout(updated);

    if (autoTriggerRest) {
      startRestTimer(90);
    }
  };

  // Update Set Value (Weight, Reps, RPE)
  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: keyof WorkoutSet,
    value: any
  ) => {
    if (!session) return;
    const updatedExercises = session.exercises.map((item) => {
      if (item.id === exerciseId) {
        const updatedSets = item.sets.map((set) => {
          if (set.id === setId) {
            return { ...set, [field]: value };
          }
          return set;
        });
        return { ...item, sets: updatedSets };
      }
      return item;
    });

    const updated = { ...session, exercises: updatedExercises };
    setSession(updated);
    localStore.saveActiveWorkout(updated);
  };

  // Remove Set
  const handleRemoveSet = (exerciseId: string, setId: string) => {
    if (!session) return;
    const updatedExercises = session.exercises.map((item) => {
      if (item.id === exerciseId) {
        const filtered = item.sets.filter((s) => s.id !== setId);
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return { ...item, sets: renumbered };
      }
      return item;
    });

    const updated = { ...session, exercises: updatedExercises };
    setSession(updated);
    localStore.saveActiveWorkout(updated);
  };

  // Remove Entire Exercise
  const handleRemoveExercise = (exerciseId: string) => {
    if (!session) return;
    const updated = {
      ...session,
      exercises: session.exercises.filter((e) => e.id !== exerciseId),
    };
    setSession(updated);
    localStore.saveActiveWorkout(updated);
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    if (!session) return;

    // Calculate total volume (sum of completed sets: weight * reps)
    let totalVolume = 0;
    const existingPRs = localStore.getPRs();
    const newPRs: PersonalRecord[] = [];

    session.exercises.forEach((item) => {
      item.sets.forEach((set) => {
        if (set.completed && set.weightKg && set.reps) {
          totalVolume += set.weightKg * set.reps;

          // Check if this is a personal record for max weight
          const currentBest = existingPRs.find((p) => p.exerciseId === item.exerciseId && p.recordType === "max_weight");
          if (!currentBest || set.weightKg > currentBest.value) {
            const newPR: PersonalRecord = {
              id: `pr_${Date.now()}_${item.exerciseId}`,
              userId: session.userId,
              exerciseId: item.exerciseId,
              exerciseName: item.exerciseName,
              recordType: "max_weight",
              value: set.weightKg,
              weightKg: set.weightKg,
              reps: set.reps,
              workoutId: session.id,
              achievedAt: new Date().toISOString(),
            };
            newPRs.push(newPR);
            localStore.savePR(newPR);
          }
        }
      });
    });

    const completedSession: WorkoutSession = {
      ...session,
      status: "completed",
      endTime: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      totalVolumeKg: totalVolume,
      personalRecordsHit: newPRs.length,
      updatedAt: new Date().toISOString(),
    };

    // Save to workout history and clear active session
    localStore.saveWorkout(completedSession);
    localStore.saveActiveWorkout(null);

    // If this workout was tied to a planner date, update the planner day override to completed
    if (session.planDate) {
      const existingOverride = localStore.getDayOverride(session.planDate);
      localStore.saveDayOverride({
        id: existingOverride?.id || `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: session.userId,
        date: session.planDate,
        isRestDay: false,
        workoutName: session.title,
        splitType: existingOverride?.splitType || "custom",
        muscleGroups: existingOverride?.muscleGroups || [],
        exercises: existingOverride?.exercises || [],
        status: "completed",
        workoutSessionId: completedSession.id,
        createdAt: existingOverride?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setFinishedSummary({ totalVolume, newPRs });
  };

  // Discard Workout
  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard this workout session? Unsaved progress will be removed.")) {
      localStore.saveActiveWorkout(null);
      router.push("/workouts");
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
      {/* 1. Sticky Rest Timer & Header Bar */}
      <div className="sticky top-16 z-30 glass-panel !rounded-2xl p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-4">
        {/* Workout Title & Duration */}
        <div className="space-y-0.5">
          <input
            type="text"
            value={session.title}
            onChange={(e) => {
              const updated = { ...session, title: e.target.value };
              setSession(updated);
              localStore.saveActiveWorkout(updated);
            }}
            className="font-bold text-base sm:text-lg text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none transition-colors"
          />
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>{formatTimer(elapsedSeconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-indigo-600 dark:text-indigo-400 font-sans hover:underline ml-1"
            >
              {isTimerRunning ? "Pause" : "Resume"}
            </button>
          </div>
        </div>

        {/* Sticky Rest Timer Widget */}
        <div className="flex items-center gap-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-500/20 px-3.5 py-2 rounded-2xl">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
              Rest Timer
            </span>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              {formatTimer(restSecondsLeft)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsRestRunning(!isRestRunning)}
              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              title={isRestRunning ? "Pause timer" : "Resume timer"}
            >
              {isRestRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => startRestTimer(90)}
              className="p-1.5 rounded-lg bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white transition-colors border border-slate-200/50 dark:border-white/10"
              title="Reset 90s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Finish & Discard */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <button
            onClick={handleDiscard}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleFinishWorkout}
            className="btn-primary !py-1.5 !px-4 !text-xs !rounded-xl shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Finish Workout</span>
          </button>
        </div>
      </div>

      {/* 2. Workout Exercises List */}
      <div className="space-y-4">
        {session.exercises.map((exerciseItem) => (
          <div
            key={exerciseItem.id}
            className="glass-panel p-5 space-y-4 border-slate-200/60 dark:border-white/10"
          >
            {/* Exercise Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {exerciseItem.muscleGroup.replace("_", " ")}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {exerciseItem.exerciseName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startRestTimer(exerciseItem.restTimerSeconds || 90)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Rest {exerciseItem.restTimerSeconds || 90}s
                </button>
                <button
                  onClick={() => handleRemoveExercise(exerciseItem.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove Exercise"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Set Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-200/50 dark:border-white/10 pb-2">
                    <th className="py-2 px-1 w-12 text-center">SET</th>
                    <th className="py-2 px-2 w-28">KG / LBS</th>
                    <th className="py-2 px-2 w-24">REPS</th>
                    <th className="py-2 px-2 w-20">RPE</th>
                    <th className="py-2 px-2 text-center w-14">DONE</th>
                    <th className="py-2 px-1 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
                  {exerciseItem.sets.map((set) => (
                    <tr
                      key={set.id}
                      className={`transition-colors ${
                        set.completed
                          ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                          : "hover:bg-slate-50/50 dark:hover:bg-white/5"
                      }`}
                    >
                      <td className="py-2.5 px-1 font-bold text-center">
                        <span className="w-6 h-6 rounded-full inline-flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {set.setNumber}
                        </span>
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.5"
                          value={set.weightKg ?? ""}
                          onChange={(e) =>
                            handleUpdateSet(
                              exerciseItem.id,
                              set.id,
                              "weightKg",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 glass-input !py-1 !px-2 font-mono font-bold text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={set.reps ?? ""}
                          onChange={(e) =>
                            handleUpdateSet(
                              exerciseItem.id,
                              set.id,
                              "reps",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 glass-input !py-1 !px-2 font-mono font-bold text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="6"
                          max="10"
                          step="0.5"
                          placeholder="8"
                          value={set.rpe ?? ""}
                          onChange={(e) =>
                            handleUpdateSet(
                              exerciseItem.id,
                              set.id,
                              "rpe",
                              parseFloat(e.target.value) || undefined
                            )
                          }
                          className="w-14 glass-input !py-1 !px-2 font-mono text-center"
                        />
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSet(exerciseItem.id, set.id)}
                          className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center transition-all ${
                            set.completed
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                              : "border border-slate-300 dark:border-white/20 text-transparent hover:border-violet-500"
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </td>

                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exerciseItem.id, set.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Set Button */}
            <button
              type="button"
              onClick={() => handleAddSet(exerciseItem.id)}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Set</span>
            </button>
          </div>
        ))}

        {/* Add Exercise Trigger Button */}
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-violet-500/40 hover:border-violet-600 bg-violet-500/5 hover:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Exercise to Workout</span>
        </button>
      </div>

      {/* 3. Exercise Library Selection Modal */}
      {isPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsPickerOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-lg max-h-[80vh] flex flex-col p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Select Exercise
              </h3>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search exercises by name or muscle..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="w-full glass-input text-xs"
              autoFocus
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {searchExercises(exerciseSearch, {
                customExercises: localStore.getCustomExercises(),
                limit: 50,
              }).map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleSelectExercise(ex)}
                  className="p-3 rounded-xl border border-slate-200/60 dark:border-white/5 hover:border-violet-500/40 bg-white/40 dark:bg-white/5 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {ex.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                      {ex.muscleGroup.replace("_", " ")} • {ex.category}
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-violet-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Workout Completed Celebration Modal */}
      {finishedSummary && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Trophy className="w-8 h-8 fill-white/20" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Workout Complete!
              </h3>
              <p className="text-xs text-slate-500">
                Outstanding effort. Your workout and progress are safely saved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
                <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                  Total Volume
                </span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {finishedSummary.totalVolume.toLocaleString()} kg
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  PRs Hit
                </span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {finishedSummary.newPRs.length}
                </p>
              </div>
            </div>

            {finishedSummary.newPRs.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left text-xs">
                <p className="font-bold text-amber-700 dark:text-amber-300 mb-1">
                  New Personal Records:
                </p>
                {finishedSummary.newPRs.map((pr) => (
                  <p key={pr.id} className="text-slate-700 dark:text-slate-300">
                    • {pr.exerciseName}: {pr.value} kg ({pr.reps} reps)
                  </p>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => router.push("/progress/cards")}
                className="btn-primary w-full shadow-lg shadow-violet-500/25"
              >
                <span>Create Progress Card</span>
              </button>
              <button
                onClick={() => router.push("/workouts")}
                className="btn-secondary w-full"
              >
                <span>Back to Workouts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading active workout...</div>}>
      <ActiveWorkoutContent />
    </React.Suspense>
  );
}

