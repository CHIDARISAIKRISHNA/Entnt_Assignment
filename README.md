## Talentflow – React Frontend Assignment (No Backend)

A mini hiring platform demonstrating jobs, candidates, and assessments flows – implemented fully on the frontend using MirageJS for a fake REST API and Dexie (IndexedDB) for persistence.

### Quickstart

```bash
# 1) Install
npm install

# 2) Run (dev)
npm start

# 3) Open
# Vite will print the local URL (typically http://localhost:5173)
```

Notes:
- Frontend only. No real backend is used.
- If you see duplicated jobs from earlier local runs, hard-refresh or clear IndexedDB for database name `talentflow-db` from the browser storage panel and reload.

### Tech Stack
- React 18 + Vite
- React Router (v6)
- MirageJS (fake REST API with latency + error injection)
- Dexie (IndexedDB persistence; write-through and restore-on-refresh)
- react-beautiful-dnd (drag-and-drop)
- react-window (virtualized lists)
- @faker-js/faker (seed data)

### Project Structure

```
src/
  App.jsx                 # App shell + routes
  main.jsx                # App bootstrap + Mirage server start
  mirage.js               # Mirage routes, latency, error injection
  lib/
    db.js                # Dexie schema, seed, data helpers
    api.js               # Fetch wrapper to Mirage routes
  routes/
    JobsPage.jsx
    CandidatesPage.jsx
    CandidateProfile.jsx
    AssessmentsPage.jsx
  components/
    Jobs/...
    Candidates/...
    Assessments/...
    UI/...
```

### Features Checklist (as per brief)

1) Jobs
- List with pagination, search, status filter, and sort by `order` (server-like)
- Create/Edit in modal with validation (title required, unique slug)
- Archive/Unarchive
- Reorder via drag-and-drop with optimistic updates and rollback on error
- Deep link to a job: `/jobs/:jobId`

Files: `routes/JobsPage.jsx`, `components/Jobs/*`, API in `lib/api.js` → Mirage `GET/POST/PATCH /jobs`, `PATCH /jobs/:id/reorder`.

2) Candidates
- 1000+ seeded candidates
- Virtualized list with `react-window`
- Client search (name/email) and server-like stage filter
- Kanban board to move between stages (drag-and-drop; optimistic + rollback)
- Profile route `/candidates/:id` showing timeline of status changes
- Notes with @mentions rendering (suggestions from a local list)

Files: `components/Candidates/*`, `routes/CandidatesPage.jsx`, `routes/CandidateProfile.jsx`, API in `lib/api.js` → Mirage `GET/POST/PATCH /candidates`, `GET /candidates/:id/timeline`, `GET/POST /notes`.

3) Assessments
- Per-job Assessment Builder: add sections and questions
  - Types: single-choice, multi-choice, short text, long text, numeric (min/max), file upload stub
- Live preview pane renders the assessment as a fillable form (shows all questions)
- Validation rules: required, numeric range, max length
- Conditional questions via `showIf` (e.g., display when another question equals a value)
- Persist builder state and candidate responses locally (IndexedDB)
- UI lists exactly 3 jobs that have ≥10 questions; guaranteed by startup logic

Files: `routes/AssessmentsPage.jsx`, `components/Assessments/*`, API in `lib/api.js` → Mirage `GET/PUT/POST /assessments`.

### Data, API, and Persistence

- Fake REST API: MirageJS (`src/mirage.js`)
  - Latency: 200–1200 ms per request
  - Error rate: ~8% on write endpoints (simulates failure for optimistic rollback)
  - Routes implemented:
    - Jobs: `GET /jobs`, `POST /jobs`, `PATCH /jobs/:id`, `PATCH /jobs/:id/reorder`
    - Candidates: `GET /candidates`, `POST /candidates`, `PATCH /candidates/:id`, `GET /candidates/:id/timeline`
    - Assessments: `GET /assessments/:jobId`, `PUT /assessments/:jobId`, `POST /assessments/:jobId/submit`
    - Notes: `GET /notes`, `POST /notes`

- Persistence: Dexie (IndexedDB) (`src/lib/db.js`)
  - Schema: `jobs`, `candidates`, `timelines`, `notes`, `assessments`, `responses`
  - Seed data: 25 jobs, 1000 candidates, timelines, and at least 3 assessments (10+ questions)
  - Write-through from Mirage to Dexie; app state restored from Dexie on refresh
  - Startup maintenance: remove duplicate jobs; ensure 3 assessments each with ≥10 questions

### Development Notes

- Optimistic updates: Jobs reorder and Kanban stage moves update the UI immediately and rollback on server error.
- Slug uniqueness: Enforced in Mirage route for `POST/PATCH /jobs`.
- Validation: Per question type in `AssessmentForm.jsx`.
- Conditional visibility: Each question can set `showIf: { questionId, equals }`.

### Troubleshooting

- Duplicated jobs or stale data after local edits?
  - Clear IndexedDB database `talentflow-db` in the browser devtools (Application/Storage), then refresh.
- Random failures on writes are intentional (error injection) – try again to verify optimistic rollback.

### Deployment

Any static host that supports SPA routing works (Netlify, Vercel, GitHub Pages). Example (Netlify):

```bash
npm run build
# deploy the dist/ directory
```

SPA routing: enable fallback to `index.html`.

### Credits / Decisions

- MirageJS selected to keep all behavior frontend-only while resembling real network calls.
- Dexie for reliable IndexedDB access and bulk operations.
- `react-window` chosen for a simple, fast virtualized list.
- `react-beautiful-dnd` for accessible drag-and-drop and reordering.

### No Authentication

The app does not require login. If authentication were required, credentials would be listed here.

---
If you have questions or need changes for the submission format, open an issue or contact the maintainer.

## Setup (detailed)

Prerequisites:
- Node.js 18+

Install and run:
```bash
npm install
npm start
```

Scripts:
- `npm start`: dev server (Vite)
- `npm run build`: production build to `dist/`
- `npm run preview`: preview local production build

Data reset:
- Open browser devtools → Application/Storage → IndexedDB → delete `talentflow-db` → reload.

## Architecture

Layers:
- UI components in `components/*` render lists, forms, and DnD interactions.
- Route containers in `routes/*` own page-level data loading and composition.
- API client `lib/api.js` is a thin fetch wrapper to Mirage endpoints.
- Mirage server `mirage.js` simulates network latency/errors and writes through to Dexie.
- Dexie `lib/db.js` defines schema, seeds data, restores state on refresh, and performs maintenance (de-duplication, ensuring 3× assessments with ≥10 questions).

Flow:
1. UI calls `lib/api.js`.
2. Mirage handles the request, waits 200–1200ms, may return a write error (~8%).
3. Mirage writes to Dexie; reads also come from Dexie.
4. On refresh, the app reads existing Dexie data (no reseed required).

## Data Model (Dexie tables)
- `jobs`: `{ id, title, slug, status, tags[], order }`
- `candidates`: `{ id, name, email, stage, jobId }`
- `timelines`: `{ id, candidateId, at, action, toStage? }`
- `notes`: `{ id, candidateId, text, at }`
- `assessments`: `{ jobId, sections: [{ id, title, questions: [...] }] }`
- `responses`: `{ id, jobId, candidateId?, payload, submittedAt }`

Assessment question types:
- `short`, `long`, `single` (options), `multi` (options), `number` (min/max), `file` (stub; filename only)
- Conditional: `showIf: { questionId, equals }`

## State Management
- Local component state drives inputs and transient UI.
- Page-level data fetched on mount via `lib/api.js`.
- No global state store required; persistence handled by Dexie beneath Mirage.

## Error Handling & Retry
- Mirage injects ~8% errors on write endpoints (jobs create/edit/reorder, candidate stage changes, notes add, assessment save/submit).
- UI surfaces failures and performs rollback for optimistic flows (DnD reorder, Kanban moves).
- Users can retry actions immediately.

## Optimistic Updates & Rollback
- Jobs reorder (`PATCH /jobs/:id/reorder`): UI updates immediately, reverts on 500.
- Candidate stage move (`PATCH /candidates/:id`): board moves card instantly; failure restores previous columns.

## Performance Considerations
- Jobs list paginated server-like (page, pageSize, search, status).
- Candidates list virtualized with `react-window` (1000+ rows).
- Minimal re-renders via simple memoization and list virtualization.

## Technical Decisions
- MirageJS vs MSW: Mirage keeps all routes bundled with the app and simplifies seeding/latency/error injection without a service worker.
- Dexie vs localForage: schema and bulk operations are clearer with Dexie; used for seeding and transactions.
- DnD library: `react-beautiful-dnd` for accessible drag-and-drop and reorder semantics.
- Virtualization: `react-window` offers a small API and good performance for large lists.

## Known Issues / Future Work
- Toast notifications could replace basic alerts.
- Assessment conditional builder UI could provide point-and-click question references instead of manual IDs.
- More robust slug collision edge cases (e.g., Unicode) could be handled.
- Accessibility audits on drag handles and focus states would improve UX further.
