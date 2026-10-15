"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Target,
  Flame,
  Dumbbell,
  Apple,
  Droplets,
  ShieldAlert,
  Sparkles,
  Scale,
  Info,
  Check,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  History,
  Calendar,
  HeartPulse,
  Sliders,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import {
  calculatePersonalizedNutrition,
  calculateGoalRoadmap,
  getWorkoutGoalSuggestion,
} from "@/lib/fitness/calculations";
import type {
  UserProfile,
  FitnessGoalType,
  ActivityLevel,
  DietaryPreference,
  UnitSystem,
  NutritionCalculationResult,
  GoalRoadmapResult,
  WorkoutGoalSuggestion,
  GoalRecommendationRecord,
} from "@/types/user";

function GoalsPageInner() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>("2026-01-01");

  // Form State
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [currentWeightInput, setCurrentWeightInput] = useState<number>(70);
  const [goalWeightInput, setGoalWeightInput] = useState<number>(68);
  const [heightCmInput, setHeightCmInput] = useState<number>(175);
  const [heightFtInput, setHeightFtInput] = useState<number>(5);
  const [heightInInput, setHeightInInput] = useState<number>(9);
  const [ageInput, setAgeInput] = useState<number>(25);
  const [genderInput, setGenderInput] = useState<"male" | "female" | "other" | "prefer_not_to_say">("male");
  const [activityLevelInput, setActivityLevelInput] = useState<ActivityLevel>("moderate");
  const [workoutFrequencyInput, setWorkoutFrequencyInput] = useState<number>(4);
  const [primaryGoalInput, setPrimaryGoalInput] = useState<FitnessGoalType>("fat_loss");
  const [dietaryPreferenceInput, setDietaryPreferenceInput] = useState<DietaryPreference>("non_vegetarian");
  const [dietaryRestrictionsInput, setDietaryRestrictionsInput] = useState<string>("");
  const [foodPreferencesNotesInput, setFoodPreferencesNotesInput] = useState<string>("");
  const [targetDateInput, setTargetDateInput] = useState<string>("");
  const [changeReasonInput, setChangeReasonInput] = useState<string>("");

  // Preview Modal & History State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<GoalRecommendationRecord[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    const u = localStore.getUser();
    setUser(u);
    setHistoryRecords(localStore.getGoalRecommendationHistory());

    if (u) {
      setUnitSystem(u.unitSystem || "metric");
      const defaultWeight = u.weightKg > 0 ? u.weightKg : 70;
      setCurrentWeightInput(
        u.unitSystem === "imperial" ? Math.round(defaultWeight * 2.20462) : defaultWeight
      );
      const defaultGoalWeight = (u.goalWeightKg && u.goalWeightKg > 0) ? u.goalWeightKg : defaultWeight;
      setGoalWeightInput(
        u.unitSystem === "imperial" ? Math.round(defaultGoalWeight * 2.20462) : defaultGoalWeight
      );

      const h = u.heightCm > 0 ? u.heightCm : 175;
      setHeightCmInput(h);
      const totalInches = Math.round(h / 2.54);
      setHeightFtInput(Math.floor(totalInches / 12));
      setHeightInInput(totalInches % 12);

      setAgeInput(u.age || 25);
      setGenderInput(u.gender || "male");
      setActivityLevelInput(u.activityLevel || "moderate");
      setWorkoutFrequencyInput(u.workoutFrequencyPerWeek || 4);
      setPrimaryGoalInput(u.primaryGoal || "fat_loss");
      setDietaryPreferenceInput(u.dietaryPreference || "non_vegetarian");
      setDietaryRestrictionsInput(u.dietaryRestrictions || "");
      setFoodPreferencesNotesInput(u.foodPreferencesNotes || "");
      setTargetDateInput(u.targetDate || "");
    }
    setCurrentDate(new Date().toISOString().split("T")[0]);
    setIsLoaded(true);
  }, []);

  // Standardized metric values for calculation
  const normalizedWeightKg = useMemo(() => {
    if (unitSystem === "imperial") {
      return Math.round((currentWeightInput / 2.20462) * 10) / 10;
    }
    return currentWeightInput;
  }, [currentWeightInput, unitSystem]);

  const normalizedGoalWeightKg = useMemo(() => {
    if (unitSystem === "imperial") {
      return Math.round((goalWeightInput / 2.20462) * 10) / 10;
    }
    return goalWeightInput;
  }, [goalWeightInput, unitSystem]);

  const normalizedHeightCm = useMemo(() => {
    if (unitSystem === "imperial") {
      return Math.round((heightFtInput * 12 + heightInInput) * 2.54);
    }
    return heightCmInput;
  }, [heightCmInput, heightFtInput, heightInInput, unitSystem]);

  // Minor Flag
  const isMinor = ageInput < 18;

  // Real-time Calculation for Live Preview
  const liveCalculation: NutritionCalculationResult = useMemo(() => {
    return calculatePersonalizedNutrition({
      weightKg: normalizedWeightKg,
      goalWeightKg: normalizedGoalWeightKg,
      heightCm: normalizedHeightCm,
      age: ageInput,
      gender: genderInput,
      activityLevel: activityLevelInput,
      workoutFrequencyPerWeek: workoutFrequencyInput,
      primaryGoal: primaryGoalInput,
      dietaryPreference: dietaryPreferenceInput,
      targetDate: targetDateInput,
      currentDate,
    });
  }, [
    normalizedWeightKg,
    normalizedGoalWeightKg,
    normalizedHeightCm,
    ageInput,
    genderInput,
    activityLevelInput,
    workoutFrequencyInput,
    primaryGoalInput,
    dietaryPreferenceInput,
    targetDateInput,
    currentDate,
  ]);

  // Live Roadmap
  const liveRoadmap: GoalRoadmapResult = useMemo(() => {
    const measurements = isLoaded ? localStore.getMeasurements() : [];
    return calculateGoalRoadmap({
      currentWeightKg: normalizedWeightKg,
      goalWeightKg: normalizedGoalWeightKg,
      primaryGoal: primaryGoalInput,
      age: ageInput,
      weightHistory: measurements,
      currentDate,
    });
  }, [normalizedWeightKg, normalizedGoalWeightKg, ageInput, primaryGoalInput, isLoaded, currentDate]);

  // Workout Suggestion
  const workoutSuggestion: WorkoutGoalSuggestion = useMemo(() => {
    return getWorkoutGoalSuggestion(primaryGoalInput, workoutFrequencyInput);
  }, [primaryGoalInput, workoutFrequencyInput]);

  // Handle Save / Apply
  const handleApplyChanges = (reason?: string) => {
    const updatedFields: Partial<UserProfile> = {
      weightKg: normalizedWeightKg,
      goalWeightKg: normalizedGoalWeightKg,
      heightCm: normalizedHeightCm,
      age: ageInput,
      gender: genderInput,
      activityLevel: activityLevelInput,
      workoutFrequencyPerWeek: workoutFrequencyInput,
      primaryGoal: primaryGoalInput,
      dietaryPreference: dietaryPreferenceInput,
      dietaryRestrictions: dietaryRestrictionsInput,
      foodPreferencesNotes: foodPreferencesNotesInput,
      targetDate: targetDateInput,
      unitSystem: unitSystem,
    };

    const res = localStore.applyGoalChange(
      updatedFields,
      reason || changeReasonInput || "Goal & nutrition calculator update"
    );

    setUser(res.profile);
    setHistoryRecords(localStore.getGoalRecommendationHistory());
    setPreviewOpen(false);
    setSaveSuccessMsg("Your personalized goals and daily nutrition targets have been updated successfully!");
    setTimeout(() => setSaveSuccessMsg(null), 6000);
  };

  // Preview Diff calculation
  const previewDiff = useMemo(() => {
    if (!previewOpen) return null;
    return localStore.calculateGoalPreview({
      weightKg: normalizedWeightKg,
      goalWeightKg: normalizedGoalWeightKg,
      heightCm: normalizedHeightCm,
      age: ageInput,
      gender: genderInput,
      activityLevel: activityLevelInput,
      workoutFrequencyPerWeek: workoutFrequencyInput,
      primaryGoal: primaryGoalInput,
      dietaryPreference: dietaryPreferenceInput,
      targetDate: targetDateInput,
    });
  }, [
    previewOpen,
    normalizedWeightKg,
    normalizedGoalWeightKg,
    normalizedHeightCm,
    ageInput,
    genderInput,
    activityLevelInput,
    workoutFrequencyInput,
    primaryGoalInput,
    dietaryPreferenceInput,
    targetDateInput,
  ]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c1024]/60 backdrop-blur-2xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Evidence-Based Protocol v2026.2
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mifflin-St Jeor + PAL
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Personalized Goal & Nutrition Calculator
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-1 max-w-2xl">
              Scientifically calibrated energy expenditure, macro balance, adolescent safety protections, and milestone roadmaps aligned directly to your training split.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-medium transition-all"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>Version History ({historyRecords.length})</span>
            </button>
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>Recalculate & Review</span>
            </button>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Minor / Adolescent Safeguard Notice */}
      {isMinor && (
        <div className="p-5 md:p-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-2xl text-amber-200 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-100 text-base md:text-lg">
                  Under-18 Athlete Safeguard Active (Age: {ageInput})
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pediatric Protection
                </span>
              </div>
              <p className="text-amber-200/90 text-sm leading-relaxed">
                Adolescents have active skeletal growth plates, rapid hormonal development, and vital organ maturation.
                <strong> SabFitness strictly prohibits restrictive caloric deficits or rapid weight cutting formulas for users under 18.</strong>
              </p>
              <p className="text-amber-300/80 text-xs">
                Caloric targets are locked to full maintenance or positive fuel availability. Prioritize nutrient-dense whole foods, sufficient calcium, iron, and adequate hydration. Consult a pediatrician or sports dietitian for individualized guidance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Inputs Column vs Live Outputs Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Configuration Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0c1024]/60 backdrop-blur-2xl p-6 md:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Body Parameters & Activity</h2>
              </div>
              {/* Unit Toggle */}
              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setUnitSystem("metric")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    unitSystem === "metric"
                      ? "bg-indigo-500 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Metric (kg / cm)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem("imperial")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    unitSystem === "imperial"
                      ? "bg-indigo-500 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Imperial (lb / ft)
                </button>
              </div>
            </div>

            {/* Weights & Height Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Weight */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Current Body Weight</span>
                  <span className="text-slate-400 font-normal">{unitSystem === "metric" ? "kg" : "lb"}</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={currentWeightInput || ""}
                  onChange={(e) => setCurrentWeightInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Goal Weight */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Target Goal Weight</span>
                  <span className="text-slate-400 font-normal">{unitSystem === "metric" ? "kg" : "lb"}</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={goalWeightInput || ""}
                  onChange={(e) => setGoalWeightInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Height */}
              {unitSystem === "metric" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Height</span>
                    <span className="text-slate-400 font-normal">cm</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="100"
                    max="250"
                    value={heightCmInput || ""}
                    onChange={(e) => setHeightCmInput(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Height</span>
                    <span className="text-slate-400 font-normal">ft & in</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="ft"
                      value={heightFtInput || ""}
                      onChange={(e) => setHeightFtInput(parseInt(e.target.value) || 0)}
                      className="px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <input
                      type="number"
                      placeholder="in"
                      value={heightInInput || ""}
                      onChange={(e) => setHeightInInput(parseInt(e.target.value) || 0)}
                      className="px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Age</span>
                  {isMinor && <span className="text-amber-400 font-bold text-[11px]">Minor (&lt;18)</span>}
                </label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={ageInput || ""}
                  onChange={(e) => setAgeInput(parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2.5 rounded-2xl bg-white/5 border text-white text-sm focus:outline-none focus:ring-2 ${
                    isMinor ? "border-amber-500/50 focus:ring-amber-500/50" : "border-white/10 focus:ring-indigo-500/50"
                  }`}
                />
              </div>
            </div>

            {/* Gender & Biological Sex for Mifflin-St Jeor */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Biological Sex / Caloric Baseline Formulation</span>
                <span title="Mifflin-St Jeor formula requires biological sex constant (+5 male, -161 female) for resting metabolic rate calculation.">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "male", label: "Male (+5)" },
                  { id: "female", label: "Female (-161)" },
                  { id: "other", label: "Neutral / Other" },
                  { id: "prefer_not_to_say", label: "Prefer not to say" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenderInput(g.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      genderInput === g.id
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Daily Non-Exercise Activity Level (PAL Factor)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: "sedentary", title: "Sedentary", desc: "Desk job, minimal daily steps (<5,000)" },
                  { id: "light", title: "Lightly Active", desc: "Light walking, retail/teaching (5k-8k steps)" },
                  { id: "moderate", title: "Moderately Active", desc: "Active on feet, 8k-12k steps daily" },
                  { id: "very_active", title: "Very Active", desc: "Manual labor, physical career (>12k steps)" },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActivityLevelInput(a.id as ActivityLevel)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      activityLevelInput === a.id
                        ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xs font-bold">{a.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Frequency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Planned Resistance / Workout Frequency
                </label>
                <span className="text-indigo-400 text-xs font-bold">
                  {workoutFrequencyInput} days / week
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setWorkoutFrequencyInput(num)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      workoutFrequencyInput === num
                        ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30"
                        : "bg-white/5 text-slate-300 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {num}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Goals & Diet Preferences Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0c1024]/60 backdrop-blur-2xl p-6 md:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
              <Target className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Fitness Goal & Dietary Alignment</h2>
            </div>

            {/* Primary Goal Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Primary Objective</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "fat_loss",
                    title: "Fat Loss / Leaning Out",
                    badge: isMinor ? "Maintenance Mode" : "Safe Deficit",
                    desc: isMinor
                      ? "Protects energy & growth for under-18 athletes"
                      : "Preserves lean muscle with moderate 350-500 kcal deficit",
                  },
                  {
                    id: "muscle_gain",
                    title: "Muscle Hypertrophy",
                    badge: "+250-400 kcal",
                    desc: "Controlled lean surplus to optimize muscle protein synthesis",
                  },
                  {
                    id: "maintain_fitness",
                    title: "Weight Maintenance",
                    badge: "Neutral Energy",
                    desc: "Sustained TDEE energy for athletic performance & body recomposition",
                  },
                  {
                    id: "strength",
                    title: "Strength & Power",
                    badge: "+150 kcal Fuel",
                    desc: "Performance-oriented nutrition for CNS & barbell progression",
                  },
                  {
                    id: "endurance",
                    title: "Endurance & Conditioning",
                    badge: "High Carbohydrate",
                    desc: "Glycogen replenishment and cardiovascular stamina",
                  },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setPrimaryGoalInput(g.id as FitnessGoalType)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      primaryGoalInput === g.id
                        ? "bg-indigo-500/20 border-indigo-500/50 text-white ring-1 ring-indigo-500/30"
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{g.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-indigo-300">
                        {g.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Preference */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Dietary Pattern</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "non_vegetarian", label: "Non-Veg" },
                  { id: "vegetarian", label: "Vegetarian" },
                  { id: "eggetarian", label: "Eggetarian" },
                  { id: "vegan", label: "Vegan" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDietaryPreferenceInput(d.id as DietaryPreference)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      dietaryPreferenceInput === d.id
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes / Restrictions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Dietary Restrictions / Allergens
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lactose intolerant, peanut allergy, gluten-free"
                  value={dietaryRestrictionsInput}
                  onChange={(e) => setDietaryRestrictionsInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Food Preferences / Cuisine Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., North Indian, high curd/paneer, dal-roti staple"
                  value={foodPreferencesNotesInput}
                  onChange={(e) => setFoodPreferencesNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Optional Target Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Optional Milestone Target Date</span>
                <span className="text-[11px] text-slate-400">Biological timelines are non-linear</span>
              </label>
              <input
                type="date"
                value={targetDateInput}
                onChange={(e) => setTargetDateInput(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <p className="text-[11px] text-slate-400">
                Note: SabFitness never guarantees fixed weight changes by exact calendar dates due to natural metabolic adaptation and body fluid shifts.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Calibrated Target Outputs & Roadmap (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Daily Energy & Target Calories Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0c1024]/60 backdrop-blur-2xl p-6 md:p-7 shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Daily Calorie Target</h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  liveCalculation.adjustmentType === "deficit"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : liveCalculation.adjustmentType === "surplus"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }`}
              >
                {liveCalculation.adjustmentType === "deficit"
                  ? `${Math.abs(liveCalculation.calorieAdjustment)} kcal Deficit`
                  : liveCalculation.adjustmentType === "surplus"
                  ? `+${liveCalculation.calorieAdjustment} kcal Surplus`
                  : "Maintenance"}
              </span>
            </div>

            {/* Big Calories Number */}
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/10 relative">
              <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200">
                {liveCalculation.targetCalories.toLocaleString()}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">
                kcal / day
              </div>

              {/* BMR vs TDEE Comparison */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Basal Metabolic (BMR)</span>
                  <span className="font-bold text-slate-200">{liveCalculation.bmr} kcal</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Est. Maintenance (TDEE)</span>
                  <span className="font-bold text-slate-200">{liveCalculation.tdee} kcal</span>
                </div>
              </div>
            </div>

            {/* Internally Consistent Macros */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Macronutrient Breakdown</span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {(liveCalculation.proteinGrams * 4) + (liveCalculation.carbsGrams * 4) + (liveCalculation.fatGrams * 9)} = {liveCalculation.targetCalories} kcal (100% Reconciled)
                </span>
              </div>

              {/* Progress split bar */}
              <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.round(((liveCalculation.proteinGrams * 4) / liveCalculation.targetCalories) * 100)}%`,
                  }}
                  className="bg-indigo-500"
                  title="Protein"
                />
                <div
                  style={{
                    width: `${Math.round(((liveCalculation.carbsGrams * 4) / liveCalculation.targetCalories) * 100)}%`,
                  }}
                  className="bg-purple-500"
                  title="Carbohydrates"
                />
                <div
                  style={{
                    width: `${Math.round(((liveCalculation.fatGrams * 9) / liveCalculation.targetCalories) * 100)}%`,
                  }}
                  className="bg-amber-500"
                  title="Healthy Fats"
                />
              </div>

              {/* Macro Cards Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Protein */}
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <div className="text-[11px] text-indigo-300 font-medium">Protein</div>
                  <div className="text-xl font-bold text-white mt-0.5">{liveCalculation.proteinGrams}g</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    ~{liveCalculation.proteinPerKg}g/kg
                  </div>
                </div>

                {/* Carbs */}
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <div className="text-[11px] text-purple-300 font-medium">Carbs</div>
                  <div className="text-xl font-bold text-white mt-0.5">{liveCalculation.carbsGrams}g</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {Math.round(((liveCalculation.carbsGrams * 4) / liveCalculation.targetCalories) * 100)}% energy
                  </div>
                </div>

                {/* Fats */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-[11px] text-amber-300 font-medium">Healthy Fats</div>
                  <div className="text-xl font-bold text-white mt-0.5">{liveCalculation.fatGrams}g</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {liveCalculation.fatPercentOfCalories}% energy
                  </div>
                </div>
              </div>

              {/* Additional Vital Markers: Fiber & Hydration */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Dietary Fiber</span>
                  <span className="font-bold text-slate-200">~{liveCalculation.fiberGrams}g / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    Hydration
                  </span>
                  <span className="font-bold text-cyan-300">{(liveCalculation.waterGoalMl / 1000).toFixed(1)} L / day</span>
                </div>
              </div>
            </div>

            {/* Quick Commit Button */}
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Review & Save These Targets</span>
            </button>
          </div>

          {/* Progress Roadmap Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0c1024]/60 backdrop-blur-2xl p-6 md:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Personalized Progress Roadmap</h3>
              </div>
              <span className="text-xs text-slate-400">Review every 21d</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Goal Delta</span>
                <span className={`font-bold ${liveRoadmap.deltaKg < 0 ? "text-rose-400" : liveRoadmap.deltaKg > 0 ? "text-emerald-400" : "text-blue-400"}`}>
                  {liveRoadmap.deltaKg > 0 ? `+${liveRoadmap.deltaKg}` : liveRoadmap.deltaKg} kg
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Next Recommended Target Review</span>
                <span className="font-semibold text-slate-200">
                  {new Date(liveRoadmap.suggestedReviewDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <p className="text-xs text-slate-300/90 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
                {liveRoadmap.roadmapSummary}
              </p>

              {/* Milestone Checkpoints (Distinguished as Conservative Projections) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Phase Checkpoints</span>
                  <span className="text-[10px] text-slate-500 italic">Estimated Guidance</span>
                </div>

                <div className="space-y-2">
                  {liveRoadmap.weeklyMilestones.map((m) => (
                    <div
                      key={m.weekNumber}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200">
                          {m.milestoneTitle}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Focus: {m.focusHabit}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-indigo-300">
                          {m.targetWeightKg ? `${m.targetWeightKg} kg` : "Week " + m.weekNumber}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Aligned Workout Split Suggestion Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0c1024]/60 backdrop-blur-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Suggested Training Split</h3>
              </div>
              <span className="text-xs text-indigo-400 font-semibold">
                {workoutSuggestion.suggestedFrequencyDays}d Protocol
              </span>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm">{workoutSuggestion.recommendedSplitName}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {workoutSuggestion.trainingFocus}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
              <div><strong>Progression:</strong> {workoutSuggestion.progressionStrategy}</div>
              <div><strong>Conditioning:</strong> {workoutSuggestion.suggestedCardioProtocol}</div>
            </div>

            <Link
              href="/workouts/planner"
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <span>Configure in Weekly Planner</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recalculate & Review Preview Modal */}
      {previewOpen && previewDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0c1024]/90 backdrop-blur-2xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Review Recalibration Preview</h2>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Previous */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Current Active Targets
                </span>
                {previewDiff.previous ? (
                  <>
                    <div className="text-2xl font-black text-slate-300">
                      {previewDiff.previous.targetCalories} <span className="text-xs font-normal">kcal</span>
                    </div>
                    <div className="space-y-1 text-slate-400">
                      <div>Protein: <span className="text-white font-medium">{previewDiff.previous.proteinGrams}g</span></div>
                      <div>Carbs: <span className="text-white font-medium">{previewDiff.previous.carbsGrams}g</span></div>
                      <div>Fats: <span className="text-white font-medium">{previewDiff.previous.fatGrams}g</span></div>
                      <div>Hydration: <span className="text-white font-medium">{(previewDiff.previous.waterGoalMl / 1000).toFixed(1)}L</span></div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 italic py-4">No previously saved calculation targets.</div>
                )}
              </div>

              {/* Proposed */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300 block">
                  New Proposed Targets
                </span>
                <div className="text-2xl font-black text-white">
                  {previewDiff.proposed.targetCalories} <span className="text-xs font-normal">kcal</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>Protein: <span className="text-white font-bold">{previewDiff.proposed.proteinGrams}g</span> (~{previewDiff.proposed.proteinPerKg}g/kg)</div>
                  <div>Carbs: <span className="text-white font-bold">{previewDiff.proposed.carbsGrams}g</span></div>
                  <div>Fats: <span className="text-white font-bold">{previewDiff.proposed.fatGrams}g</span> ({previewDiff.proposed.fatPercentOfCalories}%)</div>
                  <div>Hydration: <span className="text-white font-bold">{(previewDiff.proposed.waterGoalMl / 1000).toFixed(1)}L</span></div>
                </div>
              </div>
            </div>

            {/* Explanation Bullets: What changed and why */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                What Changed and Why:
              </h4>
              <ul className="space-y-2 text-xs text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                {previewDiff.diffExplanation.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Change Reason Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Reason for Change (Audit Log Note)
              </label>
              <input
                type="text"
                placeholder="e.g., Starting 8-week cutting phase, increased workout frequency to 5 days"
                value={changeReasonInput}
                onChange={(e) => setChangeReasonInput(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyChanges()}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
              >
                Confirm & Apply New Targets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer / Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0c1024]/90 backdrop-blur-2xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Goal Recommendation History</h2>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {historyRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No past goal recalibrations on file yet. Save your current targets to create your first record!
              </div>
            ) : (
              <div className="space-y-4">
                {historyRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {rec.effectiveDate} &bull; {rec.version}
                      </span>
                      <span className="text-indigo-400 font-semibold font-mono">
                        {rec.recommendations.targetCalories} kcal
                      </span>
                    </div>
                    <div className="text-slate-400">
                      Reason: <span className="text-slate-200">{rec.reasonForChange || "Standard update"}</span>
                    </div>
                    <div className="flex gap-4 text-slate-300 pt-1 border-t border-white/5">
                      <span>P: {rec.recommendations.proteinGrams}g</span>
                      <span>C: {rec.recommendations.carbsGrams}g</span>
                      <span>F: {rec.recommendations.fatGrams}g</span>
                      <span>Weight: {rec.inputs.weightKg}kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }
    >
      <GoalsPageInner />
    </React.Suspense>
  );
}
