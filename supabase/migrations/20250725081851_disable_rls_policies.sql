-- Migracja: Wyłączenie wszystkich polityk RLS
-- Opis: Wyłącza wszystkie polityki RLS z poprzedniej migracji
-- Autor: AI Assistant
-- Data: 2024-07-25

-- Wyłączenie polityk dla profiles
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can create own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can delete own profile" on profiles;

-- Wyłączenie polityk dla recipes
drop policy if exists "Users can view own recipes" on recipes;
drop policy if exists "Users can create own recipes" on recipes;
drop policy if exists "Users can update own recipes" on recipes;
drop policy if exists "Users can delete own recipes" on recipes;

-- Wyłączenie polityk dla ai_runs
drop policy if exists "Users can view ai runs for own recipes" on ai_runs;
drop policy if exists "Users can create ai runs for own recipes" on ai_runs;
drop policy if exists "Users can update ai runs for own recipes" on ai_runs;
drop policy if exists "Users can delete ai runs for own recipes" on ai_runs;

-- Wyłączenie RLS dla wszystkich tabel
alter table if exists profiles disable row level security;
alter table if exists recipes disable row level security;
alter table if exists ai_runs disable row level security; 