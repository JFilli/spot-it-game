-- Run this in the Supabase SQL editor to set up the game_rooms table

create table if not exists game_rooms (
  code text primary key,
  seed text not null,
  grid_size integer not null default 3,
  mode text not null default 'async',
  players jsonb not null default '[]',
  race jsonb,
  created_at timestamptz not null default now()
);

alter table game_rooms enable row level security;

create policy "Anyone can read game rooms"
  on game_rooms for select
  using (true);

create policy "Anyone can insert game rooms"
  on game_rooms for insert
  with check (true);

create policy "Anyone can update game rooms"
  on game_rooms for update
  using (true);

-- Enable realtime for live lobby updates
alter publication supabase_realtime add table game_rooms;

-- Migration: add grid size support (run in Supabase SQL editor if upgrading):
-- alter table game_rooms add column if not exists grid_size integer not null default 3;

-- Migration: add 1v1 race mode support (run in Supabase SQL editor):
-- alter table game_rooms add column if not exists mode text not null default 'async';
-- alter table game_rooms add column if not exists race jsonb;

-- Solo global leaderboard (run in Supabase SQL editor):
-- create table if not exists solo_leaderboard (
--   id uuid primary key default gen_random_uuid(),
--   player_id text not null,
--   player_name text not null,
--   grid_size integer not null,
--   total_ms integer not null,
--   created_at timestamptz not null default now()
-- );
-- create index if not exists solo_leaderboard_grid_time_idx on solo_leaderboard (grid_size, total_ms);
-- alter table solo_leaderboard enable row level security;
-- create policy "Anyone can read solo leaderboard" on solo_leaderboard for select using (true);
-- create policy "Anyone can insert solo leaderboard" on solo_leaderboard for insert with check (true);
-- create policy "Anyone can delete solo leaderboard" on solo_leaderboard for delete using (true);

-- Migration from old two-player schema (run if upgrading):
-- alter table game_rooms add column if not exists players jsonb not null default '[]';
-- alter table game_rooms drop column if exists player1_name;
-- alter table game_rooms drop column if exists player2_name;
-- alter table game_rooms drop column if exists player1_times;
-- alter table game_rooms drop column if exists player2_times;
-- alter table game_rooms drop column if exists player1_done;
-- alter table game_rooms drop column if exists player2_done;
