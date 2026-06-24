# AuthApp — Bug & Issue Audit

> Generated: 2026-06-24 | Total issues found: **80+**

---

## CRITICAL (14)

### C1. Exposed secrets committed in `.env` files
**Files:** `backend/.env`, `frontend/.env`  
**Issue:** Real credentials committed to git: Gmail SMTP App Password (`bdms jhvv oduo oklx`), JWT_SECRET, ENCRYPTION_KEY, SECRET_KEY. Root `.gitignore` only ignores `node_modules` — `.env` files are tracked.  
**Fix:** Rotate all secrets. Add `.env` to `.gitignore`. Use `git rm --cached .env` to un-track. Purge from git history.

### C2. Hardcoded fallback JWT secret in 3 locations
**Files:** `backend/controllers/authController.js:22`, `backend/services/authService.js:28`, `backend/utils/websocket.js:7`  
```js
const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret_for_development_purposes";
```
**Issue:** If `JWT_SECRET` env var is missing, a known hardcoded string is used. Anyone can forge valid JWTs.  
**Fix:** Crash on missing JWT_SECRET in production. Remove fallback.

### C3. JWT tokens expire in 365 days
**File:** `backend/services/authService.js:32,36`  
```js
jwt.sign({ userId }, JWT_SECRET, { expiresIn: "365d" });
jwt.sign({ userId, type }, JWT_SECRET, { expiresIn: "365d" });
```
**Issue:** Auth tokens and temp tokens both valid for 1 year. A stolen token works for a year with no revocation.  
**Fix:** Auth tokens: 15min–24h with refresh tokens. Temp tokens: 10–15 minutes.

### C4. `writeDB` silently swallows failures
**File:** `backend/utils/dbHelper.js:54-67`  
**Issue:** The `.catch()` handler logs the error but does NOT re-throw. Callers who `await writeDB(db)` get `undefined` and assume success. All writes in the app are vulnerable to silent data loss.  
**Fix:** Re-throw after logging, or return `{ success: false }`.

### C5. Race condition: `readDB` doesn't synchronize with write queue
**File:** `backend/utils/dbHelper.js:20-47`  
**Issue:** `readDB()` reads `db.json` directly from disk without waiting for pending writes in `writeQueue`. A read concurrent with a write (between writing temp file and renaming) gets stale data.  
**Fix:** Have `readDB` also wait for `writeQueue` to resolve.

### C6. Predictable AES-256 encryption key
**File:** `backend/.env`  
```
SECRET_KEY=12345678901234567890123456789012
```
**Issue:** The 32-byte key is just digits 1–32. No cryptographic protection.  
**Fix:** Generate a proper random 32-byte hex key.

### C7. `nodemailer` version `^9.0.1` — dependency confusion risk
**File:** `backend/package.json:24`  
**Issue:** Official nodemailer latest is v6.x. Version `^9.0.1` would match a malicious package. Supply-chain attack risk.  
**Fix:** Change to `"nodemailer": "^6.9.0"`.

### C8. `crypto` npm package is unnecessary/malicious
**File:** `backend/package.json:17`  
**Issue:** Node.js has built-in `crypto`. The npm package `crypto` is a deprecated stub. Adds unnecessary supply-chain risk.  
**Fix:** Remove `"crypto": "^1.0.1"` from package.json.

### C9. Hierarchy API documented but NOT implemented
**File:** `backend/routes/hierarchy.js` vs `AGENTS.md`  
**Issue:** AGENTS.md says `POST /`, `PUT /:id`, `DELETE /:id` exist. Backend only has `GET /config`, `GET /data`, `POST /export/csv`. Frontend `hierarchyService.js` calls non-existent endpoints → 404 errors.  
**Fix:** Implement CRUD endpoints OR update docs and frontend.

### C10. Frontend hierarchy calls will 404
**File:** `frontend/src/services/hierarchyService.js`  
**Issue:** Calls `GET /api/hierarchy` (expecting `{ config, data }` in single response). Backend serves these at separate `/config` and `/data` endpoints.  
**Fix:** Update service to call correct endpoints.

### C11. `PublicRoute` is disabled (commented out)
**File:** `frontend/src/App.jsx:104,113`  
**Issue:** `<Route element={<PublicRoute />}>` wrappers are commented out. Auth pages (login, signup, 2FA) are NOT guarded for already-authenticated users. Root `/` redirects to `/dashboards` not `/login` as documented.  
**Fix:** Uncomment the PublicRoute wrappers.

### C12. Root `node_modules/` is orphaned
**Path:** `C:\AuthApp\node_modules\`  
**Issue:** Exists on disk despite no root `package.json`. Leftover from previous monorepo setup. Includes `react`, `dom-helpers`, etc.  
**Fix:** Delete the directory and add to root `.gitignore`.

### C13. Auth rate limiter is 1000/15min — not 10 as documented
**File:** `backend/middleware/rateLimit.js:25`  
**Issue:** AGENTS.md says "10 requests per 15 minutes" for auth endpoints. Code has `max: 1000` — allowing 1000 login attempts/15min per IP. Brute-force is trivial.  
**Fix:** Change `max` to 10.

### C14. `readSync` blocks event loop in request handlers
**Files:** `backend/routes/hierarchy.js:12`, `backend/routes/dashboardDataRoutes.js:23`  
**Issue:** `fs.readFileSync` in request handlers blocks Node.js event loop. Under load causes severe performance degradation.  
**Fix:** Use `fs.promises.readFile` with async/await.

---

## HIGH (18)

### H1. `/api/hierarchy/export/csv` has NO authentication
**File:** `backend/routes/hierarchy.js:25`  
**Issue:** No `requireAuth` or `sessionToken` middleware. Anyone can POST arbitrary data.  
**Fix:** Add authentication middleware.

### H2. `/api/auth/dev/emails` endpoints have NO authentication
**File:** `backend/routes/authRoutes.js:90,99`  
**Issue:** Dev email mailbox is publicly readable. Anyone can read ALL users' simulated emails.  
**Fix:** Add `requireAuth` or restrict to dev environment.

### H3. Session token `blacklistedNonces` is never populated (dead code)
**File:** `backend/middleware/sessionToken.js:6,36`  
**Issue:** Set is declared but never written to. Session tokens can never be revoked.  
**Fix:** Implement revocation logic or remove dead code.

### H4. `validTokens` Set and `currentToken` variable are dead code
**File:** `backend/middleware/sessionToken.js:5,7`  
**Issue:** Declared but never used. Creates false sense of security.  
**Fix:** Remove unused declarations.

### H5. No error handling on hierarchy/dashboard JSON reads
**Files:** `backend/routes/hierarchy.js:10-13`, `backend/routes/dashboardDataRoutes.js:23`  
**Issue:** If file is missing, corrupt, or permission-denied, unhandled exception crashes the request.  
**Fix:** Wrap in try/catch.

### H6. 2FA secret sent in plain text via email
**File:** `backend/services/emailService.js:129-131`  
**Issue:** TOTP secret is transmitted in plain text email. If email is compromised, attacker gains permanent 2FA access.  
**Fix:** Remove secret from email or only send QR code.

### H7. Password reset token exposed as URL query parameter
**File:** `backend/services/emailService.js:107`  
**Issue:** Reset token in URL query string can leak via referrer headers, browser history sync, proxy logs.  
**Fix:** Use POST-based reset flow or path parameter.

### H8. Auth cookie `maxAge` of 365 days
**File:** `backend/controllers/authController.js:19`  
**Issue:** Cookie expires in 365 days (matching JWT). Stolen cookie valid for a year.  
**Fix:** Reduce to 24h or implement proper refresh/revocation.

### H9. No CSRF protection
**Files:** All routes  
**Issue:** No CSRF token mechanism, no Origin/Referer validation. State-changing operations are vulnerable to CSRF.  
**Fix:** Add CSRF middleware.

### H10. No security headers (Helmet)
**File:** `backend/index.js:26-43`  
**Issue:** Missing Content-Security-Policy, X-Frame-Options, HSTS, etc.  
**Fix:** Add `const helmet = require('helmet'); app.use(helmet());`.

### H11. Admin seed password hardcoded in source
**File:** `backend/utils/seed.js:6`  
```js
const ADMIN_PASSWORD = "Admin@123";
```
**Issue:** Weak, known admin password hardcoded. If seed runs in production, admin account is compromised.  
**Fix:** Use env vars; skip seeding in production.

### H12. Duplicate mailer implementations
**Files:** `backend/utils/mailer.js`, `backend/services/emailService.js`  
**Issue:** Both implement `sendEmail`, `getEmails`, `clearEmails`. `mailer.js` is dead code that adds confusion.  
**Fix:** Remove `mailer.js` and consolidate.

### H13. `forgotPassword` stores SHA-256 of reset token without salt
**File:** `backend/services/authService.js:344-346`  
**Issue:** `crypto.createHash("sha256").update(resetToken)` — no salt, no HMAC.  
**Fix:** Use `crypto.createHmac` or bcrypt.

### H14. Body size limit 10kb too restrictive
**File:** `backend/index.js:36`  
**Issue:** 10 kilobytes is very small. Bulk operations, CSV export, workspace messages, dashboard layouts may exceed this.  
**Fix:** Increase to at least 100kb or 1mb.

### H15. `transport.sendMail` silently swallows errors
**Files:** `backend/services/emailService.js:74`, `backend/services/emailService.js:75`  
**Issue:** `.catch(() => {})` → all SMTP errors are silently swallowed. No one knows if emails fail.  
**Fix:** Log the error properly.

### H16. No input rate limiting on WebSocket events
**File:** `backend/utils/websocket.js:80-161`  
**Issue:** Event and page_view handlers write to `db.json` on every message. No per-user rate limiting. Spam attack possible.  
**Fix:** Implement per-user rate limiting on WebSocket event handlers.

### H17. `receiveMemberAdded` reducer missing in workspaceSlice
**File:** `frontend/src/redux/slices/workspaceSlice.js:89`  
**Issue:** The `receiveMemberAdded` case in the reducer is incomplete/not properly handling deduplication.  
**Fix:** Implement proper dedup logic matching `addMember.fulfilled` pattern.

### H18. Stale closure in HierarchyTable polling interval
**File:** `frontend/src/components/HierarcyTable.jsx:452-453,466-478`  
**Issue:** Uses local closure variables `prevConfigStr`/`prevDataStr` in setInterval — these are stale after re-renders. Also has leftover `console.log("data ", rawData)`.  
**Fix:** Replace with `useRef` references.

---

## MEDIUM (22)

### M1. `bulkSuspendUsers` returns non-serializable `Set` in thunk payload
**File:** `frontend/src/redux/slices/adminSlice.js:199-201`  
**Issue:** `return { userIds: new Set(userIds), suspended }` — `Set` is not JSON-serializable. Will trigger RTK serializableCheck warnings.  
**Fix:** Return plain array, create `Set` inside reducer.

### M2. WidgetManager has invalid MUI `sx` prop syntax
**File:** `frontend/src/components/admin/WidgetManager.jsx:111`  
**Issue:** `sx={{ display="flex", ... }}` uses `=` instead of `:`. This is invalid JSX/syntax error.  
**Fix:** Use `sx={{ display: "flex", ... }}`.

### M3. `Token` field persisted via redux-persist (security risk)
**File:** `frontend/src/redux/store.js:24`  
**Issue:** No `whitelist` in persist config — the entire auth reducer is persisted, including JWT `token` to localStorage. This makes the token recoverable from disk.  
**Fix:** Add `whitelist: ['user']` to only persist user data.

### M4. Pending deletion cancelled silently on every `checkStatus`
**File:** `backend/services/authService.js:418-423`  
**Issue:** Every time a user's status is checked, any pending account deletion is silently cancelled. Visiting the site after receiving deletion warning cancels it.  
**Fix:** Only cancel on explicit user action.

### M5. Session token validates format but not user identity
**File:** `backend/middleware/sessionToken.js:11-46`  
**Issue:** Validates token format but NEVER extracts or uses `userId`. Does not attach `req.user`. Any valid token from any user passes.  
**Fix:** Attach decrypted user to `req.session`.

### M6. `/api/dashboard-data` and `/api/hierarchy/*` only use `sessionToken` (not `requireAuth`)
**Files:** `backend/routes/dashboardDataRoutes.js:17`, `backend/routes/hierarchy.js:15,20`  
**Issue:** Only require session token which can be obtained before full 2FA verification. Partially-registered users can access these.  
**Fix:** Add `requireAuth`.

### M7. `stay-active` and `inactivity-status` lack `requireAuth`
**File:** `backend/routes/authRoutes.js:77`  
**Issue:** Accept `userId` and `token` from body/query rather than JWT. No `requireAuth`. Any user with a valid inactivity token for another user could extend their session.  
**Fix:** Add `requireAuth` and verify authenticated user matches `userId`.

### M8. `dashboardSlice` missing `.rejected` handler for `fetchSectionPermissions`
**File:** `frontend/src/redux/slices/dashboardSlice.js:64-66`  
**Issue:** No `.addCase(fetchSectionPermissions.rejected, ...)` — error state is never set on failure.  
**Fix:** Add the rejected handler.

### M9. Password visibility toggle disabled in Login
**File:** `frontend/src/pages/Login.jsx:178-186`  
**Issue:** `InputProps` with `endAdornment` for password toggle is commented out. Users cannot toggle password visibility.  
**Fix:** Uncomment the `InputProps`.

### M10. Inactivity timer env vars not defined — results in NaN
**File:** `frontend/src/hooks/useInactivityTimer.js:11-17`  
**Issue:** No default fallback for `VITE_INACTIVITY_TIMEOUT_MS` and `VITE_GRACE_PERIOD_SEC` — if env vars are missing, `parseInt` returns `NaN`.  
**Fix:** Add `|| 300000` and `|| 120` fallbacks.

### M11. Chart tooltip DOM leaks in React 19 StrictMode
**Files:** `frontend/src/components/charts/BarChart.jsx`, `LineChart.jsx`, `DonutChart.jsx`, `ScatterPlot.jsx`  
**Issue:** D3 tooltip divs are appended to `<body>` but never cleaned up on unmount. React 19 StrictMode mount/unmount cycles cause multiple orphaned tooltips.  
**Fix:** Remove tooltip before creating new one; use class-based cleanup selector.

### M12. `checkDisposableEmail` returns `true` if no email provided
**File:** `backend/middleware/validate.js:24`  
```js
if (!email) return true;
```
**Issue:** If email is empty/undefined, disposable check passes (returns "yes it's disposable"). While `isEmail()` would also fail, ordering means disposable check runs first.  
**Fix:** Move the falsy check after `isEmail()` validation.

### M13. Case-sensitive email comparison could bypass dedup
**File:** `backend/services/userService.js:8`  
```js
return db.users.find((u) => u.email === email);
```
**Issue:** Email lookups are case-sensitive. `User@Example.com` and `user@example.com` treated as different users.  
**Fix:** Compare case-insensitively.

### M14. `getLockRemainingMinutes` returns negative numbers
**File:** `backend/services/userService.js:21`  
**Issue:** If lock has expired, returns negative minutes. Could show "Try again in -3 minute(s)".  
**Fix:** `return Math.max(0, ...)`.

### M15. Session token TTL uses `Math.abs()` — allows future-dated tokens
**File:** `backend/middleware/sessionToken.js:41`  
```js
if (Math.abs(age) > TOKEN_TTL_MS) {
```
**Issue:** `Math.abs(age)` means a token created in the future is valid longer than intended.  
**Fix:** Use `age > TOKEN_TTL_MS` without `Math.abs`.

### M16. `encrypt()` returns `null` without caller checking
**File:** `backend/utils/cryptoHelper.js:32`  
```js
function encrypt(text) {
  if (!text) return null;
```
**Issue:** Returns null for empty input. If caller stores null in `twoFactorSecretEncrypted`, 2FA always fails.  
**Fix:** Throw error instead of returning null.

### M17. `ACTIVITY_THROTTLE_MS` env var name mismatch
**File:** `backend/services/userService.js:24` vs `backend/.env`  
**Issue:** Code reads `ACTIVITY_THROTTLE_MS` but `.env` has `ACTIVITY_LOG_THROTTLE_MS`. Code always falls back to 60000.  
**Fix:** Align the names.

### M18. Dead route: `/api/auth/dashboard-data` placeholder in authRoutes
**File:** `backend/routes/authRoutes.js:58-69`  
**Issue:** Returns static JSON placeholder. Actual dashboard data served elsewhere. Development leftover.  
**Fix:** Remove the placeholder route.

### M19. Root `.gitignore` only ignores `node_modules`
**File:** `C:\AuthApp\.gitignore`  
**Issue:** Missing `.env`, `backend/data/`, `frontend/dist/`, OS/IDE files, log files.  
**Fix:** Add comprehensive gitignore entries.

### M20. `PublicRoute` contains debug `console.log` statements
**File:** `frontend/src/routes/PublicRoute.jsx:9-12`  
**Issue:** Debug logs left in production code.  
**Fix:** Remove console.log statements.

### M21. `ProtectedRoute` uses unstyled `<div>Loading...</div>`
**File:** `frontend/src/routes/ProtectedRoute.jsx:10`  
**Issue:** Plain text loading indicator instead of proper MUI CircularProgress.  
**Fix:** Replace with MUI CircularProgress or Skeleton.

### M22. `apiClient.js` removes `persist:root` on 401 — conflicts with redux-persist
**File:** `frontend/src/services/apiClient.js:24`  
**Issue:** Directly removes `persist:root` from localStorage on 401. Could clash with redux-persist state restoration.  
**Fix:** Dispatch a Redux logout action instead.

---

## LOW (18)

### L1. `seed()` runs on every server startup
**File:** `backend/index.js:82`  
**Issue:** Reads full database on every restart, adds unnecessary I/O and latency.  
**Fix:** Only run seed in development mode.

### L2. `gracefulShutdown` uses `process.exit(0)` — doesn't wait
**File:** `backend/index.js:101-107`  
**Issue:** Forceful exit without waiting for WebSocket disconnects or pending writes.  
**Fix:** Close Socket.IO server and wait for writes before exiting.

### L3. Inactivity env vars defined but never used
**File:** `backend/.env:14-16`  
**Issue:** `INACTIVITY_TIMEOUT_MS`, `GRACE_PERIOD_MS`, `MONITOR_INTERVAL_MS` are never read by any code. Actual values hardcoded in `websocket.js:169`.  
**Fix:** Either use env vars or remove from `.env`.

### L4. Honeypot response reveals internal mechanism
**File:** `backend/middleware/validate.js:42-45`  
**Issue:** Response includes `"devNote": "Honeypot triggered, action was ignored."` and `"token": "fake-token-for-spambot"` — reveals deception.  
**Fix:** Return realistic success response without devNote.

### L5. `disabled` field in hierarchyData for one entry never used
**File:** `backend/data/hierarchyData.json:14`  
**Issue:** Field appears on one entry but no code reads or processes it.  
**Fix:** Either implement `disabled` handling or remove the field.

### L6. No health check for database file integrity
**Files:** All routes  
**Issue:** If db.json, hierarchyData.json, or dashboard data files corrupt, errors are generic 500 or crashes. No health check endpoint.  
**Fix:** Add file integrity checks to `/health` endpoint.

### L7. Admin operations have no activity logging
**File:** `backend/routes/adminRoutes.js`  
**Issue:** Admin CRUD operations not logged for audit purposes.  
**Fix:** Add `activityService.logActivity()` calls.

### L8. Websocket `disconnect` sets `sessionStart` after disconnect
**File:** `backend/utils/websocket.js:236-237`  
**Issue:** `meta.sessionStart = Date.now()` after disconnect — session is already over, this is dead code.  
**Fix:** Remove the post-disconnect assignment.

### L9. Emit functions swallow all WebSocket errors
**File:** `backend/services/adminService.js` (14 locations)  
**Issue:** Every WebSocket emit wrapped in `try {} catch (_) {}` — errors swallowed silently.  
**Fix:** Log the error instead of catching silently.

### L10. Stale Vite template assets and CSS
**Files:** `frontend/src/App.css`, `frontend/src/index.css`, `frontend/src/assets/hero.png`, `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg`  
**Issue:** 295 lines of unused CSS, 3 unused assets from Vite boilerplate.  
**Fix:** Delete unused files.

### L11. `session-ses_1554.md` stale agent log in project root
**Path:** `C:\AuthApp\session-ses_1554.md`  
**Issue:** 500+ lines of OpenCode agent session history committed to git.  
**Fix:** Delete and add `session-*.md` to `.gitignore`.

### L12. `build_err.txt` and `build_out.txt` stale artifacts
**Path:** `C:\AuthApp\frontend\build_err.txt`, `C:\AuthApp\frontend\build_out.txt`  
**Issue:** Empty build artifact files.  
**Fix:** Delete and add to `.gitignore`.

### L13. `frontend/README.md` is unmodified Vite boilerplate
**File:** `frontend/README.md`  
**Issue:** Does not describe the actual application.  
**Fix:** Update or remove.

### L14. Backend dev script lacks hot-reload
**File:** `backend/package.json`  
**Issue:** `"dev": "node index.js"` — no nodemon or `--watch`. Manual restart needed.  
**Fix:** Add nodemon or use `node --watch`.

### L15. Inactivity timeout mismatch: backend 10s vs frontend 30s
**Files:** `backend/.env:14`, `frontend/.env:10`  
**Issue:** `INACTIVITY_TIMEOUT_MS=10000` (10s) vs `VITE_INACTIVITY_TIMEOUT_MS=30000` (30s).  
**Fix:** Align to same value.

### L16. Password special character regex may be unintended
**File:** `backend/middleware/validate.js:65`  
**Issue:** Character class `[,.-]` includes ASCII range from `,` to `.` (includes `-`). Excludes `~`, `` ` ``, `_`, `[`, `]`, `;`, `'`, `/`.  
**Fix:** Be explicit about allowed special characters.

### L17. No TODO/FIXME comments anywhere in codebase
**Issue:** Grep for `TODO|FIXME|HACK|XXX` returns zero results. Either very clean code or intentionally removed. Consider documenting known limitations inline.

### L18. `hierarchyService.js` has dead exports
**File:** `frontend/src/services/hierarchyService.js`  
**Issue:** `createHierarchyNode`, `updateHierarchyNode`, `deleteHierarchyNode` call non-existent backend routes. Dead code.  
**Fix:** Remove dead exports or implement matching backend routes.

---

## Documentation Bugs (5)

| # | Issue | File |
|---|-------|------|
| D1 | Hierarchy API claims CRUD endpoints that don't exist | `AGENTS.md` |
| D2 | Claims `/` redirects to `/login` but actually redirects to `/dashboards` | `AGENTS.md` |
| D3 | Claims auth rate limit is 10/15min, code has 1000 | `AGENTS.md` vs `rateLimit.js` |
| D4 | Line reference for CORS config is outdated (line 15 → line 28) | `AGENTS.md` |
| D5 | Claims hierarchy data at `hierarchy.json`, actual files are `hierarchyConfig.json` and `hierarchyData.json` | `AGENTS.md` |

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 14 |
| HIGH | 18 |
| MEDIUM | 22 |
| LOW | 18 |
| DOCS | 5 |
| **TOTAL** | **77** |
