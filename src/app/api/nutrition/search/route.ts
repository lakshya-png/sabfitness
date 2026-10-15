import { NextResponse } from "next/server";
import type { FoodItemDefinition } from "@/types/nutrition";

interface CacheEntry {
  timestamp: number;
  data: FoodItemDefinition[];
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], cached: false });
  }

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.data, cached: true });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=25&fields=product_name,product_name_en,brands,code,serving_size,serving_quantity,nutriments`;

    const res = await fetch(offUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SabFitnessApp - Web - Version 1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open Food Facts returned status ${res.status}`);
    }

    const data = await res.json();
    const products: any[] = Array.isArray(data.products) ? data.products : [];

    const results: FoodItemDefinition[] = [];

    for (const p of products) {
      const name = p.product_name || p.product_name_en;
      if (!name) continue;

      const n = p.nutriments || {};
      const cal = n["energy-kcal_100g"] ?? n["energy-kcal"] ?? (n.energy_100g ? Math.round(n.energy_100g / 4.184) : 0);
      const protein = n.proteins_100g ?? n.proteins ?? 0;
      const carbs = n.carbohydrates_100g ?? n.carbohydrates ?? 0;
      const fat = n.fat_100g ?? n.fat ?? 0;
      const fiber = n.fiber_100g ?? n.fiber ?? 0;
      const sugar = n.sugars_100g ?? n.sugars ?? 0;
      const sodium = n.sodium_100g ? Math.round(n.sodium_100g * 1000) : (n.salt_100g ? Math.round(n.salt_100g * 400) : 0);

      // Serving size parsing
      const servingWeight = Number(p.serving_quantity) || 100;

      results.push({
        id: `off_${p.code || Math.random().toString(36).slice(2, 9)}`,
        name: name.slice(0, 80),
        brand: p.brands ? p.brands.split(",")[0].trim() : undefined,
        barcode: p.code,
        category: "packaged_food",
        servingSize: 100,
        servingUnit: "g",
        servingWeightGrams: 100,
        allowedUnits: [
          { unit: "g", label: "Grams (g)", factorToGrams: 1 },
          ...(servingWeight !== 100
            ? [{ unit: "serving", label: `Serving (${servingWeight}g)`, factorToGrams: servingWeight }]
            : []),
        ],
        calories: Math.round(cal),
        proteinGrams: Math.round(protein * 10) / 10,
        carbsGrams: Math.round(carbs * 10) / 10,
        fatGrams: Math.round(fat * 10) / 10,
        fiberGrams: Math.round(fiber * 10) / 10,
        sugarGrams: Math.round(sugar * 10) / 10,
        sodiumMg: Math.round(sodium),
        source: "open_food_facts",
      });
    }

    // Cache the result
    if (searchCache.size > 200) {
      searchCache.clear();
    }
    searchCache.set(cacheKey, { timestamp: Date.now(), data: results });

    return NextResponse.json({ results, cached: false, count: results.length });
  } catch (err: any) {
    // Offline resilience: return empty results without breaking the UI
    return NextResponse.json({
      results: [],
      error: "Search service unavailable or offline",
      details: err?.message,
    });
  }
}
