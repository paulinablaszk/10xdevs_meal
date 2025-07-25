-- Migracja: Inicjalna struktura bazy danych dla aplikacji MealPlanner
-- Opis: Tworzy wszystkie tabele, typy, funkcje i polityki bezpieczeństwa
-- Autor: AI Assistant
-- Data: 2024-07-25

-- Najpierw tworzymy typy enum
create type unit_type as enum (
  'g', 'dag', 'kg', 'ml', 'l', 'łyżeczka', 'łyżka', 'szklanka',
  'pęczek', 'garść', 'sztuka', 'plaster', 'szczypta', 'ząbek'
);

create type ai_status as enum (
  'pending', 'success', 'error'
);

-- Funkcja do automatycznej aktualizacji updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Funkcja walidująca format składników
create or replace function validate_ingredients(ingredients jsonb)
returns boolean as $$
declare
  ingredient record;
begin
  -- sprawdź czy to tablica
  if not jsonb_typeof(ingredients) = 'array' then
    return false;
  end if;

  -- sprawdź każdy element tablicy
  for ingredient in select * from jsonb_array_elements(ingredients) loop
    -- sprawdź wymagane pola i ich typy
    if not (
      ingredient.value ? 'name' and 
      jsonb_typeof(ingredient.value->'name') = 'string' and
      ingredient.value ? 'amount' and 
      jsonb_typeof(ingredient.value->'amount') = 'number' and
      (ingredient.value->>'amount')::numeric > 0 and
      ingredient.value ? 'unit' and 
      jsonb_typeof(ingredient.value->'unit') = 'string' and
      (ingredient.value->>'unit')::unit_type is not null
    ) then
      return false;
    end if;
  end loop;

  return true;
end;
$$ language plpgsql;

-- Tabela profiles
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  calorie_target numeric(10,2) not null check (calorie_target >= 0),
  allergens jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger dla updated_at w profiles
create trigger set_updated_at_profiles
  before update on profiles
  for each row
  execute function set_updated_at();

-- Tabela recipes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(120) not null,
  description text,
  ingredients jsonb not null check (
    jsonb_array_length(ingredients) > 0 and
    validate_ingredients(ingredients)
  ),
  steps jsonb not null,
  kcal numeric(10,2) check (kcal >= 0),
  protein_g numeric(10,2) check (protein_g >= 0),
  fat_g numeric(10,2) check (fat_g >= 0),
  carbs_g numeric(10,2) check (carbs_g >= 0),
  is_manual_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger dla updated_at w recipes
create trigger set_updated_at_recipes
  before update on recipes
  for each row
  execute function set_updated_at();

-- Trigger ograniczający liczbę przepisów na użytkownika
create or replace function enforce_recipe_limit()
returns trigger as $$
begin
  if (
    select count(*) from recipes 
    where user_id = new.user_id
  ) >= 100 then
    raise exception 'Przekroczono limit 100 przepisów na użytkownika';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_recipe_limit
  before insert on recipes
  for each row
  execute function enforce_recipe_limit();

-- Tabela ai_runs
create table ai_runs (
  id bigint generated always as identity primary key,
  recipe_id uuid not null references recipes(id) on delete cascade,
  status ai_status not null,
  prompt text not null,
  response jsonb,
  error_message text,
  confidence numeric(5,4) check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

-- Indeksy
create index recipes_user_id_idx on recipes (user_id);
create index recipes_ingredients_idx on recipes using gin (ingredients jsonb_path_ops);
create index ai_runs_recipe_id_idx on ai_runs (recipe_id);
create index ai_runs_created_at_idx on ai_runs (created_at desc);

-- Włączenie RLS
alter table profiles enable row level security;
alter table recipes enable row level security;
alter table ai_runs enable row level security;

-- Polityki RLS dla profiles

-- Polityka select dla authenticated - użytkownik może widzieć tylko swój profil
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = user_id);

-- Polityka insert dla authenticated - użytkownik może utworzyć tylko swój profil
create policy "Users can create own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Polityka update dla authenticated - użytkownik może aktualizować tylko swój profil
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Polityka delete dla authenticated - użytkownik może usunąć tylko swój profil
create policy "Users can delete own profile"
  on profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- Polityki RLS dla recipes

-- Polityka select dla authenticated - użytkownik widzi tylko swoje przepisy
create policy "Users can view own recipes"
  on recipes for select
  to authenticated
  using (auth.uid() = user_id);

-- Polityka insert dla authenticated - użytkownik może tworzyć tylko swoje przepisy
create policy "Users can create own recipes"
  on recipes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Polityka update dla authenticated - użytkownik może aktualizować tylko swoje przepisy
create policy "Users can update own recipes"
  on recipes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Polityka delete dla authenticated - użytkownik może usuwać tylko swoje przepisy
create policy "Users can delete own recipes"
  on recipes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Polityki RLS dla ai_runs

-- Polityka select dla authenticated - użytkownik widzi tylko ai_runs dla swoich przepisów
create policy "Users can view ai runs for own recipes"
  on ai_runs for select
  to authenticated
  using (
    recipe_id in (
      select id from recipes where user_id = auth.uid()
    )
  );

-- Polityka insert dla authenticated - użytkownik może tworzyć ai_runs tylko dla swoich przepisów
create policy "Users can create ai runs for own recipes"
  on ai_runs for insert
  to authenticated
  with check (
    recipe_id in (
      select id from recipes where user_id = auth.uid()
    )
  );

-- Polityka update dla authenticated - użytkownik może aktualizować ai_runs tylko dla swoich przepisów
create policy "Users can update ai runs for own recipes"
  on ai_runs for update
  to authenticated
  using (
    recipe_id in (
      select id from recipes where user_id = auth.uid()
    )
  )
  with check (
    recipe_id in (
      select id from recipes where user_id = auth.uid()
    )
  );

-- Polityka delete dla authenticated - użytkownik może usuwać ai_runs tylko dla swoich przepisów
create policy "Users can delete ai runs for own recipes"
  on ai_runs for delete
  to authenticated
  using (
    recipe_id in (
      select id from recipes where user_id = auth.uid()
    )
  ); 