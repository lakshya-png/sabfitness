-- SABFITNESS MIGRATION 004: PERSONALIZED GOAL WEIGHT & NUTRITION CALCULATOR
-- Tagline: Your fitness journey. Your goals.

-- 1. EXTEND PROFILES TABLE WITH PERSONALIZED GOAL ATTRIBUTES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_weight_kg NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS workout_frequency_per_week INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
  ADD COLUMN IF NOT EXISTS food_preferences_notes TEXT,
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS active_recommendation_version TEXT DEFAULT 'v2026.2';

-- 2. CREATE GOAL RECOMMENDATION HISTORY TABLE (AUDITABLE VERSIONED GOAL & NUTRITION ARCHIVE)
CREATE TABLE IF NOT EXISTS public.goal_recommendation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT 'v2026.2',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason_for_change TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS) FOR RECOMMENDATION HISTORY
ALTER TABLE public.goal_recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goal recommendation history"
  ON public.goal_recommendation_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. PERFORMANCE INDEX FOR AUDITABLE VERSION RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_goal_rec_user_date
  ON public.goal_recommendation_history(user_id, effective_date DESC, created_at DESC);
