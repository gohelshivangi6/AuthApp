# New session - 2026-06-09T04:42:21.425Z

**Session ID:** ses_1554fb296ffeEoGb73G370ax5e
**Created:** 6/9/2026, 10:12:21 AM
**Updated:** 6/9/2026, 10:25:03 AM

---

## User

Create or update `AGENTS.md` for this repository.

The goal is a compact instruction file that helps future OpenCode sessions avoid mistakes and ramp up quickly. Every line should answer: "Would an agent likely miss this without help?" If not, leave it out.

User-provided focus or constraints (honor these):


## How to investigate

Read the highest-value sources first:
- `README*`, root manifests, workspace config, lockfiles
- build, test, lint, formatter, typecheck, and codegen config
- CI workflows and pre-commit / task runner config
- existing instruction files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`)
- repo-local OpenCode config such as `opencode.json`

If architecture is still unclear after reading config and docs, inspect a small number of representative code files to find the real entrypoints, package boundaries, and execution flow. Prefer reading the files that explain how the system is wired together over random leaf files.

Prefer executable sources of truth over prose. If docs conflict with config or scripts, trust the executable source and only keep what you can verify.

## What to extract

Look for the highest-signal facts for an agent working in this repo:
- exact developer commands, especially non-obvious ones
- how to run a single test, a single package, or a focused verification step
- required command order when it matters, such as `lint -> typecheck -> test`
- monorepo or multi-package boundaries, ownership of major directories, and the real app/library entrypoints
- framework or toolchain quirks: generated code, migrations, codegen, build artifacts, special env loading, dev servers, infra deploy flow
- repo-specific style or workflow conventions that differ from defaults
- testing quirks: fixtures, integration test prerequisites, snapshot workflows, required services, flaky or expensive suites
- important constraints from existing instruction files worth preserving

Good `AGENTS.md` content is usually hard-earned context that took reading multiple files to infer.

## Questions

Only ask the user questions if the repo cannot answer something important. Use the `question` tool for one short batch at most.

Good questions:
- undocumented team conventions
- branch / PR / release expectations
- missing setup or test prerequisites that are known but not written down

Do not ask about anything the repo already makes clear.

## Writing rules

Include only high-signal, repo-specific guidance such as:
- exact commands and shortcuts the agent would otherwise guess wrong
- architecture notes that are not obvious from filenames
- conventions that differ from language or framework defaults
- setup requirements, environment quirks, and operational gotchas
- references to existing instruction sources that matter

Exclude:
- generic software advice
- long tutorials or exhaustive file trees
- obvious language conventions
- speculative claims or anything you could not verify
- content better stored in another file referenced via `opencode.json` `instructions`

When in doubt, omit.

Prefer short sections and bullets. If the repo is simple, keep the file simple. If the repo is large, summarize the few structural facts that actually change how an agent should work.

If `AGENTS.md` already exists at `/`, improve it in place rather than rewriting blindly. Preserve verified useful guidance, delete fluff or stale claims, and reconcile it with the current codebase.

---

## Assistant (Build · MiMo V2.5 Free · 8.8s)

_Thinking:_

Let me start by exploring the repository structure and reading key files to understand the codebase.

**Tool: skill**

**Input:**
```json
{
  "name": "customize-opencode"
}
```

**Output:**
```
<skill_content name="customize-opencode">
# Skill: customize-opencode

<!--
  Built-in skill. Name and description are registered in code at
  packages/core/src/plugin/skill.ts
  and CUSTOMIZE_OPENCODE_SKILL_DESCRIPTION). The body below becomes the
  skill's content.
-->

# Customizing opencode

opencode validates its own config strictly and refuses to start when a field
is wrong. The shapes below cover the common surface area, but they are a
**summary, not the source of truth**.

## Full schema reference

The authoritative list of every config option — with field types, enums,
defaults, and descriptions — lives in the published JSON Schema:

**<https://opencode.ai/config.json>**

If a field is not documented in this skill, or you need to confirm an exact
shape before writing config, **fetch that URL and read the schema directly**
rather than guessing. opencode hard-fails on invalid config, so the cost of a
wrong shape is a broken startup.

Independently, every `opencode.json` should declare
`"$schema": "https://opencode.ai/config.json"` so the user's editor catches
mistakes as they type.

## Applying changes

Config is loaded once when opencode starts and is not hot-reloaded. After
saving changes to `opencode.json`, an agent file, a skill, a plugin, or any
other config-time file, **tell the user to quit and restart opencode** for
the changes to take effect. The running session will keep using the
already-loaded config until then.

## Where files live

| Scope                         | Path                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Project config                | `./opencode.json`, `./opencode.jsonc`, or `.opencode/opencode.json` (opencode walks up from the cwd to the worktree root) |
| Global config                 | `~/.config/opencode/opencode.json` (NOT `~/.opencode/`)                                                                   |
| Project agents                | `.opencode/agent/<name>.md` or `.opencode/agents/<name>.md`                                                               |
| Global agents                 | `~/.config/opencode/agent(s)/<name>.md`                                                                                   |
| Project skills                | `.opencode/skill(s)/<name>/SKILL.md`                                                                                      |
| Global skills                 | `~/.config/opencode/skill(s)/<name>/SKILL.md`                                                                             |
| External skills (auto-loaded) | `~/.claude/skills/<name>/SKILL.md`, `~/.agents/skills/<name>/SKILL.md`                                                    |

Configs from each scope are deep-merged. Project overrides global. Unknown
top-level keys in `opencode.json` are rejected with `ConfigInvalidError`.

## opencode.json

Every field is optional.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "username": "string",
  "model": "provider/model-id",
  "small_model": "provider/model-id",
  "default_agent": "agent-name",
  "shell": "/bin/zsh",
  "logLevel": "DEBUG" | "INFO" | "WARN" | "ERROR",
  "share": "manual" | "auto" | "disabled",
  "autoupdate": true | false | "notify",
  "snapshot": true,
  "instructions": ["AGENTS.md", "docs/style.md"],

  "skills": {
    "paths": [".opencode/skills", "/abs/path/to/skills"],
    "urls": ["https://example.com/.well-known/skills/"]
  },

  "agent": {
    "my-agent": {
      "model": "anthropic/claude-sonnet-4-6",
      "mode": "subagent",
      "description": "...",
      "permission": { "edit": "deny" }
    }
  },

  "command": {
    "deploy": { "description": "...", "prompt": "..." }
  },

  "provider": {
    "anthropic": { "options": { "apiKey": "..." } }
  },
  "disabled_providers": ["openai"],
  "enabled_providers": ["anthropic"],

  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true,
      "env": {}
    },
    "remote-thing": {
      "type": "remote",
      "url": "https://...",
      "headers": { "Authorization": "Bearer ..." }
    }
  },

  "plugin": [
    "opencode-gemini-auth",
    "opencode-foo@1.2.3",
    "./local-plugin.ts",
    ["opencode-bar", { "option": "value" }]
  ],

  "permission": {
    "edit": "deny",
    "bash": { "git *": "allow", "*": "ask" }
  },

  "formatter": false,
  "lsp": false,

  "experimental": {
    "primary_tools": ["edit"],
    "mcp_timeout": 30000
  },

  "tool_output": { "max_lines": 200, "max_bytes": 8192 },

  "compaction": { "auto": true, "tail_turns": 15 }
}
```

Shape notes worth being explicit about:

- `model` always carries a provider prefix: `"anthropic/claude-sonnet-4-6"`.
- `skills` is an object with `paths` and/or `urls`, not an array.
- `agent` is an object keyed by agent name, not an array.
- `plugin` is an array of strings or `[name, options]` tuples, not an object.
- `mcp[name].command` is an array of strings, never a single string. `type` is required.
- `permission` is either a string action or an object keyed by tool name.

## Skills

opencode's skill loader scans for `**/SKILL.md` inside skill directories. The
file is named `SKILL.md` exactly, and lives in its own folder named after the
skill:

```
.opencode/skills/my-skill/SKILL.md
```

Frontmatter:

```markdown
---
name: my-skill
description: One sentence covering what this skill does AND when to trigger it. Front-load the literal keywords or filenames the user is likely to say.
---

# My Skill

(skill body in markdown: instructions, examples, references)
```

- `name` is required, lowercase hyphen-separated, up to 64 chars, and matches the folder name.
- `description` is effectively required: skills without one are filtered out and never surfaced to the model. Cover both _what_ the skill does and _when_ to use it. Write in third person ("Use when...", not "I help with..."). Front-load concrete trigger keywords and filenames; gate with "Use ONLY when..." if the skill should stay quiet on adjacent topics.
- Optional: `license`, `compatibility`, `metadata` (string-string map).

Register skills from non-default locations via `skills.paths` (scanned
recursively for `**/SKILL.md`) and `skills.urls` (each URL serves a list of
skills).

## Agents

Two ways to define an agent. Use the file form for anything non-trivial.

### Inline (in `opencode.json`)

```json
{
  "agent": {
    "my-reviewer": {
      "description": "Reviews PRs for style violations.",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-6",
      "permission": { "edit": "deny", "bash": "ask" },
      "prompt": "You are a strict PR reviewer..."
    }
  }
}
```

### File

```
.opencode/agent/my-reviewer.md      OR     .opencode/agents/my-reviewer.md
```

```markdown
---
description: Reviews PRs for style violations.
mode: subagent
model: anthropic/claude-sonnet-4-6
permission:
  edit: deny
  bash: ask
---

You are a strict PR reviewer. Focus on...
```

The file body becomes the agent's `prompt`. Do not also put `prompt:` in the
frontmatter.

`mode` is one of `"primary"`, `"subagent"`, `"all"`.

Allowed top-level frontmatter fields: `name, model, variant, description, mode,
hidden, color, steps, options, permission, disable, temperature, top_p`. Any
unknown field is silently routed into `options`.

To disable a built-in agent: `agent: { build: { disable: true } }`, or in a
file, `disable: true` in frontmatter.

`default_agent` must point to a non-hidden, primary-mode agent.

### Built-in agents

opencode ships with `build`, `plan`, `general`, `explore`. Hidden internal agents:
`compaction`, `title`, `summary`. To override a built-in's fields, define the
same key in `agent: { <name>: { ... } }`.

## Plugins

`plugin:` is an array. Each entry is one of:

```json
"plugin": [
  "opencode-gemini-auth",            // npm spec, latest
  "opencode-foo@1.2.3",              // npm spec, pinned
  "./local-plugin.ts",               // file path, relative to the declaring config
  "file:///abs/path/plugin.js",      // file URL
  ["opencode-bar", { "key": "val" }] // tuple form with options
]
```

Auto-discovered plugins (no config entry needed): any `*.ts` or `*.js` file in
`.opencode/plugin/` or `.opencode/plugins/`.

A plugin module exports `default` (or any named export) of type
`Plugin = (input: PluginInput, options?) => Promise<Hooks>`. The export is a
function, not a plain object literal, and the function returns an object
(return `{}` if there is nothing to register).

```ts
import type { Plugin } from "@opencode-ai/plugin"

export default (async ({ client, project, directory, $ }) => {
  return {
    config: (cfg) => {
      // cfg is the live merged config; mutate fields here.
    },
    "tool.execute.before": async (input, output) => {
      // mutate output.args before the tool runs
    },
  }
}) satisfies Plugin
```

Hook surface (mutate `output` in place; return `void`):

- `event(input)`: every bus event
- `config(cfg)`: once on init with the merged config
- `chat.message`, `chat.params`, `chat.headers`
- `tool.execute.before`, `tool.execute.after`
- `tool.definition`
- `command.execute.before`
- `shell.env`
- `permission.ask`
- `experimental.chat.messages.transform`, `experimental.chat.system.transform`,
  `experimental.session.compacting`, `experimental.compaction.autocontinue`,
  `experimental.text.complete`

Special object-shaped (not callbacks): `tool: { my_tool: { ... } }`,
`auth: { ... }`, `provider: { ... }`.

## MCP servers

`mcp:` is an object keyed by server name. Each server is discriminated by
`type`:

```json
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true,
      "env": { "BROWSER": "chromium" }
    },
    "github": {
      "type": "remote",
      "url": "https://...",
      "enabled": true,
      "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" }
    },
    "old-server": { "enabled": false }
  }
}
```

`command` is an array of strings. `type` is required. Use `enabled: false` to
disable a server inherited from a parent config.

## Permissions

```json
"permission": {
  "edit": "deny",
  "bash": { "git *": "allow", "rm *": "deny", "*": "ask" },
  "external_directory": { "~/secrets/**": "deny", "*": "allow" }
}
```

Actions: `"allow"`, `"ask"`, `"deny"`.

Per-tool value forms: `"allow"` shorthand (treated as `{"*": "allow"}`), or an
object `{ pattern: action }`. Within an object, **insertion order matters**.
opencode evaluates the LAST matching rule, so put broad rules first and narrow
rules last.

`permission: "allow"` (a string at the top level) is shorthand for "allow
everything" and is rarely what the user wants.

Known permission keys: `read, edit, glob, grep, list, bash, task,
external_directory, todowrite, question, webfetch, websearch, lsp, doom_loop,
skill`. Some of these (`todowrite,
question, webfetch, websearch, doom_loop`) only accept a flat
action, not a per-pattern object.

`external_directory` patterns are filesystem paths (use `~/`, absolute paths,
or globs like `~/projects/**`).

Per-agent `permission:` overrides top-level `permission:`. Plan Mode lives on
the `plan` agent's permission ruleset (`edit: deny *`).

## Escape hatches

When a user's config is broken and opencode won't start, these env vars help:

- `OPENCODE_DISABLE_PROJECT_CONFIG=1`: skip the project's local `opencode.json`
  and start from globals only. Run from the project directory, opencode loads,
  the user edits the broken file, then they restart without the flag.
- `OPENCODE_CONFIG=/path/to/file.json`: load an additional explicit config.
- `OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json"}'`:
  inject inline JSON as a final local-scope merge.
- `OPENCODE_DISABLE_DEFAULT_PLUGINS=1`: skip default plugins.
- `OPENCODE_PURE=1`: skip external plugins entirely.
- `OPENCODE_DISABLE_EXTERNAL_SKILLS=1`,
  `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1`: skip the external skill scans under
  `~/.claude/` and `~/.agents/`.

## When proposing edits

- Validate against the schema before writing. If you are unsure of a field's
  exact shape, or the field is not covered in this skill, fetch
  `https://opencode.ai/config.json` and read the schema rather than guessing.
- Preserve `$schema` and any existing fields the user did not ask to change.
- For agent, skill, and plugin definitions, prefer creating new files in the
  correct location over inlining everything in `opencode.json`.
- If the user's existing config is malformed, point them at the env-var escape
  hatches above so they can edit from inside opencode without breaking their
  session.
- After saving any config change, remind the user to quit and restart opencode
  — running sessions keep using the already-loaded config.

Base directory for this skill: file:///C:/AuthApp
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>C:\AuthApp\backend\utils\mailer.js</file>
<file>C:\AuthApp\backend\utils\dbHelper.js</file>
<file>C:\AuthApp\backend\utils\cryptoHelper.js</file>
<file>C:\AuthApp\backend\utils\cleanup.js</file>
<file>C:\AuthApp\node_modules\react\README.md</file>
<file>C:\AuthApp\node_modules\react\react.react-server.js</file>
<file>C:\AuthApp\node_modules\react\package.json</file>
<file>C:\AuthApp\node_modules\react\LICENSE</file>
<file>C:\AuthApp\node_modules\react\jsx-runtime.react-server.js</file>
<file>C:\AuthApp\node_modules\react\jsx-runtime.js</file>
</skill_files>
</skill_content>
```

---

## Assistant (Build · MiMo V2.5 Free · 4.5s)

_Thinking:_

This is an AuthApp repository. Let me explore its structure to understand what it is and what I need to document.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp"
}
```

**Output:**
```
<path>C:\AuthApp</path>
<type>directory</type>
<entries>
backend/
frontend/
node_modules/

(3 entries)
</entries>
```

---

## Assistant (Build · MiMo V2.5 Free · 3.6s)

_Thinking:_

This looks like a full-stack JavaScript project with backend and frontend directories. Let me explore both directories.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend"
}
```

**Output:**
```
<path>C:\AuthApp\backend</path>
<type>directory</type>
<entries>
.env
controllers/
data/
index.js
middleware/
node_modules/
package-lock.json
package.json
routes/
utils/

(10 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend"
}
```

**Output:**
```
<path>C:\AuthApp\frontend</path>
<type>directory</type>
<entries>
.gitignore
dist/
eslint.config.js
index.html
node_modules/
package-lock.json
package.json
public/
README.md
src/
vite.config.js

(11 entries)
</entries>
```

---

## Assistant (Build · MiMo V2.5 Free · 3.3s)

_Thinking:_

Let me look at package.json files, README files, and configuration files to understand the project.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\package.json"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\package.json</path>
<type>file</type>
<content>
1: {
2:   "name": "frontend",
3:   "private": true,
4:   "version": "0.0.0",
5:   "type": "module",
6:   "scripts": {
7:     "dev": "vite",
8:     "build": "vite build",
9:     "lint": "eslint .",
10:     "preview": "vite preview"
11:   },
12:   "dependencies": {
13:     "@emotion/react": "^11.14.0",
14:     "@emotion/styled": "^11.14.1",
15:     "@mui/icons-material": "^9.0.1",
16:     "@mui/material": "^9.0.1",
17:     "@reduxjs/toolkit": "^2.12.0",
18:     "axios": "^1.17.0",
19:     "d3": "^7.9.0",
20:     "react": "^19.2.6",
21:     "react-dom": "^19.2.6",
22:     "react-redux": "^9.3.0",
23:     "react-router-dom": "^7.16.0",
24:     "redux-persist": "^6.0.0",
25:     "sass": "^1.100.0"
26:   },
27:   "devDependencies": {
28:     "@eslint/js": "^10.0.1",
29:     "@types/react": "^19.2.14",
30:     "@types/react-dom": "^19.2.3",
31:     "@vitejs/plugin-react": "^6.0.1",
32:     "eslint": "^10.3.0",
33:     "eslint-plugin-react-hooks": "^7.1.1",
34:     "eslint-plugin-react-refresh": "^0.5.2",
35:     "globals": "^17.6.0",
36:     "vite": "^8.0.12"
37:   }
38: }

(End of file - total 38 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\README.md"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\README.md</path>
<type>file</type>
<content>
1: # React + Vite
2: 
3: This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
4: 
5: Currently, two official plugins are available:
6: 
7: - [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
8: - [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
9: 
10: ## React Compiler
11: 
12: The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
13: 
14: ## Expanding the ESLint configuration
15: 
16: If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

(End of file - total 16 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\vite.config.js"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\vite.config.js</path>
<type>file</type>
<content>
1: import { defineConfig } from 'vite'
2: import react from '@vitejs/plugin-react'
3: 
4: // https://vite.dev/config/
5: export default defineConfig({
6:   plugins: [react()],
7: })

(End of file - total 7 lines)
</content>
```

---

## Assistant (Build · MiMo V2.5 Free · 2.8s)

_Thinking:_

Let me look at the frontend src directory and backend structure to understand the app better.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src</path>
<type>directory</type>
<entries>
App.css
App.jsx
assets/
components/
index.css
main.jsx
pages/
redux/
routes/
styles/

(10 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\.gitignore"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\.gitignore</path>
<type>file</type>
<content>
1: # Logs
2: logs
3: *.log
4: npm-debug.log*
5: yarn-debug.log*
6: yarn-error.log*
7: pnpm-debug.log*
8: lerna-debug.log*
9: 
10: node_modules
11: dist
12: dist-ssr
13: *.local
14: 
15: # Editor directories and files
16: .vscode/*
17: !.vscode/extensions.json
18: .idea
19: .DS_Store
20: *.suo
21: *.ntvs*
22: *.njsproj
23: *.sln
24: *.sw?

(End of file - total 24 lines)
</content>
```

---

## Assistant (Build · MiMo V2.5 Free · 4.0s)

_Thinking:_

Let me explore more of the frontend and backend structure to understand the app better.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src\\components"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src\components</path>
<type>directory</type>
<entries>
charts/
DevMailbox.jsx
GlassCard.jsx
HierarchyTable.jsx

(4 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src\\pages"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src\pages</path>
<type>directory</type>
<entries>
Dashboard.jsx
ForgotPassword.jsx
Login.jsx
ResetPassword.jsx
Setup2FA.jsx
Signup.jsx
Verify2FA.jsx

(7 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src\\redux"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src\redux</path>
<type>directory</type>
<entries>
slices/
store.js

(2 entries)
</entries>
```

---

## Assistant (Build · MiMo V2.5 Free · 3.6s)

_Thinking:_

Let me also check the backend structure and look at some key files to understand the architecture better.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\package.json"
}
```

**Output:**
```
<path>C:\AuthApp\backend\package.json</path>
<type>file</type>
<content>
1: {
2:   "name": "backend",
3:   "version": "1.0.0",
4:   "main": "index.js",
5:   "scripts": {
6:     "test": "echo \"Error: no test specified\" && exit 1",
7:     "dev": "node index.js"
8:   },
9:   "author": "",
10:   "license": "ISC",
11:   "description": "",
12:   "dependencies": {
13:     "bcryptjs": "^3.0.3",
14:     "cookie-parser": "^1.4.7",
15:     "cors": "^2.8.6",
16:     "dotenv": "^17.4.2",
17:     "express": "^5.2.1",
18:     "express-rate-limit": "^8.5.2",
19:     "express-validator": "^7.3.2",
20:     "jsonwebtoken": "^9.0.3",
21:     "qrcode": "^1.5.4",
22:     "speakeasy": "^2.0.0",
23:     "uuid": "^14.0.0"
24:   }
25: }

(End of file - total 25 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\index.js"
}
```

**Output:**
```
<path>C:\AuthApp\backend\index.js</path>
<type>file</type>
<content>
1: const express = require('express');
2: const cors = require('cors');
3: const cookieParser = require('cookie-parser');
4: require('dotenv').config();
5: 
6: const authRoutes = require('./routes/authRoutes');
7: const { globalLimiter } = require('./middleware/rateLimit');
8: const errorHandler = require('./middleware/errorHandler');
9: const { initCleanupTask } = require('./utils/cleanup');
10: 
11: const app = express();
12: const PORT = process.env.PORT || 5000;
13: 
14: // Enable CORS for frontend development server with cookie credentials allowed
15: app.use(cors({
16:   origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
17:   credentials: true,
18:   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
19:   allowedHeaders: ['Content-Type', 'Authorization']
20: }));
21: 
22: // Body parsing middleware
23: app.use(express.json({ limit: '10kb' })); // Limit body size to protect against body bloating attacks
24: app.use(cookieParser());
25: 
26: // Global Rate Limiting
27: app.use(globalLimiter);
28: 
29: // Mount API routes
30: app.use('/api/auth', authRoutes);
31: 
32: // Simple healthcheck route
33: app.get('/health', (req, res) => {
34:   res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
35: });
36: 
37: // 404 Route handler
38: app.use((req, res) => {
39:   res.status(404).json({ success: false, message: 'Resource not found.' });
40: });
41: 
42: // Global Error Handler Middleware (MUST be registered last)
43: app.use(errorHandler);
44: 
45: // Start Periodic cleanup task for unverified 2FA accounts
46: initCleanupTask();
47: 
48: // Start server
49: const server = app.listen(PORT, () => {
50:   console.log(`[Server] Secure Auth backend listening on port ${PORT}...`);
51: });
52: 
53: // Catch process-level crashes (unhandled rejections/exceptions)
54: process.on('uncaughtException', (err) => {
55:   console.error('[CRITICAL] Uncaught Exception occurred at process level:');
56:   console.error(err);
57:   // Log details and keep the server running if safe, or shut down gracefully
58:   // In a robust production environment, you log to external monitoring and restart the container
59:   console.warn('[Process Control] System recovered. Process was kept alive.');
60: });
61: 
62: process.on('unhandledRejection', (reason, promise) => {
63:   console.error('[CRITICAL] Unhandled Rejection at Promise level:');
64:   console.error('Promise:', promise);
65:   console.error('Reason:', reason);
66:   console.warn('[Process Control] System recovered. Process was kept alive.');
67: });
68: 
69: // Handle graceful shutdown signals
70: const gracefulShutdown = () => {
71:   console.log('[Server] Shutdown signal received. Closing HTTP server...');
72:   server.close(() => {
73:     console.log('[Server] HTTP server closed. Exiting process.');
74:     process.exit(0);
75:   });
76: };
77: 
78: process.on('SIGTERM', gracefulShutdown);
79: process.on('SIGINT', gracefulShutdown);

(End of file - total 79 lines)
</content>
```

---

## Assistant (Build · MiMo V2.5 Free · 5.3s)

_Thinking:_

Let me explore more backend files to understand the architecture better.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\controllers"
}
```

**Output:**
```
<path>C:\AuthApp\backend\controllers</path>
<type>directory</type>
<entries>
authController.js

(1 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\routes"
}
```

**Output:**
```
<path>C:\AuthApp\backend\routes</path>
<type>directory</type>
<entries>
authRoutes.js

(1 entries)
</entries>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\middleware"
}
```

**Output:**
```
<path>C:\AuthApp\backend\middleware</path>
<type>directory</type>
<entries>
errorHandler.js
rateLimit.js
validate.js

(3 entries)
</entries>
```

---

## Assistant (Build · MiMo V2.5 Free · 3.2s)

_Thinking:_

Let me check the frontend eslint config and any existing instruction files.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\eslint.config.js"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\eslint.config.js</path>
<type>file</type>
<content>
1: import js from '@eslint/js'
2: import globals from 'globals'
3: import reactHooks from 'eslint-plugin-react-hooks'
4: import reactRefresh from 'eslint-plugin-react-refresh'
5: import { defineConfig, globalIgnores } from 'eslint/config'
6: 
7: export default defineConfig([
8:   globalIgnores(['dist']),
9:   {
10:     files: ['**/*.{js,jsx}'],
11:     extends: [
12:       js.configs.recommended,
13:       reactHooks.configs.flat.recommended,
14:       reactRefresh.configs.vite,
15:     ],
16:     languageOptions: {
17:       globals: globals.browser,
18:       parserOptions: { ecmaFeatures: { jsx: true } },
19:     },
20:   },
21: ])

(End of file - total 21 lines)
</content>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "AGENTS.md",
  "path": "C:\\AuthApp"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · MiMo V2.5 Free · 4.3s)

_Thinking:_

Now let me check some key files to understand the structure better, especially the Redux store and backend routes.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src\\redux\\store.js"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src\redux\store.js</path>
<type>file</type>
<content>
1: // import { configureStore } from '@reduxjs/toolkit';
2: // import authReducer from './slices/authSlice';
3: 
4: // export const store = configureStore({
5: //   reducer: {
6: //     auth: authReducer,
7: //   },
8: // });
9: 
10: import { configureStore } from '@reduxjs/toolkit';
11: import authReducer from './slices/authSlice';
12: 
13: import storageModule from 'redux-persist/lib/storage';
14: import { persistReducer, persistStore } from 'redux-persist';
15: 
16: const storage = storageModule.default || storageModule;
17: 
18: const persistConfig = {
19:   key: 'root',
20:   storage,
21: };
22: 
23: const persistedReducer = persistReducer(
24:   persistConfig,
25:   authReducer
26: );
27: 
28: export const store = configureStore({
29:   reducer: {
30:     auth: persistedReducer,
31:   },
32: });
33: 
34: export const persistor = persistStore(store);

(End of file - total 34 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\routes\\authRoutes.js"
}
```

**Output:**
```
<path>C:\AuthApp\backend\routes\authRoutes.js</path>
<type>file</type>
<content>
1: const express = require('express');
2: const router = express.Router();
3: 
4: const {
5:   signup,
6:   verify2FASetup,
7:   login,
8:   verify2FALogin,
9:   forgotPassword,
10:   resetPassword,
11:   logout,
12:   checkStatus,
13:   requireAuth,
14:   me
15: } = require('../controllers/authController');
16: 
17: const {
18:   validateSignup,
19:   validateLogin,
20:   validateForgotPassword,
21:   validateResetPassword,
22:   validate2FA,
23:   handleValidationErrors
24: } = require('../middleware/validate');
25: 
26: const {
27:   authLimiter,
28:   passwordResetLimiter
29: } = require('../middleware/rateLimit');
30: 
31: const { getEmails, clearEmails } = require('../utils/mailer');
32: 
33: // --- Auth Routes ---
34: router.post('/signup', authLimiter, validateSignup, handleValidationErrors, signup);
35: router.post('/verify-2fa-setup', authLimiter, validate2FA, handleValidationErrors, verify2FASetup);
36: router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
37: router.post('/verify-2fa-login', authLimiter, validate2FA, handleValidationErrors, verify2FALogin);
38: router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, handleValidationErrors, forgotPassword);
39: router.post('/reset-password', passwordResetLimiter, validateResetPassword, handleValidationErrors, resetPassword);
40: router.get('/me', requireAuth, me);
41: router.post('/logout', logout);
42: router.get('/status', checkStatus);
43: 
44: // --- Protected Dashboard Data Route ---
45: router.get('/dashboard-data', requireAuth, (req, res) => {
46:   res.status(200).json({
47:     success: true,
48:     secretMessage: 'Welcome to the inner sanctum. This data is cryptographically protected by double factors.',
49:     timestamp: new Date().toISOString(),
50:     sessionDetails: {
51:       userId: req.user.id,
52:       name: req.user.name,
53:       email: req.user.email
54:     }
55:   });
56: });
57: 
58: // --- Dev Utilities (Simulated Email Sandbox) ---
59: router.get('/dev/emails', async (req, res, next) => {
60:   try {
61:     const list = await getEmails();
62:     res.status(200).json({ success: true, emails: list });
63:   } catch (error) {
64:     next(error);
65:   }
66: });
67: 
68: router.post('/dev/emails/clear', async (req, res, next) => {
69:   try {
70:     await clearEmails();
71:     res.status(200).json({ success: true, message: 'Simulated mailbox cleared.' });
72:   } catch (error) {
73:     next(error);
74:   }
75: });
76: 
77: module.exports = router;

(End of file - total 77 lines)
</content>
```

---

## Assistant (Build · MiMo V2.5 Free · 2.9s)

_Thinking:_

Now let me check the frontend main.jsx and App.jsx to understand routing and structure.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src\\main.jsx"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src\main.jsx</path>
<type>file</type>
<content>
1: import { StrictMode } from "react";
2: import { createRoot } from "react-dom/client";
3: import "./styles/global.scss";
4: import App from "./App.jsx";
5: // import { AuthProvider } from "./routes/AuthContext.jsx";
6: import { persistor, store } from "./redux/store.js";
7: import { Provider } from "react-redux";
8: import { PersistGate } from "redux-persist/integration/react";
9: 
10: createRoot(document.getElementById("root")).render(
11:   <StrictMode>
12:     <Provider store={store}>
13:       <PersistGate loading={null} persistor={persistor}>
14:         <App />
15:       </PersistGate>
16:     </Provider>
17:   </StrictMode>,
18: );

(End of file - total 18 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src\\App.jsx"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src\App.jsx</path>
<type>file</type>
<content>
1: import React from "react";
2: import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
3: import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
4: 
5: // Import Pages
6: import Login from "./pages/Login";
7: import Signup from "./pages/Signup";
8: import Setup2FA from "./pages/Setup2FA";
9: import Verify2FA from "./pages/Verify2FA";
10: import ForgotPassword from "./pages/ForgotPassword";
11: import ResetPassword from "./pages/ResetPassword";
12: import Dashboard from "./pages/Dashboard";
13: 
14: // Import Components
15: import DevMailbox from "./components/DevMailbox";
16: import HierarchyTable from "./components/HierarchyTable";
17: import PublicRoute from "./routes/PublicRoute";
18: import ProtectedRoute from "./routes/ProtectedRoute";
19: 
20: // Create a custom modern dark theme using Outfit and Inter typography
21: const theme = createTheme({
22:   palette: {
23:     mode: "dark",
24:     primary: {
25:       main: "#6366f1", // Indigo
26:       light: "#818cf8",
27:       dark: "#4f46e5",
28:     },
29:     secondary: {
30:       main: "#a855f7", // Purple
31:       light: "#c084fc",
32:       dark: "#9333ea",
33:     },
34:     background: {
35:       default: "#0a0a16",
36:       paper: "#12122b",
37:     },
38:     text: {
39:       primary: "#f8fafc",
40:       secondary: "#94a3b8",
41:     },
42:     error: {
43:       main: "#ef4444",
44:     },
45:     success: {
46:       main: "#10b981",
47:     },
48:   },
49:   typography: {
50:     fontFamily:
51:       "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
52:     h1: { fontFamily: "'Outfit', sans-serif" },
53:     h2: { fontFamily: "'Outfit', sans-serif" },
54:     h3: { fontFamily: "'Outfit', sans-serif" },
55:     h4: { fontFamily: "'Outfit', sans-serif" },
56:     h5: { fontFamily: "'Outfit', sans-serif" },
57:     h6: { fontFamily: "'Outfit', sans-serif" },
58:     button: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
59:   },
60:   components: {
61:     MuiCssBaseline: {
62:       styleOverrides: {
63:         body: {
64:           backgroundColor: "#0a0a16",
65:           backgroundImage:
66:             "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 40%)",
67:         },
68:       },
69:     },
70:   },
71: });
72: 
73: function App() {
74:   return (
75:     <ThemeProvider theme={theme}>
76:       <CssBaseline />
77:       <BrowserRouter>
78:         {/* Dynamic mesh gradient background element */}
79:         <Box className="app-background" />
80: 
81:         <Box
82:           sx={{
83:             minHeight: "100vh",
84:             display: "flex",
85:             flexDirection: "column",
86:             position: "relative",
87:             pb: 8,
88:           }}
89:         >
90:           <Routes>
91:             <Route path="/" element={<Navigate to="/login" replace />} />
92:             <Route element={<PublicRoute />}>
93:               <Route path="/login" element={<Login />} />
94:               <Route path="/signup" element={<Signup />} />
95:               <Route path="/forgot-password" element={<ForgotPassword />} />
96:               <Route path="/reset-password" element={<ResetPassword />} />
97:               <Route path="/verify-2fa" element={<Verify2FA />} />
98:               <Route path="/setup-2fa" element={<Setup2FA />} />
99:             </Route>
100: 
101:             <Route element={<ProtectedRoute />}>
102:               <Route path="/dashboard" element={<Dashboard />} />
103:               <Route
104:                 path="/hierarchy"
105:                 element={
106:                   <Box sx={{ py: 6, px: { xs: 2, md: 4 }, maxWidth: 1000, margin: "0 auto" }}>
107:                     <HierarchyTable />
108:                   </Box>
109:                 }
110:               />
111:             </Route>
112: 
113:             {/* Catch-all redirects back to login */}
114:             <Route path="*" element={<Navigate to="/login" replace />} />
115:           </Routes>
116:         </Box>
117: 
118:         {/* Developer Mailbox - simulated mailbox drawer overlay for local testing */}
119:         <DevMailbox />
120:       </BrowserRouter>
121:     </ThemeProvider>
122:   );
123: }
124: 
125: export default App;

(End of file - total 125 lines)
</content>
```

---

## Assistant (Build · MiMo V2.5 Free · 144.9s)

_Thinking:_

Now I have a good understanding of the project. Let me check the backend env file to understand what environment variables are needed.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\.env"
}
```

**Output:**
```
<path>C:\AuthApp\backend\.env</path>
<type>file</type>
<content>
1: PORT=5000
2: JWT_SECRET=f7e34cb8827fa6bf744b82d47da153833d7bfae6bb28cf1121d5a7d6538965ab
3: ENCRYPTION_KEY=603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4
4: NODE_ENV=development

(End of file - total 4 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\frontend\\src\\redux\\slices"
}
```

**Output:**
```
<path>C:\AuthApp\frontend\src\redux\slices</path>
<type>directory</type>
<entries>
authSlice.js

(1 entries)
</entries>
```

---

## Assistant (Build · MiMo V2.5 Free · 4.3s)

_Thinking:_

Let me check if there are any existing instruction files or CI/CD configurations.

**Tool: glob**

**Input:**
```json
{
  "path": "C:\\AuthApp",
  "pattern": "**/.github/**"
}
```

**Output:**
```
C:\AuthApp\frontend\node_modules\iconv-lite\.github\dependabot.yml
C:\AuthApp\frontend\node_modules\resolve\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\resolve\.github\THREAT_MODEL.md
C:\AuthApp\frontend\node_modules\resolve\.github\INCIDENT_RESPONSE_PROCESS.md
C:\AuthApp\frontend\node_modules\math-intrinsics\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\es-errors\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\call-bind-apply-helpers\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\has-symbols\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\has-tostringtag\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\es-object-atoms\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\get-proto\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\dunder-proto\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\function-bind\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\gopd\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\function-bind\.github\SECURITY.md
C:\AuthApp\frontend\node_modules\es-define-property\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\supports-preserve-symlinks-flag\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\get-intrinsic\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\hasown\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\math-intrinsics\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\object-inspect\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\qs\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\qs\.github\THREAT_MODEL.md
C:\AuthApp\backend\node_modules\qs\.github\SECURITY.md
C:\AuthApp\backend\node_modules\es-errors\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\call-bind-apply-helpers\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\has-symbols\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\es-object-atoms\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\get-proto\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\dunder-proto\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\side-channel-list\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\function-bind\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\side-channel-map\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\side-channel\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\gopd\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\side-channel-weakmap\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\function-bind\.github\SECURITY.md
C:\AuthApp\backend\node_modules\es-define-property\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\call-bound\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\get-intrinsic\.github\FUNDING.yml
C:\AuthApp\backend\node_modules\hasown\.github\FUNDING.yml
C:\AuthApp\frontend\node_modules\fast-json-stable-stringify\.github\FUNDING.yml
```

**Tool: glob**

**Input:**
```json
{
  "path": "C:\\AuthApp",
  "pattern": "**/CLAUDE.md"
}
```

**Output:**
```
No files found
```

---

## Assistant (Build · MiMo V2.5 Free · 2.8s)

_Thinking:_

Let me check the backend utility files to understand the structure better.

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\utils\\mailer.js"
}
```

**Output:**
```
<path>C:\AuthApp\backend\utils\mailer.js</path>
<type>file</type>
<content>
1: const fs = require('fs');
2: const path = require('path');
3: 
4: const EMAIL_FILE = path.join(__dirname, '..', 'data', 'emails.json');
5: 
6: // Ensure directory exists
7: const dir = path.dirname(EMAIL_FILE);
8: if (!fs.existsSync(dir)) {
9:   fs.mkdirSync(dir, { recursive: true });
10: }
11: 
12: /**
13:  * Simulates sending an email by appending it to a local JSON file.
14:  * Keeps only the last 50 emails to prevent resource exhaustion.
15:  */
16: async function sendEmail({ to, subject, text, html }) {
17:   const newEmail = {
18:     id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
19:     to,
20:     subject,
21:     text,
22:     html,
23:     timestamp: new Date().toISOString()
24:   };
25: 
26:   try {
27:     let emails = [];
28:     if (fs.existsSync(EMAIL_FILE)) {
29:       try {
30:         const fileContent = await fs.promises.readFile(EMAIL_FILE, 'utf8');
31:         emails = JSON.parse(fileContent);
32:         if (!Array.isArray(emails)) emails = [];
33:       } catch (err) {
34:         console.error('Error reading emails.json, starting fresh:', err);
35:       }
36:     }
37: 
38:     // Insert new email at the top
39:     emails.unshift(newEmail);
40: 
41:     // Slice to keep only last 50
42:     if (emails.length > 50) {
43:       emails = emails.slice(0, 50);
44:     }
45: 
46:     await fs.promises.writeFile(EMAIL_FILE, JSON.stringify(emails, null, 2), 'utf8');
47:     console.log(`[Simulated Email Sent] To: ${to} | Subject: ${subject}`);
48:     return true;
49:   } catch (error) {
50:     console.error('Failed to write simulated email to file:', error);
51:     // Even if writing to file fails, do not crash the app, just log to console
52:     return false;
53:   }
54: }
55: 
56: /**
57:  * Utility to fetch all logged emails (dev utility).
58:  */
59: async function getEmails() {
60:   try {
61:     if (!fs.existsSync(EMAIL_FILE)) return [];
62:     const fileContent = await fs.promises.readFile(EMAIL_FILE, 'utf8');
63:     return JSON.parse(fileContent);
64:   } catch (error) {
65:     console.error('Failed to read simulated emails:', error);
66:     return [];
67:   }
68: }
69: 
70: /**
71:  * Utility to clear all logged emails (dev utility).
72:  */
73: async function clearEmails() {
74:   try {
75:     await fs.promises.writeFile(EMAIL_FILE, JSON.stringify([], null, 2), 'utf8');
76:     return true;
77:   } catch (error) {
78:     console.error('Failed to clear emails:', error);
79:     return false;
80:   }
81: }
82: 
83: module.exports = {
84:   sendEmail,
85:   getEmails,
86:   clearEmails
87: };

(End of file - total 87 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\backend\\utils\\dbHelper.js"
}
```

**Output:**
```
<path>C:\AuthApp\backend\utils\dbHelper.js</path>
<type>file</type>
<content>
1: const fs = require('fs');
2: const path = require('path');
3: 
4: const DB_DIR = path.join(__dirname, '..', 'data');
5: const DB_PATH = path.join(DB_DIR, 'db.json');
6: const TEMP_PATH = path.join(DB_DIR, 'db.tmp.json');
7: const BACKUP_PATH = path.join(DB_DIR, 'db.backup.json');
8: 
9: // Ensure database directory exists
10: if (!fs.existsSync(DB_DIR)) {
11:   fs.mkdirSync(DB_DIR, { recursive: true });
12: }
13: 
14: // Simple Promise-based write queue to prevent concurrent write collisions
15: let writeQueue = Promise.resolve();
16: 
17: /**
18:  * Reads user data from db.json safely, recovering from backup if main database is corrupted.
19:  */
20: async function readDB() {
21:   try {
22:     if (!fs.existsSync(DB_PATH)) {
23:       if (fs.existsSync(BACKUP_PATH)) {
24:         console.warn('db.json missing. Restoring from backup...');
25:         const backupData = await fs.promises.readFile(BACKUP_PATH, 'utf8');
26:         await fs.promises.writeFile(DB_PATH, backupData, 'utf8');
27:         return JSON.parse(backupData);
28:       }
29:       return { users: [] };
30:     }
31:     const data = await fs.promises.readFile(DB_PATH, 'utf8');
32:     return JSON.parse(data);
33:   } catch (error) {
34:     console.error('Error reading db.json, attempting backup restore:', error);
35:     try {
36:       if (fs.existsSync(BACKUP_PATH)) {
37:         const backupData = await fs.promises.readFile(BACKUP_PATH, 'utf8');
38:         await fs.promises.writeFile(DB_PATH, backupData, 'utf8');
39:         return JSON.parse(backupData);
40:       }
41:     } catch (backupError) {
42:       console.error('Backup restoration failed:', backupError);
43:     }
44:     // If all fail, return empty db structure
45:     return { users: [] };
46:   }
47: }
48: 
49: /**
50:  * Writes data to db.json atomically.
51:  * It writes to db.tmp.json, renames it to db.json, and copies to db.backup.json.
52:  */
53: async function writeDB(data) {
54:   // Chain to the write queue to prevent concurrent file modifications
55:   writeQueue = writeQueue.then(async () => {
56:     try {
57:       const dataStr = JSON.stringify(data, null, 2);
58:       
59:       // 1. Write to temp file
60:       await fs.promises.writeFile(TEMP_PATH, dataStr, 'utf8');
61:       
62:       // 2. Rename temp file to target file (atomic operation in OS)
63:       await fs.promises.rename(TEMP_PATH, DB_PATH);
64:       
65:       // 3. Make backup copy
66:       await fs.promises.copyFile(DB_PATH, BACKUP_PATH);
67:     } catch (error) {
68:       console.error('Failed to write to JSON database atomically:', error);
69:       throw new Error('Database write operation failed');
70:     }
71:   });
72: 
73:   return writeQueue;
74: }
75: 
76: module.exports = {
77:   readDB,
78:   writeDB
79: };

(End of file - total 79 lines)
</content>
```

---

## Assistant (Build · MiMo V2.5 Free · 3.7s)

_Thinking:_

Now I have a good understanding of the project. Let me check if there's a root package.json or any monorepo configuration.

**Tool: glob**

**Input:**
```json
{
  "path": "C:\\AuthApp",
  "pattern": "package.json"
}
```

**Output:**
```
C:\AuthApp\frontend\package.json
C:\AuthApp\backend\package.json
C:\AuthApp\node_modules\dom-helpers\width\package.json
C:\AuthApp\node_modules\dom-helpers\triggerEvent\package.json
C:\AuthApp\node_modules\dom-helpers\transitionEnd\package.json
C:\AuthApp\node_modules\dom-helpers\toggleClass\package.json
C:\AuthApp\node_modules\dom-helpers\text\package.json
C:\AuthApp\node_modules\dom-helpers\siblings\package.json
C:\AuthApp\node_modules\dom-helpers\scrollTop\package.json
C:\AuthApp\node_modules\dom-helpers\scrollTo\package.json
C:\AuthApp\node_modules\dom-helpers\scrollParent\package.json
C:\AuthApp\node_modules\dom-helpers\scrollLeft\package.json
C:\AuthApp\node_modules\dom-helpers\scrollbarSize\package.json
C:\AuthApp\node_modules\dom-helpers\removeEventListener\package.json
C:\AuthApp\node_modules\dom-helpers\removeClass\package.json
C:\AuthApp\node_modules\dom-helpers\remove\package.json
C:\AuthApp\node_modules\dom-helpers\querySelectorAll\package.json
C:\AuthApp\node_modules\dom-helpers\prepend\package.json
C:\AuthApp\node_modules\react-dom\package.json
C:\AuthApp\node_modules\react-transition-group\TransitionGroupContext\package.json
C:\AuthApp\node_modules\react-transition-group\TransitionGroup\package.json
C:\AuthApp\node_modules\react-transition-group\Transition\package.json
C:\AuthApp\node_modules\react-transition-group\SwitchTransition\package.json
C:\AuthApp\node_modules\react-transition-group\ReplaceTransition\package.json
C:\AuthApp\node_modules\react-transition-group\package.json
C:\AuthApp\node_modules\react-transition-group\CSSTransition\package.json
C:\AuthApp\node_modules\react-transition-group\config\package.json
C:\AuthApp\node_modules\react\package.json
C:\AuthApp\node_modules\scheduler\package.json
C:\AuthApp\node_modules\stylis\package.json
C:\AuthApp\node_modules\prop-types\package.json
C:\AuthApp\node_modules\stylis\dist\umd\package.json
C:\AuthApp\node_modules\react-is\package.json
C:\AuthApp\node_modules\@popperjs\core\package.json
C:\AuthApp\node_modules\prop-types\node_modules\react-is\package.json
C:\AuthApp\node_modules\object-assign\package.json
C:\AuthApp\node_modules\js-tokens\package.json
C:\AuthApp\node_modules\loose-envify\package.json
C:\AuthApp\frontend\node_modules\axios\package.json
C:\AuthApp\frontend\node_modules\@parcel\watcher\package.json
C:\AuthApp\frontend\node_modules\babel-plugin-macros\package.json
C:\AuthApp\frontend\node_modules\@parcel\watcher-win32-x64\package.json
C:\AuthApp\backend\node_modules\lodash\package.json
C:\AuthApp\backend\node_modules\validator\package.json
C:\AuthApp\backend\node_modules\yargs\package.json
C:\AuthApp\backend\node_modules\ip-address\package.json
C:\AuthApp\backend\node_modules\call-bind-apply-helpers\package.json
C:\AuthApp\backend\node_modules\body-parser\package.json
C:\AuthApp\backend\node_modules\dunder-proto\package.json
C:\AuthApp\backend\node_modules\get-proto\package.json
C:\AuthApp\backend\node_modules\get-intrinsic\package.json
C:\AuthApp\backend\node_modules\dotenv\package.json
C:\AuthApp\backend\node_modules\debug\package.json
C:\AuthApp\backend\node_modules\es-define-property\package.json
C:\AuthApp\backend\node_modules\call-bound\package.json
C:\AuthApp\backend\node_modules\cookie-parser\package.json
C:\AuthApp\backend\node_modules\yargs-parser\package.json
C:\AuthApp\backend\node_modules\dijkstrajs\package.json
C:\AuthApp\backend\node_modules\y18n\package.json
C:\AuthApp\backend\node_modules\which-module\package.json
C:\AuthApp\backend\node_modules\content-disposition\package.json
C:\AuthApp\backend\node_modules\cors\package.json
C:\AuthApp\backend\node_modules\cookie\package.json
C:\AuthApp\backend\node_modules\content-type\package.json
C:\AuthApp\backend\node_modules\encodeurl\package.json
C:\AuthApp\backend\node_modules\bytes\package.json
C:\AuthApp\backend\node_modules\wrap-ansi\package.json
C:\AuthApp\backend\node_modules\cookie-signature\package.json
C:\AuthApp\backend\node_modules\cliui\package.json
C:\AuthApp\backend\node_modules\decamelize\package.json
C:\AuthApp\backend\node_modules\vary\package.json
C:\AuthApp\backend\node_modules\depd\package.json
C:\AuthApp\backend\node_modules\lodash.includes\package.json
C:\AuthApp\backend\node_modules\lodash.isboolean\package.json
C:\AuthApp\backend\node_modules\ecdsa-sig-formatter\package.json
C:\AuthApp\backend\node_modules\wrappy\package.json
C:\AuthApp\backend\node_modules\buffer-equal-constant-time\package.json
C:\AuthApp\backend\node_modules\ee-first\package.json
C:\AuthApp\backend\node_modules\emoji-regex\package.json
C:\AuthApp\backend\node_modules\color-convert\package.json
C:\AuthApp\backend\node_modules\color-name\package.json
C:\AuthApp\backend\node_modules\camelcase\package.json
C:\AuthApp\frontend\node_modules\zod\v4\package.json
C:\AuthApp\frontend\node_modules\zod\v4\mini\package.json
C:\AuthApp\frontend\node_modules\zod\v4\locales\package.json
C:\AuthApp\frontend\node_modules\zod\v4\core\package.json
C:\AuthApp\frontend\node_modules\zod\v4\classic\package.json
C:\AuthApp\frontend\node_modules\zod\v4-mini\package.json
C:\AuthApp\frontend\node_modules\zod\v3\package.json
C:\AuthApp\frontend\node_modules\@eslint\plugin-kit\package.json
C:\AuthApp\frontend\node_modules\acorn\package.json
C:\AuthApp\frontend\node_modules\@eslint\object-schema\package.json
C:\AuthApp\frontend\node_modules\baseline-browser-mapping\package.json
C:\AuthApp\frontend\node_modules\@eslint\js\package.json
C:\AuthApp\frontend\node_modules\balanced-match\package.json
C:\AuthApp\frontend\node_modules\balanced-match\dist\esm\package.json
C:\AuthApp\frontend\node_modules\@vitejs\plugin-react\package.json
C:\AuthApp\frontend\node_modules\zod-validation-error\package.json
C:\AuthApp\frontend\node_modules\@eslint\core\package.json
C:\AuthApp\frontend\node_modules\balanced-match\dist\commonjs\package.json

(Results are truncated: showing first 100 results. Consider using a more specific path or pattern.)
```

**Tool: glob**

**Input:**
```json
{
  "path": "C:\\AuthApp",
  "pattern": "*.md"
}
```

**Output:**
```
C:\AuthApp\frontend\node_modules\d3-interpolate\README.md
C:\AuthApp\frontend\node_modules\d3-quadtree\README.md
C:\AuthApp\frontend\node_modules\d3-polygon\README.md
C:\AuthApp\frontend\node_modules\d3-path\README.md
C:\AuthApp\node_modules\dom-helpers\README.md
C:\AuthApp\node_modules\react-dom\README.md
C:\AuthApp\node_modules\react-transition-group\README.md
C:\AuthApp\node_modules\react\README.md
C:\AuthApp\node_modules\@emotion\cache\README.md
C:\AuthApp\node_modules\stylis\README.md
C:\AuthApp\node_modules\scheduler\README.md
C:\AuthApp\node_modules\prop-types\README.md
C:\AuthApp\node_modules\@emotion\weak-memoize\README.md
C:\AuthApp\node_modules\@emotion\hash\README.md
C:\AuthApp\node_modules\@emotion\sheet\README.md
C:\AuthApp\node_modules\loose-envify\README.md
C:\AuthApp\node_modules\react-is\README.md
C:\AuthApp\node_modules\@emotion\unitless\README.md
C:\AuthApp\node_modules\js-tokens\README.md
C:\AuthApp\node_modules\prop-types\node_modules\react-is\README.md
C:\AuthApp\node_modules\object-assign\readme.md
C:\AuthApp\node_modules\@popperjs\core\README.md
C:\AuthApp\node_modules\@babel\runtime\README.md
C:\AuthApp\node_modules\js-tokens\CHANGELOG.md
C:\AuthApp\node_modules\@popperjs\core\LICENSE.md
C:\AuthApp\frontend\node_modules\axios\README.md
C:\AuthApp\frontend\node_modules\axios\MIGRATION_GUIDE.md
C:\AuthApp\frontend\node_modules\call-bind-apply-helpers\README.md
C:\AuthApp\frontend\node_modules\call-bind-apply-helpers\CHANGELOG.md
C:\AuthApp\frontend\node_modules\babel-plugin-macros\README.md
C:\AuthApp\frontend\node_modules\babel-plugin-macros\CHANGELOG.md
C:\AuthApp\backend\node_modules\validator\README.md
C:\AuthApp\backend\node_modules\yargs\README.md
C:\AuthApp\backend\node_modules\yargs\CHANGELOG.md
C:\AuthApp\backend\node_modules\uuid\README.md
C:\AuthApp\backend\node_modules\uuid\LICENSE.md
C:\AuthApp\backend\node_modules\call-bind-apply-helpers\README.md
C:\AuthApp\backend\node_modules\call-bind-apply-helpers\CHANGELOG.md
C:\AuthApp\backend\node_modules\dunder-proto\README.md
C:\AuthApp\backend\node_modules\body-parser\README.md
C:\AuthApp\backend\node_modules\base32.js\HISTORY.md
C:\AuthApp\backend\node_modules\dunder-proto\CHANGELOG.md
C:\AuthApp\backend\node_modules\es-define-property\README.md
C:\AuthApp\backend\node_modules\call-bound\README.md
C:\AuthApp\backend\node_modules\bcryptjs\README.md
C:\AuthApp\backend\node_modules\call-bound\CHANGELOG.md
C:\AuthApp\backend\node_modules\es-define-property\CHANGELOG.md
C:\AuthApp\backend\node_modules\dijkstrajs\README.md
C:\AuthApp\backend\node_modules\yargs-parser\README.md
C:\AuthApp\backend\node_modules\cookie-parser\README.md
C:\AuthApp\backend\node_modules\cookie-signature\Readme.md
C:\AuthApp\backend\node_modules\dijkstrajs\LICENSE.md
C:\AuthApp\backend\node_modules\y18n\README.md
C:\AuthApp\backend\node_modules\yargs-parser\CHANGELOG.md
C:\AuthApp\backend\node_modules\cookie-parser\HISTORY.md
C:\AuthApp\backend\node_modules\color-convert\README.md
C:\AuthApp\backend\node_modules\cookie-signature\History.md
C:\AuthApp\backend\node_modules\dijkstrajs\CONTRIBUTING.md
C:\AuthApp\backend\node_modules\cookie\SECURITY.md
C:\AuthApp\backend\node_modules\depd\Readme.md
C:\AuthApp\backend\node_modules\y18n\CHANGELOG.md
C:\AuthApp\backend\node_modules\vary\HISTORY.md
C:\AuthApp\backend\node_modules\accepts\README.md
C:\AuthApp\backend\node_modules\content-type\README.md
C:\AuthApp\backend\node_modules\bytes\Readme.md
C:\AuthApp\backend\node_modules\cliui\README.md
C:\AuthApp\backend\node_modules\camelcase\readme.md
C:\AuthApp\backend\node_modules\which-module\README.md
C:\AuthApp\backend\node_modules\cors\README.md
C:\AuthApp\backend\node_modules\decamelize\readme.md
C:\AuthApp\backend\node_modules\cookie\README.md
C:\AuthApp\backend\node_modules\content-disposition\README.md
C:\AuthApp\backend\node_modules\ecdsa-sig-formatter\README.md
C:\AuthApp\backend\node_modules\ipaddr.js\README.md
C:\AuthApp\backend\node_modules\accepts\HISTORY.md
C:\AuthApp\backend\node_modules\content-type\HISTORY.md
C:\AuthApp\backend\node_modules\encodeurl\README.md
C:\AuthApp\backend\node_modules\bytes\History.md
C:\AuthApp\backend\node_modules\base32.js\README.md
C:\AuthApp\backend\node_modules\cliui\CHANGELOG.md
C:\AuthApp\backend\node_modules\wrap-ansi\readme.md
C:\AuthApp\backend\node_modules\color-name\README.md
C:\AuthApp\backend\node_modules\ansi-regex\readme.md
C:\AuthApp\backend\node_modules\ansi-styles\readme.md
C:\AuthApp\backend\node_modules\buffer-equal-constant-time\README.md
C:\AuthApp\backend\node_modules\vary\README.md
C:\AuthApp\backend\node_modules\depd\History.md
C:\AuthApp\backend\node_modules\lodash.includes\README.md
C:\AuthApp\backend\node_modules\lodash.isboolean\README.md
C:\AuthApp\backend\node_modules\wrappy\README.md
C:\AuthApp\backend\node_modules\ee-first\README.md
C:\AuthApp\backend\node_modules\color-convert\CHANGELOG.md
C:\AuthApp\frontend\node_modules\zod-validation-error\README.v3.md
C:\AuthApp\frontend\node_modules\brace-expansion\README.md
C:\AuthApp\frontend\node_modules\balanced-match\README.md
C:\AuthApp\frontend\node_modules\zod-validation-error\README.md
C:\AuthApp\frontend\node_modules\balanced-match\LICENSE.md
C:\AuthApp\frontend\node_modules\browserslist\README.md
C:\AuthApp\frontend\node_modules\baseline-browser-mapping\README.md
C:\AuthApp\frontend\README.md

(Results are truncated: showing first 100 results. Consider using a more specific path or pattern.)
```

---

## Assistant (Build · MiMo V2.5 Free · 17.7s)

_Thinking:_

Now I have enough information to create the AGENTS.md file. This is a full-stack authentication application with:

1. **Frontend**: React + Vite + MUI + Redux Toolkit + React Router
2. **Backend**: Express.js with JSON file-based database

Key points to document:
- Two separate packages (frontend/backend) with no shared root package.json
- Backend uses JSON file-based database (no external DB)
- Frontend runs on port 5173, backend on port 5000
- CORS configured for localhost:5173
- Email simulation (not real email)
- 2FA with speakeasy
- JWT authentication
- Redux Persist for state persistence

Let me create the AGENTS.md file.

Now I have enough information to create the AGENTS.md file. Here's what I learned:

1. **Architecture**: Full-stack auth app with separate `frontend/` (React+Vite) and `backend/` (Express.js) packages, no shared root `package.json`
2. **Database**: JSON file-based (`backend/data/db.json`) with atomic writes and backup recovery
3. **Email**: Simulated via file (`backend/data/emails.json`), not real SMTP
4. **Key ports**: Backend on 5000, frontend on 5173
5. **No existing AGENTS.md, CI config, or root README**

**Tool: write**

**Input:**
```json
{
  "filePath": "C:\\AuthApp\\AGENTS.md",
  "content": "# AuthApp — Agent Instructions\n\n## Architecture\n\nFull-stack authentication app. Two independent packages with separate `node_modules`:\n\n- `frontend/` — React 19 + Vite 8 + MUI 9 + Redux Toolkit + React Router 7\n- `backend/` — Express 5 + JWT + TOTP 2FA (speakeasy)\n- **No monorepo tooling.** Each package has its own `package.json` and `npm run` scripts.\n\n## Dev Commands\n\n### Backend (from `backend/`)\n```bash\ncd backend && npm install   # first time\ncd backend && npm run dev   # starts on :5000\n```\n\n### Frontend (from `frontend/`)\n```bash\ncd frontend && npm install  # first time\ncd frontend && npm run dev  # starts on :5173\ncd frontend && npm run lint # eslint flat config, JS+JSX only\ncd frontend && npm run build\n```\n\n## Backend Facts\n\n- **Database**: JSON file at `backend/data/db.json`. Atomic writes via temp+rename, backup at `db.backup.json`. No external DB required.\n- **Email**: Simulated — writes to `backend/data/emails.json`. Dev mailbox endpoint: `GET /api/auth/dev/emails`.\n- **Env vars** (in `backend/.env`): `PORT`, `JWT_SECRET`, `ENCRYPTION_KEY`, `NODE_ENV`. Hardcoded defaults for dev; **do not commit real secrets**.\n- **CORS**: Allowlisted for `localhost:5173` and `127.0.0.1:5173` only. If you change the frontend port, update `backend/index.js:15`.\n- **Rate limiting**: Global + per-route. See `backend/middleware/rateLimit.js`.\n- **Input validation**: `express-validator` schemas in `backend/middleware/validate.js`. Must run `handleValidationErrors` after validators.\n- **Error handler**: Global in `backend/middleware/errorHandler.js` — must be registered last (`app.use(errorHandler)`).\n- **Cleanup task**: Periodic deletion of unverified 2FA accounts (`backend/utils/cleanup.js`).\n- **API base**: All routes mounted at `/api/auth`.\n\n## Frontend Facts\n\n- **State**: Redux Toolkit with `redux-persist` (localStorage). Auth state survives page reloads.\n- **Routing**: Public vs Protected route wrappers in `src/routes/`. `/` redirects to `/login`. Catch-all redirects to `/login`.\n- **Theme**: Dark theme defined inline in `App.jsx`. Font families: Outfit (headings), Inter (body).\n- **Styling**: MUI components + SCSS (`src/styles/global.scss`).\n- **Dev tools**: `DevMailbox` component renders as a drawer overlay — local testing only, reads `/api/auth/dev/emails`.\n\n## Gotchas\n\n- **Run both servers.** Frontend calls `localhost:5000` for API. Neither server proxies the other automatically.\n- **Backend is CJS** (`require`/`module.exports`). Frontend is ESM (`import`/`export`). Do not mix.\n- **No TypeScript.** Frontend uses plain `.jsx`.\n- **No test suite.** Backend has a placeholder `test` script that exits with error.\n- **`redux-persist` storage import** (`frontend/src/redux/store.js:16`): uses `.default` fallback for ESM/CJS interop. Preserve this pattern.\n- **Backend reads `.env` from its own directory** (`backend/.env`). Do not place env files in the project root.\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Build · MiMo V2.5 Free · 5.4s)

_Thinking:_

I've created the AGENTS.md file. Let me verify it was created correctly.

Created `AGENTS.md` at the project root. Key contents:

- **Architecture**: Two independent packages (no monorepo tooling)
- **Dev commands**: Exact `npm run dev` for both backend (`:5000`) and frontend (`:5173`)
- **Backend facts**: JSON file DB, simulated email, CORS allowlist, validation patterns, error handler ordering
- **Frontend facts**: Redux Persist with localStorage, route wrappers, SCSS + MUI
- **Gotchas**: Both servers must run, CJS/ESM split, no tests, redux-persist storage interop pattern

---

## User

echo $COLORTERM

---

## Assistant (Build · MiMo V2.5 Free · 8.7s)

_Thinking:_

The user is asking me to run `echo $COLORTERM`. This is a bash command to check if the terminal supports color.

**Tool: bash**

**Input:**
```json
{
  "command": "echo $COLORTERM",
  "description": "Check terminal color support"
}
```

**Output:**
```
(no output)
```

---

## Assistant (Build · MiMo V2.5 Free · 2.9s)

_Thinking:_

The `$COLORTERM` environment variable is not set, which means the terminal either doesn't support color or the variable isn't exported.

`$COLORTERM` is not set in this environment.

---

## User

system

---

## Assistant (Build · MiMo V2.5 Free · 2.8s)

_Thinking:_

The user just typed "system". This is ambiguous - they might be asking about the system environment, or it could be a partial message. Let me ask what they need.

What do you need?

---

