-- SABFITNESS MIGRATION 002: CUSTOM FOODS, RECIPES & MEAL TEMPLATES
-- Tagline: Your fitness journey. Your goals.

-- 1. CUSTOM FOODS TABLE
CREATE TABLE IF NOT EXISTS public.custom_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  regional_name TEXT,
  brand TEXT,
  barcode TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  cuisine_region TEXT,
  serving_size NUMERIC(6, 2) NOT NULL DEFAULT 100,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  serving_weight_grams NUMERIC(6, 2) NOT NULL DEFAULT 100,
  allowed_units JSONB DEFAULT '[]'::jsonb,
  calories NUMERIC(6, 1) NOT NULL,
  protein_g NUMERIC(5, 1) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(5, 1) NOT NULL DEFAULT 0,
  fat_g NUMERIC(5, 1) NOT NULL DEFAULT 0,
  fiber_g NUMERIC(5, 1) DEFAULT 0,
  sugar_g NUMERIC(5, 1) DEFAULT 0,
  sodium_mg NUMERIC(6, 1) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom foods"
  ON public.custom_foods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. RECIPES TABLE
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  servings NUMERIC(4, 1) NOT NULL DEFAULT 1,
  prep_time_minutes INTEGER DEFAULT 0,
  cook_time_minutes INTEGER DEFAULT 0,
  instructions TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recipes"
  ON public.recipes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public recipes"
  ON public.recipes FOR SELECT
  USING (is_public = TRUE);

-- 3. RECIPE INGREDIENTS TABLE
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  food_item_id TEXT NOT NULL,
  food_item JSONB NOT NULL,
  quantity NUMERIC(6, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'g',
  weight_grams NUMERIC(6, 2),
  calories NUMERIC(6, 1) NOT NULL DEFAULT 0,
  protein_g NUMERIC(5, 1) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(5, 1) NOT NULL DEFAULT 0,
  fat_g NUMERIC(5, 1) NOT NULL DEFAULT 0,
  fiber_g NUMERIC(5, 1) DEFAULT 0,
  sugar_g NUMERIC(5, 1) DEFAULT 0,
  sodium_mg NUMERIC(6, 1) DEFAULT 0
);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ingredients through recipe ownership"
  ON public.recipe_ingredients FOR ALL
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

-- 4. SAVED MEAL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.meal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_meal_type TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meal templates"
  ON public.meal_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. EXTEND FOOD ENTRIES
ALTER TABLE public.food_entries 
  ADD COLUMN IF NOT EXISTS sugar_g NUMERIC(5, 1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
