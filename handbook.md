# AuthApp — Developer Handbook

> Fixes, patterns, and actions to remember for future tasks.

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
