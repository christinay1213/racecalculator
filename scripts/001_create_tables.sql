-- Create races table
CREATE TABLE IF NOT EXISTS public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  edit_pin TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'setup',
  current_leg_index INT NOT NULL DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create runners table
CREATE TABLE IF NOT EXISTS public.runners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pr_distance TEXT NOT NULL,
  pr_time_seconds INT NOT NULL,
  estimated_pace NUMERIC NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Create legs table
CREATE TABLE IF NOT EXISTS public.legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  leg_number INT NOT NULL,
  distance NUMERIC NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  runner_id UUID REFERENCES public.runners(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  actual_pace NUMERIC,
  fatigue_level INT,
  system_suggested_fatigue INT,
  UNIQUE(race_id, leg_number)
);
