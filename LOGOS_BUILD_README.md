# PROJECT LOGOS — Build README (what exists so far)

**Date:** 2026-08-09
**Repo:** `CatabolicSolutions/clickclack` (fork of `openclaw/clickclack`)
**Branch:** `cognitive-os` — HEAD `642dc5a`, all work committed + pushed
**Owner:** Conor Ross / RINCON

> **PURPOSE:** This is the factual record for a builder (Copilot) taking over.
> It documents what was built, what is live, and where things stand — so you
> start from verified state, not re-derived guesses. Read `LOGOS_CORRECTION_ADVISEMENT.md`
> FIRST — it defines what Conor actually wants and what to stop doing.

---

## 1. THE INTENT (restated, unambiguous)

ClickClack is **plumbing** — it lives deep underneath and stays untouched as
the message substrate. The goal is a **standalone companion application**
("Project LOGOS") that:

- **extracts the chat feature** from clickclack and laces it in as ONE
  embedded component (uses clickclack's API + realtime, cookie auth),
- builds **everything else natively in the new app** — operator console
  shell, semantic thread sidebar, memory graph viewer, message inspection
  blades, command palette + keyboard-first nav, adaptive companion replies,
  telemetry,
- has **its own shape/design/UX/interface, its own URL, its own
  deployment** — NOT a reskin of clickclack's UI, NOT a subpath of its
  origin, NOT a modification of the existing site.

**What NOT to do (this is what went wrong before):** modifying the clickclack
SPA/API and mounting a second app as a subpath of the same deployment reads
as "same program, different coat of paint" — Conor rejected that explicitly,
more than once. Do not touch `apps/web` (the clickclack SPA) or the clickclack
API surface for the companion's sake.

---

## 2. WHAT WAS BUILT (commits, newest first — branch `cognitive-os`)

| Commit | What |
|---|---|
| `642dc5a` | logos: Copilot review fixes — orphaned anchor code, a11y labels, dead union trim |
| `9992af7` | logos: §8 operator-console surface build-out (mono metadata header, 5-button action rail, flush grid, zero decorative artifacts) |
| `cb004a3` | logos: recap + T2 finish / T3 start plan |
| `aeec01d` | logos: record total scope — full §8 outline + verified live state |
| `164a311` | logos: fix standalone-origin auth — shared cookie domain + absolute return_to |
| `1fb435e` | logos: restore root-relative standalone build (base '') — fix subpath strapping |
| `9c31f66` | logos: REVERT Jarvis skin — restore monochrome §8 spec (Conor correction) |
| `a472466` | logos: Jarvis theme (REVERTED by 9c31f66 — do not reintroduce) |
| `2e397bb` | logos: lock in current chat-first messaging shell |
| earlier | chat substrate, semantic surfaces, inspection/telemetry, cognition scaffold, T2 schema |

**Subprojects that exist in this repo:**
- `apps/logos` — the standalone SvelteKit companion app (adapter-static,
  root-relative `base: ''`). THIS is the upspun surface.
- `apps/cognition` — the "brain": standalone Hono/TS service with routes
  `/healthz`, `/analyze`, `/respond`, `/transform`, `/threads/cluster`,
  `/memory/query`, `/memory/list`, `/memory/anchors` (DeepSeek LLM lane,
  local all-MiniLM embeddings via transformers.js — no external embeddings key).
- `apps/api` — clickclack plumbing (Go). T2 message-object schema is live:
  `intent`, `persona`, `confidence`, `context_json`, `metadata_json`,
  `transform_history_json` on `messages` (sqlite 0041 + postgres 0042),
  `PATCH /messages/{id}/metadata`, analyze-on-ingest. **Do not modify for the
  companion's sake — it's the substrate.**
- `apps/web` — the clickclack SPA. **Do not touch.**
- `packages/sdk-ts` — typed SDK client (regenerable via `pnpm build:sdk`).

**LOGOS app components** (`apps/logos/src/lib/`):
- `clickclack/` — minimal API client (cookie auth, workspaces, channels,
  messages, chatState, WS realtime with 10s poll fallback)
- `components/` — ChatStream (THE embedded chat), MessageFrame (intent band,
  mono metadata header, action rail), SemanticMargin, CommandPalette,
  InspectorBlade, TelemetryRail, SemanticThreadPane, ClarificationPrompt,
  ResultStrip
- `cognition.ts` — typed client for the cognition service
- `styles/` — tokens.css (monochrome §8), chassis.css (operator shell),
  NO theme.css (Jarvis deleted)

---

## 3. WHAT IS LIVE (verified 2026-08-09)

- **`logos.catabolicsolutions.com`** → LOGOS app at ROOT (200, root-relative
  assets). Auth works: OAuth → GitHub → back to logos origin with shared
  `Domain=.catabolicsolutions.com` cookies. `/api/me` → 401 clean challenge.
- **`app.catabolicsolutions.com`** → clickclack SPA, unchanged (plumbing, 200).
- Worker routes: `logos.` origin → LOGOS static (:8788 droplet) + `/api/*` →
  clickclack API (:8090) + `/cognition/*` → cognition (:8787, token-injected).
  No `/logos/*` subpath route (removed — that pattern is rejected).
- Droplet `137.184.144.196`: clickclack API :8090, logos-app static :8788,
  logos-cognition :8787 (firewalled to Cloudflare IPs).

---

## 4. VERIFIED STATE NOTES (honesty)

- The surface is a **standalone shell with the clickclack chat embedded** —
  it is NOT yet the fully realized §8 operator console experience Conor
  described (semantic margin, deep inspection, telemetry, keyboard-first
  console identity). That's the build work remaining.
- Monochrome §8 is the identity: pure black, 2px functional accents,
  0px radius, zero gradients/glass/glow/shadows.
- Cognition routes are live and return real DeepSeek output; local
  embeddings work (no OpenAI key needed; the old OpenAI key is dead).
- Logprobs are n/a on DeepSeek — never fake them; use intent_vector_score,
  latency, tokens, citations instead.

## 5. BUILD / VERIFY COMMANDS

- `cd apps/logos && npm run typecheck && npm run build` → dist/
- `cd apps/api && go build ./... && go test ./...`
- `cd apps/cognition && npm run build`
- Deploy is RINCON's job (droplet rsync + systemd restart). Builders:
  commit + push only.
