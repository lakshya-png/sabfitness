"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  CheckCircle2,
  Moon,
  Dumbbell,
  Clock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  Star,
  Copy,
  Info,
  X,
  AlertTriangle,
  Check,
  Flame,
  Award,
} from "lucide-react";
import { localStore, DEFAULT_WEEKLY_TEMPLATES } from "@/lib/storage/localState";
import { searchExercises, getPopularExercises, getExerciseById } from "@/lib/fitness/exerciseLibrary";
import type {
  WorkoutWeeklyTemplate,
  WeeklyPlanDayOverride,
  ResolvedDayPlan,
  PlannedDayWorkout,
  PlannedExerciseTarget,
  ExerciseDefinition,
  MuscleGroup,
  ExerciseCategory,
  ExerciseMovementType,
  ExerciseDifficulty,
  WorkoutSplitType,
} from "@/types/fitness";

const ALL_MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "shoulders", label: "Shoulders" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "forearms", label: "Forearms" },
  { key: "legs_quads", label: "Quads" },
  { key: "legs_hamstrings", label: "Hamstrings" },
  { key: "calves", label: "Calves" },
  { key: "glutes", label: "Glutes" },
  { key: "core", label: "Core & Abs" },
  { key: "full_body", label: "Full Body" },
  { key: "cardio", label: "Cardio" },
  { key: "mobility", label: "Mobility" },
];

const SPLIT_TYPES: { key: WorkoutSplitType; label: string }[] = [
  { key: "push", label: "Push Day" },
  { key: "pull", label: "Pull Day" },
  { key: "legs", label: "Leg Day" },
  { key: "upper", label: "Upper Body" },
  { key: "lower", label: "Lower Body" },
  { key: "full_body", label: "Full Body" },
  { key: "cardio", label: "Cardio" },
  { key: "mobility", label: "Mobility & Recovery" },
  { key: "custom", label: "Custom Split" },
];

function getMondayOfDate(d: Date): string {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split("T")[0];
}

function formatDateRange(mondayStr: string): string {
  const start = new Date(mondayStr + "T12:00:00Z");
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export default function WorkoutPlannerPage() {
  const [mounted, setMounted] = useState(false);
  const [currentMondayStr, setCurrentMondayStr] = useState<string>("");
  const [todayStr, setTodayStr] = useState<string>("");

  const [activeTemplate, setActiveTemplate] = useState<WorkoutWeeklyTemplate | null>(null);
  const [allTemplates, setAllTemplates] = useState<WorkoutWeeklyTemplate[]>([]);
  const [weekStats, setWeekStats] = useState<{
    totalDays: number;
    plannedWorkoutDays: number;
    restDays: number;
    completedDays: number;
    skippedDays: number;
    consistencyPercentage: number;
    days: ResolvedDayPlan[];
  } | null>(null);

  // Exercise Picker Drawer / Modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTargetDate, setPickerTargetDate] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleGroup | "all">("all");
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);

  // Target Config Drawer / Modal
  const [targetModalExercise, setTargetModalExercise] = useState<{
    dateStr: string;
    target: PlannedExerciseTarget;
    isEditingExisting: boolean;
  } | null>(null);

  // Edit Day Meta Modal (Workout Name, Split Type, Muscle Groups, Rest Day)
  const [dayMetaModal, setDayMetaModal] = useState<{
    dateStr: string;
    workoutName: string;
    splitType: WorkoutSplitType;
    muscleGroups: MuscleGroup[];
    isRestDay: boolean;
    restNotes: string;
  } | null>(null);

  // Create Custom Exercise Dialog
  const [isCustomExerciseOpen, setIsCustomExerciseOpen] = useState(false);
  const [newCustomExercise, setNewCustomExercise] = useState<{
    name: string;
    muscleGroup: MuscleGroup;
    category: ExerciseCategory;
    equipment: string;
    instructions: string;
  }>({
    name: "",
    muscleGroup: "chest",
    category: "dumbbell",
    equipment: "Dumbbells",
    instructions: "",
  });

  // Template Manager / Confirmation Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [confirmResetWeek, setConfirmResetWeek] = useState(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);

  // Hydrate on mount
  useEffect(() => {
    const today = new Date();
    const tStr = today.toISOString().split("T")[0];
    const mStr = getMondayOfDate(today);

    setTodayStr(tStr);
    setCurrentMondayStr(mStr);
    setFavoriteIds(localStore.getFavoriteExerciseIds());
    setCustomExercises(localStore.getCustomExercises());

    refreshPlanner(mStr);
    setMounted(true);
  }, []);

  const refreshPlanner = (mondayStr: string) => {
    const templates = localStore.getWeeklyTemplates();
    const active = localStore.getActiveWeeklyTemplate();
    const stats = localStore.getWeeklyPlannerStats(mondayStr);

    setAllTemplates(templates);
    setActiveTemplate(active);
    setWeekStats(stats);
    setFavoriteIds(localStore.getFavoriteExerciseIds());
    setCustomExercises(localStore.getCustomExercises());
  };

  const handlePrevWeek = () => {
    if (!currentMondayStr) return;
    const current = new Date(currentMondayStr + "T12:00:00Z");
    const prev = new Date(current.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevStr = prev.toISOString().split("T")[0];
    setCurrentMondayStr(prevStr);
    refreshPlanner(prevStr);
  };

  const handleNextWeek = () => {
    if (!currentMondayStr) return;
    const current = new Date(currentMondayStr + "T12:00:00Z");
    const next = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextStr = next.toISOString().split("T")[0];
    setCurrentMondayStr(nextStr);
    refreshPlanner(nextStr);
  };

  const handleCurrentWeek = () => {
    const mStr = getMondayOfDate(new Date());
    setCurrentMondayStr(mStr);
    refreshPlanner(mStr);
  };

  // Switch Active Template
  const handleSelectTemplate = (templateId: string) => {
    localStore.setActiveWeeklyTemplate(templateId);
    refreshPlanner(currentMondayStr);
    setIsTemplateModalOpen(false);
  };

  // Duplicate Template
  const handleDuplicateTemplate = (templateId: string) => {
    const cloned = localStore.duplicateWeeklyTemplate(templateId);
    refreshPlanner(currentMondayStr);
    return cloned;
  };

  // Delete Template
  const handleDeleteTemplate = (templateId: string) => {
    localStore.deleteWeeklyTemplate(templateId);
    setConfirmDeleteTemplateId(null);
    refreshPlanner(currentMondayStr);
  };

  // Reset entire current week to active template
  const handleResetEntireWeek = () => {
    localStore.resetWeekToTemplate(currentMondayStr);
    setConfirmResetWeek(false);
    refreshPlanner(currentMondayStr);
  };

  // Reset single day to template
  const handleResetDay = (dateStr: string) => {
    localStore.deleteDayOverride(dateStr);
    refreshPlanner(currentMondayStr);
  };

  // Toggle Rest Day for a day
  const handleToggleRestDay = (day: ResolvedDayPlan) => {
    const newIsRest = !day.isRestDay;
    const existingOverride = localStore.getDayOverride(day.date);

    const override: WeeklyPlanDayOverride = {
      id: existingOverride?.id || `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: localStore.getUser().id,
      date: day.date,
      isRestDay: newIsRest,
      restNotes: newIsRest ? "Active recovery day. Focus on rest, hydration, and stretching." : undefined,
      workoutName: newIsRest ? "Rest & Active Recovery" : day.workoutName === "Rest & Active Recovery" ? "Custom Workout" : day.workoutName,
      splitType: day.splitType,
      muscleGroups: day.muscleGroups,
      exercises: day.exercises,
      status: newIsRest ? "rest" : "planned",
      createdAt: existingOverride?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveDayOverride(override);
    refreshPlanner(currentMondayStr);
  };

  // Reorder Exercises (Move Up / Move Down)
  const handleMoveExercise = (day: ResolvedDayPlan, index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= day.exercises.length) return;

    const updatedExercises = [...day.exercises];
    const [moved] = updatedExercises.splice(index, 1);
    updatedExercises.splice(targetIndex, 0, moved);

    const existingOverride = localStore.getDayOverride(day.date);
    const override: WeeklyPlanDayOverride = {
      id: existingOverride?.id || `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: localStore.getUser().id,
      date: day.date,
      isRestDay: day.isRestDay,
      restNotes: day.restNotes,
      workoutName: day.workoutName,
      splitType: day.splitType,
      muscleGroups: day.muscleGroups,
      exercises: updatedExercises,
      status: day.status,
      workoutSessionId: day.workoutSessionId,
      createdAt: existingOverride?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveDayOverride(override);
    refreshPlanner(currentMondayStr);
  };

  // Remove Exercise from Day
  const handleRemoveExercise = (day: ResolvedDayPlan, targetId: string) => {
    const updatedExercises = day.exercises.filter((ex) => ex.id !== targetId);
    const existingOverride = localStore.getDayOverride(day.date);

    const override: WeeklyPlanDayOverride = {
      id: existingOverride?.id || `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: localStore.getUser().id,
      date: day.date,
      isRestDay: day.isRestDay,
      restNotes: day.restNotes,
      workoutName: day.workoutName,
      splitType: day.splitType,
      muscleGroups: day.muscleGroups,
      exercises: updatedExercises,
      status: day.status,
      workoutSessionId: day.workoutSessionId,
      createdAt: existingOverride?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveDayOverride(override);
    refreshPlanner(currentMondayStr);
  };

  // Save Day Metadata (workout name, muscle groups, split)
  const handleSaveDayMeta = () => {
    if (!dayMetaModal) return;
    const { dateStr, workoutName, splitType, muscleGroups, isRestDay, restNotes } = dayMetaModal;
    const day = weekStats?.days.find((d) => d.date === dateStr);
    const existingOverride = localStore.getDayOverride(dateStr);

    const override: WeeklyPlanDayOverride = {
      id: existingOverride?.id || `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: localStore.getUser().id,
      date: dateStr,
      isRestDay,
      restNotes: isRestDay ? restNotes : undefined,
      workoutName: workoutName.trim() || (isRestDay ? "Rest & Recovery" : "Workout"),
      splitType,
      muscleGroups,
      exercises: day ? day.exercises : [],
      status: isRestDay ? "rest" : "planned",
      createdAt: existingOverride?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveDayOverride(override);
    setDayMetaModal(null);
    refreshPlanner(currentMondayStr);
  };

  // Save Target Modal (Add or Edit Exercise Target)
  const handleSaveTargetModal = () => {
    if (!targetModalExercise) return;
    const { dateStr, target, isEditingExisting } = targetModalExercise;
    const day = weekStats?.days.find((d) => d.date === dateStr);
    if (!day) return;

    let updatedExercises = [...day.exercises];
    if (isEditingExisting) {
      updatedExercises = updatedExercises.map((e) => (e.id === target.id ? target : e));
    } else {
      updatedExercises.push(target);
    }

    const existingOverride = localStore.getDayOverride(dateStr);
    const override: WeeklyPlanDayOverride = {
      id: existingOverride?.id || `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: localStore.getUser().id,
      date: dateStr,
      isRestDay: false, // adding an exercise automatically sets training day
      workoutName: day.isRestDay ? "Custom Workout" : day.workoutName,
      splitType: day.splitType,
      muscleGroups: day.muscleGroups.includes(target.muscleGroup) ? day.muscleGroups : [...day.muscleGroups, target.muscleGroup],
      exercises: updatedExercises,
      status: "planned",
      createdAt: existingOverride?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveDayOverride(override);
    setTargetModalExercise(null);
    setIsPickerOpen(false);
    refreshPlanner(currentMondayStr);
  };

  // Select Exercise from Library to Add
  const handlePickExercise = (ex: ExerciseDefinition) => {
    if (!pickerTargetDate) return;
    const newTarget: PlannedExerciseTarget = {
      id: `pe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      category: ex.category,
      trackingMode: ex.trackingMode || "reps_weight",
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: ex.category === "barbell" ? 60 : ex.category === "dumbbell" ? 20 : 0,
      targetWeightUnit: "kg",
      restTimerSeconds: 90,
      targetRpe: 8,
      notes: ex.formCues?.[0] || "",
    };

    // Open target configurator for fine-tuning
    setTargetModalExercise({
      dateStr: pickerTargetDate,
      target: newTarget,
      isEditingExisting: false,
    });
  };

  // Toggle Favorite
  const handleToggleFavorite = (exId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localStore.toggleFavoriteExercise(exId);
    setFavoriteIds(localStore.getFavoriteExerciseIds());
  };

  // Save New Custom Exercise
  const handleCreateCustomExercise = () => {
    if (!newCustomExercise.name.trim()) return;
    const created = localStore.saveCustomExercise({
      name: newCustomExercise.name.trim(),
      muscleGroup: newCustomExercise.muscleGroup,
      category: newCustomExercise.category,
      equipment: newCustomExercise.equipment.trim() || "Gym Equipment",
      instructions: newCustomExercise.instructions.trim() || "Perform exercise with controlled range of motion.",
      trackingMode: "reps_weight",
      difficulty: "intermediate",
      formCues: ["Maintain strict form", "Avoid momentum"],
    });

    setCustomExercises(localStore.getCustomExercises());
    setIsCustomExerciseOpen(false);

    // If picker is open, pick the newly created exercise immediately
    if (pickerTargetDate) {
      handlePickExercise(created);
    }
  };

  // Filtered exercises for the library picker
  const filteredLibrary = useMemo(() => {
    if (!isPickerOpen) return [];
    return searchExercises(exerciseSearch, {
      muscleGroup: selectedMuscleFilter,
      equipment: selectedEquipmentFilter,
      favoritesOnly,
      favoriteIds,
      customExercises,
      limit: 60,
    });
  }, [
    isPickerOpen,
    exerciseSearch,
    selectedMuscleFilter,
    selectedEquipmentFilter,
    favoritesOnly,
    favoriteIds,
    customExercises,
  ]);

  if (!mounted || !weekStats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white/40 dark:bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-64 bg-white/40 dark:bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnyOverride = weekStats.days.some((d) => d.isOverride);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
              Weekly Routine & Splits
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              1,110+ Exercise Library
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Workout Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Design recurring splits, customize single-week schedules, and launch workouts seamlessly.
          </p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-2 bg-white/60 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/10 backdrop-blur-md self-start md:self-auto shadow-sm">
          <button
            onClick={handlePrevWeek}
            aria-label="Previous Week"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleCurrentWeek}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-violet-600" />
            <span>This Week</span>
          </button>

          <span className="text-xs font-bold text-slate-900 dark:text-white px-2 whitespace-nowrap">
            {formatDateRange(currentMondayStr)}
          </span>

          <button
            onClick={handleNextWeek}
            aria-label="Next Week"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Stats & Active Template Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Template Selector Card */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-indigo-500/0 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Active Recurring Template
              </span>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 font-semibold flex items-center gap-1"
              >
                <span>Change Template</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTemplate?.name || "PPL 6-Day Hypertrophy Split"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {activeTemplate?.description || "Push, Pull, Legs balanced routine with dedicated recovery."}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-200/50 dark:border-white/5">
            {hasAnyOverride && (
              <button
                onClick={() => setConfirmResetWeek(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Week to Template</span>
              </button>
            )}
            <button
              onClick={() => {
                if (activeTemplate) handleDuplicateTemplate(activeTemplate.id);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Duplicate Template</span>
            </button>
          </div>
        </div>

        {/* Consistency Adherence Metric */}
        <div className="glass-card p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Weekly Adherence
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {weekStats.consistencyPercentage}%
              </span>
              <span className="text-xs text-emerald-600 font-semibold">
                {weekStats.completedDays}/{weekStats.plannedWorkoutDays} Sessions
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Planned rest days never penalize consistency.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Scheduled Rest Days Metric */}
        <div className="glass-card p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Recovery Days
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {weekStats.restDays}
              </span>
              <span className="text-xs text-sky-600 font-semibold">
                Scheduled Rest
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Vital for muscle protein synthesis & CNS recovery.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-600 flex items-center justify-center border border-sky-500/30">
            <Moon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. 7-Day Calendar Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>7-Day Schedule</span>
            <span className="text-xs font-medium text-slate-500">
              (Freely assign and mix any muscle groups)
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {weekStats.days.map((day) => {
            const isToday = day.date === todayStr;
            const isCompleted = day.status === "completed";
            const isRest = day.isRestDay;

            return (
              <div
                key={day.date}
                className={`glass-card p-4 flex flex-col justify-between transition-all duration-200 relative group min-h-[380px] ${
                  isToday
                    ? "ring-2 ring-violet-500/70 shadow-lg shadow-violet-500/10 border-violet-500/40"
                    : isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                    : isRest
                    ? "border-sky-500/20 bg-sky-500/[0.015]"
                    : ""
                }`}
              >
                {/* Day Card Header */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {day.dayName.slice(0, 3)}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-600 text-white">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(day.date + "T12:00:00Z").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Done</span>
                        </span>
                      ) : isRest ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" />
                          <span>Rest</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                          Planned
                        </span>
                      )}

                      {day.isOverride ? (
                        <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          Customized
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-slate-400">
                          Template
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Workout Title & Edit Trigger */}
                  <div className="flex items-start justify-between gap-1 group/title">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {day.workoutName}
                    </h4>
                    <button
                      onClick={() =>
                        setDayMetaModal({
                          dateStr: day.date,
                          workoutName: day.workoutName,
                          splitType: day.splitType,
                          muscleGroups: day.muscleGroups,
                          isRestDay: day.isRestDay,
                          restNotes: day.restNotes || "",
                        })
                      }
                      title="Edit day workout name & muscles"
                      className="p-1 rounded text-slate-400 hover:text-violet-600 dark:hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Muscle Groups Badges */}
                  {!isRest && day.muscleGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {day.muscleGroups.map((mg) => (
                        <span
                          key={mg}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 capitalize"
                        >
                          {mg.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rest Day Notes */}
                  {isRest && (
                    <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-800 dark:text-sky-300">
                      <p className="font-semibold mb-0.5">Active Recovery</p>
                      <p className="line-clamp-3 text-[10px] text-slate-600 dark:text-slate-300">
                        {day.restNotes || "Rest, hydrate, and stretch to prepare for upcoming workouts."}
                      </p>
                    </div>
                  )}

                  {/* Planned Exercises List */}
                  {!isRest && (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                      {day.exercises.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                          No exercises added yet
                        </div>
                      ) : (
                        day.exercises.map((target, idx) => (
                          <div
                            key={target.id}
                            className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-xs flex items-center justify-between gap-1 group/item"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white truncate text-[11px]">
                                {idx + 1}. {target.exerciseName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                <span>
                                  {target.targetSets} × {target.targetRepsMin || 10}
                                  {target.targetRepsMax ? `-${target.targetRepsMax}` : ""}{" "}
                                  {target.trackingMode === "time_duration" ? "s" : "reps"}
                                </span>
                                {target.targetWeightKg ? (
                                  <span>@ {target.targetWeightKg}kg</span>
                                ) : null}
                                {target.restTimerSeconds ? (
                                  <span className="text-violet-600 dark:text-violet-400">
                                    ⏱{target.restTimerSeconds}s
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Stepper / Action Controls */}
                            <div className="flex items-center gap-0.5 opacity-60 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleMoveExercise(day, idx, "up")}
                                disabled={idx === 0}
                                title="Move up"
                                className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveExercise(day, idx, "down")}
                                disabled={idx === day.exercises.length - 1}
                                title="Move down"
                                className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  setTargetModalExercise({
                                    dateStr: day.date,
                                    target,
                                    isEditingExisting: true,
                                  })
                                }
                                title="Edit target sets & reps"
                                className="p-0.5 text-slate-400 hover:text-violet-600"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRemoveExercise(day, target.id)}
                                title="Remove exercise"
                                className="p-0.5 text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Day Card Footer Actions */}
                <div className="space-y-1.5 pt-3 mt-3 border-t border-slate-200/50 dark:border-white/5">
                  {!isRest ? (
                    <>
                      {isCompleted ? (
                        <div className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Logged ({day.completedWorkout?.totalVolumeKg.toLocaleString() || 0} kg)</span>
                        </div>
                      ) : (
                        <Link
                          href={`/workouts/active?planDate=${day.date}`}
                          className="btn-primary w-full !py-1.5 text-xs flex items-center justify-center gap-1 shadow-md shadow-violet-500/20"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Start Workout</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setPickerTargetDate(day.date);
                          setIsPickerOpen(true);
                        }}
                        className="w-full py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Exercise</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/workouts/active?planDate=${day.date}`}
                        className="w-full py-1.5 px-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold text-center hover:bg-sky-500/25 transition-colors flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Log Unplanned Workout</span>
                      </Link>
                    </>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleToggleRestDay(day)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                    >
                      {isRest ? "Make Training Day" : "Set Rest Day"}
                    </button>

                    {day.isOverride && (
                      <button
                        onClick={() => handleResetDay(day.date)}
                        title="Reset this day back to template"
                        className="text-[10px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset Day</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Exercise Picker Drawer / Modal (Search 1,110+ items) */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Search Exercise Library
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                    1,110 Verified Exercises
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select an exercise to configure sets, reps, weight, and rest intervals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustomExerciseOpen(true)}
                  className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 text-violet-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Exercise</span>
                </button>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Input & Quick Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by exercise name, target muscle, or equipment (e.g. Incline Bench, Deadlift, Cable)..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full glass-input text-xs pl-10 pr-4"
                  autoFocus
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  className={`px-2.5 py-1 rounded-xl font-medium border flex items-center gap-1 transition-colors whitespace-nowrap ${
                    favoritesOnly
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/10"
                  }`}
                >
                  <Star className={`w-3 h-3 ${favoritesOnly ? "fill-white" : ""}`} />
                  <span>Favorites</span>
                </button>

                <select
                  value={selectedMuscleFilter}
                  onChange={(e) => setSelectedMuscleFilter(e.target.value as any)}
                  className="glass-input !py-1 !px-2 text-xs w-auto"
                >
                  <option value="all">All Muscles</option>
                  {ALL_MUSCLE_GROUPS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedEquipmentFilter}
                  onChange={(e) => setSelectedEquipmentFilter(e.target.value)}
                  className="glass-input !py-1 !px-2 text-xs w-auto"
                >
                  <option value="all">All Equipment</option>
                  <option value="barbell">Barbell</option>
                  <option value="dumbbell">Dumbbell</option>
                  <option value="cable">Cable</option>
                  <option value="machine">Machine</option>
                  <option value="bodyweight">Bodyweight</option>
                  <option value="kettlebell">Kettlebell</option>
                </select>

                <span className="text-[11px] text-slate-400 ml-auto whitespace-nowrap">
                  Showing {filteredLibrary.length} results
                </span>
              </div>
            </div>

            {/* Exercise Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
              {filteredLibrary.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <Dumbbell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    No matching exercises found
                  </p>
                  <p className="mt-1">
                    Try adjusting your search terms or create a custom exercise.
                  </p>
                </div>
              ) : (
                filteredLibrary.map((ex) => {
                  const isFav = favoriteIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => handlePickExercise(ex)}
                      className="p-3 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-violet-500/40 bg-white/40 dark:bg-white/5 cursor-pointer flex items-center justify-between gap-3 transition-all hover:bg-violet-500/5 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {ex.name}
                          </h4>
                          {ex.isCustom && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                              Custom
                            </span>
                          )}
                          {ex.difficulty && (
                            <span className="text-[10px] text-slate-400 capitalize hidden sm:inline">
                              • {ex.difficulty}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <span className="capitalize text-violet-700 dark:text-violet-400 font-semibold">
                            {ex.muscleGroup.replace("_", " ")}
                          </span>
                          {ex.equipment && (
                            <span>• {ex.equipment}</span>
                          )}
                          {ex.category && (
                            <span>• {ex.category}</span>
                          )}
                        </div>

                        {ex.formCues && ex.formCues.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                            Cue: {ex.formCues[0]}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleToggleFavorite(ex.id, e)}
                          title="Toggle favorite"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          <Star className={`w-4 h-4 ${isFav ? "fill-amber-500 text-amber-500" : ""}`} />
                        </button>

                        <div className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold group-hover:bg-violet-700 transition-colors flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Target Config Modal (Sets, Reps, Weight, Rest Timer, RPE) */}
      {targetModalExercise && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {targetModalExercise.isEditingExisting ? "Edit Target" : "Configure Exercise"}
                </h3>
                <p className="text-xs text-slate-500">
                  {targetModalExercise.target.exerciseName}
                </p>
              </div>
              <button
                onClick={() => setTargetModalExercise(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Sets Stepper */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Target Sets
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={targetModalExercise.target.targetSets}
                    onChange={(e) =>
                      setTargetModalExercise({
                        ...targetModalExercise,
                        target: {
                          ...targetModalExercise.target,
                          targetSets: parseInt(e.target.value) || 3,
                        },
                      })
                    }
                    className="flex-1 accent-violet-600"
                  />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white w-12 text-center py-1 px-2 rounded-lg bg-white/50 dark:bg-white/10 border border-slate-200/50">
                    {targetModalExercise.target.targetSets} sets
                  </span>
                </div>
              </div>

              {/* Rep Range Min / Max */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Min Reps
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={targetModalExercise.target.targetRepsMin || 8}
                    onChange={(e) =>
                      setTargetModalExercise({
                        ...targetModalExercise,
                        target: {
                          ...targetModalExercise.target,
                          targetRepsMin: parseInt(e.target.value) || 8,
                        },
                      })
                    }
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Max Reps
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={targetModalExercise.target.targetRepsMax || 12}
                    onChange={(e) =>
                      setTargetModalExercise({
                        ...targetModalExercise,
                        target: {
                          ...targetModalExercise.target,
                          targetRepsMax: parseInt(e.target.value) || 12,
                        },
                      })
                    }
                    className="w-full glass-input"
                  />
                </div>
              </div>

              {/* Target Weight */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={500}
                  value={targetModalExercise.target.targetWeightKg || 0}
                  onChange={(e) =>
                    setTargetModalExercise({
                      ...targetModalExercise,
                      target: {
                        ...targetModalExercise.target,
                        targetWeightKg: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full glass-input"
                  placeholder="0 for bodyweight"
                />
              </div>

              {/* Rest Timer Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Rest Timer
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[45, 60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        setTargetModalExercise({
                          ...targetModalExercise,
                          target: {
                            ...targetModalExercise.target,
                            restTimerSeconds: sec,
                          },
                        })
                      }
                      className={`py-1.5 rounded-xl font-semibold text-center border transition-all ${
                        targetModalExercise.target.restTimerSeconds === sec
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/10"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Cues */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Notes / Form Cue
                </label>
                <input
                  type="text"
                  value={targetModalExercise.target.notes || ""}
                  onChange={(e) =>
                    setTargetModalExercise({
                      ...targetModalExercise,
                      target: {
                        ...targetModalExercise.target,
                        notes: e.target.value,
                      },
                    })
                  }
                  className="w-full glass-input"
                  placeholder="e.g. 2-sec pause at bottom"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTargetModalExercise(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTargetModal}
                className="btn-primary flex-1 shadow-md shadow-violet-500/25"
              >
                Save Target
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Day Meta Modal (Workout Name, Split Type, Muscle Groups, Rest Day) */}
      {dayMetaModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Customize Day Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(dayMetaModal.dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setDayMetaModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Rest Day Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Scheduled Rest Day
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Rest days never count as missed workouts in your stats.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dayMetaModal.isRestDay}
                  onChange={(e) =>
                    setDayMetaModal({
                      ...dayMetaModal,
                      isRestDay: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-violet-600 rounded"
                />
              </div>

              {!dayMetaModal.isRestDay ? (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Workout Title
                    </label>
                    <input
                      type="text"
                      value={dayMetaModal.workoutName}
                      onChange={(e) =>
                        setDayMetaModal({
                          ...dayMetaModal,
                          workoutName: e.target.value,
                        })
                      }
                      className="w-full glass-input"
                      placeholder="e.g. Chest + Shoulders Power"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Split Category
                    </label>
                    <select
                      value={dayMetaModal.splitType}
                      onChange={(e) =>
                        setDayMetaModal({
                          ...dayMetaModal,
                          splitType: e.target.value as any,
                        })
                      }
                      className="w-full glass-input"
                    >
                      {SPLIT_TYPES.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Muscle Group Multi-Select Chips */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      Target Muscle Groups (Combine Freely)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ALL_MUSCLE_GROUPS.map((mg) => {
                        const isSelected = dayMetaModal.muscleGroups.includes(mg.key);
                        return (
                          <button
                            key={mg.key}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? dayMetaModal.muscleGroups.filter((g) => g !== mg.key)
                                : [...dayMetaModal.muscleGroups, mg.key];
                              setDayMetaModal({
                                ...dayMetaModal,
                                muscleGroups: updated,
                              });
                            }}
                            className={`py-1.5 px-2 rounded-xl text-left font-medium border flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-violet-600 text-white border-violet-600"
                                : "bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/10"
                            }`}
                          >
                            <span>{mg.label}</span>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Recovery Notes
                  </label>
                  <textarea
                    rows={3}
                    value={dayMetaModal.restNotes}
                    onChange={(e) =>
                      setDayMetaModal({
                        ...dayMetaModal,
                        restNotes: e.target.value,
                      })
                    }
                    className="w-full glass-input"
                    placeholder="Focus on 8 hours sleep, hydration, and mobility walking..."
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDayMetaModal(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDayMeta}
                className="btn-primary flex-1 shadow-md shadow-violet-500/25"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Create Custom Exercise Dialog */}
      {isCustomExerciseOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Custom Exercise
              </h3>
              <button
                onClick={() => setIsCustomExerciseOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  value={newCustomExercise.name}
                  onChange={(e) =>
                    setNewCustomExercise({ ...newCustomExercise, name: e.target.value })
                  }
                  className="w-full glass-input"
                  placeholder="e.g. Larsen Press, Landmine Twist"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Primary Muscle
                  </label>
                  <select
                    value={newCustomExercise.muscleGroup}
                    onChange={(e) =>
                      setNewCustomExercise({
                        ...newCustomExercise,
                        muscleGroup: e.target.value as any,
                      })
                    }
                    className="w-full glass-input"
                  >
                    {ALL_MUSCLE_GROUPS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Equipment
                  </label>
                  <input
                    type="text"
                    value={newCustomExercise.equipment}
                    onChange={(e) =>
                      setNewCustomExercise({ ...newCustomExercise, equipment: e.target.value })
                    }
                    className="w-full glass-input"
                    placeholder="Barbell, Cable, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Instructions / Cues
                </label>
                <textarea
                  rows={2}
                  value={newCustomExercise.instructions}
                  onChange={(e) =>
                    setNewCustomExercise({ ...newCustomExercise, instructions: e.target.value })
                  }
                  className="w-full glass-input"
                  placeholder="Keep elbows tucked, feet planted flat on the floor..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomExerciseOpen(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomExercise}
                disabled={!newCustomExercise.name.trim()}
                className="btn-primary flex-1 disabled:opacity-50 shadow-md shadow-violet-500/25"
              >
                Save Exercise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Template Switcher & Management Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recurring Workout Templates
                </h3>
                <p className="text-xs text-slate-500">
                  Select a template blueprint for your future weekly routine.
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {allTemplates.map((tpl) => {
                const isActive = tpl.id === activeTemplate?.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? "border-violet-500/50 bg-violet-500/10 shadow-md shadow-violet-500/10"
                        : "border-slate-200/60 dark:border-white/5 hover:border-violet-500/30 bg-white/40 dark:bg-white/5"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {tpl.name}
                        </h4>
                        {isActive && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-violet-600 text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {tpl.description || "Custom weekly split routine."}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <span>
                          {tpl.days.filter((d) => !d.isRestDay).length} Training Days
                        </span>
                        <span>•</span>
                        <span>
                          {tpl.days.filter((d) => d.isRestDay).length} Rest Days
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(tpl.id);
                        }}
                        title="Duplicate"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {allTemplates.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteTemplateId(tpl.id);
                          }}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-end">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Reset Entire Week Confirmation Modal */}
      {confirmResetWeek && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset Week to Template?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This will clear custom exercise modifications and rest day overrides for this 7-day period, cleanly restoring the active weekly template.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmResetWeek(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetEntireWeek}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex-1 transition-colors"
              >
                Reset Week
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Delete Template Confirmation Modal */}
      {confirmDeleteTemplateId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Template?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this weekly workout template? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteTemplateId(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTemplate(confirmDeleteTemplateId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex-1 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
