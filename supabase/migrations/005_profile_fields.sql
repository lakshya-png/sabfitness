-- Migration: Add extra profile fields for full name, fitness goal, and target weight
-- File: supabase/migrations/002_profile_fields.sql

-- 1. Add missing columns to public.profiles if they do not exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
  ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC;

-- 2. Update handle_new_user trigger to save metadata fields to profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_invite_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INTEGER;
  raw_full_name TEXT;
  raw_goal TEXT;
  raw_target_weight NUMERIC;
BEGIN
  -- Generate guaranteed-unique invite code
  LOOP
    new_invite_code := 'SAB-';
    FOR i IN 1..6 LOOP
      new_invite_code := new_invite_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = new_invite_code);
  END LOOP;

  raw_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, 'athlete'), '@', 1)
  );
  raw_goal := NEW.raw_user_meta_data->>'fitness_goal';
  raw_target_weight := CASE 
    WHEN (NEW.raw_user_meta_data->>'target_weight_kg') ~ '^[0-9]+(\.[0-9]+)?$' 
    THEN (NEW.raw_user_meta_data->>'target_weight_kg')::NUMERIC 
    ELSE NULL 
  END;

  INSERT INTO public.profiles (
    id,
    email,
    name,
    full_name,
    fitness_goal,
    target_weight_kg,
    invite_code,
    is_admin
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    raw_full_name,
    raw_full_name,
    raw_goal,
    raw_target_weight,
    new_invite_code,
    FALSE -- Explicitly forbidden from becoming admin on signup
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    fitness_goal = COALESCE(EXCLUDED.fitness_goal, public.profiles.fitness_goal),
    target_weight_kg = COALESCE(EXCLUDED.target_weight_kg, public.profiles.target_weight_kg),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
