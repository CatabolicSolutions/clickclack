# PROJECT LOGOS — BUILD RECAP + T2 FINISH / T3 START PLAN (2026-08-09)

**Owner:** Conor Ross / RINCON
**Branch:** `cognitive-os` (fork `CatabolicSolutions/clickclack`)
**Authoritative scope:** `LOGOS_SCOPE.md` (updated 2026-08-09 — full §8 outline recorded)
**Decide:** forward motion or restructure. This doc is the state + the plan.

---

## 1. CLI / TOOLING LANES — VERIFIED READY (2026-08-09)

| Lane | Status |
|---|---|
| GitHub Copilot CLI v1.0.78 | ✅ installed, responds, `gh` authed as `CatabolicSolutions` |
| VS Code CLI v1.132.0 | ✅ `~/.local/bin/code` → `~/.local/vscode-cli/code` |
| DeepSeek v4-pro subagents | ✅ used for surface build (in flight) |
| Kimi (moonshot) | ⚠️ `moonshot:default` has billing cooldown; `moonshot:orion` live if needed — frontier reserved for review, not production |
| Codex | ❌ REMOVED permanently — do not reintroduce |

**Handoff protocol (approved):** DeepSeek builds → Copilot/VSCode reviews the
landed diff → RINCON fixes what review flags → T1/T2/T3 deploys as one
complete pass → Conor verifies visually.

---

## 2. BUILD RECAP — WHAT EXISTS (verified in repo + live)

### Shipped and verified live (08-09)
| Item | Evidence |
|---|---|
| Standalone origin serves LOGOS at root | `logos.catabolicsolutions.com` → 200, root-relative assets |
| Auth on standalone origin works | OAuth start → 302, `Domain=.catabolicsolutions.com` cookies, `return_to` = logos origin; `/api/me` → 401 clean challenge |
| ClickClack plumbing untouched | `app.catabolicsolutions.com` → 200 (container) |
| Monochrome §8 restored | pure black, 2px functional accents, 0px radius, zero decorative artifacts; Jarvis skin deleted |
| Subpath mount killed | `/logos/*` worker proxy removed |
| Scope recorded | `LOGOS_SCOPE.md` — full §8 outline (aesthetic, spatial, message anatomy, deep inspection, motion/keyboard) |

### Codebase state (commits, newest first)
```
aeec01d logos: record total scope — full §8 outline + verified live state
164a311 logos: fix standalone-origin auth — shared cookie domain + absolute return_to
1fb435e logos: restore root-relative standalone build (base '')
9c31f66 logos: REVERT Jarvis skin — restore monochrome §8 spec
2e397bb logos: lock in current chat-first messaging shell
...earlier: T1 reskin, T2 schema, T3 cognition core
```

### Working tree (in flight — surface build subagent, not yet committed)
```
M apps/logos/src/lib/components/ChatStream.svelte        (console composition)
M apps/logos/src/lib/components/CommandPalette.svelte
M apps/logos/src/lib/components/InspectorBlade.svelte
M apps/logos/src/lib/components/MessageFrame.svelte
M apps/logos/src/lib/components/TelemetryRail.svelte
M apps/logos/src/routes/+page.svelte
M apps/logos/src/styles/chassis.css
```
These are the §8 operator-console surfaces being composed (chat stays the one
inherited component). RINCON reviews → commits → Copilot reviews → deploy.

### Track status map
| Track | Status |
|---|---|
| T0 Foundation | ✅ |
| T1 SPA/console chassis | ✅ (standalone) |
| T2 Message object schema | ✅ core (migrations 0041/0042, PATCH route, store impls, analyze-on-ingest) — finish items below |
| T3 Cognition service | 🔄 scaffold + Phase B core live (/analyze /respond /transform /threads/cluster /memory/*, local embeddings, telemetry) |
| T4 Integration | ⏳ (markers from real cognition data) |
| T5 Telemetry & inspection depth | ⏳ |

---

## 3. PLAN — FINISH T2

**Goal:** close the four T2 finish items so the message-object data layer is
production-verified end to end (droplet + Neon parity).

### T2-F1 — Neon parity run
- **What:** run the full migration set (incl. 0041 cognitive fields + 0042)
  against the Neon Postgres project, verify all 6 columns land on `messages`
  and PATCH works against Postgres (not just sqlite).
- **Verify:** `go test ./...` with Postgres store; migration apply on Neon;
  `PATCH /messages/{id}/metadata` round-trip on both stores.
- **Who:** DeepSeek subagent → Copilot review.

### T2-F2 — E2E PATCH round-trip (already partially done, lock it)
- **What:** the E2E test exists and caught a real sqlite read-path bug (fixed
  in `messageSelect`/`scanMessage`). Expand the test to cover Postgres too.
- **Verify:** `cd apps/api && go build ./... && go test ./...` green on both stores.

### T2-F3 — SDK regen
- **What:** regenerate `packages/sdk-ts` types from the updated OpenAPI spec
  (metadata PATCH path is its own route now — fix the earlier duplicate
  `patch:` key issue, already fixed in spec; ensure SDK types expose
  intent/persona/confidence/metadata_json).
- **Verify:** `pnpm build:sdk` clean; types consumed by apps/web + apps/logos.

### T2-F4 — Repo hygiene
- **What:** `.svelte-kit` build artifacts gitignored/removed from tracking;
  verify `apps/logos/.svelte-kit` untracked; confirm no stray build output
  in commits.
- **Verify:** `git status` clean after build; `.gitignore` covers it.

**T2 done =** both stores green, SDK regen, hygiene clean. No API behavior change.

---

## 4. PLAN — BEGIN T3 (Phase B: cognition hardening + integration prep)

T3 scaffold + core is live (all routes smoke-tested with real DeepSeek
output). Phase B turns it from scaffold into production brain.

### T3-B1 — Intent parser hardening
- **What:** replace ~20-line classifier prompt with strict boundary rules
  (6 intents, tricky cases: command vs draft, explore vs ask, clarify vs
  ask), confidence tiers (≥0.85 clear, <0.55 must flag clarification).
- **Verify:** eval suite — 132-message corpus (22/bucket) at 100%; ambiguous
  inputs trigger `clarification_question`.

### T3-B2 — Persona differentiation
- **What:** verify 5 personas produce measurably distinct outputs
  (operator=terse tactical, analyst=thesis-evidence-conclusion, creative=
  metaphor+lateral, socratic=questions, archivist=cross-reference).
- **Verify:** 50/50 persona-pair outputs differ (Jaccard < 0.85).

### T3-B3 — Transform quality pass
- **What:** all 15 ops return valid structured output; check diagram/
  checklist/simulate shapes; wire op strings to match the UI action rail
  exactly (xform/condense/expand/memnode/rewrite + 8 spec transforms).
- **Verify:** 15/15 ops valid; UI rail ↔ server op contract match.

### T3-B4 — Thread management
- **What:** clustering live (all-MiniLM, threshold tuned); add merge/split/
  archive semantics + thread persistence as living documents.
- **Verify:** cluster on real channel messages; merge/split round-trips.

### T3-B5 — /respond composer wiring
- **What:** adaptive companion replies (`/respond`) wired into the LOGOS
  composer suggestion flow (memory-cited, intent-aware).
- **Verify:** composer shows suggestion from real /respond output; memory
  citations resolve to real anchors.

**T3 done =** intent/persona/transform evals green, thread management live,
/respond composed into the UI.

---

## 5. DEPLOY SEQUENCE (T1/T2/T3 COMPLETE PASS — single deploy when green)

1. Review + commit surface build (RINCON) → Copilot review → fix flags.
2. T2-F1..F4 (API/SDK) + T3-B1..B5 (cognition) — each verified by typecheck/
   build/tests.
3. One deploy pass:
   - `apps/logos && npm run build` → `/opt/logos-app/dist` (droplet :8788)
   - `apps/api && go build ./apps/api/cmd/clickclack` → `/opt/clickclack/clickclack` (restart service)
   - `apps/cognition && npm run build` → `/opt/logos-cognition` (restart)
   - Worker unchanged unless routes/contracts change
4. Verify live: logos 200 + CSS hash match, /api/me 401 clean, OAuth 302
   shared-domain, /cognition/healthz ok, /cognition/analyze real output.
5. Conor visual pass on `logos.catabolicsolutions.com` — reads as NEW console,
   not chat-in-a-frame.

---

## 6. DECISION POINT (for Conor)

- **Option A — proceed:** T2 finish + T3 Phase B as specced above, single
  deploy pass at the end.
- **Option B — restructure:** if the surface build lands and still reads as a
  reskin, redirect: stop production in DeepSeek, route a redesign iteration
  through VS Code/frontier lane (Copilot CLI) with the §8 spec as the brief,
  RINCON reviews and ships.
- **Option C — re-sequence:** ship T2 finish first (small, low-risk), then
  T3 Phase B in stages, deploying each green increment instead of one pass.
