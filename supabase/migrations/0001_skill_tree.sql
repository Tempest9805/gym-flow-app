-- Calisthenics skill-tree foundation
-- Spec: docs/superpowers/specs/2026-06-13-calistenia-skill-tree-design.md

-- 1. profiles: equipment the user has at home
alter table public.profiles
  add column if not exists available_equipment text[] not null default '{}';

-- 2. exercise_progressions: skill-tree structure (public content)
create table if not exists public.exercise_progressions (
  id uuid primary key default gen_random_uuid(),
  path text not null check (path in ('push','pull','core','legs','skill')),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  level int not null check (level >= 1),
  tier text not null check (tier in ('beginner','intermediate','advanced')),
  unlock_reps int,
  unlock_hold_seconds int,
  prerequisite_exercise_id uuid references public.exercises(id) on delete set null,
  equipment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_exercise_progressions_path
  on public.exercise_progressions(path, level);

-- 3. challenges: catalog of retos (public content)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_es text not null,
  challenge_tier int not null check (challenge_tier between 1 and 4),
  kind text not null check (kind in ('skill','volume_reps','hold_time','reps_in_time')),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  target_reps int,
  target_seconds int,
  time_window_seconds int,
  equipment text,
  readiness_rule jsonb,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. workout_logs: per-set performance
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  reps int,
  seconds int,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_workout_logs_user
  on public.workout_logs(user_id, exercise_id);

-- 5. user_skill_progress: per-user node state
create table if not exists public.user_skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  status text not null default 'locked'
    check (status in ('locked','available','in_progress','mastered')),
  best_reps int,
  best_hold_seconds int,
  mastered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- 6. user_challenge_progress: per-user reto state
create table if not exists public.user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status text not null default 'locked'
    check (status in ('locked','ready','attempted','achieved')),
  readiness numeric not null default 0 check (readiness >= 0 and readiness <= 100),
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

-- 7. Row Level Security
alter table public.exercise_progressions enable row level security;
alter table public.challenges enable row level security;
alter table public.workout_logs enable row level security;
alter table public.user_skill_progress enable row level security;
alter table public.user_challenge_progress enable row level security;

-- Public read for content tables
create policy "progressions readable" on public.exercise_progressions
  for select using (true);
create policy "challenges readable" on public.challenges
  for select using (true);

-- Per-user access for user-owned tables
create policy "own workout logs" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own skill progress" on public.user_skill_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own challenge progress" on public.user_challenge_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
