# Hevy API - High-Level Architecture Overview

> Source: OpenAPI 3.0.0 spec served at `https://api.hevyapp.com/docs/` (rendered via Swagger UI). Underlying spec title: "Hevy API Docs", version `0.0.1`. This is a young, evolving public API - Hevy explicitly states the structure and endpoint set may change.

---

## 1. Purpose

The Hevy API exposes a fitness-tracking backend (workouts, routines, exercise templates, routine folders, user info, and webhook subscriptions) so third-party apps and AI agents can read and write a user's training data.

- **Access tier:** Only available to **Hevy Pro** subscribers.
- **Key issuance:** API keys are generated at `https://hevy.com/settings?developer`.
- **Style:** REST-ish, resource-based, JSON in/out.

---

## 2. Base URL & Versioning

| Item | Value |
|---|---|
| Base URL | `https://api.hevyapp.com` |
| Path prefix | `/v1/...` (single version in use) |
| Spec version | `0.0.1` (pre-1.0, expect breaking changes) |
| Format | JSON request/response bodies |

---

## 3. Authentication

Every endpoint requires the **same single credential**, sent as a header - there is no OAuth flow, no scopes, no token refresh.

| Parameter | Location | Type | Required | Notes |
|---|---|---|---|---|
| `api-key` | HTTP header | `string` (`format: uuid`) | **Yes, on every request** | Obtained from Hevy Pro account settings |

```
GET /v1/workouts?page=1&pageSize=5
Host: api.hevyapp.com
api-key: 226b4150-f29f-4a5a-9438-ab91cc39e080
```

**Architectural implication:** Auth is uniform and flat - one API key = one Hevy account = full read/write access to that account's data. There's no per-endpoint permission model to design around.

---

## 4. Resource Domains (Tags)

The API groups endpoints into 5 tag/resource domains:

| Domain | Tag | Endpoints |
|---|---|---|
| Workouts | `Workouts` | list, create, get by id, update, count, events (changefeed) |
| Routines | `Routines` | list, create, get by id, update |
| Exercise Templates | `ExerciseTemplates` | list, create (custom), get by id |
| Routine Folders | `RoutineFolders` | list, create, get by id |
| Webhooks | (not in retrieved spec slice, confirmed via project docs) | create, list, delete subscriptions for workout events |
| User | `Users` | get authenticated user info |

---

## 5. Endpoint Reference

### 5.1 Workouts

| Method | Path | Summary | Required Params | Optional Params |
|---|---|---|---|---|
| GET | `/v1/workouts` | Paginated list of workouts | `api-key` (header) | `page` (int, default 1), `pageSize` (int, default 5, **max 10**) |
| POST | `/v1/workouts` | Create a new workout | `api-key` (header), body: `PostWorkoutsRequestBody` | - |
| GET | `/v1/workouts/count` | Total workout count on account | `api-key` (header) | - |
| GET | `/v1/workouts/events` | Paged changefeed (updates/deletes) since a timestamp, newest to oldest | `api-key` (header) | `page`, `pageSize` (max 10), `since` (string, ISO-8601, default `1970-01-01T00:00:00Z`) |
| GET | `/v1/workouts/{workoutId}` | Full details of a single workout | `api-key` (header), `workoutId` (path) | - |
| PUT | `/v1/workouts/{workoutId}` | Update an existing workout | `api-key` (header), `workoutId` (path), body: `PostWorkoutsRequestBody` | - |

**Design note:** `/v1/workouts/events` exists specifically so clients can sync a local cache incrementally instead of re-pulling the full workout list - a deliberate delta-sync pattern.

### 5.2 Routines

| Method | Path | Summary | Required Params | Optional Params |
|---|---|---|---|---|
| GET | `/v1/routines` | Paginated list of routines | `api-key` (header) | `page`, `pageSize` (max 10) |
| POST | `/v1/routines` | Create a new routine | `api-key` (header), body: `PostRoutinesRequestBody` | - |
| GET | `/v1/routines/{routineId}` | Get one routine | `api-key` (header), `routineId` (path) | - |
| PUT | `/v1/routines/{routineId}` | Update a routine | `api-key` (header), `routineId` (path), body: `PutRoutinesRequestBody` | - |

Notable response: creating a routine can return **403 Routine limit exceeded** - there's an account-level cap on stored routines.

### 5.3 Exercise Templates

| Method | Path | Summary | Required Params | Optional Params |
|---|---|---|---|---|
| GET | `/v1/exercise_templates` | Paginated list of exercise templates | `api-key` (header) | `page`, `pageSize` (default 5, **max 100**) |
| POST | `/v1/exercise_templates` | Create a custom exercise template | `api-key` (header), body: `CreateCustomExerciseRequestBody` | - |
| GET | `/v1/exercise_templates/{exerciseTemplateId}` | Get one template | `api-key` (header), `exerciseTemplateId` (path) | - |

Notable response: **403 exceeds-custom-exercise-limit** - custom exercise creation is capped per account.

Live response fields verified through Atlas include:

```json
{
  "id": "79D0BB3A",
  "title": "Bench Press (Barbell)",
  "type": "weight_reps",
  "primary_muscle_group": "chest",
  "secondary_muscle_groups": ["triceps", "shoulders"],
  "equipment": "barbell",
  "is_custom": false
}
```

Atlas uses `primary_muscle_group` and `secondary_muscle_groups` as the source for weighted dashboard muscle distribution. The values are cached locally so dashboard reads do not call Hevy.

### 5.4 Routine Folders

| Method | Path | Summary | Required Params | Optional Params |
|---|---|---|---|---|
| GET | `/v1/routine_folders` | Paginated list of folders | `api-key` (header) | `page`, `pageSize` (max 10) |
| POST | `/v1/routine_folders` | Create a folder (always inserted at index 0; other folders shift) | `api-key` (header), body: `PostRoutineFolderRequestBody` | - |
| GET | `/v1/routine_folders/{folderId}` | Get one folder | `api-key` (header), `folderId` (path) | - |

### 5.5 User

| Method | Path | Summary | Required Params |
|---|---|---|---|
| GET | `/v1/user/info` | Authenticated user's profile info | `api-key` (header) |

### 5.6 Webhooks (confirmed to exist; not present in the spec slice retrieved)

Per the project's own documentation, the API supports webhook subscriptions for workout events (create, list/view, delete). If you need exact request/response schemas for these, pull the full `openapi-spec.json` directly (see Section 8) since only the first ~1,000 of 2,635 lines were retrievable through the mirror used here.

---

## 6. Pagination Model

Consistent across all list endpoints:

| Param | Type | Default | Cap |
|---|---|---|---|
| `page` | integer | 1 | must be at least 1 |
| `pageSize` | integer | 5 | 10 (100 for exercise templates) |

Responses follow a consistent envelope:
```json
{
  "page": 1,
  "page_count": 5,
  "<resource_name_plural>": [ /* array of resource objects */ ]
}
```

---

## 7. Core Data Schemas (referenced via `$ref`)

The following named schemas are referenced throughout the spec (`#/components/schemas/...`). Their full field-level definitions live further into the spec file than could be retrieved in this pass, but based on the API's real-world response shape (seen in community client implementations), the **Workout** object nests like this:

```
Workout
|-- id, title, description
|-- start_time, end_time, updated_at, created_at
`-- exercises: []
    |-- index, title, notes
    |-- exercise_template_id, superset_id
    `-- sets: []
        |-- index, set_type
        |-- weight_kg, reps
        `-- (additional set metrics: e.g. duration, distance, rpe depending on exercise type)
```

Named schemas referenced in the spec:

| Schema | Used by |
|---|---|
| `Workout` | GET/POST/PUT workouts responses |
| `PostWorkoutsRequestBody` | POST/PUT workout request body |
| `PaginatedWorkoutEvents` | GET workout events |
| `UserInfoResponse` | GET user info |
| `Routine` | GET/POST routines |
| `PostRoutinesRequestBody` | POST routine body |
| `PutRoutinesRequestBody` | PUT routine body |
| `ExerciseTemplate` | GET/list exercise templates |
| `CreateCustomExerciseRequestBody` | POST exercise template body |
| `RoutineFolder` | GET/POST routine folders |
| `PostRoutineFolderRequestBody` | POST routine folder body |

**Variable count:** Exact total field/variable count across all schemas couldn't be confirmed because the full `components.schemas` section (roughly lines 1000-2635 of the 2635-line spec) wasn't retrievable through the available mirror. If you need an exact count, fetch the raw file at the GitHub location in Section 8 and I can parse it fully.

---

## 8. Where the Full Spec Lives

- Rendered docs (JS Swagger UI, no raw JSON visible): `https://api.hevyapp.com/docs/`
- Full OpenAPI JSON (community-maintained mirror, generated straight from Hevy's spec): `https://github.com/chrisdoc/hevy-mcp/blob/main/openapi-spec.json` (2,635 lines)

If you paste that raw JSON into ChatGPT directly (or I fetch and parse the remaining ~1,600 lines for you), it can get exact field-by-field schema definitions, required vs. optional flags per field, and enums (e.g. valid `set_type` values).

---

## 9. Summary for an LLM Consumer

- **Auth:** one static header (`api-key`, UUID) - same key for every call, full account access, no scopes.
- **Shape:** flat REST resources under `/v1/`, no nested sub-resource routing beyond one level (`/v1/workouts/{id}`).
- **Pagination:** uniform `page` + `pageSize` query params, small page caps (10, except templates at 100).
- **Write operations:** `POST` to create, `PUT` to update - no `PATCH`, no `DELETE` endpoints observed in the retrieved portion (aside from webhook deletion mentioned in project docs).
- **Rate/limits surfaced in API:** account-level caps exist for routines (403) and custom exercises (403) - build retry/error-handling logic around those specific error bodies (`{"error": "..."}`).
- **Sync pattern:** `/v1/workouts/events` is the intended mechanism for incremental sync - prefer it over full re-fetch of `/v1/workouts` for anything beyond the first import.
