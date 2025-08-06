# REST API Plan

## 1. Resources

| Resource | DB Table / Enum           | Description                                                                                                                |
| -------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Profile  | `public.profiles`         | Stores user dietary preferences such as allergens and daily calorie target. One-to-one with Supabase `auth.users`.         |
| Recipe   | `public.recipes`          | A private cooking recipe owned by a user. Contains nutritional information either calculated by AI or manually overridden. |
| Unit     | `public.unit_type` (enum) | Allowed measurement units for ingredients (read-only reference list).                                                      |

## 2. Endpoints

> All URLs are prefixed with `/api` and return JSON. All endpoints require a valid Supabase JWT in the `Authorization: Bearer <token>` header **unless explicitly stated otherwise**.

### 2.2 Profile

| Method | Path         | Description                      |
| ------ | ------------ | -------------------------------- |
| GET    | /api/profile | Retrieve current user profile    |
| POST   | /api/profile | Create profile (first-time only) |
| PATCH  | /api/profile | Update profile preferences       |

##### 2.3.1 GET /api/recipes

Returns a paginated list of **current user’s** recipes. Supports filtering, sorting and full-text search.

Query parameters:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `page` | integer (≥1) | 1 | Page number (1-based) |
| `limit` | integer (1-50) | 20 | Page size |
| `search` | string | – | Full-text search on recipe `name` |
| `ingredient` | string (repeatable) | – | Filter recipes that contain **all** specified ingredient names |
| `sort` | enum `name\|created_at\|kcal` | `created_at` | Sort field |
| `order` | enum `asc\|desc` | `desc` | Sort direction |

Example request

```
GET /api/recipes?page=2&limit=10&ingredient=chicken&sort=kcal&order=asc
```

Response 200 OK

```json
{
  "page": 2,
  "limit": 10,
  "total": 42,
  "results": [
    {
      "id": "34b4b1bb-b6a0-4c98-8109-9094b0abe5bd",
      "name": "Chicken Salad",
      "kcal": 450.0,
      "protein_g": 45.0,
      "fat_g": 20.0,
      "carbs_g": 10.0,
      "created_at": "2025-07-25T08:00:00Z"
    }
    // ... up to `limit` items ...
  ]
}
```

Notes:

- The `total` field represents total matching recipes (for pagination UI).
- Nutrient fields may be `null` while AI calculation is pending.

Errors
| Code | Message | Condition |
|------|---------|-----------|
| 400 | "Invalid query parameter" | `limit` >50, `page` <1, unknown `sort` field, etc. |
| 401 | "Unauthenticated" | Missing/invalid JWT |
| 429 | "Rate limit exceeded" | Per-IP limit 60 RPM |

---

#### 2.3.2 POST /api/recipes

Request

```json
{
  "name": "Chicken Salad",
  "description": "Quick high-protein salad",
  "ingredients": [
    { "name": "Chicken breast", "amount": 200, "unit": "g" },
    { "name": "Olive oil", "amount": 1, "unit": "łyżka" }
  ],
  "steps": ["Grill chicken", "Mix ingredients"]
}
```

Validation

- `ingredients` array non-empty and each item passes `validate_ingredients` (unit in `unit_type`, amount >0).
- Max 100 recipes per user (DB trigger).

Response 202 Accepted

```json
{
  "recipe": {
    /* stored record with kcal & macros = null */
  }
}
```

Errors
| Code | Message |
|------|---------|
| 400 | "Validation failed" |
| 401 | "Unauthenticated" |
| 429 | "Recipe quota exceeded" |

#### 2.3.3 GET /api/recipes/{id}

Returns full recipe JSON.

Response 200

```json
{
  "id": "uuid",
  "name": "Chicken Salad",
  "description": "Quick high-protein salad",
  "ingredients": [...],
  "steps": [...],
  "kcal": 450.0,
  "protein_g": 45.0,
  "fat_g": 20.0,
  "carbs_g": 10.0,
  "is_manual_override": false,
  "created_at": "...",
  "updated_at": "..."
}
```

Errors 401, 403 (accessing others), 404.

(List, PUT, PATCH, DELETE endpoints follow similar pattern – omit here for brevity in plan.)

---

### 2.4 AI Runs

| Method | Path                            | Description                      |
| ------ | ------------------------------- | -------------------------------- |
| GET    | /api/recipes/{recipeId}/ai-runs | List AI runs for recipe          |
| POST   | /api/recipes/{recipeId}/ai-runs | Re-trigger nutrition calculation |
| GET    | /api/ai-runs/{id}               | Get single AI run                |

`status` values come from `ai_status` enum: `pending`, `success`, `error`.

Response example (GET single)

```json
{
  "id": 123,
  "recipe_id": "uuid",
  "status": "error",
  "prompt": "...",
  "response": null,
  "error_message": "Unknown unit 'cup'",
  "confidence": null,
  "created_at": "..."
}
```

Rate limiting: Max 5 re-tries per recipe per hour (429 Too Many Requests).

---

## 3. Authentication & Authorization

1. **Supabase JWT** – issued after sign-up / sign-in via Supabase Auth endpoints (`/auth/v1/...`).
2. Frontend sends the JWT in the `Authorization` header. Astro middleware (`src/middleware/index.ts`) injects `supabase` client per request.
3. **Row-Level Security (RLS)** in Postgres ensures:
   - A profile can only be read/written by its owner.
   - Recipes and AI runs are accessible only by the owning user (RLS policies already defined).
4. The API layer performs _additional_ checks for clarity (returns 403/404 instead of leaking existence).
5. **Rate limiting**: 60 requests / minute / user via middleware (e.g. KV-based sliding window). Exceeding returns `429 Too Many Requests`.

## 4. Validation & Business Logic

### 4.1 Validation Rules (mirrors DB constraints)

| Field                                | Rule                                                                                                                             | Source                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `calorieTarget`                      | `>= 0`                                                                                                                           | `profiles.calorie_target CHECK`                       |
| `ingredients`                        | Must be non-empty JSON array; each element **must** have `name` (string), `amount` (number > 0), `unit` (value from `unit_type`) | `recipes.ingredients CHECK`, `validate_ingredients()` |
| `steps`                              | Non-empty array of strings                                                                                                       | Application layer                                     |
| `kcal`, `proteinG`, `fatG`, `carbsG` | `>= 0` if provided                                                                                                               | `recipes` numeric checks                              |
| Recipe limit                         | Max 100 recipes per user                                                                                                         | `enforce_recipe_limit()` trigger                      |
| `confidence`                         | 0 ≤ value ≤ 1                                                                                                                    | `ai_runs.confidence CHECK`                            |

Validation is enforced at three levels:

1. **Zod schemas** in API handlers (fast fail, clear errors).
2. **Database constraints** (absolute guarantee).
3. **Supabase RLS** (access control).

### 4.2 Business Logic Mapping

| PRD Functionality                             | Endpoint(s)                         | Notes                                                               |
| --------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| User registration/login/logout (US-001 - 003) | Supabase Auth `/auth/v1/...`        | Not part of custom API; handled by Supabase SDK.                    |
| Add recipe (US-004)                           | `POST /api/recipes`                 | On success creates an **AI Run** (`status=pending`).                |
| List recipes (US-005)                         | `GET /api/recipes`                  | Pagination, search, sort.                                           |
| View recipe details (US-006)                  | `GET /api/recipes/{id}`             | Returns nutrition fields.                                           |
| Manual nutrition correction (US-007)          | `PATCH /api/recipes/{id}/nutrition` | Sets `isManualOverride=true`; skips AI recalculation.               |
| Edit recipe (US-008)                          | `PUT/PATCH /api/recipes/{id}`       | Triggers new AI Run (unless manual override).                       |
| Delete recipe (US-009)                        | `DELETE /api/recipes/{id}`          | Also cascades delete of AI runs (FK `on delete cascade`).           |
| Set dietary preferences (US-010)              | `PUT/PATCH /api/profile`            |                                                                     |
| Unit validation list (US-011)                 | `GET /api/units`                    | Frontend uses to build select input.                                |
| AI error handling (US-012)                    | `GET /api/ai-runs/{runId}`          | Returns `status=error` and `errorMessage`. Frontend shows guidance. |
| Recipe privacy (US-013)                       | All endpoints                       | Enforced by JWT + RLS; 403/404 on unauthorized access.              |

---

---

## 5. Performance & Security Considerations

- **Indexes**: `recipes_user_id_idx`, `recipes_ingredients_idx`, `ai_runs_recipe_id_idx`, already cover list and filter queries.
- **Pagination**: Use keyset pagination (`created_at`, `id`) for large datasets.
- **Rate Limiting**: As described above (60 rpm).
- **Input Size Limits**: Max JSON payload 100 KB; `ingredients` and `steps` each max 50 items.
- **CORS**: Restrict to trusted frontend origins.
- **HTTPS only**: Enforced at load balancer.
- **Helmet-like headers**: Added by Astro middleware.

---

## 6. Versioning & Documentation

- Version the API via URL prefix (`/api/v1/...`).
- Provide OpenAPI 3.1 spec at `/api/openapi.json` and Swagger UI in dev only.
- Breaking changes trigger a new major path (`/api/v2`).
