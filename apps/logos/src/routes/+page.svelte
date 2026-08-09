<script lang="ts">
  import { currentPersona, semanticPaneOpen, telemetryOpen, type Persona } from "$lib/ui";
  import ChatStream from "$lib/components/ChatStream.svelte";
  import SemanticThreadPane from "$lib/components/SemanticThreadPane.svelte";
  import { chatState } from "$lib/clickclack/chat";

  let persona = $state<Persona>("operator");
  $effect(() => {
    const unsub = currentPersona.subscribe((v) => (persona = v));
    return unsub;
  });

  // Feed the semantic pane with the current message window
  let threadMessages = $state<Array<{ id: string; content: string }>>([]);
  $effect(() => {
    const unsub = chatState.subscribe((v) => {
      threadMessages = v.messages.map((m) => ({ id: m.id, content: m.body ?? "" }));
    });
    return unsub;
  });

  function focusMessage(messageId: string) {
    // Find the message row and scroll it into view
    const el = document.querySelector(`[data-msg-id="${messageId}"]`);
    el?.scrollIntoView({ block: "center" });
    el?.classList.add("flash-highlight");
    setTimeout(() => el?.classList.remove("flash-highlight"), 1200);
  }
</script>

<div class="console">
  <header class="console-topbar">
    <div class="topbar-copy">
      <span class="brand">LOGOS</span>
      <div class="brand-stack">
        <div class="brand-title">Messaging that stays out of the way</div>
        <div class="brand-subtitle">Write first. Review context only when you ask for it.</div>
      </div>
    </div>
    <span class="spacer"></span>
    <span class="persona-tag logos-mono accent-intent">{persona.toUpperCase()}</span>
    <button class="ghost" class:active={$semanticPaneOpen} onclick={() => semanticPaneOpen.set(!$semanticPaneOpen)}>Open history</button>
    <button class="ghost" class:active={$telemetryOpen} onclick={() => telemetryOpen.set(!$telemetryOpen)}>Open signals</button>
  </header>

  <div class="console-body" class:semantic-open={$semanticPaneOpen}>
    <section class="pane chat-pane">
      <div class="pane-body chat-body">
        <ChatStream />
      </div>
    </section>

    <aside class="pane right-pane" class:open={$semanticPaneOpen}>
      <SemanticThreadPane
        messages={threadMessages}
        onClose={() => semanticPaneOpen.set(false)}
        onFocusMessage={focusMessage}
      />
    </aside>
  </div>

  <footer class="console-statusbar">
    <span class="logos-mono">⌘K palette</span><span>·</span><span>History is collapsed by default</span><span>·</span>
    <span>Signals are optional</span>
  </footer>
</div>

<style>
  /* ── Console: fixed tiled grid operator chassis (§8.3) ── */
  .console {
    display: grid;
    grid-template-rows: 52px minmax(0, 1fr) 36px;
    height: 100%;
    min-width: 0;
  }

  /* ── Topbar: pure black, 1px charcoal border, no blur/gradients/glow ── */
  .console-topbar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: 0 var(--space-5);
    border-bottom: 1px solid var(--line);
    background: var(--bg);
  }

  .topbar-copy {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .brand {
    font-weight: 700;
    color: var(--text-strong);
    letter-spacing: 0.14em;
    font-size: 12px;
  }

  .brand-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .brand-title {
    color: var(--text-strong);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
  }

  .brand-subtitle {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .spacer { flex: 1; }

  /* ── Persona tag: 2px amber intent border, no radius, no shadow ── */
  .persona-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 0 12px;
    border: 2px solid var(--accent-intent);
    background: transparent;
    color: var(--text-strong);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  /* ── Ghost toggles: pure console buttons ── */
  .ghost {
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--muted);
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast);
  }

  .ghost:hover {
    color: var(--text-strong);
    border-color: var(--line-strong);
    background: var(--hover);
  }

  .ghost.active {
    color: var(--text-strong);
    border-color: var(--accent-thread);
    background: var(--hover-strong);
  }

  /* ── Body: fixed grid; semantic pane slides in-grid (§8.3) ── */
  .console-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 0px;
    min-height: 0;
    transition: grid-template-columns var(--motion-med);
  }

  .console-body.semantic-open {
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 0;
  }

  .pane {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
    border: 1px solid var(--line);
    border-radius: 0;
    background: var(--panel);
    overflow: hidden;
  }

  .chat-pane {
    background: var(--bg);
  }

  .chat-body {
    min-height: 0;
  }

  .right-pane {
    overflow: hidden;
    transition:
      opacity var(--motion-med),
      transform var(--motion-med);
  }

  .right-pane:not(.open) {
    opacity: 0;
    pointer-events: none;
    transform: translateX(12px);
  }

  /* ── Statusbar: pure black, 1px charcoal top ── */
  .console-statusbar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-4);
    border-top: 1px solid var(--line);
    background: var(--bg);
    color: var(--muted-2);
    font-size: 12px;
    overflow-x: auto;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .console-topbar {
      flex-wrap: wrap;
      min-height: 52px;
      padding-block: var(--space-2);
    }
    .topbar-copy {
      width: 100%;
    }
    .console-body.semantic-open {
      grid-template-columns: minmax(0, 1fr);
    }
    .right-pane.open {
      position: absolute;
      inset: 76px var(--space-3) 48px var(--space-3);
      z-index: 10;
    }
  }

  @media (max-width: 480px) {
    .console {
      grid-template-rows: auto minmax(0, 1fr) 40px;
    }
    .brand {
      width: auto;
    }
    .persona-tag,
    .ghost {
      min-height: 40px;
    }
    .brand-subtitle {
      white-space: normal;
    }
  }
</style>
