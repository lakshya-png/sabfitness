"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Download,
  Share2,
  Trophy,
  Flame,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  Calendar,
  Layers,
  Dumbbell,
  Droplets,
  Scale,
  Apple,
  Info,
  Check,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type {
  ProgressCardTheme,
  ProgressCardDateRange,
  ProgressCardSummaryType,
} from "@/types/progress";
import type { UserProfile } from "@/types/user";
import type { WorkoutSession } from "@/types/fitness";
import type { LoggedFoodItem } from "@/types/nutrition";
import type { WaterEntry } from "@/types/water";
import type { BodyMeasurement } from "@/types/progress";

const THEMES: { id: ProgressCardTheme; name: string; bgClass: string; accentColor: string }[] = [
  {
    id: "alpine_sunset",
    name: "Alpine Sunset",
    bgClass: "from-[#1a0f35] via-[#4c1d95] to-[#f43f5e]",
    accentColor: "#f472b6",
  },
  {
    id: "glass_midnight",
    name: "Midnight Liquid Glass",
    bgClass: "from-[#080c1d] via-[#101838] to-[#1e1b4b]",
    accentColor: "#818cf8",
  },
  {
    id: "violet_aura",
    name: "Violet Aura",
    bgClass: "from-[#2e1065] via-[#581c87] to-[#3b0764]",
    accentColor: "#c084fc",
  },
  {
    id: "emerald_surge",
    name: "Emerald Surge",
    bgClass: "from-[#022c22] via-[#064e3b] to-[#042f2e]",
    accentColor: "#34d399",
  },
  {
    id: "sunset_gold",
    name: "Sunset Gold",
    bgClass: "from-[#451a03] via-[#7c2d12] to-[#831843]",
    accentColor: "#fbbf24",
  },
];

export default function ProgressCardsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [foodLogs, setFoodLogs] = useState<LoggedFoodItem[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterEntry[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  // Range and Card Configuration
  const [rangeType, setRangeType] = useState<ProgressCardDateRange>("14d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [summaryType, setSummaryType] = useState<ProgressCardSummaryType>("basic");
  const [theme, setTheme] = useState<ProgressCardTheme>("alpine_sunset");
  const [customTitle, setCustomTitle] = useState("My Fitness Journey Milestone");
  const [optionalNotes, setOptionalNotes] = useState("");
  
  // Sensitive Data Protection
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [todayDateStr, setTodayDateStr] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(localStore.getUser());
    setWorkouts(localStore.getWorkouts());
    setFoodLogs(localStore.getFoodLogs());
    setWaterLogs(localStore.getWaterLogs());
    setMeasurements(localStore.getMeasurements());
    setTodayDateStr(new Date().toLocaleDateString());

    // Initialize default range: last 14 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRangePresetChange = (preset: ProgressCardDateRange) => {
    setRangeType(preset);
    const end = new Date();
    const start = new Date();
    let days = 14;
    if (preset === "7d") days = 7;
    else if (preset === "10d") days = 10;
    else if (preset === "14d") days = 14;
    else if (preset === "30d") days = 30;

    if (preset !== "custom") {
      start.setDate(end.getDate() - (days - 1));
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  // Filter genuine data in selected range [startDate, endDate]
  const dateRangeDaysCount = Math.max(
    1,
    Math.round(
      (new Date(endDate || "2026-10-15").getTime() - new Date(startDate || "2026-10-01").getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  // 1. Workouts in range
  const workoutsInRange = workouts.filter((w) => {
    const d = w.startTime.split("T")[0];
    return d >= startDate && d <= endDate;
  });
  const uniqueWorkoutDays = new Set(workoutsInRange.map((w) => w.startTime.split("T")[0])).size;
  const consistencyPercentage = Math.min(100, Math.round((uniqueWorkoutDays / dateRangeDaysCount) * 100));

  // 2. Nutrition in range (Distinguishing logged days vs missing days!)
  const foodsInRange = foodLogs.filter((f) => {
    const d = f.loggedAt.split("T")[0];
    return d >= startDate && d <= endDate;
  });
  const foodDayGroups: Record<string, { calories: number; protein: number }> = {};
  foodsInRange.forEach((f) => {
    const d = f.loggedAt.split("T")[0];
    if (!foodDayGroups[d]) foodDayGroups[d] = { calories: 0, protein: 0 };
    foodDayGroups[d].calories += f.calories || 0;
    foodDayGroups[d].protein += f.proteinGrams || 0;
  });
  const loggedNutritionDays = Object.keys(foodDayGroups).length;
  const totalCaloriesInRange = Object.values(foodDayGroups).reduce((acc, curr) => acc + curr.calories, 0);
  const totalProteinInRange = Object.values(foodDayGroups).reduce((acc, curr) => acc + curr.protein, 0);

  const avgCalories = loggedNutritionDays > 0 ? Math.round(totalCaloriesInRange / loggedNutritionDays) : null;
  const avgProtein = loggedNutritionDays > 0 ? Math.round((totalProteinInRange / loggedNutritionDays) * 10) / 10 : null;

  // 3. Water in range (Distinguishing logged days vs missing days!)
  const waterInRange = waterLogs.filter((w) => w.date >= startDate && w.date <= endDate);
  const waterDayGroups: Record<string, number> = {};
  waterInRange.forEach((w) => {
    waterDayGroups[w.date] = (waterDayGroups[w.date] || 0) + (w.amountMl || 0);
  });
  const loggedWaterDays = Object.keys(waterDayGroups).length;
  const totalWaterMlInRange = Object.values(waterDayGroups).reduce((acc, curr) => acc + curr, 0);
  const avgWaterLiters = loggedWaterDays > 0 ? (totalWaterMlInRange / loggedWaterDays / 1000).toFixed(1) : null;

  // 4. Weight & Body Measurements in range
  const measurementsInRange = measurements.filter((m) => m.date >= startDate && m.date <= endDate);
  const startWeight = measurementsInRange.length > 0 ? measurementsInRange[0].weightKg : user?.weightKg;
  const endWeight = measurementsInRange.length > 0 ? measurementsInRange[measurementsInRange.length - 1].weightKg : user?.weightKg;
  const weightDelta = startWeight && endWeight ? Math.round((endWeight - startWeight) * 10) / 10 : null;

  // Toggle sensitive metrics with strict confirmation
  const handleToggleSensitive = () => {
    if (!showSensitiveData && !sensitiveConfirmed) {
      if (confirm("Display sensitive metrics (weight and body measurements) on this shareable card?")) {
        setSensitiveConfirmed(true);
        setShowSensitiveData(true);
      }
    } else {
      setShowSensitiveData(!showSensitiveData);
    }
  };

  // High-Resolution Canvas PNG Export
  const handleExportPNG = () => {
    setIsExporting(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    if (theme === "alpine_sunset") {
      grad.addColorStop(0, "#1a0f35");
      grad.addColorStop(0.5, "#4c1d95");
      grad.addColorStop(1, "#f43f5e");
    } else if (theme === "violet_aura") {
      grad.addColorStop(0, "#2e1065");
      grad.addColorStop(0.6, "#581c87");
      grad.addColorStop(1, "#3b0764");
    } else if (theme === "emerald_surge") {
      grad.addColorStop(0, "#022c22");
      grad.addColorStop(0.6, "#064e3b");
      grad.addColorStop(1, "#042f2e");
    } else if (theme === "sunset_gold") {
      grad.addColorStop(0, "#451a03");
      grad.addColorStop(0.6, "#7c2d12");
      grad.addColorStop(1, "#831843");
    } else {
      grad.addColorStop(0, "#080c1d");
      grad.addColorStop(0.5, "#101838");
      grad.addColorStop(1, "#1e1b4b");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Inner Translucent Frosted Glass Card
    ctx.fillStyle = "rgba(18, 22, 45, 0.7)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(80, 100, 920, 1150, 40);
    ctx.fill();
    ctx.stroke();

    // Brand Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("SabFitness", 140, 200);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "24px sans-serif";
    ctx.fillText("Your fitness journey. Your goals.", 140, 240);

    // Title & Date Range
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText(customTitle || "Progress Summary", 140, 340);

    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`${startDate}  to  ${endDate}  (${dateRangeDaysCount} Days)`, 140, 390);

    // Metric 1: Workouts & Consistency
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(`Workouts Completed: ${workoutsInRange.length} Sessions`, 140, 500);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "26px sans-serif";
    ctx.fillText(`Consistency: ${consistencyPercentage}% (${uniqueWorkoutDays} active days)`, 140, 545);

    // Metric 2: Nutrition
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    const calText = avgCalories !== null ? `Average Calories: ${avgCalories} kcal / day` : "Average Calories: Not logged";
    ctx.fillText(calText, 140, 640);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "26px sans-serif";
    const proText = avgProtein !== null ? `Average Protein: ${avgProtein} g / day  •  (${loggedNutritionDays} of ${dateRangeDaysCount} days logged)` : `(${loggedNutritionDays} of ${dateRangeDaysCount} days logged)`;
    ctx.fillText(proText, 140, 685);

    // Metric 3: Water
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    const waterText = avgWaterLiters !== null ? `Hydration: ${avgWaterLiters} L / day` : "Hydration: Not logged";
    ctx.fillText(waterText, 140, 780);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "26px sans-serif";
    ctx.fillText(`(${loggedWaterDays} of ${dateRangeDaysCount} days logged)`, 140, 825);

    // Sensitive Metrics (if enabled)
    if (showSensitiveData && startWeight) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px sans-serif";
      const wText = weightDelta !== null ? `Weight Delta: ${weightDelta > 0 ? "+" : ""}${weightDelta} kg (${startWeight}kg → ${endWeight}kg)` : `Current Weight: ${startWeight} kg`;
      ctx.fillText(wText, 140, 920);
    }

    // Notes
    if (optionalNotes.trim()) {
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "italic 28px sans-serif";
      ctx.fillText(`"${optionalNotes.trim()}"`, 140, 1030);
    }

    // Footer Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "22px sans-serif";
    ctx.fillText("Generated with SabFitness • Real records only", 140, 1180);

    // Download PNG
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `SabFitness_Progress_Card_${startDate}_${endDate}.png`;
    link.href = dataUrl;
    link.click();

    setIsExporting(false);
    showToast("Progress card exported as high-res PNG!");
  };

  const handleShare = async () => {
    const shareText = `SabFitness Progress Summary (${startDate} to ${endDate}):\n• Workouts: ${workoutsInRange.length} sessions (${consistencyPercentage}% consistency)\n• Avg Calories: ${avgCalories ? `${avgCalories} kcal` : "N/A"}\n• Avg Water: ${avgWaterLiters ? `${avgWaterLiters} L` : "N/A"}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: customTitle,
          text: shareText,
          url: window.location.origin,
        });
        showToast("Shared successfully!");
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast("Summary copied to clipboard!");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 glass-card !bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/progress"
            className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Progress Analytics</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Custom Fitness Progress Cards
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Generate verified, beautiful cards from actual records across customizable date ranges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-xl transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4 text-purple-400" />
            <span>Share</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="btn-primary !text-xs !py-2.5 !px-5 shadow-lg shadow-indigo-500/25"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating..." : "Export Image (PNG)"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Controls & Customizer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Date Range Selector */}
          <div className="glass-panel p-5 space-y-3 bg-white/10 border border-white/15">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Select Date Window</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "7d", label: "Last 7 Days" },
                { id: "10d", label: "10 Days" },
                { id: "14d", label: "14 Days" },
                { id: "30d", label: "30 Days" },
                { id: "custom", label: "Custom" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleRangePresetChange(p.id as ProgressCardDateRange)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    rangeType === p.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {rangeType === "custom" && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-300">
              Analyzing <span className="font-bold text-white">{dateRangeDaysCount} days</span> from actual logged records.
            </div>
          </div>

          {/* 2. Theme & Design Customizer */}
          <div className="glass-panel p-5 space-y-3 bg-white/10 border border-white/15">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Card Theme &amp; Style</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2 ${
                    theme === t.id
                      ? "bg-white/15 border-purple-400/60 shadow-md"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                    style={{ backgroundColor: t.accentColor }}
                  />
                  <span className="text-xs font-bold text-white truncate">{t.name}</span>
                </button>
              ))}
            </div>

            {/* Summary Format */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Summary Level
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSummaryType("basic")}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    summaryType === "basic"
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 border border-white/10 text-slate-300"
                  }`}
                >
                  Basic Overview
                </button>
                <button
                  onClick={() => setSummaryType("detailed")}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    summaryType === "detailed"
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 border border-white/10 text-slate-300"
                  }`}
                >
                  Detailed Body Metrics
                </button>
              </div>
            </div>

            {/* Card Title & Notes */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Card Headline
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Personal Note / Reflection (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14 days of relentless discipline!"
                  value={optionalNotes}
                  onChange={(e) => setOptionalNotes(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Sensitive Data Privacy Toggle */}
          <div className="glass-panel p-5 space-y-3 bg-white/10 border border-white/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Private Weight &amp; Body Data</span>
              </div>
              <button
                onClick={handleToggleSensitive}
                className={`p-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  showSensitiveData
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                {showSensitiveData ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Included</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Protected</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sensitive information such as body weight and measurements is masked by default and only shown with your explicit consent.
            </p>
          </div>
        </div>

        {/* Right Live Preview Card (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            ref={cardRef}
            className={`w-full max-w-md rounded-3xl p-7 shadow-2xl relative overflow-hidden border border-white/20 transition-all bg-gradient-to-br ${
              THEMES.find((t) => t.id === theme)?.bgClass || "from-[#1a0f35] via-[#4c1d95] to-[#f43f5e]"
            }`}
          >
            {/* Ambient Specular Highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 to-pink-500 p-0.5 shadow-md flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white leading-none">SabFitness</h3>
                    <p className="text-[10px] text-slate-300 mt-0.5">Your fitness journey. Your goals.</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20 backdrop-blur-md">
                  Verified Summary
                </span>
              </div>

              {/* Title & Window */}
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {customTitle || "Fitness Progress"}
                </h2>
                <p className="text-xs font-semibold text-purple-200 mt-1 flex items-center gap-1.5">
                  <span>{startDate}</span>
                  <span>→</span>
                  <span>{endDate}</span>
                  <span>• ({dateRangeDaysCount} Days)</span>
                </p>
              </div>

              {/* Aggregated Real Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Workouts */}
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-semibold">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
                    <span>Workouts</span>
                  </div>
                  <p className="text-xl font-black text-white">{workoutsInRange.length} Sessions</p>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    {consistencyPercentage}% Consistency ({uniqueWorkoutDays} active days)
                  </p>
                </div>

                {/* Hydration */}
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-semibold">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Daily Water</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {avgWaterLiters ? `${avgWaterLiters} L` : "Not logged"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {loggedWaterDays > 0 ? `Avg over ${loggedWaterDays} logged days` : "No entries"}
                  </p>
                </div>

                {/* Nutrition Calories */}
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-semibold">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>Daily Calories</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {avgCalories ? `${avgCalories} kcal` : "Not logged"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {loggedNutritionDays > 0 ? `Avg over ${loggedNutritionDays} logged days` : "No entries"}
                  </p>
                </div>

                {/* Nutrition Protein */}
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/15 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-semibold">
                    <Apple className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daily Protein</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {avgProtein ? `${avgProtein} g` : "Not logged"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {loggedNutritionDays > 0 ? `Avg over ${loggedNutritionDays} logged days` : "No entries"}
                  </p>
                </div>
              </div>

              {/* Sensitive Metrics Box (Weight & Measurements) */}
              {showSensitiveData && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      Weight Trend
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {weightDelta !== null ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : "Stable"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {startWeight ? `Start: ${startWeight} kg  •  Current: ${endWeight || startWeight} kg` : "No weight entries"}
                  </p>
                </div>
              )}

              {/* Personal Notes */}
              {optionalNotes.trim() && (
                <div className="p-3 rounded-2xl bg-white/10 border border-white/10 text-xs italic text-slate-200">
                  &ldquo;{optionalNotes.trim()}&rdquo;
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span>Verified genuine records • SabFitness</span>
                <span>{todayDateStr || "Verified Record"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
