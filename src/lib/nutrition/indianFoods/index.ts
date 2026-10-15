import { INDIAN_FOOD_LIBRARY } from "./foodEntries";
import type { FoodItemDefinition, FoodCategory, IndianRegion } from "@/types/nutrition";
export { INDIAN_FOOD_LIBRARY } from "./foodEntries";
export * from "./units";

export interface IndianFoodSearchFilters {
  category?: FoodCategory | "all";
  region?: IndianRegion | "all";
  isVeg?: boolean;
  highProtein?: boolean;
  minCalories?: number;
  maxCalories?: number;
  limit?: number;
}

// Pre-index foods for faster token lookup
const foodLookupMap = new Map<string, FoodItemDefinition>();
for (const food of INDIAN_FOOD_LIBRARY) {
  foodLookupMap.set(food.id, food);
}

export function getIndianFoodById(id: string): FoodItemDefinition | undefined {
  return foodLookupMap.get(id);
}

/**
 * Searches the Indian food library with multi-token matching and flexible filters.
 */
export function searchIndianFoods(
  query: string = "",
  filters: IndianFoodSearchFilters = {}
): FoodItemDefinition[] {
  const {
    category = "all",
    region = "all",
    isVeg,
    highProtein,
    minCalories,
    maxCalories,
    limit = 50,
  } = filters;

  const normalizedQuery = query.trim().toLowerCase();
  const queryTokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  const results: { food: FoodItemDefinition; score: number }[] = [];

  for (const food of INDIAN_FOOD_LIBRARY) {
    // Category filter
    if (category && category !== "all" && food.category !== category) {
      continue;
    }

    // Region filter
    if (region && region !== "all" && food.cuisineRegion !== region) {
      continue;
    }

    // Veg / Non-veg filter
    if (isVeg === true) {
      if (food.category === "non_veg" || food.category === "eggs" || food.tags?.includes("non_veg")) {
        continue;
      }
    }

    // High Protein filter (>= 8g protein per 100g / serving)
    if (highProtein === true) {
      const proteinDensity = (food.proteinGrams / (food.servingWeightGrams || 100)) * 100;
      if (proteinDensity < 8 && food.proteinGrams < 8) {
        continue;
      }
    }

    // Calories range filter
    if (minCalories !== undefined && food.calories < minCalories) continue;
    if (maxCalories !== undefined && food.calories > maxCalories) continue;

    // Search query relevance scoring
    if (queryTokens.length === 0) {
      results.push({ food, score: 1 });
      continue;
    }

    const nameLower = food.name.toLowerCase();
    const regionalLower = (food.regionalName || "").toLowerCase();
    const tagsLower = (food.tags || []).join(" ").toLowerCase();
    const fullSearchText = `${nameLower} ${regionalLower} ${tagsLower} ${food.category || ""} ${food.cuisineRegion || ""}`;

    let matchCount = 0;
    let score = 0;

    for (const token of queryTokens) {
      if (fullSearchText.includes(token)) {
        matchCount++;
        // Boost if matches start of word or primary dish name
        if (nameLower.startsWith(token) || regionalLower.startsWith(token)) {
          score += 15;
        } else if (nameLower.includes(` ${token}`) || regionalLower.includes(` ${token}`)) {
          score += 10;
        } else if (tagsLower.includes(token)) {
          score += 5;
        } else {
          score += 2;
        }
      }
    }

    // Must match all tokens for high precision, or at least 1 token if single word
    if (matchCount === queryTokens.length) {
      results.push({ food, score });
    }
  }

  // Sort descending by relevance score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit).map((r) => r.food);
}

/**
 * Common staple Indian foods for quick picking without typing
 */
export function getPopularIndianFoods(limit = 20): FoodItemDefinition[] {
  const stapleKeywords = [
    "roti_wheat_plain",
    "paratha_plain",
    "rice_basmati_cooked",
    "dal_yellow_moong",
    "dal_tadka_toor",
    "paneer_raw",
    "paneer_bhurji",
    "egg_boiled",
    "egg_bhurji",
    "chicken_curry_homestyle",
    "dahi_curd_plain",
    "idli_rice_urad",
    "dosa_plain_sada",
    "poha_onion_kanda",
    "upma_rava_vegetable",
    "khichdi_moong_dal",
    "chana_masala_chole",
    "rajma_curry",
    "masala_chai",
    "ghee_cow",
  ];

  const staples: FoodItemDefinition[] = [];
  for (const kw of stapleKeywords) {
    const match = INDIAN_FOOD_LIBRARY.find((f) => f.id.includes(kw));
    if (match && !staples.some((s) => s.id === match.id)) {
      staples.push(match);
    }
  }

  // Fill up if needed
  if (staples.length < limit) {
    for (const food of INDIAN_FOOD_LIBRARY) {
      if (!staples.some((s) => s.id === food.id)) {
        staples.push(food);
        if (staples.length >= limit) break;
      }
    }
  }

  return staples.slice(0, limit);
}

/**
 * Return all distinct categories present in library
 */
export function getIndianFoodCategories(): { value: FoodCategory; label: string }[] {
  return [
    { value: "breads_rotis", label: "Rotis & Breads" },
    { value: "rice_khichdi_biryani", label: "Rice & Biryani" },
    { value: "dals_lentils_curries", label: "Dals & Lentils" },
    { value: "sabzi_curry", label: "Sabzis & Veg Curries" },
    { value: "dairy_paneer", label: "Dairy & Paneer" },
    { value: "breakfast_tiffin", label: "Breakfast & Tiffin" },
    { value: "snacks_street_food", label: "Snacks & Street Food" },
    { value: "non_veg", label: "Meat & Poultry" },
    { value: "seafood", label: "Fish & Seafood" },
    { value: "eggs", label: "Eggs" },
    { value: "sweets_desserts", label: "Mithai & Desserts" },
    { value: "beverages", label: "Chai & Drinks" },
    { value: "chutneys_pickles", label: "Chutneys & Pickles" },
    { value: "cooking_fats_spices", label: "Oils, Ghee & Spices" },
    { value: "fruits_nuts_seeds", label: "Fruits & Dry Fruits" },
    { value: "raw_staples", label: "Raw Staples & Flours" },
  ];
}

/**
 * Return all distinct regional cuisines
 */
export function getIndianCuisineRegions(): IndianRegion[] {
  return [
    "North Indian",
    "South Indian",
    "Punjabi",
    "Gujarati",
    "Maharashtrian",
    "Bengali",
    "Rajasthani",
    "Kerala",
    "Andhra / Telugu",
    "Tamil",
    "Karnataka",
    "Goan",
    "Kashmiri",
    "Mughlai",
    "Indo-Chinese",
    "Pan-Indian",
  ];
}
