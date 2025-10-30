## Talentflow – React Frontend Assignment (No Backend)

A mini hiring platform demonstrating jobs, candidates, and assessments flows – implemented fully on the frontend using MirageJS for a fake REST API and Dexie (IndexedDB) for persistence.

### Quickstart

```bash
# 1)npm install

# 2) npm start

# 3) Vite will print the local URL (typically http://localhost:5173)
```

### Tech Stack
- React 18 + Vite
- React Router (v6)
- MirageJS (fake REST API with latency + error injection)
- Dexie (IndexedDB persistence; write-through and restore-on-refresh)
- react-beautiful-dnd (drag-and-drop)
- react-window (virtualized lists)
- @faker-js/faker (seed data)


### Features Implemented

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


## Setup

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

## Known Issues
- Toast notifications could replace basic alerts.
- Assessment conditional builder UI could provide point-and-click question references instead of manual IDs.
- More robust slug collision edge cases (e.g., Unicode) could be handled.
- Accessibility audits on drag handles and focus states would improve UX further.


## Technical Decisions
- MirageJS vs MSW: Mirage keeps all routes bundled with the app and simplifies seeding/latency/error injection without a service worker.
- Dexie vs localForage: schema and bulk operations are clearer with Dexie; used for seeding and transactions.
- DnD library: `react-beautiful-dnd` for accessible drag-and-drop and reorder semantics.
- Virtualization: `react-window` offers a small API and good performance for large lists.




