# REST API Plan

## 1. Resources

| Resource | DB Table / Enum | Description |
|----------|-----------------|-------------|
| Profile  | `public.profiles` | Stores user dietary preferences such as allergens and daily calorie target. One-to-one with Supabase `auth.users`. |
| Recipe   | `public.recipes` | A private cooking recipe owned by a user. Contains nutritional information either calculated by AI or manually overridden. |
| Unit     | `public.unit_type` (enum) | Allowed measurement units for ingredients (read-only reference list). |

## 2. Endpoints

> All URLs are prefixed with `/api` and return JSON. All endpoints require a valid Supabase JWT in the `Authorization: Bearer <token>` header **unless explicitly stated otherwise**.

### 2.1 Profiles

| HTTP | Path | Description |
|------|------|-------------|
| GET  | `/api/profile` | Get the authenticated user profile. Creates a default profile on-the-fly if missing. |
| POST | `/api/profile` | Create profile (first-time users). Usually called implicitly after sign-up. |
| PUT /PATCH | `/api/profile` | Update dietary preferences: allergens, calorie target. |

**Request body (POST/PUT/PATCH)**
```json
{
  "calorieTarget": 2000,
  "allergens": ["gluten", "peanuts"]
}
```

**Response body** (200)
```json
{
  "userId": "uuid",
  "calorieTarget": 2000,
  "allergens": ["gluten", "peanuts"],
  "createdAt": "2024-07-25T12:00:00Z",
  "updatedAt": "2024-07-25T12:00:00Z"
}
```

Success codes: `200 OK`, `201 Created`

Error codes: `400 Bad Request` (validation), `401 Unauthorized`, `409 Conflict` (duplicate), `500 Internal Server Error`

---

### 2.2 Recipes

| HTTP | Path | Description |
|------|------|-------------|
| GET  | `/api/recipes` | List authenticated user recipes. Supports pagination, search, and sorting. |
| POST | `/api/recipes` | Create a new recipe. Triggers an AI Run automatically. |
| GET  | `/api/recipes/{recipeId}` | Retrieve full recipe details. |
| PUT /PATCH | `/api/recipes/{recipeId}` | Update a recipe (ingredients or steps). Triggers new AI Run unless `isManualOverride` is `true`. |
| PATCH | `/api/recipes/{recipeId}/nutrition` | Manually override nutrition (sets `isManualOverride` = `true`). |
| DELETE | `/api/recipes/{recipeId}` | Permanently delete a recipe. |

**Query parameters for list**
- `page` (integer, default 1)
- `limit` (integer, default 20, max 100)
- `search` (string; matches `name` ILIKE)
- `sort` (enum: `created_at`, `name`, `kcal`; default `created_at`)
- `order` (`asc`\|`desc`, default `desc`)

**Request body – create / update**
```json
{
  "name": "Chicken salad",
  "description": "High-protein lunch option",
  "ingredients": [
    { "name": "Chicken breast", "amount": 200, "unit": "g" },
    { "name": "Olive oil", "amount": 1, "unit": "łyżka" }
  ],
  "steps": [
    "Season the chicken.",
    "Grill for 6 minutes each side."
  ]
}
```

**Response body – recipe**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Chicken salad",
  "description": "High-protein lunch option",
  "ingredients": [...],
  "steps": [...],
  "kcal": 350,
  "proteinG": 42,
  "fatG": 10,
  "carbsG": 5,
  "isManualOverride": false,
  "createdAt": "2024-07-25T12:00:00Z",
  "updatedAt": "2024-07-25T12:00:00Z"
}
```

Success codes: `200 OK`, `201 Created`, `204 No Content` (DELETE)

Error codes: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (other user), `404 Not Found`, `409 Conflict` (recipe limit reached), `422 Unprocessable Entity` (AI error), `500 Internal Server Error`

---

### 2.3 Static reference – Units

| HTTP | Path | Description |
|------|------|-------------|
| GET  | `/api/units` | Returns the full `unit_type` enum as an array. Public, no auth required (cache-able). | 

Response
```json
["g", "dag", "kg", "ml", "l", "łyżeczka", "łyżka", "szklanka", "pęczek", "garść", "sztuka", "plaster", "szczypta", "ząbek"]
```

---

## 3. Authentication & Authorization

1. **Supabase JWT** – issued after sign-up / sign-in via Supabase Auth endpoints (`/auth/v1/...`).
2. Frontend sends the JWT in the `Authorization` header. Astro middleware (`src/middleware/index.ts`) injects `supabase` client per request.
3. **Row-Level Security (RLS)** in Postgres ensures:
   - A profile can only be read/written by its owner.
   - Recipes and AI runs are accessible only by the owning user (RLS policies already defined).
4. The API layer performs *additional* checks for clarity (returns 403/404 instead of leaking existence).
5. **Rate limiting**: 60 requests / minute / user via middleware (e.g. KV-based sliding window). Exceeding returns `429 Too Many Requests`.

## 4. Validation & Business Logic

### 4.1 Validation Rules (mirrors DB constraints)

| Field | Rule | Source |
|-------|------|--------|
| `calorieTarget` | `>= 0` | `profiles.calorie_target CHECK` |
| `ingredients` | Must be non-empty JSON array; each element **must** have `name` (string), `amount` (number > 0), `unit` (value from `unit_type`) | `recipes.ingredients CHECK`, `validate_ingredients()` |
| `steps` | Non-empty array of strings | Application layer |
| `kcal`, `proteinG`, `fatG`, `carbsG` | `>= 0` if provided | `recipes` numeric checks |
| Recipe limit | Max 100 recipes per user | `enforce_recipe_limit()` trigger |
| `confidence` | 0 ≤ value ≤ 1 | `ai_runs.confidence CHECK` |

Validation is enforced at three levels:
1. **Zod schemas** in API handlers (fast fail, clear errors).
2. **Database constraints** (absolute guarantee).
3. **Supabase RLS** (access control).

### 4.2 Business Logic Mapping

| PRD Functionality | Endpoint(s) | Notes |
|-------------------|-------------|-------|
| User registration/login/logout (US-001 - 003) | Supabase Auth `/auth/v1/...` | Not part of custom API; handled by Supabase SDK. |
| Add recipe (US-004) | `POST /api/recipes` | On success creates an **AI Run** (`status=pending`). |
| List recipes (US-005) | `GET /api/recipes` | Pagination, search, sort. |
| View recipe details (US-006) | `GET /api/recipes/{id}` | Returns nutrition fields. |
| Manual nutrition correction (US-007) | `PATCH /api/recipes/{id}/nutrition` | Sets `isManualOverride=true`; skips AI recalculation. |
| Edit recipe (US-008) | `PUT/PATCH /api/recipes/{id}` | Triggers new AI Run (unless manual override). |
| Delete recipe (US-009) | `DELETE /api/recipes/{id}` | Also cascades delete of AI runs (FK `on delete cascade`). |
| Set dietary preferences (US-010) | `PUT/PATCH /api/profile` | |
| Unit validation list (US-011) | `GET /api/units` | Frontend uses to build select input. |
| AI error handling (US-012) | `GET /api/ai-runs/{runId}` | Returns `status=error` and `errorMessage`. Frontend shows guidance. |
| Recipe privacy (US-013) | All endpoints | Enforced by JWT + RLS; 403/404 on unauthorized access. |

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