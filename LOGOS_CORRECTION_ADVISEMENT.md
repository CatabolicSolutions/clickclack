# PROJECT LOGOS — Correction Advisement (for Copilot / any builder)

**Date:** 2026-08-09 (updated — supersedes prior advisements)
**From:** Conor Ross (owner) via RINCON
**Read first:** `LOGOS_BUILD_README.md` (what exists), then this document, then
`LOGOS_SPEC.md` (full directive + §8 visual language).

---

## 1. The core ask (read this twice)

**What Conor wants:** extract the **chat feature** from clickclack and lace it
into a **standalone companion application** ("Project LOGOS"). clickclack is
the plumbing that lives deep underneath — the new app is the upspun asset,
utility, and experience.

**The chat is the ONLY thing inherited from clickclack.** It enters the new
app as one embedded component (clickclack API + realtime, cookie auth).
EVERYTHING else — the shell, the design, the UX, the interface, the
semantic/thread/memory/inspection/telemetry surfaces — is native to the new
app and must be built NEW.

Conor's words, verbatim (2026-08-09):
> "we just needed to extract the chat feature from this and lace it into a
> build out companion app."
> "I want a upgraded app, that inherently means different shape/design/user
> experience/interface."
> "The chat should be the only thing that we are using, everything else
> should be new."

---

## 2. What went wrong (the miss — do not repeat)

Work kept **modifying the clickclack SPA/API and mounting a second app as a
subpath of the same deployment**. That reads as "same program, different coat
of paint" — which is what Conor rejected. Specifically:

- A skin pass ("Jarvis": navy/cyan, glassmorphism, gradients, glow) was
  applied to the LOGOS shell and later **reverted** — it contradicted the §8
  monochrome spec. Do not reintroduce it.
- The LOGOS build was deployed with `base: '/logos'` (subpath mount of the
  clickclack origin) — exactly the pattern Conor rejected. It is now
  root-relative (`base: ''`) and serves at its own origin
  (`logos.catabolicsolutions.com`). The `/logos/*` worker route was removed.
- Result: a standalone shell exists with the chat embedded, but it is not
  yet the fully realized new operator-console experience. **That is the work
  to complete.**

**The correct target (unchanged from the earlier correction):**
- A **separate, standalone application** with its own shell, its own
  deployment, its own URL — `logos.catabolicsolutions.com` (provisioned).
- **Chat = one embedded component** — the only inherited piece. Uses
  clickclack's API + realtime (cookie auth, WS, REST).
- **Everything around the chat is native to the new app**: operator console
  shell (§8), semantic thread sidebar, memory graph viewer, message
  inspection blades, command palette + keyboard-first nav, adaptive
  companion replies (`/respond`).

---

## 3. Do NOT do these (hard rules)

1. **Do NOT modify `apps/web`** (the clickclack SPA) — it's the plumbing
   surface Conor sees as "the same program". Leave it alone.
2. **Do NOT mount LOGOS as a subpath** of app.catabolicsolutions.com or
   re-add a `/logos/*` route. LOGOS lives at its own origin.
3. **Do NOT reintroduce Jarvis styling** (navy/cyan, glassmorphism, gradients,
   glow, rounded look). Monochrome §8 is the identity: pure black `#000000`,
   off-white `#F4F4F0`, charcoal `#1A1A1A`, 2px functional accents only
   (Phosphor Green #00FF66 / Amber #FFB000 / Cobalt #0088FF), 0px radius,
   zero decorative artifacts.
4. **Do NOT change the clickclack API's message schema or auth model** — T2
   schema is live and is the substrate. Extend the companion, not the plumbing.
5. **No order placement / account-mutating behavior anywhere.**
6. **No high-cost/frontier model use unless absolutely necessary.** Default
   lanes: deepseek-v4-pro subagents; Copilot CLI / VS Code CLI for T3+
   handoffs. No Codex, ever.

---

## 4. What to build (the real scope)

Build the standalone LOGOS experience per `LOGOS_SPEC.md` §7 + §8. **§7 is the
environment spec — the surface the chat service lives in gets the same
operator-grade treatment; it is not exempt.** Priority order:

0. **Environment (spec §7) — the typewriter-minimal canvas the app lives in:**
   - Strict black/off-white monochrome, 0px radius, precision grid, no
     bubbles/emojis/gradients/shadows/consumer embellishments.
   - Tactile system canvas: telemetry, state inspection, and execution depth
     embedded in the UI substrate — no conversational follow-up needed.
   - Sub-surface drill-down: hover/click on any interface object reveals
     inline split-blade panels (vector distances, confidence weightings,
     token-level probabilities, model generation parameters).
   - Live telemetry in-environment: execution stacks, memory-graph citations,
     intent parser metrics, active state variables on the canvas.
   - Dynamic message states: intent color band, persona tag, confidence
     indicator, thread affiliation marker, execution marker.
   - Non-modal inline utilities: Transform / Summarize / Expand / Thread Link /
     Memory Link / Persona Switch — inline, zero pop-ups or page transitions.

1. **Operator console shell** — fixed tiled grid, vertical semantic margin
   (1px grid marks, line counters, intent indicators), panels flush against
   one another, no floating overlaps, 0px radius, monochrome.
2. **Message object anatomy** — 2px intent edge band (Ask #D1D1D1 / Command
   #FFB000 / Reflect #4A5568 / Draft #00FF66 / Clarify #FF0055 / Explore
   #0088FF), monospaced metadata header
   `[INTENT][PERSONA][CONF][THREAD][LATENCY]`, non-modal inline action rail
   `[XFORM][CONDENSE][EXPAND][MEM-NODE][REWRITE]`.
3. **Deep inspection** — Alt/Option diagnostic mode (text 60% opacity, 1px
   dashed association lines), in-canvas split-blade on CONF click (telemetry,
   memory citations, raw payload JSON, execution stack).
4. **Semantic thread sidebar + memory graph viewer** — powered by the
   cognition service (`/threads/cluster`, `/memory/*`).
5. **Command palette + keyboard-first** — Cmd+K / `/`, `:persona`,
   `:inspect`, `:telemetry`, `:threads`, vim-style j/k navigation.
6. **Adaptive companion replies** — `/respond` wired into the composer.
7. **Motion** — 100–150ms linear/step, no easing; chassis-slide transitions.

**Chat stays one embedded component** (ChatStream.svelte + the clickclack
client at `apps/logos/src/lib/clickclack/`). Everything else is native.

---

## 5. Verify before shipping

- `cd apps/logos && npm run typecheck && npm run build` — green.
- `cd apps/cognition && npm run build` — green (if touched).
- Served CSS hash on `logos.catabolicsolutions.com` matches local build.
- `/api/me` on logos origin → 401 clean challenge (auth intact).
- `/cognition/healthz` ok; `/cognition/analyze` returns real output.
- RINCON handles deploy + live verification. Builders commit + push.

---

## 6. Provenance

- All claims above verified in-repo on branch `cognitive-os` (HEAD
  `642dc5a`) and/or verified live on 2026-08-09.
- Authoritative spec: `LOGOS_SPEC.md`. Scope record: `LOGOS_SCOPE.md`.
- Status/plan: `LOGOS_RECAP_PLAN_20260809.md`.
