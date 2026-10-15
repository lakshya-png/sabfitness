"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Dumbbell,
  Scale,
  Sparkles,
  Zap,
  Heart,
  CalendarCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
} from "lucide-react";
import { FITNESS_GOALS, type FitnessGoalType, type DietaryPreference, type UnitSystem, type ActivityLevel } from "@/types/user";
import { calculatePersonalizedTargets } from "@/lib/fitness/calculations";
import { localStore } from "@/lib/storage/localState";

const GOAL_ICONS: Record<FitnessGoalType, React.ElementType> = {
  muscle_gain: Dumbbell,
  fat_loss: Scale,
  maintain_fitness: Sparkles,
  strength_improvement: Zap,
  general_fitness_stamina: Heart,
  improve_consistency: CalendarCheck,
  custom: Flame,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [primaryGoal, setPrimaryGoal] = useState<FitnessGoalType>("muscle_gain");
  const [secondaryGoals, setSecondaryGoals] = useState<FitnessGoalType[]>([]);
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<"male" | "female" | "other" | "prefer_not_to_say">("male");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [height, setHeight] = useState<number>(175); // cm or inches
  const [weight, setWeight] = useState<number>(75); // kg or lbs
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("non_vegetarian");

  const isUnder18 = age < 18;

  const toggleSecondaryGoal = (goal: FitnessGoalType) => {
    if (goal === primaryGoal) return;
    if (secondaryGoals.includes(goal)) {
      setSecondaryGoals(secondaryGoals.filter((g) => g !== goal));
    } else {
      setSecondaryGoals([...secondaryGoals, goal]);
    }
  };

  const handleFinish = () => {
    // Convert units to metric for internal storage
    const heightCm = unitSystem === "imperial" ? Math.round(height * 2.54) : height;
    const weightKg = unitSystem === "imperial" ? Math.round((weight / 2.20462) * 10) / 10 : weight;

    const targets = calculatePersonalizedTargets({
      weightKg,
      heightCm,
      age,
      gender,
      activityLevel,
      primaryGoal,
    });

    localStore.saveUser({
      age,
      gender,
      heightCm,
      weightKg,
      unitSystem,
      primaryGoal,
      secondaryGoals,
      activityLevel,
      dietaryPreference,
      dailyCalorieTarget: targets.calories,
      dailyProteinTargetGrams: targets.proteinGrams,
      dailyCarbsTargetGrams: targets.carbsGrams,
      dailyFatTargetGrams: targets.fatGrams,
      dailyWaterGoalMl: targets.waterGoalMl,
      onboardingCompleted: true,
    });

    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/30 mb-4 animate-in zoom-in-50 duration-300">
          <Flame className="w-8 h-8 fill-white/20" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Welcome to <span className="gradient-text">SabFitness</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-lg mt-2 italic">
          Your fitness journey. Your goals.
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`h-2 rounded-full transition-all duration-300 ${
              step === num
                ? "w-8 bg-gradient-to-r from-violet-600 to-indigo-600"
                : step > num
                ? "w-2 bg-violet-400"
                : "w-2 bg-slate-300 dark:bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* STEP 1: Select Goals */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              What would you like to achieve?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select one primary goal and optional secondary goals to guide your custom targets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(FITNESS_GOALS).map((goal) => {
              const Icon = GOAL_ICONS[goal.id];
              const isPrimary = primaryGoal === goal.id;
              const isSecondary = secondaryGoals.includes(goal.id);

              return (
                <div
                  key={goal.id}
                  onClick={() => {
                    setPrimaryGoal(goal.id);
                    setSecondaryGoals(secondaryGoals.filter((g) => g !== goal.id));
                  }}
                  className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                    isPrimary
                      ? "bg-violet-600/15 border-violet-500 shadow-md shadow-violet-500/10 ring-2 ring-violet-500/30"
                      : isSecondary
                      ? "bg-blue-600/10 border-blue-500/40 text-slate-800 dark:text-slate-200"
                      : "bg-white/50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:border-violet-400/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isPrimary
                            ? "bg-violet-600 text-white"
                            : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {goal.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {goal.tagline}
                        </p>
                      </div>
                    </div>
                    {isPrimary && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white">
                        Primary
                      </span>
                    )}
                    {isSecondary && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                        Secondary
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                    {goal.description}
                  </p>

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSecondaryGoal(goal.id);
                      }}
                      className="mt-3 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
                    >
                      {isSecondary ? "Remove secondary" : "+ Add as secondary goal"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="btn-primary"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Physical Profile & Age Check */}
      {step === 2 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Tell us about yourself
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Used to calculate calorie recommendations, protein targets, and safe hydration goals.
            </p>
          </div>

          {/* Under 18 Age Guard Alert */}
          {isUnder18 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-300">
              <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">Youth & Adolescent Health Guidance</p>
                <p className="mt-0.5">
                  Because you are under 18, SabFitness prioritizes healthy growth, proper nutrition, and sustainable habits. Adult aggressive calorie deficits and high-stimulant supplements are disabled for safety.
                </p>
              </div>
            </div>
          )}

          {/* Units Selection */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Preferred Units:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnitSystem("metric")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitSystem === "metric"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem("imperial")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitSystem === "imperial"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                }`}
              >
                Imperial (lbs / in)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Age
              </label>
              <input
                type="number"
                min="13"
                max="100"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Biological Gender (for BMR)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full glass-input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Height ({unitSystem === "metric" ? "cm" : "inches"})
              </label>
              <input
                type="number"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 170)}
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Weight ({unitSystem === "metric" ? "kg" : "lbs"})
              </label>
              <input
                type="number"
                min="30"
                max="300"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 70)}
                className="w-full glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Activity Level
            </label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full glass-input"
            >
              <option value="sedentary">Sedentary (desk job, minimal exercise)</option>
              <option value="light">Lightly Active (exercise 1-3 days/week)</option>
              <option value="moderate">Moderately Active (exercise 3-5 days/week)</option>
              <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
              <option value="extra_active">Extra Active (intense training & physical job)</option>
            </select>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-primary"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Dietary Preferences & Target Preview */}
      {step === 3 && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Nutrition & Equipment Preferences
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select your dietary preference and preview your recommended daily targets.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Dietary Preference
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "non_vegetarian", label: "Non-Veg" },
                { id: "vegetarian", label: "Vegetarian" },
                { id: "vegan", label: "Vegan" },
                { id: "custom", label: "Custom" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDietaryPreference(item.id as DietaryPreference)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    dietaryPreference === item.id
                      ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20"
                      : "bg-white/40 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Target Preview */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-blue-600/10 border border-violet-500/30">
            <h3 className="text-xs uppercase tracking-wider font-bold text-violet-700 dark:text-violet-300 mb-3">
              Your Personalized Daily Targets
            </h3>
            {(() => {
              const heightCm = unitSystem === "imperial" ? Math.round(height * 2.54) : height;
              const weightKg = unitSystem === "imperial" ? Math.round((weight / 2.20462) * 10) / 10 : weight;
              const targets = calculatePersonalizedTargets({
                weightKg,
                heightCm,
                age,
                gender,
                activityLevel,
                primaryGoal,
              });

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 text-center">
                    <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400">
                      {targets.calories}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Calories / day
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 text-center">
                    <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      {targets.proteinGrams}g
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Protein
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 text-center">
                    <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                      {targets.carbsGrams}g
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Carbs
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 text-center">
                    <p className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
                      {targets.waterGoalMl}ml
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Water Goal
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleFinish}
              className="btn-primary"
            >
              <Check className="w-4 h-4" />
              <span>Enter SabFitness</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
