# 1. Tabele

## 1.1 `profiles`
| Kolumna            | Typ danych           | Ograniczenia                                          |
|--------------------|----------------------|-------------------------------------------------------|
| `user_id`          | uuid                 | PRIMARY KEY, REFERENCES `auth`.`users`(id) ON DELETE CASCADE |
| `calorie_target`   | numeric(10,2)        | NOT NULL, CHECK (`calorie_target` >= 0)               |
| `allergens`        | jsonb                | NOT NULL DEFAULT '[]'                                 |
| `created_at`       | timestamptz          | NOT NULL DEFAULT now()                                |
| `updated_at`       | timestamptz          | NOT NULL DEFAULT now()                                |

> Trigger `set_updated_at_profiles` aktualizuje `updated_at` przy każdej modyfikacji rekordu.

---

## 1.2 `recipes`
| Kolumna          | Typ danych           | Ograniczenia                                                                              |
|------------------|----------------------|-------------------------------------------------------------------------------------------|
| `id`             | uuid                 | PRIMARY KEY, DEFAULT gen_random_uuid()                                                   |
| `user_id`        | uuid                 | NOT NULL, REFERENCES `auth`.`users`(id) ON DELETE CASCADE                                 |
| `name`           | varchar(120)         | NOT NULL                                                                                  |
| `description`    | text                 | NULLABLE                                                                                  |
| `ingredients`    | jsonb                | NOT NULL, CHECK (jsonb_array_length(`ingredients`) > 0), CHECK (validate_ingredients(`ingredients`)) |
| `steps`          | jsonb                | NOT NULL                                                                                  |
| `kcal`           | numeric(10,2)        | CHECK (`kcal` >= 0)                                                                       |
| `protein_g`      | numeric(10,2)        | CHECK (`protein_g` >= 0)                                                                  |
| `fat_g`          | numeric(10,2)        | CHECK (`fat_g` >= 0)                                                                      |
| `carbs_g`        | numeric(10,2)        | CHECK (`carbs_g` >= 0)                                                                    |
| `is_manual_override` | boolean          | NOT NULL DEFAULT false                                                                    |
| `created_at`     | timestamptz          | NOT NULL DEFAULT now()                                                                    |
| `updated_at`     | timestamptz          | NOT NULL DEFAULT now()                                                                    |

> Triggery:
> * `set_updated_at_recipes` – aktualizuje `updated_at` przy UPDATE.
> * `enforce_recipe_limit` – BEFORE INSERT, wymusza ≤ 100 przepisów na użytkownika.

---

## 1.3 `ai_runs`
| Kolumna        | Typ danych            | Ograniczenia                                                                    |
|----------------|-----------------------|---------------------------------------------------------------------------------|
| `id`           | bigint GENERATED ALWAYS AS IDENTITY | PRIMARY KEY                                                   |
| `recipe_id`    | uuid                 | NOT NULL, REFERENCES `recipes`(id) ON DELETE CASCADE                           |
| `status`       | ai_status            | NOT NULL                                                                       |
| `prompt`       | text                 | NOT NULL                                                                       |
| `response`     | jsonb                | NULLABLE                                                                       |
| `error_message`| text                 | NULLABLE                                                                       |
| `confidence`   | numeric(5,4)         | NULLABLE, CHECK (`confidence` BETWEEN 0 AND 1)                                 |
| `created_at`   | timestamptz          | NOT NULL DEFAULT now()                                                         |

---

## 1.4 Typy ENUM & Funkcje pomocnicze
* `unit_type` ENUM: `'g', 'dag', 'kg', 'ml', 'l', 'łyżeczka', 'łyżka', 'szklanka', 'pęczek', 'garść', 'sztuka', 'plaster', 'szczypta', 'ząbek',`
* `ai_status` ENUM: `'pending', 'success', 'error'`
* Funkcja `validate_ingredients(ingredients jsonb)`
  * Sprawdza że każda pozycja zawiera pola `name` (text), `amount` (numeric > 0), `unit` (w zakresie `unit_type`).

# 2. Relacje między tabelami
1. `profiles` 1 : 1 `auth.users` (PK = FK).
2. `auth.users` 1 : N `recipes` (po `user_id`).
3. `recipes` 1 : N `ai_runs` (po `recipe_id`).

# 3. Indeksy
| Tabela          | Kolumna / Wyrażenie                           | Typ indeksu                 | Cel |
|-----------------|------------------------------------------------|-----------------------------|-----|
| `recipes`       | (`user_id`)                                   | BTREE                       | Szybkie filtrowanie przepisów użytkownika |
| `recipes`       | USING GIN (`ingredients` jsonb_path_ops)       | GIN                         | Wyszukiwanie po składnikach              |
| `ai_runs`       | (`recipe_id`)                                 | BTREE                       | Szybkie dołączenia do przepisów          |
| `ai_runs`       | (`created_at` DESC)                           | BTREE                       | Szybkie pobieranie najnowszych logów     |

# 4. Zasady PostgreSQL RLS
```sql
-- Włączenie RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;

-- Polityka dla recipes (tylko właściciel)
CREATE POLICY recipes_owner ON recipes
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Polityka dla ai_runs (dziedziczy właściciela przepisu)
CREATE POLICY ai_runs_owner ON ai_runs
  USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = auth.uid()));
```

# 5. Dodatkowe uwagi
* Wszystkie znaczniki czasu przechowywane są w UTC (`timestamptz`).
* Schemat `auth` z tabelą `users` jest tworzony i zarządzany automatycznie przez Supabase Auth; nasze FK `user_id` wskazują na `auth.users(id)` i nie wymagają własnej definicji w migracjach.
* Usunięcia wykonywane są twardo (`DELETE`), bez wersjonowania ani kolumn `status`.
* Rozszerzanie `unit_type` odbywa się poprzez `ALTER TYPE … ADD VALUE` w migracjach.
* Partycjonowanie, mikroskładniki i importy masowe zostały odroczone poza MVP. 