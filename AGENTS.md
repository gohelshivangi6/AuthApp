# AuthApp — Agent Instructions

## Architecture

Full-stack authentication app. Two independent packages with separate `node_modules`:

- `frontend/` — React 19 + Vite 8 + MUI 9 + Redux Toolkit + React Router 7
- `backend/` — Express 5 + JWT + TOTP 2FA (speakeasy)
- **No monorepo tooling.** Each package has its own `package.json` and `npm run` scripts.

## Dev Commands

### Backend (from `backend/`)
```bash
cd backend && npm install   # first time
cd backend && npm run dev   # starts on :5000
```

### Frontend (from `frontend/`)
```bash
cd frontend && npm install  # first time
cd frontend && npm run dev  # starts on :5173
cd frontend && npm run lint # eslint flat config, JS+JSX only
cd frontend && npm run build
```

## Backend Facts

- **Database**: JSON file at `backend/data/db.json`. Atomic writes via temp+rename, backup at `db.backup.json`. No external DB required.
- **Email**: Simulated — writes to `backend/data/emails.json`. Dev mailbox endpoint: `GET /api/auth/dev/emails`.
- **Env vars** (in `backend/.env`): `PORT`, `JWT_SECRET`, `ENCRYPTION_KEY`, `NODE_ENV`. Hardcoded defaults for dev; **do not commit real secrets**.
- **CORS**: Allowlisted for `localhost:5173` and `127.0.0.1:5173` only. If you change the frontend port, update `backend/index.js:15`.
- **Rate limiting**: Global + per-route. See `backend/middleware/rateLimit.js`.
- **Input validation**: `express-validator` schemas in `backend/middleware/validate.js`. Must run `handleValidationErrors` after validators.
- **Error handler**: Global in `backend/middleware/errorHandler.js` — must be registered last (`app.use(errorHandler)`).
- **Cleanup task**: Periodic deletion of unverified 2FA accounts (`backend/utils/cleanup.js`).
- **API base**: All auth routes mounted at `/api/auth`.
- **Hierarchy API**: CRUD at `/api/hierarchy`. Data stored in `backend/data/hierarchy.json`. Endpoints: `GET /`, `POST /` (body: `{ parentId, node }`), `PUT /:id`, `DELETE /:id`.

## Frontend Facts

- **State**: Redux Toolkit with `redux-persist` (localStorage). Auth state survives page reloads.
- **Routing**: Public vs Protected route wrappers in `src/routes/`. `/` redirects to `/login`. Catch-all redirects to `/login`.
- **Theme**: Dark theme defined inline in `App.jsx`. Font families: Outfit (headings), Inter (body).
- **Styling**: MUI components + SCSS (`src/styles/global.scss`).
- **Dev tools**: `DevMailbox` component renders as a drawer overlay — local testing only, reads `/api/auth/dev/emails`.
- **Hierarchy table**: `/hierarchy` route. Drills down Zone Head → CSO → ASM → DB → Product → CKU. Data fetched from `/api/hierarchy`. Add/Edit/Delete via modals.

## Gotchas

- **Run both servers.** Frontend calls `localhost:5000` for API. Neither server proxies the other automatically.
- **Backend is CJS** (`require`/`module.exports`). Frontend is ESM (`import`/`export`). Do not mix.
- **No TypeScript.** Frontend uses plain `.jsx`.
- **No test suite.** Backend has a placeholder `test` script that exits with error.
- **`redux-persist` storage import** (`frontend/src/redux/store.js:16`): uses `.default` fallback for ESM/CJS interop. Preserve this pattern.
- **Backend reads `.env` from its own directory** (`backend/.env`). Do not place env files in the project root.
