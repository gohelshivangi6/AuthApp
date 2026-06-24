# AuthApp — Project Overview

> Full-stack authentication & user management application with 2FA, admin dashboard, hierarchy management, and real-time features.

---

## Architecture

```
C:\AuthApp
├── frontend/          # React 19 + Vite 8 + MUI 9 SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level page components
│   │   ├── redux/         # Redux Toolkit store & slices
│   │   ├── routes/        # Public/Protected route wrappers
│   │   ├── services/      # API client & service modules
│   │   ├── hooks/         # Custom React hooks
│   │   ├── styles/        # SCSS global styles
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/           # Express 5 + JWT + TOTP 2FA API
│   ├── controllers/   # Route handler logic
│   ├── routes/        # Express route definitions
│   ├── middleware/     # Auth, validation, rate limiting, error handling
│   ├── services/      # Business logic layer
│   ├── utils/         # DB helpers, crypto, email, cleanup, seed
│   ├── data/          # JSON file storage (db.json, emails.json, etc.)
│   └── package.json
├── bugs.md            # Comprehensive bug audit
├── handbook.md        # Fixes & actions reference
├── AGENTS.md          # OpenCode agent instructions
└── .gitignore
```

**Key principle:** Two independent packages, no monorepo tooling. Each has its own `package.json` and `node_modules`.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| MUI (Material-UI) | 9 | Component library |
| Redux Toolkit | ~2.x | State management |
| redux-persist | ~6.x | State persistence to localStorage |
| React Router | 7 | Client-side routing |
| D3 | ~7.x | Data visualization (charts) |
| @dnd-kit | ~6.x / ~10.x | Drag & drop (dashboard layout) |
| SCSS | preprocessor | Global styling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 5 | HTTP framework |
| jsonwebtoken | ~9.x | JWT signing & verification |
| speakeasy | ~2.x | TOTP 2FA generation & verification |
| qrcode | ~1.x | QR code generation for 2FA setup |
| nodemailer | ^9.0.1* | Email sending (SMTP) |
| uuid | ~10.x | Unique ID generation |
| express-rate-limit | ~7.x | Rate limiting |
| express-validator | ~7.x | Input validation |
| Socket.IO | ~4.x | WebSocket real-time communication |
| dotenv | ~16.x | Environment variable loading |
| crypto | ^1.0.1* | **BUG: unnecessary npm package (use built-in)** |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | None | User registration |
| POST | `/login` | None | User login |
| POST | `/setup-2fa` | requireAuth | Initialize TOTP 2FA setup |
| POST | `/verify-2fa` | requireAuth | Verify TOTP code & enable 2FA |
| POST | `/verify-login-2fa` | None | Verify TOTP during login |
| POST | `/forgot-password` | None | Request password reset |
| POST | `/reset-password` | None | Reset password with token |
| POST | `/logout` | requireAuth | Logout & invalidate session |
| GET | `/status` | requireAuth | Get current user auth status |
| GET | `/dashboard-data` | requireAuth+sessionToken | Placeholder dashboard data |
| POST | `/stay-active` | None | Prevent session timeout |
| GET | `/inactivity-status` | None | Check inactivity status |
| GET | `/dev/emails` | None | Read simulated emails (dev) |
| POST | `/dev/emails/clear` | None | Clear simulated emails (dev) |

### Admin (`/api/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | requireAuth | List all users |
| POST | `/users` | requireAuth | Create user |
| PUT | `/users/:id` | requireAuth | Update user |
| DELETE | `/users/:id` | requireAuth | Delete user (soft) |
| POST | `/users/bulk-delete` | requireAuth | Bulk delete users |
| POST | `/users/bulk-suspend` | requireAuth | Bulk suspend/unsuspend |
| POST | `/users/bulk-create` | requireAuth | Bulk create users |
| GET | `/users/export` | requireAuth | Export users (CSV/JSON) |
| GET | `/departments` | requireAuth | List departments |
| POST | `/departments` | requireAuth | Create department |
| PUT | `/departments/:id` | requireAuth | Update department |
| DELETE | `/departments/:id` | requireAuth | Delete department |
| GET | `/audit-logs` | requireAuth | View audit logs |
| POST | `/audit-logs/clear` | requireAuth | Clear audit logs |
| GET | `/roles` | requireAuth | List roles |
| POST | `/roles` | requireAuth | Create role |
| PUT | `/roles/:id` | requireAuth | Update role |
| DELETE | `/roles/:id` | requireAuth | Delete role |
| GET | `/roles/:id/permissions` | requireAuth | Get role permissions |
| PUT | `/roles/:id/permissions` | requireAuth | Update role permissions |
| GET | `/workspace-settings` | requireAuth | Get workspace settings |
| PUT | `/workspace-settings` | requireAuth | Update workspace settings |

### Dashboard (`/api/dashboard`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | requireAuth+sessionToken | Get all dashboards |
| POST | `/` | requireAuth+sessionToken | Create dashboard |
| GET | `/:name/layout` | requireAuth+sessionToken | Get dashboard layout |
| PUT | `/:name/layout` | requireAuth+sessionToken | Update dashboard layout |
| GET | `/data/:name` | requireAuth+sessionToken | Get dashboard data |

### Hierarchy (`/api/hierarchy`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/config` | sessionToken | Get hierarchy configuration |
| GET | `/data` | sessionToken | Get hierarchy data |
| POST | `/export/csv` | None* | Export hierarchy as CSV |

> **Note:** `POST /`, `PUT /:id`, `DELETE /:id` are documented but NOT implemented (see bugs.md).

### Workspace (`/api/workspace`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | requireAuth | List workspaces |
| POST | `/` | requireAuth | Create workspace |
| GET | `/:id/messages` | requireAuth | Get workspace messages |
| POST | `/:id/messages` | requireAuth | Send workspace message |
| POST | `/:id/join` | requireAuth | Join workspace |
| POST | `/:id/leave` | requireAuth | Leave workspace |

---

## Database Architecture

**Storage:** JSON files with atomic writes (temp file + rename).

| File | Location | Purpose |
|------|----------|---------|
| `db.json` | `backend/data/` | Users, admin config, workspace data |
| `emails.json` | `backend/data/` | Simulated email mailbox |
| `hierarchyConfig.json` | `backend/data/` | Hierarchy tree configuration |
| `hierarchyData.json` | `backend/data/` | Hierarchy node data |
| `dashboard-*.json` | `backend/data/` | Per-dashboard configuration & layout |
| `db.backup.json` | `backend/data/` | Auto-backup on writes |

**Write pattern:** Atomic via `writeFile` to temp → `rename` to target. Queued via promise chain (`writeQueue`).

---

## Authentication Flow

1. **Signup** → User created with `pendingDelete` + email verification
2. **Login** → Validates credentials → checks lock → checks 2FA status
3. **2FA Setup** → Generates TOTP secret → shows QR code + manual code → user verifies via OTP
4. **2FA Verification (login)** → After password check, if 2FA enabled, requires OTP
5. **Session** → JWT (365d expiry) + session token (encrypted, 15min TTL) + inactivity monitoring
6. **Inactivity** → WebSocket monitors activity → warning at threshold → force logout → email notification
7. **Account Deletion** → Soft delete with pending period → email notification → cancellation possible

---

## Redux State Structure

```js
{
  auth: {          // Persisted (redux-persist)
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  },
  admin: {         // Not persisted
    users: [],
    departments: [],
    roles: [],
    auditLogs: [],
    workspaceSettings: null,
    loading: false,
    error: null
  },
  dashboard: {     // Not persisted
    departments: [],
    widgets: [],
    sectionPermissions: [],
    layoutBySlug: {},
    loading: false,
    error: null
  },
  workspace: {     // Not persisted
    workspaces: [],
    members: {},
    messages: {},
    messagesTotal: {},
    loading: false
  }
}
```

---

## Key Features

1. **User Management** — CRUD, bulk operations, soft delete, export
2. **Role-Based Access Control** — Custom roles with granular permissions
3. **Department Management** — Organizational unit management
4. **TOTP 2FA** — Time-based one-time password via authenticator app
5. **Inactivity Monitoring** — Real-time tracking via WebSocket, auto-logout
6. **Account Deletion Flow** — Soft delete → pending period → permanent delete
7. **Dashboard System** — Configurable dashboards with widgets & drag-and-drop
8. **Hierarchy Table** — Tree structure (Zone Head → CSO → ASM → DB → Product → CKU)
9. **Real-Time Chat** — Workspace messaging via Socket.IO
10. **Admin Audit Logging** — Track admin actions
11. **Password Reset** — Email-based reset flow
12. **Rate Limiting** — Global + per-route rate limits

---

## Known Issues (Top 5 Critical)

1. **Exposed secrets in `.env`** — SMTP password, JWT secret, encryption keys in git history
2. **`nodemailer` v9 dependency confusion** — Latest real version is 6.x
3. **`crypto` npm package** — Unnecessary, should use built-in Node.js crypto
4. **Hierarchy API mismatch** — Frontend calls non-existent endpoints → runtime 404
5. **`writeDB` silent failures** — Data loss invisible to all callers

See `bugs.md` for the complete audit.
