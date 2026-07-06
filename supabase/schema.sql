-- Run this in the Supabase SQL editor to set up the game_rooms table

create table if not exists game_rooms (
  code text primary key,
  seed text not null,
  players jsonb not null default '[]',
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

-- Migration from old two-player schema (run if upgrading):
-- alter table game_rooms add column if not exists players jsonb not null default '[]';
-- alter table game_rooms drop column if exists player1_name;
-- alter table game_rooms drop column if exists player2_name;
-- alter table game_rooms drop column if exists player1_times;
-- alter table game_rooms drop column if exists player2_times;
-- alter table game_rooms drop column if exists player1_done;
-- alter table game_rooms drop column if exists player2_done;
