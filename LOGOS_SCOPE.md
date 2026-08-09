# PROJECT LOGOS — TOTAL SCOPE (master record)

**Status:** ACTIVE — authoritative project record (supersedes partial docs)
**Owner:** Conor Ross / RINCON
**Repo:** `CatabolicSolutions/clickclack` · Branch: `cognitive-os`
**Directive (verbatim):** `LOGOS_SPEC.md` · Plan/architecture: `LOGOS.md` · Status: `LOGOS_STATUS.md` · Handoff: `LOGOS_HANDOFF.md` · This doc: complete scope + slice plan

**Latest update (2026-08-09):** Standalone surface is LIVE and verified.
`logos.catabolicsolutions.com` serves the LOGOS app at root with working
auth (shared-domain cookies, OAuth returns to the logos origin). The
`/logos/*` subpath proxy is REMOVED from the worker. Monochrome §8 is the
authoritative visual language — the temporary "Jarvis" skin (navy/cyan,
glassmorphism, gradients, glow) was attempted 08-08 and REVERTED 08-09.

---

## 0. THE PROJECT IN ONE PARAGRAPH

Re-architect chat from a linear text log into an object-oriented cognitive
substrate: every message is a data object (intent, persona, confidence,
context, thread affiliation, transform history). A standalone companion
application ("the glass") renders those objects in a monochrome operator
console; a separate cognition service ("the brain") owns all intelligence —
intent parsing, persona adaptation, inline transforms, semantic threading,
memory graph, adaptive responses. clickclack remains the dumb, fast plumbing
underneath; LOGOS is the upspun asset, utility, and experience.

**Hard correction (recorded 08-07, executed 08-08/09):** LOGOS is a
STANDALONE application with its own URL/deploy (`logos.catabolicsolutions.com`).
Chat is the ONLY inherited clickclack piece (embedded component — ChatStream
uses clickclack API + realtime). NOT a reskin of clickclack's SPA, NOT a
subpath mount. The `/logos/` subpath deployment is retired; the subpath proxy
was removed from the worker on 08-09. clickclack at `app.catabolicsolutions.com`
stays as plumbing and is unchanged.

---

## 1. OUTLINE — THE FULL DIRECTIVE (recorded from Conor, expanded into scope)

### 1.1 Conversational substrate (spec §1)
- Chat = dynamic cognitive space, not chronological log.
- Every message = intent-encoded unit, executable instruction, memory
  anchor, semantic node, adaptive rendering object.

### 1.2 Intelligence layer (spec §2)
- **Intent parser:** 6 buckets — ask, command, reflect, draft, clarify,
  explore. Classification drives tone/structure/depth.
- **Persona engine:** 5 personas — operator, analyst, creative, socratic,
  archivist. Explicit invocation + automated inference.
- **Semantic threading:** auto-cluster messages into semantic threads;
  merge/split/archive (manual + programmatic); cross-thread semantic
  retrieval; threads persist as living documents.

### 1.3 Utility layer (spec §3)
- **Inline transforms (8):** summarize, expand, counterargument,
  alternative_framing, diagram, checklist, plan, persona_rewrite.
- **Native conversational tools (7):** rewrite, condense, extract, invert,
  simulate, draft, diagnose.
- **Memory graph:** tracks preferences, tone, cognitive patterns, recurring
  topics, project contexts, entities/people, operational style. Queryable
  conversationally (patterns, evolution, last-N decisions).

### 1.4 UI/UX (spec §4)
- Monochrome operator-grade; NO bubbles, rounded corners, emojis, gradients,
  shadows, glass, or glow.
- Message state markers: intent color band, persona tag, confidence
  indicator, thread affiliation, execution marker.
- Non-modal inline utilities (hover/tap): transform, summarize, expand,
  thread link, memory link, persona switch.

### 1.5 Operational behavior (spec §5)
- Proactive clarification (ambiguity → prompt before processing).
- Cognitive mirroring (terse→dense, analytical→structured,
  brainstorming→exploratory).
- Conversation sculpting: merge streams, extract summaries, build outlines,
  detect contradictions, extract insights.

### 1.6 Schemas & modules (spec §6)
- Modules: intent parser, persona engine, semantic thread manager, message
  transformer, memory graph, inline utility toolkit, adaptive response
  generator.
- Message object schema: content, intent, persona, context, thread_id,
  confidence, metadata, transform_history (persisted: intent, persona,
  confidence, context_json, metadata_json, transform_history_json).

### 1.7 Environment & visual language (spec §8 — AUTHORITATIVE, verbatim outline)

**A. Aesthetic infrastructure & visual language**
- **Monochromatic precision palette:** pure black `#000000` background,
  off-white `#F4F4F0` typography, structural charcoal `#1A1A1A` borders.
- **Accent markers — strictly functional, 2px semantic indicators only:**
  Phosphor Green `#00FF66` (verified commands), High-Contrast Amber `#FFB000`
  (intent bounds), Cobalt Cyan `#0088FF` (thread routing).
- **Zero decorative artifacts:** complete absence of gradients, drop shadows,
  glassmorphism, background blurs, ambient glow. Every visual element maps
  directly to underlying computational state.
- **Hard geometry:** 0px border radius everywhere; panels tile on a rigid
  grid, no floating overlaps.
- **Dual-font system:** Inter / Neue Haas Grotesk for body & dialogue;
  JetBrains Mono / SF Mono for telemetry, metadata, intent tags, confidence,
  code blocks.

**B. Interactive spatial mechanics & layout**
- **Fixed tiled grid:** the screen is a multi-pane matrix — message streams,
  thread managers, telemetry blades sit flush against one another. Not a
  scrolling web document.
- **Vertical semantic margin:** dedicated left-hand margin along the whole
  conversation block: static 1px alignment grid marks, line counters, intent
  indicators.
- **Contextual split-blades:** no modal overlays or pop-ups. The chassis
  physically shifts — adjacent panels slide laterally on one rendering plane
  to expose sub-surface telemetry.

**C. Message object anatomy & visual states**
- **Intent edge band:** sharp 2px vertical bar on the far-left margin of each
  message block. Ask `#D1D1D1` · Command `#FFB000` · Reflect `#4A5568` ·
  Draft `#00FF66` · Clarify `#FF0055` · Explore `#0088FF`.
- **Monospaced metadata header** above the message body:
  `[INTENT: COMMAND] [PERSONA: OPERATOR] [CONFIDENCE: 98.4%] [THREAD_ID: #SYS-LOG-042] [LATENCY: 14ms]`.
- **Non-modal inline action rail** flush to the bottom edge on hover/focus:
  `[XFORM] [CONDENSE] [EXPAND] [MEM-NODE] [REWRITE]` — in-place transformation
  animation, zero modal overlay, no focal-point shift.

**D. Deep-inspection mechanics (the "underneath")**
- **Modifier-key inspection mode:** Alt/Option switches to Diagnostic
  Telemetry View — text opacity drops to 60%, 1px dashed vector association
  lines connect related messages to parent threads / memory graph nodes,
  token generation probabilities render as tiny percentages above key terms.
- **In-canvas split-blade:** clicking any message's `[CONF: 0.XX]` tag opens
  a side-by-side inspection panel in-grid: memory citations (historical
  nodes/parameters), raw payload dump (monospaced JSON of the Message Data
  Object), execution stack (intent parser / persona engine trace).

**E. Motion dynamics & tactile ergonomics**
- **Zero easing/bounciness:** 100–150ms linear or step-function timing.
  Elements move with rigid mechanical precision; panels expand and split-blades
  open with adjacent blocks adjusting instantly along grid lines — physical
  chassis hardware sliding into locked positions.
- **Operator-grade keyboard-first:** Cmd+K / `/` opens an inline monospaced
  command bar spanning the exact width of the active input frame. Vim/terminal
  style navigation of message objects, transformations, persona switching
  (`:persona operator`), telemetry drill-down (`:inspect`) — all hotkey-driven.

---

## 2. MODULE → TRACK MAP (what builds what)

| Module | Track | Status |
|---|---|---|
| Message object schema (data layer) | T2 (API) | ✅ core done, shipped |
| SPA rendering / console chassis | T1 (app) → T4 → T5 | ✅ T1 done; standalone live; T4/T5 pending |
| Standalone app identity + auth | Slice 2 | ✅ live 08-09 (own origin, shared-domain cookies, OAuth return-to) |
| Intent parser | T3 (cognition) | 🔄 scaffold + Phase B core; hardening pending |
| Persona engine | T3 (cognition) | 🔄 scaffold + /respond mirroring; hardening pending |
| Semantic thread manager | T3 (cognition) | 🔄 clustering live; merge/split/archive pending |
| Message transformer | T3 + T4 | 🔄 all 15 ops routed; quality pass pending |
| Memory graph | T3 (phased) | 🔄 anchors + query live; full graph pending |
| Inline utility toolkit | T3 + T4 | 🔄 cognition routes live; UI wiring pending |
| Adaptive response generator | T3 → T4 | ✅ /respond landed; composer wiring pending |
| Operator-console surface (spec §8 build-out) | Slice 1 (2026-08-09) | 🔄 in build; RINCON reviews/commits/ships |

---

## 3. TRACKS — DEFINITION OF DONE

### T0 Foundation ✅
- Spec + plan + branch + fork pushed.

### T1 SPA/console reskin ✅ (standalone state)
- §8 tokens + chassis components + clients. Verified typecheck/build.

### T2 Message object schema ✅ (core)
- Migrations (sqlite 0041, postgres 0042), PATCH metadata route, store
  impls, analyze-on-ingest. Verified build/tests.
- **Finish items (T2-F1..F4):** Neon parity run, E2E PATCH round-trip, SDK
  regen, .svelte-kit gitignore.

### T3 Cognition service 🔄 (scaffold + Phase B core live)
- Routes live: /healthz /analyze /respond /transform /threads/cluster
  /memory/anchors|query|list. Local embeddings live. Telemetry live.
- **Phase B:** Copilot diff review → intent hardening → persona tuning →
  transform quality → thread management → /respond composer wiring.

### T4 Integration ⏳
- SPA→cognition wiring (VITE_COGNITION_URL), analyze-on-ingest already
  server-side, hover utilities live, thread sidebar + memory links resolve.

### T5 Telemetry & inspection ⏳
- Split-blade inspection (logprobs n/a on DeepSeek — show vector score,
  latency, tokens, citations), live telemetry canvas.

---

## 4. SHIP SLICES

- **Slice 1 (2026-08-09 — SHIPPING NOW):** Standalone identity + auth +
  monochrome §8 restoration + operator-console surface build-out. Deployed
  and verified live at `logos.catabolicsolutions.com`; surface build in
  review, then commit + deploy + visual verification.
- **Slice 2:** T2 finish items (Neon parity, E2E round-trip, SDK regen) +
  remaining chassis polish.
- **Slice 3:** T4 integration — markers populated from real cognition data,
  hover utilities live.
- **Slice 4:** T5 telemetry + inspection depth + thread management.

---

## 5. VERIFICATION PROTOCOL (non-negotiable)

- `cd apps/logos && npm run typecheck && npm run build` — must pass.
- `cd apps/api && go build ./... && go test ./...` — must pass.
- Migrations additive; API backward compatible.
- No `git add -A`; stage only changed files.
- Commit format: `logos: <track> — <what>`.
- Live checks after deploy: logos origin 200 + served CSS hash == local
  build; app origin 200 (plumbing untouched); /api/me on logos origin → 401
  (clean challenge); OAuth start → 302 with Domain=.catabolicsolutions.com
  cookies + return_to back to logos origin.

---

## 6. DEPLOY TOPOLOGY (current, verified 08-09)

- Droplet `137.184.144.196`: clickclack API :8090 (SQLite), logos-cognition
  :8787 (auth-gated, Cloudflare-only), logos-app :8788 (static).
- Cloudflare worker `app.catabolicsolutions.com` + `logos.catabolicsolutions.com`:
  - `logos.` origin → LOGOS at root (static :8788), /api/* → :8090,
    /cognition/* → :8787 (token-injected)
  - `app.` origin → clickclack SPA (container) + /api/* → :8090,
    /cognition/* → :8787
  - Set-Cookie rewritten to `Domain=.catabolicsolutions.com` on all proxied
    paths so one session spans both origins
  - NO /logos/* subpath route (removed 08-09)
- Rebuild: `apps/logos && npm run build` → /opt/logos-app/dist;
  `apps/api && go build ./apps/api/cmd/clickclack` → /opt/clickclack/clickclack;
  `apps/cognition && npm run build` → /opt/logos-cognition.
- **Canonical surface:** `logos.catabolicsolutions.com` — the upspun app.
  `app.catabolicsolutions.com` stays as plumbing.
