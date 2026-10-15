-- SABFITNESS MIGRATION 003: WORKOUT PLANNER & EXERCISE LIBRARY
-- Tagline: Your fitness journey. Your goals.

-- 1. CUSTOM EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.custom_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  secondary_muscles TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'other',
  movement_type TEXT,
  tracking_mode TEXT NOT NULL DEFAULT 'reps_weight',
  difficulty TEXT DEFAULT 'intermediate',
  equipment TEXT,
  instructions TEXT,
  form_cues TEXT[] DEFAULT '{}',
  common_mistakes TEXT[] DEFAULT '{}',
  safety_tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own custom exercises" ON public.custom_exercises;
CREATE POLICY "Users can manage own custom exercises"
  ON public.custom_exercises FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. FAVORITE EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.favorite_exercises (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, exercise_id)
);

ALTER TABLE public.favorite_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorite exercises" ON public.favorite_exercises;
CREATE POLICY "Users can manage own favorite exercises"
  ON public.favorite_exercises FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. WORKOUT WEEKLY TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.workout_weekly_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  days JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workout_weekly_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own weekly workout templates" ON public.workout_weekly_templates;
CREATE POLICY "Users can manage own weekly workout templates"
  ON public.workout_weekly_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. WORKOUT DAY OVERRIDES (Single-Week Independence & Exception Layer)
CREATE TABLE IF NOT EXISTS public.workout_day_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  rest_notes TEXT,
  workout_name TEXT,
  split_type TEXT DEFAULT 'custom',
  muscle_groups TEXT[] DEFAULT '{}',
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'skipped', 'rest')),
  skip_reason TEXT,
  workout_session_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

ALTER TABLE public.workout_day_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own day overrides" ON public.workout_day_overrides;
CREATE POLICY "Users can manage own day overrides"
  ON public.workout_day_overrides FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Add plan_date and template_id to workouts for fast day resolution
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS plan_date DATE;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS template_id TEXT;
CREATE INDEX IF NOT EXISTS idx_workouts_plan_date ON public.workouts(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_workout_day_overrides_date ON public.workout_day_overrides(user_id, plan_date);

-- 6. COMPATIBILITY VIEW (Allows any query or tool expecting workout_sessions to resolve transparently)
-- Uses security_invoker = true so PostgreSQL enforces underlying table RLS on the caller
CREATE OR REPLACE VIEW public.workout_sessions
WITH (security_invoker = true) AS
  SELECT * FROM public.workouts;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
