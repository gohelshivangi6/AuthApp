# AuthApp — Developer Handbook

> Fixes, patterns, and actions to remember for future tasks.
> Last updated: 2026-06-24

---

## Completed Fixes (Session 1)

### H1. Hierarchy CSV export — no authentication
**Fixed:** `backend/routes/hierarchy.js:25`
```js
router.post('/export/csv', sessionToken, (req, res) => {
```
Added `sessionToken` middleware to the CSV export endpoint (matching other hierarchy routes).

---

### H2. Dev email endpoints — no authentication
**Fixed:** `backend/routes/authRoutes.js:90,99`
```js
router.get('/dev/emails', requireAuth, async (req, res, next) => {
router.post('/dev/emails/clear', requireAuth, async (req, res, next) => {
```
Added `requireAuth` middleware so only logged-in users can read/clear the simulated mailbox.

---

### H3. Session token `blacklistedNonces` never populated (dead code)
**Fixed:** `backend/middleware/sessionToken.js:46-62`, `backend/controllers/authController.js:14,175`
```js
// sessionToken.js — new exported function
function revokeSessionToken(header) {
  if (!header) return;
  const parts = header.split(':');
  if (parts.length !== 3) return;
  const [iv, authTag, encryptedData] = parts;
  try {
    const payload = decryptData(encryptedData, iv, authTag);
    if (payload && payload.nonce && uuidRegex.test(payload.nonce)) {
      blacklistedNonces.add(payload.nonce);
    }
  } catch (_) {}
}
```
Wired into `logout` — now when a user logs out, their session token's nonce is blacklisted, making the token unusable for subsequent requests.

---

### H4. `validTokens` Set and `currentToken` variable — dead code
**Fixed:** `backend/middleware/sessionToken.js:5,7`
Removed unused `const validTokens = new Set()` and `let currentToken = null`. Kept `blacklistedNonces` which is used by the revocation check.

---

### H5. No error handling on hierarchy/dashboard JSON reads
**Fixed:** `backend/routes/hierarchy.js:15-33`, `backend/routes/dashboardDataRoutes.js:17-30`
```js
// Pattern used for all three endpoints
try {
  const data = readJSON('hierarchyConfig.json');
  res.json(encryptData(data));
} catch (err) {
  console.error('Failed to read hierarchy config:', err);
  res.status(500).json({ success: false, message: 'Failed to read hierarchy config' });
}
```

---

### H6. 2FA secret sent in plain text via email
**Fixed:** `backend/services/emailService.js:125-131`, `backend/services/authService.js:93`
Removed `${secretBase32}` from welcome email text and HTML. Stripped the `secret.base32` argument from `sendWelcomeEmail()` call. The secret is still returned in the setup-2fa API response for on-screen display.

---

### H7. Password reset token exposed as URL query parameter
**Fixed:** `backend/services/emailService.js:107`, `frontend/src/App.jsx:108`, `frontend/src/pages/ResetPassword.jsx:2,27`
- Changed email link from `/reset-password?token=${token}` to `/${token}`
- Changed React Router route from `/reset-password` to `/reset-password/:token`
- Switched from `useSearchParams` to `useParams` to read token from path

---

### H8. Auth cookie `maxAge` of 365 days
**Fixed:** `backend/controllers/authController.js:19`
```js
maxAge: 24 * 60 * 60 * 1000,  // was: 365 * 24 * 60 * 60 * 1000
```
Reduced from 365 days to 24 hours. If cookie is stolen, exposure window drops from a year to one day.

---

### H9. No CSRF protection
**Fixed:** `backend/middleware/csrf.js` (new file), `backend/index.js:14,43-44`
Created Origin/Referer header validation middleware. Rejects state-changing requests (POST/PUT/DELETE) that don't originate from the configured frontend URL. Combined with existing `sameSite: 'strict'` cookies and `X-Session-Token` header requirement.

---

### H10. No security headers (Helmet)
**Fixed:** `backend/index.js:3,28`, installed via npm
```js
const helmet = require('helmet');
app.use(helmet());
```
Sets X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, CSP, and other security headers on every response.

---

### H12. Duplicate mailer implementations
**Fixed:** Deleted `backend/utils/mailer.js` and `backend/utils/realMailer.js`
Both files were dead code — nothing imported them. `emailService.js` was already the sole active email module with its own nodemailer integration, simulated email writes to `emails.json`, and the full email template library.

---

### H13. SHA-256 reset token without salt
**Fixed:** `backend/services/authService.js:344`
```js
// Before: crypto.createHash("sha256").update(resetToken)
// After:  crypto.createHmac("sha256", JWT_SECRET).update(resetToken)
```
Changed from plain `createHash` to `createHmac` using `JWT_SECRET` as the key. Even if the database is stolen, the attacker can't verify guessed tokens without also knowing `JWT_SECRET`.

---

### H15. `transport.sendMail` silently swallows errors
**Fixed:** `backend/services/emailService.js:75`
```js
// Before: transport.sendMail({...}).catch(() => {});
// After:  transport.sendMail({...}).catch((err) => {
//           console.error('[EmailService] Failed to send real email:', err.message);
//         });
```
Now logs the SMTP error message instead of silently discarding it.

---

### H17. `receiveMemberAdded` reducer missing dedup
**Fixed:** `frontend/src/redux/slices/workspaceSlice.js:113-120`
```js
.addCase(addMember.fulfilled, (state, action) => {
  const { workspaceId, member } = action.payload;
  if (!state.members[workspaceId]) state.members[workspaceId] = [];
  if (!state.members[workspaceId].some((m) => m.userId === member.userId)) {
    state.members[workspaceId].push(member);  // ← now has dedup check
  }
})
```
Added `.some()` check to `addMember.fulfilled` so that when both the API response and WebSocket event arrive for the same member addition, they don't push a duplicate.

---

### H18. Stale closure + debug logs in HierarchyTable polling
**Fixed:** `frontend/src/components/HierarchyTable.jsx:465,502,514-515,519`
The stale closure was already fixed (used `useRef` for `prevConfigRef`/`prevDataRef`). Removed 4 leftover `console.log` statements that were cluttering browser dev tools.

---

## Remaining Bug Fixes (Future Sessions)

### CRITICAL

#### C1. Exposed secrets committed in `.env` files
**Files:** `backend/.env`, `frontend/.env`
- Rotate all secrets (SMTP password, JWT_SECRET, ENCRYPTION_KEY, SECRET_KEY)
- `git rm --cached backend/.env frontend/.env`
- Add `.env` to root `.gitignore`
- Purge from git history with `git filter-branch` or BFG

#### C2. Hardcoded fallback JWT secret in 3 locations
**Files:** `backend/controllers/authController.js:22`, `backend/services/authService.js:28`, `backend/utils/websocket.js:7`
- Replace `|| "fallback_jwt_secret..."` with crash-on-missing in production

#### C3. JWT tokens expire in 365 days
**File:** `backend/services/authService.js:32,36`
- Reduce auth token to 15min–24h with refresh token flow
- Reduce temp tokens (password reset, 2FA setup) to 10–15 minutes

#### C4. `writeDB` silently swallows failures
**File:** `backend/utils/dbHelper.js:54-67`
- Re-throw error after logging so callers know writes failed

#### C5. Race condition: `readDB` doesn't synchronize with write queue
**File:** `backend/utils/dbHelper.js:20-47`
- Have `readDB` also wait for `writeQueue` to resolve before reading

#### C6. Predictable AES-256 encryption key
**File:** `backend/.env` (`SECRET_KEY=12345678901234567890123456789012`)
- Generate proper random 32-byte hex key via `crypto.randomBytes(32).toString('hex')`

#### C7. `nodemailer` version `^9.0.1` — dependency confusion risk
**File:** `backend/package.json:24`
- Change to `"nodemailer": "^6.9.0"` (latest real version is 6.x)

#### C8. `crypto` npm package is unnecessary
**File:** `backend/package.json:17`
- Remove `"crypto": "^1.0.1"` — use built-in Node.js `crypto` module

#### C9. Hierarchy API documented but NOT implemented
**File:** `backend/routes/hierarchy.js` vs `AGENTS.md`
- Either implement `POST /`, `PUT /:id`, `DELETE /:id` or update docs + frontend service

#### C10. Frontend hierarchy calls will 404
**File:** `frontend/src/services/hierarchyService.js`
- Update service to call `/api/hierarchy/config` and `/api/hierarchy/data` separately (not a single `/api/hierarchy`)

#### C11. `PublicRoute` is disabled (commented out)
**File:** `frontend/src/App.jsx:104,113`
- Uncomment `<Route element={<PublicRoute />}>` wrappers to guard auth pages from already-logged-in users

#### C12. Root `node_modules/` is orphaned
**Path:** `C:\AuthApp\node_modules\`
- Delete the directory, add to root `.gitignore`

#### C13. Auth rate limiter is 1000/15min — not 10 as documented
**File:** `backend/middleware/rateLimit.js:25`
- Change `max` to 10

#### C14. `readSync` blocks event loop in request handlers
**Files:** `backend/routes/hierarchy.js:12`, `backend/routes/dashboardDataRoutes.js:23`
- Replace `fs.readFileSync` with `fs.promises.readFile` + async/await

---

### HIGH (remaining)

| ID | Issue | File | Fix |
|----|-------|------|-----|
| H11 | Admin seed password hardcoded | `backend/utils/seed.js:6` | Use env vars, skip seed in production |
| H14 | Body size limit 10kb too restrictive | `backend/index.js:36` | Increase to 100kb–1mb |
| H16 | No input rate limiting on WebSocket events | `backend/utils/websocket.js:80-161` | Add per-user rate limiting |

---

### MEDIUM (remaining)

| ID | Issue | File | Fix |
|----|-------|------|-----|
| M1 | `bulkSuspendUsers` returns non-serializable `Set` | `adminSlice.js:199-201` | Return plain array |
| M2 | WidgetManager invalid `sx` syntax | `WidgetManager.jsx:111` | `=` → `:` |
| M3 | Token persisted via redux-persist | `store.js:24` | Add `whitelist: ['user']` |
| M4 | Pending deletion cancelled on every `checkStatus` | `authService.js:418-423` | Only cancel on explicit action |
| M5 | Session token not user-aware | `sessionToken.js:11-46` | Attach decrypted user to `req` |
| M6 | Hierarchy/dashboard endpoints only use `sessionToken` | `dashboardDataRoutes.js:17`, `hierarchy.js:15,20` | Add `requireAuth` |
| M7 | `stay-active`/`inactivity-status` lack `requireAuth` | `authRoutes.js:77` | Add `requireAuth` + verify userId match |
| M8 | `dashboardSlice` missing rejected handler | `dashboardSlice.js:64-66` | Add `.addCase(rejected, ...)` |
| M9 | Password toggle disabled in Login | `Login.jsx:178-186` | Uncomment `InputProps` |
| M10 | Env vars missing → NaN | `useInactivityTimer.js:11-17` | Add `||` fallbacks |
| M11 | Chart tooltip DOM leaks | `BarChart.jsx`, `LineChart.jsx`, etc. | Class-based cleanup in useEffect |
| M12 | `checkDisposableEmail` returns true on empty | `validate.js:24` | Reorder validation |
| M13 | Case-sensitive email comparison | `userService.js:8` | `.toLowerCase()` both sides |
| M14 | Negative lock minutes | `userService.js:21` | `Math.max(0, ...)` |
| M15 | `Math.abs` on token age allows future tokens | `sessionToken.js:41` | Remove `Math.abs` |
| M16 | `encrypt()` returns null unhandled | `cryptoHelper.js:32` | Throw instead of returning null |
| M17 | Env var name mismatch | `userService.js:24` vs `.env` | Align names |
| M18 | Dead `/dashboard-data` placeholder route | `authRoutes.js:58-69` | Remove it |
| M19 | Root `.gitignore` too sparse | `C:\AuthApp\.gitignore` | Add comprehensive entries |
| M20 | `PublicRoute` debug console.log | `PublicRoute.jsx:9-12` | Remove |
| M21 | `ProtectedRoute` unstyled loading div | `ProtectedRoute.jsx:10` | Replace with MUI `CircularProgress` |
| M22 | `apiClient.js` removes `persist:root` on 401 | `apiClient.js:24` | Dispatch Redux logout instead |

---

### LOW (remaining)

| ID | Issue | File | Fix |
|----|-------|------|-----|
| L1 | `seed()` runs on every startup | `index.js:82` | Dev-only seeding |
| L2 | `gracefulShutdown` uses `process.exit(0)` | `index.js:101-107` | Wait for WS / pending writes |
| L3 | Inactivity env vars defined but never used | `.env:14-16` vs `websocket.js:169` | Use env vars or remove |
| L4 | Honeypot response reveals deception | `validate.js:42-45` | Return realistic response |
| L5 | `disabled` field unused in hierarchyData | `hierarchyData.json:14` | Implement or remove |
| L6 | No DB file integrity health check | all routes | Add to `/health` endpoint |
| L7 | Admin ops not logged | `adminRoutes.js` | Add `activityService.logActivity()` |
| L8 | `sessionStart` set after disconnect | `websocket.js:236-237` | Remove dead assignment |
| L9 | Emit functions swallow WS errors | `adminService.js` (14 spots) | Log instead of `catch (_) {}` |
| L10 | Stale Vite boilerplate assets | `App.css`, `index.css`, `assets/*.png/svg` | Delete unused files |
| L11 | `session-ses_*.md` in repo | project root | Delete + add to `.gitignore` |
| L12 | `build_err.txt` / `build_out.txt` artifacts | `frontend/` | Delete + gitignore |
| L13 | Frontend README is boilerplate | `frontend/README.md` | Update or remove |
| L14 | Backend dev script lacks hot-reload | `backend/package.json` | Add nodemon / `node --watch` |
| L15 | Inactivity timeout mismatch (10s vs 30s) | Both `.env` files | Align values |
| L16 | Password special char regex unclear | `validate.js:65` | Be explicit |
| L17 | No TODO/FIXME comments | entire codebase | Add inline docs for known limitations |
| L18 | Dead `hierarchyService.js` exports | `hierarchyService.js` | Remove or implement backend endpoints |

---

## Environment & Secrets

### Never commit `.env` files
```bash
# .env files are tracked in git — must un-track
git rm --cached backend/.env
git rm --cached frontend/.env
# Add to root .gitignore
echo ".env" >> .gitignore
echo "session-*.md" >> .gitignore
echo "backend/data/" >> .gitignore
```

**Check before commit:** `git status --short` — ensure no `.env` files appear.

### Generate proper secrets
```bash
# 32-byte hex key for ENCRYPTION_KEY / SECRET_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# JWT secret (minimum 256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Redux & State Management

### RTK serializableCheck — always ignore redux-persist actions
```js
// store.js
export const store = configureStore({
  reducer: { ... },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});
```

### Never return non-serializable values from `createAsyncThunk`
```js
// BAD — Set is not serializable
return { userIds: new Set(userIds), suspended };

// GOOD — return plain data, create Set in reducer
return { userIds, suspended };
// In reducer:
.addCase(bulkSuspendUsers.fulfilled, (state, action) => {
  const idSet = new Set(action.payload.userIds);
  state.users.forEach(u => { if (idSet.has(u.id)) u.suspended = action.payload.suspended; });
});
```

### redux-persist — whitelist-sensitive fields
```js
// Only persist user data, NOT the JWT token
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'],  // DON'T persist 'token'
};
```

---

## Backend Patterns

### JSON file reads — always async + try/catch
```js
// BAD — blocks event loop, crashes on error
function readJSON(filename) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// GOOD
async function readJSON(filename) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
    throw err;
  }
}
```

### `writeDB` — must re-throw errors
```js
// dbHelper.js — the .catch MUST re-throw
writeQueue = writeQueue
  .then(async () => { ... atomic write ... })
  .catch((error) => {
    console.error('Failed to write to JSON database atomically:', error);
    throw error;  // DON'T silently swallow
  });
```

### JWT — never use hardcoded fallbacks
```js
// BAD — if env var missing, anyone can forge tokens
const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret...";

// GOOD — crash hard if not configured
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
```

### JWT expiry — short-lived tokens
```js
// Auth tokens: 15 minutes to 24 hours max
jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

// Temp tokens (password reset, 2FA setup): 10-15 minutes
jwt.sign({ userId, type }, JWT_SECRET, { expiresIn: '10m' });

// Add refresh token flow for persistent sessions
```

### Session token — `Math.abs` is wrong for TTL check
```js
// BAD — future-dated tokens bypass expiry
if (Math.abs(age) > TOKEN_TTL_MS) { /* expired */ }

// GOOD
if (age > TOKEN_TTL_MS || age < 0) { /* expired */ }
```

### Rate limiting — actually enforce documented limits
```js
// rateLimit.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // NOT 1000 — brute force protection
});
```

---

## Frontend Patterns

### Stale closures in intervals — always use `useRef`
```js
// BAD — stale closure in setInterval
const [prevData, setPrevData] = useState(null);
setInterval(() => { console.log(prevData); }, 1000);  // prevData is always initial value

// GOOD
const prevDataRef = useRef(null);
setInterval(() => { console.log(prevDataRef.current); }, 1000);
```

### D3 tooltip cleanup — prevent DOM leaks
```js
useEffect(() => {
  // Remove orphaned tooltips before creating new ones
  d3.select("body").selectAll(".chart-tooltip").remove();

  const tooltip = d3.select("body").append("div")
    .attr("class", "chart-tooltip")  // Class-based cleanup
    .style("position", "absolute")...;

  return () => {
    tooltip.remove();  // Cleanup on unmount
  };
}, [data]);
```

### MUI `sx` prop — use colon, not equals
```jsx
// BAD — JSX syntax error
sx={{ display="flex" }}

// GOOD
sx={{ display: 'flex' }}
```

### Env var defaults — always provide fallbacks
```js
// hooks/useInactivityTimer.js
const INACTIVITY_TIMEOUT = parseInt(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS, 10) || 300000;
const GRACE_PERIOD = parseInt(import.meta.env.VITE_GRACE_PERIOD_SEC, 10) || 120;
```

---

## Security Checklist

- [ ] `.env` files not tracked in git
- [ ] No hardcoded secrets in source code
- [ ] JWT secret has no fallback — crash if missing
- [ ] JWT expiry ≤ 24h (or use refresh tokens)
- [ ] Rate limit auth endpoints to 10/15min
- [ ] CSRF protection enabled
- [ ] Helmet security headers enabled
- [ ] Body parser limit ≥ 100kb
- [ ] All API endpoints have proper auth middleware
- [ ] `crypto` npm package removed (use built-in)
- [ ] `nodemailer` version is `^6.x`, not `^9.x`
- [ ] No synchronous file reads in request handlers

---

## Git Hygiene

```bash
# Before committing
git status                    # check for unintended files
git diff --cached             # review staged changes
git diff                      # review unstaged changes

# Check for secrets in staged files
git diff --cached | grep -i "password\|secret\|key\b"

# Remove .env from tracking
git rm --cached backend/.env
git rm --cached frontend/.env

# Good commit messages (see git log for examples):
# feat: add inactivity email notifications
# fix: prevent stale closure in HierarchyTable polling
# chore: remove dead code in mailer.js
# security: rotate exposed SMTP credentials
```

---

## Common Fix Commands

```bash
# Remove orphaned root node_modules
Remove-Item -Recurse -Force node_modules

# Clean stale artifacts
Remove-Item -Force frontend/build_err.txt, frontend/build_out.txt
Remove-Item -Force session-*.md

# Run both servers
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev

# Frontend lint
cd frontend && npm run lint

# Frontend build
cd frontend && npm run build
```

---

## Architecture Invariants

1. **Backend is CJS** (`require`/`module.exports`), **Frontend is ESM** (`import`/`export`). Never mix.
2. **No TypeScript** — plain `.js`/`.jsx` only.
3. **No test suite** — backend test script is placeholder that exits with error.
4. **No monorepo tooling** — two independent packages.
5. **Database is JSON file** — no external DB required.
6. **Email is simulated** — writes to `emails.json`, also has real SMTP capability.
7. **`redux-persist` storage import** uses `.default` fallback for ESM/CJS interop — preserve this pattern.
