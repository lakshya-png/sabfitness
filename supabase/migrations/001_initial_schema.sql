-- SABFITNESS INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Tagline: Your fitness journey. Your goals.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  birth_year INTEGER,
  gender TEXT DEFAULT 'prefer_not_to_say',
  height_cm NUMERIC(5, 2) DEFAULT 175.0,
  weight_kg NUMERIC(5, 2) DEFAULT 75.0,
  primary_goal TEXT NOT NULL DEFAULT 'maintain_fitness',
  secondary_goals TEXT[] DEFAULT '{}',
  activity_level TEXT NOT NULL DEFAULT 'moderate',
  training_experience TEXT NOT NULL DEFAULT 'intermediate',
  equipment TEXT NOT NULL DEFAULT 'full_gym',
  dietary_preference TEXT NOT NULL DEFAULT 'non_vegetarian',
  allergies TEXT[] DEFAULT '{}',
  unit_system TEXT NOT NULL DEFAULT 'metric',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  invite_code TEXT NOT NULL UNIQUE,
  daily_water_goal_ml INTEGER NOT NULL DEFAULT 3000,
  daily_calorie_target INTEGER NOT NULL DEFAULT 2200,
  daily_protein_target_g INTEGER NOT NULL DEFAULT 150,
  daily_carbs_target_g INTEGER NOT NULL DEFAULT 220,
  daily_fat_target_g INTEGER NOT NULL DEFAULT 65,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public registration trigger cannot elevate to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_invite_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INTEGER;
BEGIN
  -- Generate unique 6-char non-guessable invite code
  new_invite_code := 'SAB-';
  FOR i IN 1..6 LOOP
    new_invite_code := new_invite_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;

  INSERT INTO public.profiles (
    id,
    email,
    name,
    invite_code,
    is_admin
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    new_invite_code,
    FALSE -- Explicitly forbidden from becoming admin on signup
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically on auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. FITNESS GOALS HISTORY
-- Changing fitness goals must NEVER delete historical data
CREATE TABLE IF NOT EXISTS public.fitness_goals_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_primary TEXT NOT NULL,
  new_primary TEXT NOT NULL,
  previous_secondary TEXT[] DEFAULT '{}',
  new_secondary TEXT[] DEFAULT '{}',
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fitness_goals_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own goal history" ON public.fitness_goals_history;
CREATE POLICY "Users can view own goal history"
  ON public.fitness_goals_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert goal history" ON public.fitness_goals_history;
CREATE POLICY "Users can insert goal history"
  ON public.fitness_goals_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. WORKOUTS TABLE
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'discarded'
  total_volume_kg NUMERIC(10, 2) DEFAULT 0,
  personal_records_hit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workouts" ON public.workouts;
CREATE POLICY "Users can manage own workouts"
  ON public.workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. WORKOUT EXERCISES & SETS
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  category TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  rest_timer_seconds INTEGER DEFAULT 90
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage exercises through workout ownership" ON public.workout_exercises;
CREATE POLICY "Users can manage exercises through workout ownership"
  ON public.workout_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_id AND user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  set_type TEXT NOT NULL DEFAULT 'normal', -- normal, warmup, dropset, failure
  weight_kg NUMERIC(6, 2) DEFAULT 0,
  reps INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  distance_meters NUMERIC(8, 2) DEFAULT 0,
  rpe NUMERIC(3, 1),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_pr BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage sets through workout ownership" ON public.workout_sets;
CREATE POLICY "Users can manage sets through workout ownership"
  ON public.workout_sets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON we.workout_id = w.id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON we.workout_id = w.id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  ));

-- 6. NUTRITION & FOOD ITEMS
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  brand TEXT,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  serving_amount NUMERIC(6, 2) NOT NULL,
  serving_unit TEXT NOT NULL,
  calories NUMERIC(6, 1) NOT NULL,
  protein_g NUMERIC(5, 1) NOT NULL,
  carbs_g NUMERIC(5, 1) NOT NULL,
  fat_g NUMERIC(5, 1) NOT NULL,
  fiber_g NUMERIC(5, 1) DEFAULT 0,
  sodium_mg NUMERIC(6, 1) DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own food entries" ON public.food_entries;
CREATE POLICY "Users can manage own food entries"
  ON public.food_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. WATER LOGS
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own water logs" ON public.water_logs;
CREATE POLICY "Users can manage own water logs"
  ON public.water_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. SUPPLEMENTS & LOGS
CREATE TABLE IF NOT EXISTS public.supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  timing TEXT NOT NULL,
  schedule_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  reminder_time TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own supplements" ON public.supplements;
CREATE POLICY "Users can manage own supplements"
  ON public.supplements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.supplement_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES public.supplements(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, taken, skipped
  logged_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own supplement logs" ON public.supplement_logs;
CREATE POLICY "Users can manage own supplement logs"
  ON public.supplement_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. BODY MEASUREMENTS
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5, 2),
  waist_cm NUMERIC(5, 2),
  chest_cm NUMERIC(5, 2),
  left_arm_cm NUMERIC(5, 2),
  right_arm_cm NUMERIC(5, 2),
  left_thigh_cm NUMERIC(5, 2),
  right_thigh_cm NUMERIC(5, 2),
  hips_cm NUMERIC(5, 2),
  body_fat_percentage NUMERIC(4, 1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own measurements" ON public.body_measurements;
CREATE POLICY "Users can manage own measurements"
  ON public.body_measurements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. PROGRESS PHOTOS (PRIVATE STORAGE ONLY)
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pose TEXT NOT NULL DEFAULT 'front', -- front, side, back, flexed
  storage_path TEXT NOT NULL,
  weight_kg NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own progress photos" ON public.progress_photos;
CREATE POLICY "Users can manage own progress photos"
  ON public.progress_photos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. SOCIAL RELATIONSHIPS & GRANULAR SHARING
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, blocked
  share_workouts BOOLEAN NOT NULL DEFAULT TRUE,
  share_consistency BOOLEAN NOT NULL DEFAULT TRUE,
  share_prs BOOLEAN NOT NULL DEFAULT TRUE,
  share_strength_progress BOOLEAN NOT NULL DEFAULT FALSE,
  share_weight BOOLEAN NOT NULL DEFAULT FALSE, -- PRIVATE BY DEFAULT
  share_measurements BOOLEAN NOT NULL DEFAULT FALSE, -- PRIVATE BY DEFAULT
  share_nutrition BOOLEAN NOT NULL DEFAULT FALSE, -- PRIVATE BY DEFAULT
  share_photos BOOLEAN NOT NULL DEFAULT FALSE, -- PRIVATE BY DEFAULT
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own friendships" ON public.friendships;
CREATE POLICY "Users can read own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can manage friendships" ON public.friendships;
CREATE POLICY "Users can manage friendships"
  ON public.friendships FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id);

-- 12. PROGRESS CARDS
CREATE TABLE IF NOT EXISTS public.progress_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'glass_midnight',
  metric_type TEXT NOT NULL,
  highlight_stat TEXT NOT NULL,
  secondary_stat TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.progress_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own progress cards" ON public.progress_cards;
CREATE POLICY "Users can manage own progress cards"
  ON public.progress_cards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 14. AUDIT LOGS (SOLE OWNER ADMIN ONLY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only verified owner admin can read audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_id);
