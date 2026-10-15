"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Search,
  Flame,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Copy,
  X,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChefHat,
  Globe,
  Bookmark,
  Edit,
  Layers,
  Filter,
  Clock,
  Scale,
  ListPlus,
  Target,
  ShieldAlert,
  Wand2,
  Send,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { localStore } from "@/lib/storage/localState";
import { DEFAULT_FOODS } from "@/lib/nutrition/defaultFoods";
import {
  searchIndianFoods,
  getPopularIndianFoods,
  getIndianFoodCategories,
  getIndianCuisineRegions,
  calculateMacrosForQuantity,
  getWeightInGrams,
  getAvailableUnitsForFood,
  COMMON_INDIAN_UNITS,
} from "@/lib/nutrition/indianFoods";
import {
  calculateRecipeTotals,
  calculatePerServingMacros,
  calculateCookedYieldMacros,
  createRecipeIngredient,
  updateRecipeIngredient,
  scaleRecipeForDiary,
  COMMON_COOKING_FATS,
} from "@/lib/nutrition/recipeCalculator";
import {
  groundRecipeDraft,
  heuristicRecipePlanner,
  convertDraftToRecipeDefinition,
  convertDraftToLoggedItem,
} from "@/lib/nutrition/aiRecipeEngine";
import type {
  MealType,
  LoggedFoodItem,
  FoodItemDefinition,
  RecipeDefinition,
  RecipeIngredient,
  SavedMealTemplate,
  FoodCategory,
  IndianRegion,
  ServingUnitOption,
  AIRecipeDraft,
  AIRecipeDraftIngredient,
  AIRecipeClarifyingQuestion,
  AIRecipeResponse,
  AIRecipeRequest,
} from "@/types/nutrition";
import type { UserProfile } from "@/types/user";


const MEAL_SECTIONS: { id: MealType; title: string; subtitle: string }[] = [
  { id: "breakfast", title: "Breakfast", subtitle: "Morning fuel & metabolism" },
  { id: "lunch", title: "Lunch", subtitle: "Midday nourishment & energy" },
  { id: "dinner", title: "Dinner", subtitle: "Evening recovery & satiety" },
  { id: "snack", title: "Snacks", subtitle: "Healthy bites & pre/post workout" },
];

export default function NutritionPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [foodLogs, setFoodLogs] = useState<LoggedFoodItem[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItemDefinition[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeDefinition[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedMealTemplate[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active meal for the "Add Food" modal
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);

  // Add Food Modal Tabs & Filter States
  const [addFoodTab, setAddFoodTab] = useState<
    "indian" | "online" | "recipes" | "custom" | "templates"
  >("indian");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "all">("all");
  const [selectedRegion, setSelectedRegion] = useState<IndianRegion | "all">("all");
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isHighProteinOnly, setIsHighProteinOnly] = useState(false);

  // Online Search States
  const [onlineQuery, setOnlineQuery] = useState("");
  const [onlineResults, setOnlineResults] = useState<FoodItemDefinition[]>([]);
  const [isOnlineLoading, setIsOnlineLoading] = useState(false);
  const [onlineSearchError, setOnlineSearchError] = useState<string | null>(null);

  // Quantity & Unit Calculator State (when a food is clicked to log)
  const [configuringFood, setConfiguringFood] = useState<FoodItemDefinition | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("g");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Recipe Builder Modal States
  const [isRecipeBuilderOpen, setIsRecipeBuilderOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeServings, setRecipeServings] = useState<number>(2);
  const [recipeCookedWeight, setRecipeCookedWeight] = useState<number | "">("");
  const [recipeViewMode, setRecipeViewMode] = useState<"per_serving" | "totals" | "per_100g">("per_serving");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipePrepTime, setRecipePrepTime] = useState(15);
  const [recipeCookTime, setRecipeCookTime] = useState(25);

  // Recipe Builder: Direct Diary Log Sub-State
  const [isBuilderLogOpen, setIsBuilderLogOpen] = useState(false);
  const [builderLogMeal, setBuilderLogMeal] = useState<MealType>("breakfast");
  const [builderLogPortionType, setBuilderLogPortionType] = useState<"servings" | "cooked_grams">("servings");
  const [builderLogServings, setBuilderLogServings] = useState<number>(1);
  const [builderLogCookedGrams, setBuilderLogCookedGrams] = useState<number>(150);

  // Recipe Builder: Add Ingredient Sub-State
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [ingSearchQuery, setIngSearchQuery] = useState("");
  const [selectedIngFood, setSelectedIngFood] = useState<FoodItemDefinition | null>(null);
  const [selectedIngUnit, setSelectedIngUnit] = useState<string>("g");
  const [selectedIngQuantity, setSelectedIngQuantity] = useState<number>(100);

  // Saved Recipes Drawer Modal
  const [isSavedRecipesOpen, setIsSavedRecipesOpen] = useState(false);
  const [loggingRecipe, setLoggingRecipe] = useState<RecipeDefinition | null>(null);
  const [logRecipeMeal, setLogRecipeMeal] = useState<MealType>("lunch");
  const [logRecipeServings, setLogRecipeServings] = useState<number>(1);

  // Saved Templates Modal
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [templateToSaveFromMeal, setTemplateToSaveFromMeal] = useState<MealType | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");

  // Create Custom Food Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [newCustomFood, setNewCustomFood] = useState({
    name: "",
    regionalName: "",
    category: "sabzi_curry" as FoodCategory,
    cuisineRegion: "Pan-Indian" as IndianRegion,
    servingSize: 100,
    servingUnit: "g",
    servingWeightGrams: 100,
    calories: 150,
    proteinGrams: 10,
    carbsGrams: 15,
    fatGrams: 5,
    fiberGrams: 3,
  });

  // AI Recipe Creation Assistant States
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<AIRecipeDraft | null>(null);
  const [aiClarifyingQuestions, setAiClarifyingQuestions] = useState<AIRecipeClarifyingQuestion[]>([]);
  const [aiAnsweredQuestions, setAiAnsweredQuestions] = useState<Record<string, string>>({});
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiIterativePrompt, setAiIterativePrompt] = useState("");
  const [aiProviderName, setAiProviderName] = useState<string>("SabFitness AI");
  const [isAiDirectLogOpen, setIsAiDirectLogOpen] = useState(false);
  const [aiDirectLogMeal, setAiDirectLogMeal] = useState<MealType>("breakfast");

  // Client-safe initial state hydration
  useEffect(() => {

    setUser(localStore.getUser());
    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(todayStr);
    setFoodLogs(localStore.getFoodLogs(todayStr));
    setCustomFoods(localStore.getCustomFoods());
    setSavedRecipes(localStore.getRecipes());
    setSavedTemplates(localStore.getMealTemplates());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleDateChange = (newDateStr: string) => {
    setSelectedDate(newDateStr);
    setFoodLogs(localStore.getFoodLogs(newDateStr));
  };

  const navigateDay = (offsetDays: number) => {
    const cur = new Date(selectedDate || new Date().toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + offsetDays);
    const dateStr = cur.toISOString().split("T")[0];
    handleDateChange(dateStr);
  };

  const getYesterdayDateStr = () => {
    const d = new Date(selectedDate || new Date().toISOString().split("T")[0]);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  // Copy all meals from yesterday into selectedDate as independent records
  const handleCopyYesterday = () => {
    const yesterdayStr = getYesterdayDateStr();
    const cloned = localStore.copyDayFoodLogs(yesterdayStr, selectedDate);
    if (cloned.length === 0) {
      showToast(`No food records found for ${yesterdayStr} to copy.`);
      return;
    }
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    showToast(`Copied ${cloned.length} item(s) from yesterday as independent records!`);
  };

  // Repeat a specific meal category from yesterday into selectedDate
  const handleRepeatMeal = (mealType: MealType) => {
    const yesterdayStr = getYesterdayDateStr();
    const cloned = localStore.copyDayFoodLogs(yesterdayStr, selectedDate, mealType);
    if (cloned.length === 0) {
      showToast(`No ${mealType} entries found on ${yesterdayStr}.`);
      return;
    }
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    showToast(`Repeated ${mealType} (${cloned.length} item(s)) into today!`);
  };

  // Dynamic Quantity adjustment (+ / -) in diary with automatic macro recalculation
  const handleAdjustQuantity = (item: LoggedFoodItem, deltaDirection: number) => {
    const currentAmount = item.servingAmount || 100;
    const step = currentAmount >= 50 ? 25 : 10;
    const newAmount = Math.max(10, Math.round(currentAmount + (deltaDirection > 0 ? step : -step)));
    const ratio = newAmount / currentAmount;

    const newCalories = Math.max(1, Math.round(item.calories * ratio));
    const newProtein = Math.round(item.proteinGrams * ratio * 10) / 10;
    const newCarbs = Math.round(item.carbsGrams * ratio * 10) / 10;
    const newFat = Math.round(item.fatGrams * ratio * 10) / 10;
    const newFiber = item.fiberGrams ? Math.round(item.fiberGrams * ratio * 10) / 10 : 0;

    localStore.updateFoodLog(item.id, {
      servingAmount: newAmount,
      calories: newCalories,
      proteinGrams: newProtein,
      carbsGrams: newCarbs,
      fatGrams: newFat,
      fiberGrams: newFiber,
    });

    setFoodLogs(localStore.getFoodLogs(selectedDate));
  };

  const handleDeleteEntry = (id: string) => {
    localStore.deleteFoodLog(id);
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    showToast("Food item removed.");
  };

  // --- Indian Library Search ---
  const indianFoodsFiltered = useMemo(() => {
    return searchIndianFoods(searchQuery, {
      category: selectedCategory,
      region: selectedRegion,
      isVeg: isVegOnly,
      highProtein: isHighProteinOnly,
      limit: 60,
    });
  }, [searchQuery, selectedCategory, selectedRegion, isVegOnly, isHighProteinOnly]);

  const popularIndianStaples = useMemo(() => {
    return getPopularIndianFoods(16);
  }, []);

  // --- Online Search via Open Food Facts API with Debounce ---
  useEffect(() => {
    if (!onlineQuery || onlineQuery.trim().length < 2) {
      setOnlineResults([]);
      setIsOnlineLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsOnlineLoading(true);
      setOnlineSearchError(null);
      try {
        const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(onlineQuery.trim())}`);
        if (!res.ok) throw new Error("Search request failed");
        const json = await res.json();
        setOnlineResults(Array.isArray(json.results) ? json.results : []);
        if (json.error) setOnlineSearchError(json.error);
      } catch (err: any) {
        setOnlineSearchError("Could not connect to online search. Showing offline results.");
        setOnlineResults([]);
      } finally {
        setIsOnlineLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [onlineQuery]);

  // Available Serving Units for the currently configuring food
  const availableUnitsForFood: ServingUnitOption[] = useMemo(() => {
    if (!configuringFood) return COMMON_INDIAN_UNITS.slice(0, 5);

    const units: ServingUnitOption[] = [];

    // Food's explicitly allowed units
    if (configuringFood.allowedUnits && configuringFood.allowedUnits.length > 0) {
      units.push(...configuringFood.allowedUnits);
    }

    // Always include grams
    if (!units.some((u) => u.unit === "g")) {
      units.push({ unit: "g", label: "Grams (g)", factorToGrams: 1 });
    }

    // Include primary serving unit if distinct
    if (
      configuringFood.servingUnit &&
      !units.some((u) => u.unit.toLowerCase() === configuringFood.servingUnit.toLowerCase())
    ) {
      units.push({
        unit: configuringFood.servingUnit,
        label: `${configuringFood.servingUnit} (${configuringFood.servingWeightGrams || 100}g)`,
        factorToGrams: configuringFood.servingWeightGrams || 100,
      });
    }

    // Smart contextual Indian units
    const cat = configuringFood.category;
    if (cat === "dals_lentils_curries" || cat === "sabzi_curry" || cat === "rice_khichdi_biryani") {
      if (!units.some((u) => u.unit === "katori")) {
        units.push({ unit: "katori", label: "1 Katori / Small Bowl (150g)", factorToGrams: 150 });
      }
      if (!units.some((u) => u.unit === "medium_bowl")) {
        units.push({ unit: "medium_bowl", label: "Medium Bowl (250g)", factorToGrams: 250 });
      }
    } else if (cat === "breads_rotis") {
      if (!units.some((u) => u.unit === "roti")) {
        units.push({ unit: "roti", label: "1 Roti / Chapati (35g)", factorToGrams: 35 });
      }
    } else if (cat === "cooking_fats_spices") {
      if (!units.some((u) => u.unit === "tbsp")) {
        units.push({ unit: "tbsp", label: "1 Tablespoon (15g)", factorToGrams: 15 });
      }
      if (!units.some((u) => u.unit === "tsp")) {
        units.push({ unit: "tsp", label: "1 Teaspoon (5g)", factorToGrams: 5 });
      }
    } else if (cat === "dairy_paneer" || cat === "beverages") {
      if (!units.some((u) => u.unit === "glass")) {
        units.push({ unit: "glass", label: "1 Glass (250ml)", factorToGrams: 250 });
      }
      if (!units.some((u) => u.unit === "cup")) {
        units.push({ unit: "cup", label: "1 Cup (200ml)", factorToGrams: 200 });
      }
    }

    return units;
  }, [configuringFood]);

  // Live calculated macros for current food portion
  const livePortionMacros = useMemo(() => {
    if (!configuringFood) {
      return { weightGrams: 0, calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, fiberGrams: 0 };
    }
    return calculateMacrosForQuantity(configuringFood, selectedQuantity, selectedUnit);
  }, [configuringFood, selectedQuantity, selectedUnit]);

  // Handle opening food portion config
  const handleSelectFoodToConfigure = (food: FoodItemDefinition) => {
    setConfiguringFood(food);
    const initialUnit = food.allowedUnits?.[1]?.unit || food.servingUnit || "g";
    setSelectedUnit(initialUnit);
    setSelectedQuantity(initialUnit === "g" ? food.servingSize || 100 : 1);
  };

  // Log confirmed food into diary
  const handleConfirmLogFood = () => {
    if (!configuringFood || !selectedMeal) return;

    const loggedItem: LoggedFoodItem = {
      id: `flog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      foodId: configuringFood.id,
      foodName: configuringFood.name,
      brand: configuringFood.brand,
      mealType: selectedMeal,
      servingAmount: selectedQuantity,
      servingUnit: selectedUnit,
      servingWeightGrams: livePortionMacros.weightGrams,
      calories: livePortionMacros.calories,
      proteinGrams: livePortionMacros.proteinGrams,
      carbsGrams: livePortionMacros.carbsGrams,
      fatGrams: livePortionMacros.fatGrams,
      fiberGrams: livePortionMacros.fiberGrams,
      source: configuringFood.source || "verified_ifct",
      loggedAt: `${selectedDate}T${new Date().toISOString().split("T")[1] || "12:00:00.000Z"}`,
    };

    localStore.addFoodLog(loggedItem);
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    setConfiguringFood(null);
    setSelectedMeal(null);
    showToast(`Logged ${configuringFood.name} to ${selectedMeal}!`);
  };

  // --- Recipe Builder Actions ---
  const handleOpenRecipeBuilder = (existingRecipe?: RecipeDefinition) => {
    if (existingRecipe) {
      setEditingRecipeId(existingRecipe.id);
      setRecipeName(existingRecipe.name);
      setRecipeDescription(existingRecipe.description || "");
      setRecipeServings(existingRecipe.servings || 2);
      setRecipeCookedWeight(existingRecipe.cookedWeightGrams || "");
      setRecipeIngredients(existingRecipe.ingredients || []);
      setRecipePrepTime(existingRecipe.prepTimeMinutes || 15);
      setRecipeCookTime(existingRecipe.cookTimeMinutes || 25);
      setRecipeViewMode("per_serving");
    } else {
      setEditingRecipeId(null);
      setRecipeName("");
      setRecipeDescription("");
      setRecipeServings(2);
      setRecipeCookedWeight("");
      setRecipeIngredients([]);
      setRecipePrepTime(15);
      setRecipeCookTime(25);
      setRecipeViewMode("per_serving");
    }
    setIsBuilderLogOpen(false);
    setIsRecipeBuilderOpen(true);
  };

  const handleAddIngredientToRecipe = () => {
    if (!selectedIngFood) return;
    const newIng = createRecipeIngredient(selectedIngFood, selectedIngQuantity, selectedIngUnit);
    setRecipeIngredients([...recipeIngredients, newIng]);
    setSelectedIngFood(null);
    setIsAddingIngredient(false);
    setIngSearchQuery("");
    showToast(`Added ${selectedIngFood.name} to recipe!`);
  };

  const handleUpdateIngredientQuantity = (ingId: string, delta: number) => {
    setRecipeIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== ingId) return ing;
        const step =
          ing.unit === "g" || ing.unit === "ml"
            ? (Math.abs(delta) >= 10 ? delta : delta * 10)
            : delta;
        const newQty = Math.max(0.1, Math.round((ing.quantity + step) * 10) / 10);
        return updateRecipeIngredient(ing, newQty);
      })
    );
  };

  const handleSetIngredientQuantity = (ingId: string, quantity: number) => {
    setRecipeIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== ingId) return ing;
        return updateRecipeIngredient(ing, Math.max(0, quantity));
      })
    );
  };

  const handleSetIngredientUnit = (ingId: string, unit: string) => {
    setRecipeIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== ingId) return ing;
        return updateRecipeIngredient(ing, ing.quantity, unit);
      })
    );
  };

  const handleAddQuickCookingFat = (fat: typeof COMMON_COOKING_FATS[0], tbsp: number) => {
    const fakeFood: FoodItemDefinition = {
      id: fat.id,
      name: fat.name,
      category: "cooking_fats_spices",
      servingSize: 1,
      servingUnit: "tbsp",
      servingWeightGrams: 15,
      allowedUnits: [
        { unit: "tbsp", label: "Tablespoon (15g)", factorToGrams: 15 },
        { unit: "tsp", label: "Teaspoon (5g)", factorToGrams: 5 },
        { unit: "g", label: "Grams (g)", factorToGrams: 1 },
      ],
      calories: fat.calPerTbsp,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: fat.fatPerTbsp,
      source: "verified_ifct",
    };
    const newIng = createRecipeIngredient(fakeFood, tbsp, "tbsp");
    setRecipeIngredients([...recipeIngredients, newIng]);
    showToast(`Added ${tbsp} tbsp ${fat.name} to recipe!`);
  };

  const handleRemoveIngredient = (ingId: string) => {
    setRecipeIngredients(recipeIngredients.filter((i) => i.id !== ingId));
  };

  const recipeTotals = useMemo(() => {
    return calculateRecipeTotals(recipeIngredients);
  }, [recipeIngredients]);

  const recipePerServing = useMemo(() => {
    return calculatePerServingMacros(recipeIngredients, recipeServings);
  }, [recipeIngredients, recipeServings]);

  const recipeCookedYield = useMemo(() => {
    const cookedGrams =
      typeof recipeCookedWeight === "number" && recipeCookedWeight > 0
        ? recipeCookedWeight
        : undefined;
    return calculateCookedYieldMacros(recipeTotals, cookedGrams);
  }, [recipeTotals, recipeCookedWeight]);

  // Combined ingredient search covering Custom Foods, Default Foods and Indian Library
  const searchAllIngredients = (query: string): FoodItemDefinition[] => {
    const q = query.trim().toLowerCase();
    const matched: FoodItemDefinition[] = [];
    const seenIds = new Set<string>();

    for (const cf of customFoods) {
      if (!q || cf.name.toLowerCase().includes(q)) {
        matched.push(cf);
        seenIds.add(cf.id);
      }
    }

    for (const df of DEFAULT_FOODS) {
      if (!seenIds.has(df.id) && (!q || df.name.toLowerCase().includes(q))) {
        matched.push(df);
        seenIds.add(df.id);
      }
    }

    const indianResults = searchIndianFoods(q, { limit: 25 });
    for (const inf of indianResults) {
      if (!seenIds.has(inf.id)) {
        matched.push(inf);
        seenIds.add(inf.id);
      }
    }

    return matched.slice(0, 30);
  };

  const handleSaveRecipe = () => {
    if (!recipeName.trim()) {
      showToast("Please enter a recipe name.");
      return;
    }
    if (recipeIngredients.length === 0) {
      showToast("Please add at least one ingredient.");
      return;
    }

    const recipe: RecipeDefinition = {
      id: editingRecipeId || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: recipeName.trim(),
      description: recipeDescription.trim(),
      category: "curry",
      servings: Number(recipeServings) || 1,
      cookedWeightGrams:
        typeof recipeCookedWeight === "number" && recipeCookedWeight > 0
          ? recipeCookedWeight
          : undefined,
      rawWeightGrams: recipeTotals.totalWeightGrams,
      prepTimeMinutes: recipePrepTime,
      cookTimeMinutes: recipeCookTime,
      ingredients: recipeIngredients,
      totalCalories: recipeTotals.totalCalories,
      totalProteinGrams: recipeTotals.totalProteinGrams,
      totalCarbsGrams: recipeTotals.totalCarbsGrams,
      totalFatGrams: recipeTotals.totalFatGrams,
      totalFiberGrams: recipeTotals.totalFiberGrams,
      caloriesPerServing: recipePerServing.calories,
      proteinPerServing: recipePerServing.proteinGrams,
      carbsPerServing: recipePerServing.carbsGrams,
      fatPerServing: recipePerServing.fatGrams,
      fiberPerServing: recipePerServing.fiberGrams,
      caloriesPer100gCooked: recipeCookedYield?.caloriesPer100gCooked,
      proteinPer100gCooked: recipeCookedYield?.proteinPer100gCooked,
      carbsPer100gCooked: recipeCookedYield?.carbsPer100gCooked,
      fatPer100gCooked: recipeCookedYield?.fatPer100gCooked,
      fiberPer100gCooked: recipeCookedYield?.fiberPer100gCooked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.saveRecipe(recipe);
    setSavedRecipes(localStore.getRecipes());
    setIsRecipeBuilderOpen(false);
    showToast(`Recipe "${recipe.name}" saved!`);
  };

  // Direct log from inside the Recipe Builder modal
  const handleLogDirectFromBuilder = () => {
    if (recipeIngredients.length === 0) {
      showToast("Please add at least one ingredient before logging.");
      return;
    }

    const currentRecipe: RecipeDefinition = {
      id: editingRecipeId || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: recipeName.trim() || "Custom Meal",
      description: recipeDescription.trim(),
      category: "custom_meal",
      servings: Number(recipeServings) || 1,
      cookedWeightGrams:
        typeof recipeCookedWeight === "number" && recipeCookedWeight > 0
          ? recipeCookedWeight
          : undefined,
      rawWeightGrams: recipeTotals.totalWeightGrams,
      prepTimeMinutes: recipePrepTime,
      cookTimeMinutes: recipeCookTime,
      ingredients: recipeIngredients,
      totalCalories: recipeTotals.totalCalories,
      totalProteinGrams: recipeTotals.totalProteinGrams,
      totalCarbsGrams: recipeTotals.totalCarbsGrams,
      totalFatGrams: recipeTotals.totalFatGrams,
      totalFiberGrams: recipeTotals.totalFiberGrams,
      caloriesPerServing: recipePerServing.calories,
      proteinPerServing: recipePerServing.proteinGrams,
      carbsPerServing: recipePerServing.carbsGrams,
      fatPerServing: recipePerServing.fatGrams,
      fiberPerServing: recipePerServing.fiberGrams,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const portionOpt =
      builderLogPortionType === "cooked_grams" && currentRecipe.cookedWeightGrams
        ? { cookedPortionGrams: builderLogCookedGrams }
        : { servings: builderLogServings };

    const loggedItem = scaleRecipeForDiary(currentRecipe, portionOpt, builderLogMeal, selectedDate);
    localStore.addFoodLog(loggedItem);
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    setIsBuilderLogOpen(false);
    showToast(
      `Logged ${loggedItem.servingAmount} ${loggedItem.servingUnit} (${loggedItem.calories} kcal) of "${currentRecipe.name}" to ${builderLogMeal}!`
    );
  };

  // Direct log of a saved recipe into diary
  const handleLogRecipeToDiary = (
    recipe: RecipeDefinition,
    meal: MealType,
    servings: number,
    cookedPortionGrams?: number
  ) => {
    const portionOpt = cookedPortionGrams ? { cookedPortionGrams } : servings;
    const loggedItem = scaleRecipeForDiary(recipe, portionOpt, meal, selectedDate);

    localStore.addFoodLog(loggedItem);
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    setLoggingRecipe(null);
    setIsSavedRecipesOpen(false);
    setSelectedMeal(null);
    showToast(`Logged ${loggedItem.servingAmount} ${loggedItem.servingUnit} of "${recipe.name}" to ${meal}!`);
  };

  // --- Meal Template Actions ---
  const handleSaveMealAsTemplate = (mealType: MealType) => {
    const mealItems = foodLogs.filter((i) => i.mealType === mealType);
    if (mealItems.length === 0) {
      showToast(`No foods logged for ${mealType} to save as a template.`);
      return;
    }
    setTemplateToSaveFromMeal(mealType);
    setNewTemplateName(`My ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Template`);
  };

  const handleConfirmSaveTemplate = () => {
    if (!templateToSaveFromMeal || !newTemplateName.trim()) return;
    const mealItems = foodLogs.filter((i) => i.mealType === templateToSaveFromMeal);

    const template: SavedMealTemplate = {
      id: `mt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newTemplateName.trim(),
      defaultMealType: templateToSaveFromMeal,
      items: mealItems,
      createdAt: new Date().toISOString(),
    };

    localStore.saveMealTemplate(template);
    setSavedTemplates(localStore.getMealTemplates());
    setTemplateToSaveFromMeal(null);
    showToast(`Template "${template.name}" saved!`);
  };

  const handleLogMealTemplate = (template: SavedMealTemplate, targetMeal: MealType) => {
    const cloned = localStore.logMealTemplate(template.id, selectedDate, targetMeal);
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    setIsTemplatesModalOpen(false);
    setSelectedMeal(null);
    showToast(`Logged template "${template.name}" (${cloned.length} items) to ${targetMeal}!`);
  };

  // --- Custom Food Saving ---
  const handleSaveCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomFood.name.trim()) return;

    const food: FoodItemDefinition = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newCustomFood.name.trim(),
      regionalName: newCustomFood.regionalName.trim() || undefined,
      category: newCustomFood.category,
      cuisineRegion: newCustomFood.cuisineRegion,
      servingSize: Number(newCustomFood.servingSize) || 100,
      servingUnit: newCustomFood.servingUnit || "g",
      servingWeightGrams: Number(newCustomFood.servingWeightGrams) || 100,
      allowedUnits: [
        { unit: "g", label: "Grams (g)", factorToGrams: 1 },
        {
          unit: newCustomFood.servingUnit,
          label: `${newCustomFood.servingUnit} (${newCustomFood.servingWeightGrams}g)`,
          factorToGrams: Number(newCustomFood.servingWeightGrams) || 100,
        },
      ],
      calories: Number(newCustomFood.calories) || 0,
      proteinGrams: Number(newCustomFood.proteinGrams) || 0,
      carbsGrams: Number(newCustomFood.carbsGrams) || 0,
      fatGrams: Number(newCustomFood.fatGrams) || 0,
      fiberGrams: Number(newCustomFood.fiberGrams) || 0,
      source: "custom_user",
      isCustom: true,
    };

    localStore.saveCustomFood(food);
    setCustomFoods(localStore.getCustomFoods());
    setIsCustomModalOpen(false);
    showToast(`Custom food "${food.name}" saved!`);
  };

  // --- AI Recipe Assistant Handlers ---
  const handleOpenAiRecipeAssistant = (initialPrompt?: string) => {
    if (initialPrompt) {
      setAiPrompt(initialPrompt);
      handleGenerateAiRecipe(initialPrompt);
    }
    setIsAiAssistantOpen(true);
  };

  const handleGenerateAiRecipe = async (
    customPrompt?: string,
    customAnswers?: Record<string, string>
  ) => {
    const query = customPrompt !== undefined ? customPrompt : aiPrompt;
    if (!query.trim()) return;

    setIsAiLoading(true);
    setAiError(null);

    const payload: AIRecipeRequest = {
      prompt: query.trim(),
      currentDraft: aiDraft || undefined,
      userDietaryPreference: user?.dietaryPreference || "vegetarian",
      answeredQuestions: customAnswers || aiAnsweredQuestions,
    };

    try {
      const res = await fetch("/api/nutrition/ai-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AIRecipeResponse = await res.json();
      setAiDraft(data.draft);
      setAiClarifyingQuestions(data.clarifyingQuestions || []);
      setAiMessage(data.message || null);
      setAiProviderName(data.provider || "SabFitness AI");
    } catch (err) {
      console.warn("API request failed, invoking built-in heuristic engine:", err);
      const fallback = heuristicRecipePlanner(payload, customFoods);
      setAiDraft(fallback.draft);
      setAiClarifyingQuestions(fallback.clarifyingQuestions || []);
      setAiMessage(fallback.message || null);
      setAiProviderName(fallback.provider);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnswerQuestion = (questionId: string, option: string) => {
    const updated = {
      ...aiAnsweredQuestions,
      [questionId]: option,
    };
    setAiAnsweredQuestions(updated);
    handleGenerateAiRecipe(aiPrompt || aiDraft?.recipeName, updated);
  };

  const handleUpdateDraftIngredientQty = (ingId: string, delta: number) => {
    if (!aiDraft) return;
    const updated = aiDraft.ingredients.map((ing) => {
      if (ing.id !== ingId) return ing;
      const step =
        ing.unit === "g" || ing.unit === "ml"
          ? (Math.abs(delta) >= 10 ? delta : delta * 10)
          : delta;
      const newQty = Math.max(0.1, Math.round((ing.quantity + step) * 10) / 10);
      return { ...ing, quantity: newQty };
    });
    const reGrounded = groundRecipeDraft({ ...aiDraft, ingredients: updated }, customFoods);
    setAiDraft(reGrounded);
  };

  const handleRemoveDraftIngredient = (ingId: string) => {
    if (!aiDraft) return;
    const updated = aiDraft.ingredients.filter((ing) => ing.id !== ingId);
    const reGrounded = groundRecipeDraft({ ...aiDraft, ingredients: updated }, customFoods);
    setAiDraft(reGrounded);
  };

  const handleUpdateDraftServings = (newServings: number) => {
    if (!aiDraft) return;
    const safeServings = Math.max(0.5, newServings);
    const ratio = safeServings / (aiDraft.servings || 1);
    const updated = aiDraft.ingredients.map((ing) => ({
      ...ing,
      quantity: Math.round(ing.quantity * ratio * 10) / 10,
    }));
    const reGrounded = groundRecipeDraft(
      { ...aiDraft, servings: safeServings, ingredients: updated },
      customFoods
    );
    setAiDraft(reGrounded);
  };

  const handleApplyTweak = (tweakText: string) => {
    if (!aiDraft || !tweakText.trim()) return;
    handleGenerateAiRecipe(tweakText.trim());
    setAiIterativePrompt("");
  };

  const handleSaveAiDraftToRecipes = () => {
    if (!aiDraft) return;
    const recipeDef = convertDraftToRecipeDefinition(aiDraft, user?.id);
    localStore.saveRecipe(recipeDef);
    setSavedRecipes(localStore.getRecipes());
    showToast(`Saved "${aiDraft.recipeName}" to My Recipes!`);
  };

  const handleLogAiDraftToDiary = (meal: MealType) => {
    if (!aiDraft) return;
    const loggedItem = convertDraftToLoggedItem(aiDraft, meal, selectedDate);
    localStore.addFoodLog(loggedItem);
    setFoodLogs(localStore.getFoodLogs(selectedDate));
    showToast(`Logged "${aiDraft.recipeName}" (${loggedItem.calories} kcal) to ${meal}!`);
    setIsAiDirectLogOpen(false);
  };

  const handleOpenAiDraftInRecipeBuilder = () => {
    if (!aiDraft) return;
    const recipeDef = convertDraftToRecipeDefinition(aiDraft, user?.id);
    handleOpenRecipeBuilder(recipeDef);
    setIsAiAssistantOpen(false);
  };

  if (!user) return null;


  // Macro Totals for the currently selected date
  const totalCalories = foodLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalProtein = foodLogs.reduce((acc, curr) => acc + (curr.proteinGrams || 0), 0);
  const totalCarbs = foodLogs.reduce((acc, curr) => acc + (curr.carbsGrams || 0), 0);
  const totalFat = foodLogs.reduce((acc, curr) => acc + (curr.fatGrams || 0), 0);
  const totalFiber = foodLogs.reduce((acc, curr) => acc + (curr.fiberGrams || 0), 0);

  const calorieTarget = user.dailyCalorieTarget || 2000;
  const proteinTarget = user.dailyProteinTargetGrams || 150;
  const carbsTarget = user.dailyCarbsTargetGrams || 200;
  const fatTarget = user.dailyFatTargetGrams || 65;

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 glass-card !bg-indigo-600/95 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-2 border border-white/20">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Main Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Nutrition & Indian Food Library</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              1,000+ Dishes
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Authentic IFCT/NIN regional foods, recipe builder with serving scaler, and smart portion calculator.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAiRecipeAssistant()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600/90 via-purple-600/90 to-pink-600/90 hover:from-violet-500 hover:to-pink-500 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/25 active:scale-95 group"
            title="Create balanced recipes from natural ingredients with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Create with AI</span>
          </button>

          <button
            onClick={handleCopyYesterday}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white backdrop-blur-xl flex items-center gap-1.5 transition-all shadow-sm"
            title="Copy all meals from yesterday into today as independent records"
          >
            <Copy className="w-3.5 h-3.5 text-purple-400" />
            <span>Copy Yesterday</span>
          </button>


          <button
            onClick={() => handleOpenRecipeBuilder()}
            className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/30 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ChefHat className="w-3.5 h-3.5 text-purple-400" />
            <span>Recipe Builder</span>
          </button>

          <button
            onClick={() => setIsSavedRecipesOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>My Recipes ({savedRecipes.length})</span>
          </button>

          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Meal Templates ({savedTemplates.length})</span>
          </button>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="btn-primary !text-xs !py-2 !px-3.5 shadow-md shadow-indigo-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Food</span>
          </button>
        </div>
      </div>

      {/* Evidence-Based Goal Calibration Banner */}
      <div className="glass-card p-4 rounded-2xl bg-[#0c1024]/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                Active Protocol: {calorieTarget.toLocaleString()} kcal/day
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                {user.activeRecommendationVersion || "v2026.2"}
              </span>
              {user.age && user.age < 18 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Minor Safeguard
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Protein: {proteinTarget}g &bull; Carbs: {carbsTarget}g &bull; Fats: {fatTarget}g &bull; Water: {user.dailyWaterGoalMl ? `${(user.dailyWaterGoalMl / 1000).toFixed(1)}L` : "2.5L"}
            </p>
          </div>
        </div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-indigo-300 hover:text-white text-xs font-semibold shrink-0 transition-all self-start sm:self-auto"
        >
          <span>Adjust Goal & Targets</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Date Picker Bar */}
      <div className="glass-panel p-3 px-4 flex items-center justify-between bg-white/10 border border-white/15">
        <button
          onClick={() => navigateDay(-1)}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-purple-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
          />
          {isToday && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Today
            </span>
          )}
        </div>

        <button
          onClick={() => navigateDay(1)}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Macro Progress Rings Bar */}
      <section className="glass-panel p-6 space-y-4 bg-white/10 border border-white/15">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Macronutrient Summary ({selectedDate})
          </h2>
          <span className="text-xs font-mono text-slate-300">
            {Math.round(totalCalories)} / {calorieTarget.toLocaleString()} kcal • Fiber: {Math.round(totalFiber)}g
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Calories */}
          <div className="glass-card p-4 space-y-2 text-center bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">
              Calories
            </span>
            <div className="text-xl font-extrabold text-white">
              {Math.round(totalCalories)}
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-orange-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((totalCalories / calorieTarget) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {Math.max(0, calorieTarget - Math.round(totalCalories))} kcal remaining
            </p>
          </div>

          {/* Protein */}
          <div className="glass-card p-4 space-y-2 text-center bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Protein
            </span>
            <div className="text-xl font-extrabold text-white">
              {Math.round(totalProtein)}g
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((totalProtein / proteinTarget) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400">Target: {proteinTarget}g</p>
          </div>

          {/* Carbs */}
          <div className="glass-card p-4 space-y-2 text-center bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Carbohydrates
            </span>
            <div className="text-xl font-extrabold text-white">
              {Math.round(totalCarbs)}g
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((totalCarbs / carbsTarget) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400">Target: {carbsTarget}g</p>
          </div>

          {/* Fat */}
          <div className="glass-card p-4 space-y-2 text-center bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Fats
            </span>
            <div className="text-xl font-extrabold text-white">
              {Math.round(totalFat)}g
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((totalFat / fatTarget) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400">Target: {fatTarget}g</p>
          </div>
        </div>
      </section>

      {/* Meal Diary Sections */}
      <section className="space-y-4">
        {MEAL_SECTIONS.map((sec) => {
          const items = foodLogs.filter((i) => i.mealType === sec.id);
          const mealCals = items.reduce((acc, curr) => acc + (curr.calories || 0), 0);
          const mealProtein = items.reduce((acc, curr) => acc + (curr.proteinGrams || 0), 0);
          const mealCarbs = items.reduce((acc, curr) => acc + (curr.carbsGrams || 0), 0);
          const mealFat = items.reduce((acc, curr) => acc + (curr.fatGrams || 0), 0);

          return (
            <div
              key={sec.id}
              className="glass-panel p-5 space-y-4 bg-white/10 border border-white/15"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{sec.title}</span>
                    <span className="text-xs font-mono font-normal text-purple-300">
                      • {Math.round(mealCals)} kcal
                    </span>
                    {items.length > 0 && (
                      <span className="text-[11px] text-slate-400">
                        (P: {Math.round(mealProtein)}g • C: {Math.round(mealCarbs)}g • F: {Math.round(mealFat)}g)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">{sec.subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Save as Template */}
                  {items.length > 0 && (
                    <button
                      onClick={() => handleSaveMealAsTemplate(sec.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-all"
                      title="Save this meal combination as a reusable 1-click template"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span>Save as Template</span>
                    </button>
                  )}

                  {/* Repeat Meal Action */}
                  <button
                    onClick={() => handleRepeatMeal(sec.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
                    title={`Repeat yesterday's ${sec.title.toLowerCase()} as independent records`}
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span>Repeat Meal</span>
                  </button>

                  {/* Add Food Action */}
                  <button
                    onClick={() => {
                      setSelectedMeal(sec.id);
                      setAddFoodTab("indian");
                      setSearchQuery("");
                      setConfiguringFood(null);
                    }}
                    className="btn-primary !text-xs !py-1.5 !px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Food</span>
                  </button>
                </div>
              </div>

              {/* Items in this meal */}
              {items.length === 0 ? (
                <div className="py-4 text-center rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-xs text-slate-400 italic">
                    No foods logged for {sec.title.toLowerCase()} on this date.
                  </p>
                  <button
                    onClick={() => handleRepeatMeal(sec.id)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Click to repeat yesterday&apos;s {sec.title.toLowerCase()}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.foodName}</span>
                          {item.source === "custom_recipe" && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Recipe
                            </span>
                          )}
                          {item.source === "open_food_facts" && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Online
                            </span>
                          )}
                          {item.brand && (
                            <span className="text-[10px] text-slate-400">({item.brand})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-2">
                          <span className="text-slate-300 font-medium">
                            {item.servingAmount} {item.servingUnit}
                            {item.servingWeightGrams ? ` (${item.servingWeightGrams}g)` : ""}
                          </span>
                          <span>•</span>
                          <span>P: {item.proteinGrams}g</span>
                          <span>•</span>
                          <span>C: {item.carbsGrams}g</span>
                          <span>•</span>
                          <span>F: {item.fatGrams}g</span>
                          {item.fiberGrams ? <span>• Fiber: {item.fiberGrams}g</span> : null}
                        </div>
                      </div>

                      {/* Quantity Controls & Dynamic Recalculation */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-1 bg-black/30 border border-white/15 rounded-xl p-1">
                          <button
                            onClick={() => handleAdjustQuantity(item, -1)}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                            title="Decrease portion"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-white">
                            {item.servingAmount} {item.servingUnit}
                          </span>
                          <button
                            onClick={() => handleAdjustQuantity(item, 1)}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                            title="Increase portion"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-white min-w-[70px] text-right">
                          {item.calories} kcal
                        </span>

                        <button
                          onClick={() => handleDeleteEntry(item.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1"
                          title="Remove food"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* MODAL 1: Unified "Add Food" Modal (Indian Library, Online, Recipes, etc.) */}
      {/* ========================================================================= */}
      {selectedMeal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => {
            setSelectedMeal(null);
            setConfiguringFood(null);
          }}
        >
          <div
            className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col p-5 sm:p-6 space-y-4 bg-[#0d1226]/95 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Add Food to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedMeal(null);
                  setConfiguringFood(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If configuring a specific food portion */}
            {configuringFood ? (
              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{configuringFood.name}</h4>
                      {configuringFood.regionalName && (
                        <p className="text-xs text-purple-300 font-medium">
                          {configuringFood.regionalName}
                        </p>
                      )}
                    </div>
                    {configuringFood.cuisineRegion && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {configuringFood.cuisineRegion}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Base Reference: {configuringFood.servingSize} {configuringFood.servingUnit} (
                    {configuringFood.servingWeightGrams || 100}g) = {configuringFood.calories} kcal
                  </p>
                </div>

                {/* Serving Unit & Quantity Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Serving Unit:
                    </label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full glass-input text-xs"
                    >
                      {availableUnitsForFood.map((u) => (
                        <option key={u.unit} value={u.unit} className="bg-[#0f172a] text-white">
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Quantity / Amount:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity(Math.max(0.25, selectedQuantity - (selectedUnit === "g" ? 25 : 0.5)))}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step={selectedUnit === "g" ? "10" : "0.25"}
                        min="0.1"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(parseFloat(e.target.value) || 1)}
                        className="flex-1 glass-input text-center text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity(selectedQuantity + (selectedUnit === "g" ? 25 : 0.5))}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Portions shortcuts */}
                {selectedUnit !== "g" && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Quick:</span>
                    {[0.5, 1, 1.5, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedQuantity(val)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          selectedQuantity === val
                            ? "bg-purple-600 text-white"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                )}

                {/* Real-Time Calculated Macros Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/25 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Calculated Portion ({livePortionMacros.weightGrams}g):</span>
                    <span className="text-base text-amber-300 font-mono">
                      {livePortionMacros.calories} kcal
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] text-slate-400 block uppercase">Protein</span>
                      <span className="text-xs font-bold text-indigo-300 font-mono">
                        {livePortionMacros.proteinGrams}g
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] text-slate-400 block uppercase">Carbs</span>
                      <span className="text-xs font-bold text-emerald-300 font-mono">
                        {livePortionMacros.carbsGrams}g
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] text-slate-400 block uppercase">Fat</span>
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        {livePortionMacros.fatGrams}g
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] text-slate-400 block uppercase">Fiber</span>
                      <span className="text-xs font-bold text-teal-300 font-mono">
                        {livePortionMacros.fiberGrams}g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setConfiguringFood(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Back to Search
                  </button>
                  <button
                    onClick={handleConfirmLogFood}
                    className="flex-1 btn-primary !text-xs !py-2.5 shadow-lg shadow-indigo-500/30"
                  >
                    Log to {selectedMeal}
                  </button>
                </div>
              </div>
            ) : (
              /* Main Food Search View with 5 Tabs */
              <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 text-xs scrollbar-none">
                  <button
                    onClick={() => setAddFoodTab("indian")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      addFoodTab === "indian"
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span>🇮🇳 Indian Foods</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                      1000+
                    </span>
                  </button>

                  <button
                    onClick={() => setAddFoodTab("online")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      addFoodTab === "online"
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Online / Packaged</span>
                  </button>

                  <button
                    onClick={() => setAddFoodTab("recipes")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      addFoodTab === "recipes"
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Recipes ({savedRecipes.length})</span>
                  </button>

                  <button
                    onClick={() => setAddFoodTab("custom")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      addFoodTab === "custom"
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span>Custom Foods ({customFoods.length})</span>
                  </button>

                  <button
                    onClick={() => setAddFoodTab("templates")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      addFoodTab === "templates"
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Templates ({savedTemplates.length})</span>
                  </button>
                </div>

                {/* TAB 1: Indian Food Library */}
                {addFoodTab === "indian" && (
                  <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                    {/* Search Input & Quick Filters */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search 1,000+ Indian dishes (e.g. Roti, Paneer Bhurji, Dal Tadka, Idli)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full glass-input !pl-9 text-xs"
                          autoFocus
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-3 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
                        {/* Veg toggle */}
                        <button
                          type="button"
                          onClick={() => setIsVegOnly(!isVegOnly)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all whitespace-nowrap ${
                            isVegOnly
                              ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-300"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          🟢 Pure Veg
                        </button>

                        {/* High Protein toggle */}
                        <button
                          type="button"
                          onClick={() => setIsHighProteinOnly(!isHighProteinOnly)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all whitespace-nowrap ${
                            isHighProteinOnly
                              ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💪 High Protein
                        </button>

                        {/* Category Selector */}
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as any)}
                          className="glass-input !py-1 !px-2 text-[11px] max-w-[140px]"
                        >
                          <option value="all" className="bg-[#0f172a]">
                            All Categories
                          </option>
                          {getIndianFoodCategories().map((c) => (
                            <option key={c.value} value={c.value} className="bg-[#0f172a]">
                              {c.label}
                            </option>
                          ))}
                        </select>

                        {/* Region Selector */}
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value as any)}
                          className="glass-input !py-1 !px-2 text-[11px] max-w-[140px]"
                        >
                          <option value="all" className="bg-[#0f172a]">
                            All Regions
                          </option>
                          {getIndianCuisineRegions().map((r) => (
                            <option key={r} value={r} className="bg-[#0f172a]">
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Food Items List */}
                    <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-80">
                      {/* Popular Quick Staples if no query */}
                      {!searchQuery && selectedCategory === "all" && selectedRegion === "all" && (
                        <div className="pb-2 border-b border-white/10">
                          <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2">
                            ⭐ Popular Daily Indian Staples
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {popularIndianStaples.map((food) => (
                              <button
                                key={food.id}
                                onClick={() => handleSelectFoodToConfigure(food)}
                                className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
                              >
                                <div className="truncate mr-2">
                                  <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                                    {food.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {food.servingSize} {food.servingUnit} • P: {food.proteinGrams}g • C: {food.carbsGrams}g
                                  </p>
                                </div>
                                <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                                  {food.calories} kcal
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {indianFoodsFiltered.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No Indian foods found matching filters. Try adjusting your query or category.
                        </div>
                      ) : (
                        indianFoodsFiltered.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => handleSelectFoodToConfigure(food)}
                            className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
                          >
                            <div className="pr-2">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                                  {food.name}
                                </p>
                              </div>
                              {food.regionalName && (
                                <p className="text-[11px] text-purple-300 font-medium">
                                  {food.regionalName}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Base: {food.servingSize} {food.servingUnit} ({food.servingWeightGrams || 100}g) • P: {food.proteinGrams}g, C: {food.carbsGrams}g, F: {food.fatGrams}g
                                {food.cuisineRegion ? ` • ${food.cuisineRegion}` : ""}
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-200 shrink-0">
                              {food.calories} kcal
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Online Search (Open Food Facts) */}
                {addFoodTab === "online" && (
                  <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search packaged & branded foods (e.g. Amul Butter, Quaker Oats, Epigamia, Whey)..."
                        value={onlineQuery}
                        onChange={(e) => setOnlineQuery(e.target.value)}
                        className="w-full glass-input !pl-9 text-xs"
                        autoFocus
                      />
                    </div>

                    <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-80">
                      {isOnlineLoading ? (
                        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          <span>Searching Open Food Facts database...</span>
                        </div>
                      ) : onlineSearchError ? (
                        <div className="py-6 text-center text-amber-300 text-xs">
                          {onlineSearchError}
                        </div>
                      ) : onlineResults.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          {onlineQuery.length < 2
                            ? "Type at least 2 characters to search worldwide and packaged brands."
                            : "No online packaged foods found for this query."}
                        </div>
                      ) : (
                        onlineResults.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => handleSelectFoodToConfigure(food)}
                            className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
                          >
                            <div className="pr-2">
                              <p className="text-xs font-bold text-white group-hover:text-purple-300">
                                {food.name}
                              </p>
                              {food.brand && (
                                <p className="text-[11px] text-blue-300 font-medium">
                                  Brand: {food.brand}
                                  {food.barcode ? ` • Barcode: ${food.barcode}` : ""}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Per 100g: {food.calories} kcal • P: {food.proteinGrams}g, C: {food.carbsGrams}g, F: {food.fatGrams}g
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-200 shrink-0">
                              {food.calories} kcal
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: Saved Recipes */}
                {addFoodTab === "recipes" && (
                  <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Select a recipe to log scaled portions into {selectedMeal}:
                      </span>
                      <button
                        onClick={() => handleOpenRecipeBuilder()}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Recipe</span>
                      </button>
                    </div>

                    <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-80">
                      {savedRecipes.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                          <p>You haven&apos;t created any custom recipes yet.</p>
                          <button
                            onClick={() => handleOpenRecipeBuilder()}
                            className="btn-primary !text-xs !py-1.5 !px-3"
                          >
                            Open Recipe Builder
                          </button>
                        </div>
                      ) : (
                        savedRecipes.map((recipe) => (
                          <div
                            key={recipe.id}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{recipe.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {recipe.servings} Servings total • {recipe.ingredients?.length || 0} ingredients
                              </p>
                              <p className="text-[11px] text-purple-300 font-mono mt-0.5">
                                Per Serving: {recipe.caloriesPerServing || 0} kcal • P: {recipe.proteinPerServing || 0}g • C: {recipe.carbsPerServing || 0}g • F: {recipe.fatPerServing || 0}g
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setLoggingRecipe(recipe);
                                setLogRecipeMeal(selectedMeal);
                                setLogRecipeServings(1);
                              }}
                              className="btn-primary !text-xs !py-1.5 !px-3 shrink-0"
                            >
                              Log Recipe
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: Custom Foods */}
                {addFoodTab === "custom" && (
                  <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Your private custom food entries:
                      </span>
                      <button
                        onClick={() => setIsCustomModalOpen(true)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Food</span>
                      </button>
                    </div>

                    <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-80">
                      {customFoods.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                          <p>No custom foods created yet.</p>
                          <button
                            onClick={() => setIsCustomModalOpen(true)}
                            className="btn-primary !text-xs !py-1.5 !px-3"
                          >
                            Create Custom Food
                          </button>
                        </div>
                      ) : (
                        customFoods.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => handleSelectFoodToConfigure(food)}
                            className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-purple-300">
                                {food.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {food.servingSize} {food.servingUnit} • P: {food.proteinGrams}g, C: {food.carbsGrams}g, F: {food.fatGrams}g
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-200 shrink-0">
                              {food.calories} kcal
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: Saved Meal Templates */}
                {addFoodTab === "templates" && (
                  <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                    <p className="text-xs text-slate-400">
                      1-Click log an entire saved meal into {selectedMeal}:
                    </p>

                    <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-80">
                      {savedTemplates.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No saved meal templates yet. Click &quot;Save as Template&quot; on any logged meal to create one!
                        </div>
                      ) : (
                        savedTemplates.map((template) => {
                          const tempCals = template.items.reduce((a, b) => a + (b.calories || 0), 0);
                          const tempProt = template.items.reduce((a, b) => a + (b.proteinGrams || 0), 0);

                          return (
                            <div
                              key={template.id}
                              className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-xs font-bold text-white">{template.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {template.items.length} items • {Math.round(tempCals)} kcal • {Math.round(tempProt)}g protein
                                </p>
                              </div>

                              <button
                                onClick={() => handleLogMealTemplate(template, selectedMeal)}
                                className="btn-primary !text-xs !py-1.5 !px-3 shrink-0"
                              >
                                Log Template
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Custom Recipe Builder Modal */}
      {/* ========================================================================= */}
      {isRecipeBuilderOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsRecipeBuilderOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-3xl max-h-[92vh] flex flex-col p-5 sm:p-6 space-y-4 bg-[#0d1226]/95 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRecipeId ? "Edit Recipe" : "Smart Recipe & Meal Builder"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Combine raw ingredients, adjust quantities with live density recalculation, and track cooked batch yields.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecipeBuilderOpen(false);
                    setIsAiAssistantOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-violet-600/80 to-purple-600/80 hover:from-violet-500 hover:to-purple-500 border border-white/20 text-[11px] font-bold text-white flex items-center gap-1.5 transition-all shadow-sm"
                  title="Generate or edit with AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Create with AI</span>
                </button>
                <button
                  onClick={() => setIsRecipeBuilderOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>


            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Recipe Basic Info & Cooked Batch Yield Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recipe / Meal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oats + Banana + Honey, Moong Dal Khichdi"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Servings *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRecipeServings((prev) => Math.max(0.5, Math.round((prev - 0.5) * 10) / 10))}
                      className="w-7 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={recipeServings}
                      onChange={(e) => setRecipeServings(Math.max(0.1, parseFloat(e.target.value) || 1))}
                      className="w-full text-center glass-input text-xs font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setRecipeServings((prev) => Math.round((prev + 0.5) * 10) / 10)}
                      className="w-7 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-cyan-400" />
                    <span>Cooked Batch (g)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional (e.g. 350)"
                    value={recipeCookedWeight}
                    onChange={(e) => setRecipeCookedWeight(e.target.value === "" ? "" : parseFloat(e.target.value) || "")}
                    className="w-full glass-input text-xs font-mono font-bold"
                    title="Final weighed weight after cooking. Used to calculate per-100g cooked macros."
                  />
                </div>
              </div>

              {/* Cooked Batch Weight Information Banner */}
              {recipeCookedYield && (
                <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-200 font-semibold">
                      Cooked Batch Yield: {recipeTotals.totalWeightGrams}g raw &rarr; {recipeCookedYield.cookedWeightGrams}g cooked ({recipeCookedYield.waterYieldRatio}x yield)
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono">
                    Per 100g Cooked: <strong className="text-white">{recipeCookedYield.caloriesPer100gCooked} kcal</strong> • P: {recipeCookedYield.proteinPer100gCooked}g • C: {recipeCookedYield.carbsPer100gCooked}g • F: {recipeCookedYield.fatPer100gCooked}g
                  </div>
                </div>
              )}

              {/* Quick Cooking Fats & Oils Shortcuts */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick-Add Cooking Fats & Oils:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">1 Tbsp defaults</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_COOKING_FATS.map((fat) => (
                    <button
                      key={fat.id}
                      type="button"
                      onClick={() => handleAddQuickCookingFat(fat, 1)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>{fat.name.split("(")[0].trim()}</span>
                      <span className="text-[10px] text-amber-300 font-mono">({fat.calPerTbsp} kcal)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ingredients ({recipeIngredients.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingIngredient(!isAddingIngredient)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                {/* Add Ingredient Sub-Panel */}
                {isAddingIngredient && (
                  <div className="p-4 rounded-2xl bg-[#141b36] border border-purple-500/30 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-xs font-bold text-purple-200">
                        Pick an Ingredient (Oats, Banana, Honey, Milk, Dal, Paneer, Rice...)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingIngredient(false);
                          setSelectedIngFood(null);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {!selectedIngFood ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search ingredients across 1,050+ foods (e.g. Oats, Banana, Honey, Milk, Paneer)..."
                            value={ingSearchQuery}
                            onChange={(e) => setIngSearchQuery(e.target.value)}
                            className="w-full glass-input !pl-9 text-xs"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {searchAllIngredients(ingSearchQuery).map((food) => (
                            <button
                              key={food.id}
                              type="button"
                              onClick={() => {
                                setSelectedIngFood(food);
                                const available = getAvailableUnitsForFood(food);
                                const defaultUnit = available[0]?.unit || "g";
                                setSelectedIngUnit(defaultUnit);
                                setSelectedIngQuantity(
                                  defaultUnit === "g" || defaultUnit === "ml"
                                    ? (food.servingWeightGrams || food.servingSize || 100)
                                    : 1
                                );
                              }}
                              className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <span className="text-white font-semibold block">{food.name}</span>
                                <span className="text-[10px] text-slate-400">
                                  {food.servingSize} {food.servingUnit} • P: {food.proteinGrams}g, C: {food.carbsGrams}g, F: {food.fatGrams}g
                                </span>
                              </div>
                              <span className="text-purple-300 font-mono text-[11px] font-bold shrink-0">
                                {food.calories} kcal
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <span className="font-bold text-white block">{selectedIngFood.name}</span>
                            <span className="text-[10px] text-slate-400">
                              Base: {selectedIngFood.calories} kcal per {selectedIngFood.servingSize} {selectedIngFood.servingUnit}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedIngFood(null)}
                            className="text-purple-400 hover:text-purple-300 text-[11px] font-semibold underline"
                          >
                            Change food
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-300 mb-1">Unit</label>
                            <select
                              value={selectedIngUnit}
                              onChange={(e) => setSelectedIngUnit(e.target.value)}
                              className="w-full glass-input text-xs"
                            >
                              {getAvailableUnitsForFood(selectedIngFood).map((u) => (
                                <option key={u.unit} value={u.unit} className="bg-[#0f172a]">
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-300 mb-1">Quantity</label>
                            <input
                              type="number"
                              min="0.1"
                              step={selectedIngUnit === "g" || selectedIngUnit === "ml" ? "10" : "0.5"}
                              value={selectedIngQuantity}
                              onChange={(e) => setSelectedIngQuantity(parseFloat(e.target.value) || 0)}
                              className="w-full glass-input text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Live preview for ingredient to add */}
                        {(() => {
                          const previewMacros = calculateMacrosForQuantity(
                            selectedIngFood,
                            selectedIngQuantity,
                            selectedIngUnit
                          );
                          return (
                            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs flex items-center justify-between">
                              <span className="text-slate-300 text-[11px]">
                                Calculated: <strong className="text-white font-mono">{previewMacros.weightGrams}g</strong> • P: {previewMacros.proteinGrams}g, C: {previewMacros.carbsGrams}g, F: {previewMacros.fatGrams}g
                              </span>
                              <span className="font-mono font-bold text-purple-300">
                                {previewMacros.calories} kcal
                              </span>
                            </div>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={handleAddIngredientToRecipe}
                          className="w-full btn-primary !text-xs !py-2"
                        >
                          Confirm Add Ingredient
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Display Current Ingredients with Interactive Steppers */}
                {recipeIngredients.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <p className="font-semibold text-slate-300">No ingredients added yet.</p>
                    <p>Try assembling a meal like Oats + Banana + Honey, or Dal + Rice + Ghee above!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipeIngredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-white text-xs sm:text-sm block">
                              {ing.foodItem?.name || ing.foodName || "Ingredient"}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-purple-300 font-mono font-semibold">
                                {ing.weightGrams}g total
                              </span>
                              <span className="text-white/20">•</span>
                              <span className="text-[11px] text-slate-400">
                                P: <strong className="text-indigo-300">{ing.proteinGrams}g</strong>
                              </span>
                              <span className="text-white/20">•</span>
                              <span className="text-[11px] text-slate-400">
                                C: <strong className="text-emerald-300">{ing.carbsGrams}g</strong>
                              </span>
                              <span className="text-white/20">•</span>
                              <span className="text-[11px] text-slate-400">
                                F: <strong className="text-amber-300">{ing.fatGrams}g</strong>
                              </span>
                              {ing.fiberGrams !== undefined && ing.fiberGrams > 0 && (
                                <>
                                  <span className="text-white/20">•</span>
                                  <span className="text-[11px] text-slate-400">
                                    Fiber: <strong className="text-teal-300">{ing.fiberGrams}g</strong>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                              {ing.calories} kcal
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(ing.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove ingredient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Quantity Stepper & Unit Selector */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateIngredientQuantity(ing.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0.1"
                              step={ing.unit === "g" || ing.unit === "ml" ? "10" : "0.5"}
                              value={ing.quantity}
                              onChange={(e) => handleSetIngredientQuantity(ing.id, parseFloat(e.target.value) || 0)}
                              className="w-16 text-center glass-input !py-1 !px-1 text-xs font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateIngredientQuantity(ing.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                              title="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <select
                              value={ing.unit}
                              onChange={(e) => handleSetIngredientUnit(ing.id, e.target.value)}
                              className="glass-input !py-1 text-xs max-w-[150px]"
                            >
                              {(ing.foodItem ? getAvailableUnitsForFood(ing.foodItem) : COMMON_INDIAN_UNITS).map((u) => (
                                <option key={u.unit} value={u.unit} className="bg-[#0f172a]">
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Ingredient Contribution Pill */}
                          {recipeTotals.totalCalories > 0 && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg">
                              <span>Contributes:</span>
                              <span className="text-purple-300 font-semibold font-mono">
                                {Math.round(((ing.calories || 0) / recipeTotals.totalCalories) * 100)}% kcal
                              </span>
                              {recipeTotals.totalProteinGrams > 0 && (
                                <span className="text-indigo-300 font-semibold font-mono">
                                  • {Math.round(((ing.proteinGrams || 0) / recipeTotals.totalProteinGrams) * 100)}% prot
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recipe Totals & Macro Breakdown Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border border-purple-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-white text-xs">
                    Nutrition Breakdown:
                  </span>

                  {/* View Mode Tabs */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setRecipeViewMode("per_serving")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        recipeViewMode === "per_serving"
                          ? "bg-purple-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Per Serving ({recipeServings})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipeViewMode("totals")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        recipeViewMode === "totals"
                          ? "bg-purple-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Full Recipe Totals
                    </button>
                    {recipeCookedYield && (
                      <button
                        type="button"
                        onClick={() => setRecipeViewMode("per_100g")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          recipeViewMode === "per_100g"
                            ? "bg-purple-600 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Per 100g Cooked
                      </button>
                    )}
                  </div>
                </div>

                {/* Macro Metric Cards according to View Mode */}
                {(() => {
                  let displayCals = recipePerServing.calories;
                  let displayProt = recipePerServing.proteinGrams;
                  let displayCarbs = recipePerServing.carbsGrams;
                  let displayFat = recipePerServing.fatGrams;
                  let displayFiber = recipePerServing.fiberGrams;
                  let displayWeight = recipePerServing.weightGramsPerServing;
                  let modeLabel = `Per Single Serving (1 of ${recipeServings})`;

                  if (recipeViewMode === "totals") {
                    displayCals = recipeTotals.totalCalories;
                    displayProt = recipeTotals.totalProteinGrams;
                    displayCarbs = recipeTotals.totalCarbsGrams;
                    displayFat = recipeTotals.totalFatGrams;
                    displayFiber = recipeTotals.totalFiberGrams;
                    displayWeight = recipeTotals.totalWeightGrams;
                    modeLabel = `Full Batch Total (${recipeIngredients.length} ingredients)`;
                  } else if (recipeViewMode === "per_100g" && recipeCookedYield) {
                    displayCals = Math.round(recipeCookedYield.caloriesPer100gCooked);
                    displayProt = recipeCookedYield.proteinPer100gCooked;
                    displayCarbs = recipeCookedYield.carbsPer100gCooked;
                    displayFat = recipeCookedYield.fatPer100gCooked;
                    displayFiber = recipeCookedYield.fiberPer100gCooked;
                    displayWeight = 100;
                    modeLabel = "Normalized per 100g Cooked Weight";
                  }

                  const totalMacroGrams = displayProt + displayCarbs + displayFat || 1;
                  const protPct = Math.round(((displayProt * 4) / Math.max(1, displayCals)) * 100);
                  const carbsPct = Math.round(((displayCarbs * 4) / Math.max(1, displayCals)) * 100);
                  const fatPct = Math.max(0, 100 - protPct - carbsPct);

                  return (
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        <span>{modeLabel}</span>
                        <span className="text-slate-300 font-mono normal-case">
                          Weight: {displayWeight}g
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-white/5">
                          <span className="text-[10px] text-slate-400 block">Calories</span>
                          <span className="text-lg font-extrabold text-white font-mono">
                            {displayCals}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                          <span className="text-[10px] text-indigo-300 block">Protein</span>
                          <span className="text-lg font-extrabold text-indigo-200 font-mono">
                            {displayProt}g
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] text-emerald-300 block">Carbs</span>
                          <span className="text-lg font-extrabold text-emerald-200 font-mono">
                            {displayCarbs}g
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <span className="text-[10px] text-amber-300 block">Fat</span>
                          <span className="text-lg font-extrabold text-amber-200 font-mono">
                            {displayFat}g
                          </span>
                        </div>
                      </div>

                      {/* Calorie Macro Proportion Bar */}
                      {displayCals > 0 && (
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                            <div style={{ width: `${protPct}%` }} className="bg-indigo-400" title={`Protein: ${protPct}%`} />
                            <div style={{ width: `${carbsPct}%` }} className="bg-emerald-400" title={`Carbs: ${carbsPct}%`} />
                            <div style={{ width: `${fatPct}%` }} className="bg-amber-400" title={`Fat: ${fatPct}%`} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="text-indigo-300">P: {protPct}%</span>
                            <span className="text-emerald-300">C: {carbsPct}%</span>
                            <span className="text-amber-300">F: {fatPct}%</span>
                            {displayFiber > 0 && <span className="text-teal-300">Fiber: {displayFiber}g</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Direct Diary Log Drawer / Sub-section */}
              {isBuilderLogOpen && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-purple-400" />
                      <span>Log Directly to Today&apos;s Food Diary ({selectedDate})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBuilderLogOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Target Meal</label>
                      <select
                        value={builderLogMeal}
                        onChange={(e) => setBuilderLogMeal(e.target.value as MealType)}
                        className="w-full glass-input text-xs"
                      >
                        <option value="breakfast" className="bg-[#0f172a]">Breakfast</option>
                        <option value="lunch" className="bg-[#0f172a]">Lunch</option>
                        <option value="dinner" className="bg-[#0f172a]">Dinner</option>
                        <option value="snack" className="bg-[#0f172a]">Snacks</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Portion Method</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setBuilderLogPortionType("servings")}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                            builderLogPortionType === "servings"
                              ? "bg-purple-600 text-white"
                              : "bg-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          By Servings
                        </button>
                        {recipeCookedYield && (
                          <button
                            type="button"
                            onClick={() => setBuilderLogPortionType("cooked_grams")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                              builderLogPortionType === "cooked_grams"
                                ? "bg-purple-600 text-white"
                                : "bg-white/5 text-slate-400 hover:text-white"
                            }`}
                          >
                            Weighed Plate (g)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {builderLogPortionType === "servings" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">Servings:</span>
                      {[0.5, 1, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBuilderLogServings(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            builderLogServings === s
                              ? "bg-purple-600 text-white"
                              : "bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={builderLogServings}
                        onChange={(e) => setBuilderLogServings(Math.max(0.1, parseFloat(e.target.value) || 1))}
                        className="w-16 glass-input !py-1 text-xs font-mono font-bold text-center ml-auto"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">Plate Weight:</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 175"
                        value={builderLogCookedGrams}
                        onChange={(e) => setBuilderLogCookedGrams(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-24 glass-input !py-1 text-xs font-mono font-bold"
                      />
                      <span className="text-xs text-slate-400">
                        grams cooked (out of {recipeCookedYield?.cookedWeightGrams}g batch)
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLogDirectFromBuilder}
                    className="w-full btn-primary !text-xs !py-2 flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/25"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Log to {builderLogMeal.charAt(0).toUpperCase() + builderLogMeal.slice(1)}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsRecipeBuilderOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderLogOpen(!isBuilderLogOpen)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isBuilderLogOpen
                      ? "bg-purple-600/30 border-purple-500 text-purple-200"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Log to Diary</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="btn-primary !text-xs !py-2 !px-5 shadow-lg shadow-purple-500/25"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Saved Recipes Drawer / Manager */}
      {/* ========================================================================= */}
      {isSavedRecipesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsSavedRecipesOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-xl max-h-[85vh] flex flex-col p-5 sm:p-6 space-y-4 bg-[#0d1226]/95 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  My Saved Recipes ({savedRecipes.length})
                </h3>
              </div>
              <button
                onClick={() => setIsSavedRecipesOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {savedRecipes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-3">
                  <p>You haven&apos;t built any recipes yet.</p>
                  <button
                    onClick={() => {
                      setIsSavedRecipesOpen(false);
                      handleOpenRecipeBuilder();
                    }}
                    className="btn-primary !text-xs !py-2 !px-4"
                  >
                    Open Recipe Builder
                  </button>
                </div>
              ) : (
                savedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{recipe.name}</h4>
                        <p className="text-xs text-slate-400">
                          {recipe.servings} Servings total • {recipe.ingredients?.length || 0} Ingredients
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setIsSavedRecipesOpen(false);
                            handleOpenRecipeBuilder(recipe);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                          title="Edit recipe"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            localStore.duplicateRecipe(recipe.id);
                            setSavedRecipes(localStore.getRecipes());
                            showToast(`Duplicated "${recipe.name}"!`);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                          title="Duplicate recipe"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            localStore.deleteRecipe(recipe.id);
                            setSavedRecipes(localStore.getRecipes());
                            showToast("Recipe deleted.");
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                          title="Delete recipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex flex-wrap items-center justify-between gap-1 text-xs font-mono">
                      <span className="text-slate-300">Per Serving:</span>
                      <span className="font-bold text-white">
                        {recipe.caloriesPerServing || 0} kcal • P: {recipe.proteinPerServing || 0}g • C: {recipe.carbsPerServing || 0}g • F: {recipe.fatPerServing || 0}g
                      </span>
                    </div>

                    {recipe.cookedWeightGrams && (
                      <div className="p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-cyan-300">
                        <span>Cooked Batch: {recipe.cookedWeightGrams}g</span>
                        <span>Per 100g: <strong className="text-white">{recipe.caloriesPer100gCooked || Math.round(((recipe.totalCalories || 0) / recipe.cookedWeightGrams) * 100)} kcal</strong></span>
                      </div>
                    )}

                    {/* Quick Log Form */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Log to:</span>
                        <select
                          value={logRecipeMeal}
                          onChange={(e) => setLogRecipeMeal(e.target.value as MealType)}
                          className="glass-input !py-1 !px-2 text-[11px]"
                        >
                          {MEAL_SECTIONS.map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#0f172a]">
                              {m.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Servings:</span>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={logRecipeServings}
                          onChange={(e) => setLogRecipeServings(parseFloat(e.target.value) || 1)}
                          className="w-14 glass-input !py-1 !px-2 text-center text-xs font-mono font-bold"
                        />
                        <button
                          onClick={() => handleLogRecipeToDiary(recipe, logRecipeMeal, logRecipeServings)}
                          className="btn-primary !text-xs !py-1 !px-3"
                        >
                          Log to Diary
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Saved Meal Templates Manager */}
      {/* ========================================================================= */}
      {isTemplatesModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsTemplatesModalOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-lg max-h-[85vh] flex flex-col p-5 sm:p-6 space-y-4 bg-[#0d1226]/95 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Saved Meal Templates ({savedTemplates.length})
                </h3>
              </div>
              <button
                onClick={() => setIsTemplatesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {savedTemplates.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No saved templates yet. To create one, log some foods in a meal card on the main screen, then click &quot;Save as Template&quot;!
                </div>
              ) : (
                savedTemplates.map((template) => {
                  const tempCals = template.items.reduce((a, b) => a + (b.calories || 0), 0);
                  const tempProt = template.items.reduce((a, b) => a + (b.proteinGrams || 0), 0);
                  const tempCarbs = template.items.reduce((a, b) => a + (b.carbsGrams || 0), 0);
                  const tempFat = template.items.reduce((a, b) => a + (b.fatGrams || 0), 0);

                  return (
                    <div
                      key={template.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{template.name}</h4>
                          <p className="text-xs text-slate-400">
                            {template.items.length} items logged together
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            localStore.deleteMealTemplate(template.id);
                            setSavedTemplates(localStore.getMealTemplates());
                            showToast("Template deleted.");
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-[11px] text-purple-300 font-mono">
                        Totals: {Math.round(tempCals)} kcal • P: {Math.round(tempProt)}g • C: {Math.round(tempCarbs)}g • F: {Math.round(tempFat)}g
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-2">
                        <span className="text-[10px] text-slate-400">
                          Items: {template.items.map((i) => i.foodName).join(", ").slice(0, 45)}...
                        </span>
                        <button
                          onClick={() => handleLogMealTemplate(template, template.defaultMealType || "lunch")}
                          className="btn-primary !text-xs !py-1 !px-3 shrink-0"
                        >
                          Log to {template.defaultMealType || "Lunch"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Save Current Meal as Template Dialog */}
      {/* ========================================================================= */}
      {templateToSaveFromMeal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setTemplateToSaveFromMeal(null)}
        >
          <div
            className="glass-panel w-full max-w-md p-6 space-y-4 bg-[#0d1226]/95 border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Save Meal as Template</h3>
              <button
                onClick={() => setTemplateToSaveFromMeal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Save the foods currently in your {templateToSaveFromMeal} as a reusable template for 1-click logging any day.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Template Name
              </label>
              <input
                type="text"
                required
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g. My High-Protein Breakfast"
                className="w-full glass-input text-xs"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToSaveFromMeal(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveTemplate}
                className="btn-primary !text-xs !py-2 !px-4"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Create Custom Food Modal */}
      {/* ========================================================================= */}
      {isCustomModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsCustomModalOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-lg max-h-[90vh] flex flex-col p-5 sm:p-6 space-y-4 bg-[#0d1226]/95 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Create Custom Food</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomFood} className="space-y-3 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandma's Spiced Besan Chilla"
                  value={newCustomFood.name}
                  onChange={(e) => setNewCustomFood({ ...newCustomFood, name: e.target.value })}
                  className="w-full glass-input text-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Regional / Native Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Masala Cheela / Puda"
                  value={newCustomFood.regionalName}
                  onChange={(e) => setNewCustomFood({ ...newCustomFood, regionalName: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCustomFood.category}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, category: e.target.value as FoodCategory })}
                    className="w-full glass-input text-xs"
                  >
                    {getIndianFoodCategories().map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#0f172a]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Region
                  </label>
                  <select
                    value={newCustomFood.cuisineRegion}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, cuisineRegion: e.target.value as IndianRegion })}
                    className="w-full glass-input text-xs"
                  >
                    {getIndianCuisineRegions().map((r) => (
                      <option key={r} value={r} className="bg-[#0f172a]">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Serving Amount
                  </label>
                  <input
                    type="number"
                    value={newCustomFood.servingSize}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, servingSize: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newCustomFood.servingUnit}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, servingUnit: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Grams (g)
                  </label>
                  <input
                    type="number"
                    value={newCustomFood.servingWeightGrams}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, servingWeightGrams: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-pink-300 mb-1">
                    Calories *
                  </label>
                  <input
                    type="number"
                    required
                    value={newCustomFood.calories}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, calories: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCustomFood.proteinGrams}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, proteinGrams: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCustomFood.carbsGrams}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, carbsGrams: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCustomFood.fatGrams}
                    onChange={(e) => setNewCustomFood({ ...newCustomFood, fatGrams: Number(e.target.value) })}
                    className="w-full glass-input text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !text-xs !py-2 !px-4">
                  Save Custom Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: AI-Powered Recipe Creation Assistant Modal */}
      {/* ========================================================================= */}
      {isAiAssistantOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsAiAssistantOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-4xl max-h-[92vh] flex flex-col p-5 sm:p-6 space-y-4 bg-[#0a0f24]/95 border border-white/20 shadow-2xl overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                      AI Recipe Creation Assistant
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{aiProviderName}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Describe any dish or ingredient list. Nutrition is 100% grounded against verified database figures with zero hallucination.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiAssistantOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Natural Language Prompt Input */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 'Make a recipe with oats and milk', 'Oats with banana and honey', 'Paneer bhurji', 'Aloo paratha'..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateAiRecipe();
                      }
                    }}
                    className="w-full glass-input !py-3 !pl-4 !pr-28 text-xs sm:text-sm bg-white/5 border border-white/15 focus:border-purple-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={isAiLoading || !aiPrompt.trim()}
                    onClick={() => handleGenerateAiRecipe()}
                    className="absolute right-2 top-2 bottom-2 px-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-md shadow-purple-500/20"
                  >
                    {isAiLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isAiLoading ? "Crafting..." : "Generate"}</span>
                  </button>
                </div>

                {/* Example Quick Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Try asking:</span>
                  {[
                    "Make a recipe with oats and milk",
                    "Oats with banana and honey",
                    "High-protein vegetarian breakfast",
                    "Make paneer bhurji with the ingredients I have",
                    "Create a simple aloo paratha recipe",
                    "Suggest a meal using rice, dal, and vegetables",
                  ].map((exampleText) => (
                    <button
                      key={exampleText}
                      type="button"
                      onClick={() => {
                        setAiPrompt(exampleText);
                        handleGenerateAiRecipe(exampleText);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-400/30 text-[11px] text-slate-300 hover:text-white transition-all text-left"
                    >
                      &ldquo;{exampleText}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Commentary / Message Banner */}
              {aiMessage && (
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="leading-relaxed">{aiMessage}</p>
                  </div>
                </div>
              )}

              {/* Clarifying Questions Section */}
              {aiClarifyingQuestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-300" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Chef Clarifying Questions & Preferences
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {aiClarifyingQuestions.map((q) => (
                      <div key={q.id} className="space-y-1.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-1">
                          <p className="text-xs font-medium text-slate-200">{q.question}</p>
                          {q.rationale && (
                            <span className="text-[10px] text-slate-400 italic">
                              {q.rationale}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {q.options.map((opt) => {
                            const isSelected = aiAnsweredQuestions[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAnswerQuestion(q.id, opt)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                  isSelected
                                    ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30 font-bold"
                                    : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 inline mr-1 text-amber-300" />}
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Defaults Label */}
              {aiDraft && aiDraft.ingredients.some((i) => i.isProposedDefault) && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-200">
                  <Scale className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>
                    <strong>Proposed Defaults Applied:</strong> Sensible serving quantities have been selected for unstated items (labeled in orange). You can adjust any quantity below or use the tweak bar.
                  </span>
                </div>
              )}

              {/* Grounded Recipe Preview Card */}
              {aiDraft && (
                <div className="glass-card p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/15 space-y-4">
                  {/* Recipe Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>{aiDraft.recipeName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                          Verified Grounded
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">{aiDraft.description}</p>
                    </div>

                    {/* Servings Stepper */}
                    <div className="flex items-center gap-2 bg-[#0e142e] px-3 py-1.5 rounded-xl border border-white/15 self-start sm:self-auto">
                      <span className="text-xs font-semibold text-slate-300">Servings:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateDraftServings(Math.max(0.5, (aiDraft.servings || 1) - 0.5))}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
                          title="Decrease servings"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono text-purple-300">
                          {aiDraft.servings}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateDraftServings((aiDraft.servings || 1) + 0.5)}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs"
                          title="Increase servings"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Macros Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="glass-card p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
                      <span className="text-[10px] uppercase font-bold text-pink-300">Calories</span>
                      <p className="text-lg font-extrabold text-white font-mono mt-0.5">
                        {aiDraft.caloriesPerServing}
                        <span className="text-[10px] text-pink-300 font-normal ml-0.5">kcal/srv</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {aiDraft.totalCalories} kcal total
                      </span>
                    </div>

                    <div className="glass-card p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                      <span className="text-[10px] uppercase font-bold text-indigo-300">Protein</span>
                      <p className="text-lg font-extrabold text-white font-mono mt-0.5">
                        {aiDraft.proteinPerServing}g
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {aiDraft.totalProteinGrams}g total
                      </span>
                    </div>

                    <div className="glass-card p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-300">Carbs</span>
                      <p className="text-lg font-extrabold text-white font-mono mt-0.5">
                        {aiDraft.carbsPerServing}g
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {aiDraft.totalCarbsGrams}g total
                      </span>
                    </div>

                    <div className="glass-card p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-300">Total Fat</span>
                      <p className="text-lg font-extrabold text-white font-mono mt-0.5">
                        {aiDraft.fatPerServing}g
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {aiDraft.totalFatGrams}g total
                      </span>
                    </div>

                    <div className="glass-card p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-purple-300">Fiber</span>
                      <p className="text-lg font-extrabold text-white font-mono mt-0.5">
                        {aiDraft.fiberPerServing || 0}g
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {aiDraft.totalFiberGrams || 0}g total
                      </span>
                    </div>
                  </div>

                  {/* Cooked Batch Yield Banner (if batch cooking) */}
                  {aiDraft.cookedWeightGrams && aiDraft.caloriesPer100gCooked && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
                      <span className="font-semibold">
                        Cooked Yield: {aiDraft.cookedWeightGrams}g batch
                      </span>
                      <span className="font-mono text-[11px]">
                        Per 100g Cooked: <strong>{aiDraft.caloriesPer100gCooked} kcal</strong> • P: {aiDraft.proteinPer100gCooked}g • C: {aiDraft.carbsPer100gCooked}g • F: {aiDraft.fatPer100gCooked}g
                      </span>
                    </div>
                  )}

                  {/* Ingredient Breakdown List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
                      <span>Ingredients ({aiDraft.ingredients.length})</span>
                      <span className="text-[10px] text-slate-400 normal-case">
                        Density-grounded macro calculations
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {aiDraft.ingredients.map((ing) => (
                        <div
                          key={ing.id}
                          className="p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">
                                {ing.matchedFoodName || ing.name}
                              </span>
                              {ing.isProposedDefault && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Proposed Default
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                {ing.matchStatus === "verified" ? "Verified IFCT/USDA" : "Grounded"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {ing.calories} kcal • P: {ing.proteinGrams}g • C: {ing.carbsGrams}g • F: {ing.fatGrams}g
                              {ing.fiberGrams ? ` • Fiber: ${ing.fiberGrams}g` : ""}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                              <button
                                type="button"
                                onClick={() => handleUpdateDraftIngredientQty(ing.id, -1)}
                                className="w-5 h-5 rounded hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs font-bold text-white px-1">
                                {ing.quantity} {ing.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateDraftIngredientQty(ing.id, 1)}
                                className="w-5 h-5 rounded hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white"
                                title="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveDraftIngredient(ing.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                              title="Remove ingredient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cooking Instructions */}
                  {aiDraft.instructions && aiDraft.instructions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-purple-400" />
                        <span>Preparation & Cooking Steps</span>
                      </h5>
                      <ol className="space-y-1.5 pl-4 list-decimal text-xs text-slate-300">
                        {aiDraft.instructions.map((step, idx) => (
                          <li key={idx} className="leading-relaxed pl-1">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Dietary Tags */}
                  {aiDraft.dietaryTags && aiDraft.dietaryTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {aiDraft.dietaryTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Turn Iterative Refinement Section */}
              {aiDraft && (
                <div className="glass-panel p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Iterative Refinements & Modifications:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Click to instantly tweak</span>
                  </div>

                  {/* Quick Tweak Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Make it higher in protein",
                      "Remove honey",
                      "Use skimmed milk",
                      "Make two servings",
                      "Reduce the amount of oil",
                    ].map((tweak) => (
                      <button
                        key={tweak}
                        type="button"
                        onClick={() => handleApplyTweak(tweak)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-400/40 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3 h-3 text-purple-400" />
                        <span>{tweak}</span>
                      </button>
                    ))}
                  </div>

                  {/* Free-form Tweak Input */}
                  <div className="relative pt-1">
                    <input
                      type="text"
                      placeholder="Type any custom modification (e.g. 'swap milk with almond milk', 'cut oil by half', 'add 50g paneer')..."
                      value={aiIterativePrompt}
                      onChange={(e) => setAiIterativePrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyTweak(aiIterativePrompt);
                        }
                      }}
                      className="w-full glass-input !py-2.5 !pl-3 !pr-20 text-xs bg-black/30 border border-white/10"
                    />
                    <button
                      type="button"
                      disabled={!aiIterativePrompt.trim()}
                      onClick={() => handleApplyTweak(aiIterativePrompt)}
                      className="absolute right-1.5 top-2.5 bottom-1 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40"
                    >
                      <span>Apply</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            {aiDraft && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleOpenAiDraftInRecipeBuilder}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
                  title="Open in manual Recipe Builder for in-depth ingredient customisation"
                >
                  <Edit className="w-3.5 h-3.5 text-purple-400" />
                  <span>Open in Recipe Builder</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAiDraftToRecipes}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/30 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>Save to My Recipes</span>
                  </button>

                  {/* 1-Click Direct Food Diary Logging Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAiDirectLogOpen(!isAiDirectLogOpen)}
                      className="btn-primary !text-xs !py-2 !px-4 shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log to Food Diary</span>
                    </button>

                    {isAiDirectLogOpen && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-48 glass-panel p-2 bg-[#0d1430]/95 border border-white/20 shadow-2xl rounded-2xl space-y-1 animate-in fade-in duration-150">
                        <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Select Meal:
                        </span>
                        {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((meal) => (
                          <button
                            key={meal}
                            type="button"
                            onClick={() => handleLogAiDraftToDiary(meal)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-600/30 text-xs font-semibold text-white capitalize flex items-center justify-between"
                          >
                            <span>{meal}</span>
                            <span className="text-[10px] font-mono text-purple-300">
                              {aiDraft.caloriesPerServing} kcal
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

