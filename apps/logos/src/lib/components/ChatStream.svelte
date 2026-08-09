<script lang="ts">
  // PROJECT LOGOS — ChatStream: the ONE piece inherited from clickclack
  //
  // Renders channel picker (mono, minimal), message list (flat rows, dense
  // typography, mono metadata line per message), and composer (Enter to send).
  //
  // Operator aesthetic: no bubbles, 0px radius, mono meta, 2px functional accents.
  // Props: none required; reads chatState store.
  //
  // Graceful states: booting (spinner text), error (mono error line), empty channel.

  import { onMount, onDestroy } from "svelte";
  import {
    chatState,
    boot,
    selectChannel,
    selectWorkspace,
    sendMessage,
    applyMessageUpdate,
  } from "$lib/clickclack/chat";
  import { updateMessageMetadata } from "$lib/clickclack/api";
  import type { Channel } from "$lib/clickclack/types";
  import {
    readMessageMetadata,
    type CognitiveMessage,
    type MessageMetadata,
    type TransformHistoryEntry,
  } from "$lib/clickclack/types";
  import MessageFrame, { type LogosMessage } from "$lib/components/MessageFrame.svelte";
  import InspectorBlade from "$lib/components/InspectorBlade.svelte";
  import ResultStrip from "$lib/components/ResultStrip.svelte";
  import ClarificationPrompt from "$lib/components/ClarificationPrompt.svelte";
  import { activeMessageId, currentPersona, operatorNotice } from "$lib/ui";
  import { transform, memoryAnchor, memoryQuery, respond } from "$lib/cognition";
  import { analyzeMessage, getCachedAnalysis, isAnalysisFailed } from "$lib/analyzer";
  import type { AnalysisResult } from "$lib/cognition";

  // ── Local state ──────────────────────────────────────────────

  let composerText = $state("");
  let composerRef: HTMLTextAreaElement | null = $state(null);
  let messageListRef: HTMLDivElement | null = $state(null);
  let inspecting: LogosMessage | null = $state(null);

  // ── Transform & clarification state ───────────────────────────

  /** Active transform results: messageId → { content, op, model, loading } */
  let activeTransforms = $state<Map<string, {
    content: string;
    op: string;
    model: string | null;
    loading: boolean;
  }>>(new Map());

  /** Dismissed clarification prompts: messageId → true */
  let dismissedClarifications = $state<Set<string>>(new Set());

  /** Non-persistent body overrides from applied transforms: messageId → newBody */
  let appliedOverrides = $state<Map<string, string>>(new Map());

  /** Analysis results from cognition POST /analyze: messageId → AnalysisResult */
  let analyzedMeta = $state<Map<string, AnalysisResult>>(new Map());

  /** Track message IDs we've already attempted to analyze (prevents re-queue). */
  let seenForAnalysis = $state<Set<string>>(new Set());

  let companionSuggestion = $state<{
    content: string;
    model: string | null;
    loading: boolean;
    clarificationQuestion: string | null;
    followups: string[];
    memoryPreview: Array<{
      id: string;
      content: string;
      score?: number;
      tags?: string[];
    }>;
  } | null>(null);
  let notice = $state<string | null>(null);
  let historyCollapsed = $state(true);

  // ── Derived from chatState ───────────────────────────────────

  let snapshot = $state($chatState);
  $effect(() => {
    const unsub = chatState.subscribe((v) => {
      snapshot = v;
      // Auto-scroll to bottom on new messages
      if (messageListRef && v.messages.length > 0) {
        requestAnimationFrame(() => {
          messageListRef?.scrollTo({ top: messageListRef.scrollHeight });
        });
      }
    });
    return unsub;
  });
  $effect(() => {
    const unsub = operatorNotice.subscribe((value) => {
      notice = value;
      if (!value) return;
      window.setTimeout(() => {
        operatorNotice.update((current) => (current === value ? null : current));
      }, 2000);
    });
    return unsub;
  });

  let persona = $state("operator");
  $effect(() => {
    const unsub = currentPersona.subscribe((v) => (persona = v));
    return unsub;
  });

  // ── Metadata extraction (spec §8.4) ──────────────────────────

  function messageMeta(msg: Record<string, unknown>): MessageMetadata {
    return readMessageMetadata(msg);
  }

  // ── Analyze-on-ingest: fire POST /analyze for every new message ──

  $effect(() => {
    for (const msg of snapshot.messages) {
      const msgId = String(msg.id);
      if (!msgId || seenForAnalysis.has(msgId)) continue;
      seenForAnalysis.add(msgId);

      const body = typeof (msg as Record<string, unknown>).body === "string"
        ? (msg as Record<string, unknown>).body as string
        : "";
      if (!body.trim()) continue;

      // Skip re-analysis if stored metadata already has intent & persona
      const stored = readMessageMetadata(msg as Record<string, unknown>);
      if (stored.intent && stored.confidence !== undefined) continue;

      // Fire async analysis; never blocks rendering
      void analyzeMessage(msgId, body).then((result) => {
        if (result) {
          analyzedMeta.set(msgId, result);
          analyzedMeta = new Map(analyzedMeta); // trigger Svelte 5 reactivity
        }
      });
    }
  });

  const activeWorkspaceName = $derived(
    snapshot.workspaces.find((workspace) => workspace.id === snapshot.activeWorkspaceId)?.name ?? null,
  );
  const activeChannelName = $derived(
    snapshot.channels.find((channel) => channel.id === snapshot.activeChannelId)?.name ?? null,
  );
  const recentMessages = $derived(snapshot.messages.slice(-12));
  const olderMessages = $derived(snapshot.messages.slice(0, -12));
  const collapsedHiddenCount = $derived(Math.max(0, olderMessages.length));
  const latestMessage = $derived(snapshot.messages.at(-1) as CognitiveMessage | undefined);
  const latestPreview = $derived.by(() => {
    if (!latestMessage?.body) return "Start a conversation.";
    const compact = latestMessage.body.replace(/\s+/g, " ").trim();
    if (!compact) return "Start a conversation.";
    return compact.length > 120 ? `${compact.slice(0, 117).trimEnd()}...` : compact;
  });
  const connectionLabel = $derived(
    snapshot.status === "booting"
      ? "CONNECTING"
      : snapshot.status === "error"
        ? "DEGRADED"
        : snapshot.realtime === "ws"
          ? "LIVE WS"
          : "LIVE POLL",
  );
  const readyHint = $derived.by(() => {
    if (snapshot.status === "booting") {
      return "Resolving ClickClack session, workspace, and channel context…";
    }
    if (snapshot.status === "error") {
      return "Check auth/session state or switch workspace/channel context.";
    }
    if (!snapshot.activeWorkspaceId) {
      return "No workspace selected yet. Pick a workspace to activate LOGOS.";
    }
    if (!snapshot.activeChannelId) {
      return "Workspace loaded. Pick a channel to begin the cognitive stream.";
    }
    if (snapshot.messages.length === 0) {
      return "Channel ready. Send a first message to trigger analysis, transforms, and memory surfaces.";
    }
    return null;
  });

  function metaLine(msg: { body?: string } & Record<string, unknown>): string {
    const m = messageMeta(msg);
    const parts: string[] = [];
    if (m.intent) parts.push(`[${m.intent.toUpperCase()}]`);
    if (m.persona) parts.push(`[${m.persona.toUpperCase()}]`);
    if (m.confidence !== undefined) parts.push(`[CONF: ${(m.confidence * 100).toFixed(1)}%]`);
    if (m.thread_id) parts.push(`[THREAD: ${m.thread_id}]`);
    if (m.latency_ms !== undefined) parts.push(`[${m.latency_ms}ms]`);
    return parts.join(" ");
  }

  function intentColor(intent: string | undefined): string {
    const map: Record<string, string> = {
      ask: "var(--intent-ask)",
      command: "var(--intent-command)",
      reflect: "var(--intent-reflect)",
      draft: "var(--intent-draft)",
      clarify: "var(--intent-clarify)",
      explore: "var(--intent-explore)",
    };
    return map[intent ?? ""] ?? "var(--intent-default)";
  }

  // ── Actions ──────────────────────────────────────────────────

  function onSubmit() {
    const text = composerText.trim();
    if (!text) return;
    const chId = snapshot.activeChannelId;
    if (!chId) return;
    sendMessage(chId, text);
    composerText = "";
    composerRef?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  function onChannelClick(ch: Channel) {
    selectChannel(ch.id);
  }

  function onWsChange(e: Event) {
    const sel = (e.target as HTMLSelectElement).value;
    if (sel && sel !== snapshot.activeWorkspaceId) {
      selectWorkspace(sel);
    }
  }

  // ── Message → LogosMessage adapter ─────────────────────────────

  function messageToLogos(msg: CognitiveMessage): LogosMessage {
    const m = messageMeta(msg);
    const id = String(msg.id ?? "");
    const analysis = analyzedMeta.get(id);

    // Merge: analysis results win over stored metadata
    const mergedIntent = analysis?.intent ?? m.intent ?? null;
    const mergedPersona = analysis?.persona ?? m.persona ?? null;
    const mergedConfidence = analysis?.confidence ?? m.confidence ?? null;

    // Merge telemetry: analysis telemetry + stored telemetry
    const storedTelemetry = (m as Record<string, unknown>).telemetry as Record<string, unknown> | undefined;
    const mergedTelemetry: Record<string, unknown> = {
      ...(storedTelemetry ?? {}),
      ...(analysis?.telemetry ?? {}),
    };

    // Build merged metadata_json for InspectorBlade
    const mergedMetadata: Record<string, unknown> = {
      ...(m as Record<string, unknown>),
      telemetry: mergedTelemetry,
    };
    // Surface memory_citations from telemetry into metadata_json root
    if (mergedTelemetry.memory_citations) {
      mergedMetadata.memory_citations = mergedTelemetry.memory_citations;
    }

    return {
      id,
      body: appliedOverrides.get(id) ?? String(msg.body ?? ""),
      intent: mergedIntent,
      persona: mergedPersona,
      confidence: mergedConfidence,
      thread_id: m.thread_id ?? null,
      execution_status: m.execution_status ?? null,
      metadata_json: mergedMetadata,
      transform_history: m.transform_history ?? [],
      created_at: msg.created_at ? String(msg.created_at) : null,
    };
  }

  // ── Inspector ──────────────────────────────────────────────────

  function onInspect(msg: LogosMessage) {
    inspecting = inspecting?.id === msg.id ? null : msg;
    activeMessageId.set(msg.id);
  }

  function closeInspector() {
    inspecting = null;
    activeMessageId.set(null);
  }

  // ── Row focus for keyboard / hover ─────────────────────────────

  function onRowFocus(msg: { id?: string }) {
    activeMessageId.set(String(msg.id ?? ""));
  }

  function authorLabel(msg: { author?: { display_name?: string; handle?: string } | null }): string {
    if (msg.author?.display_name) return msg.author.display_name;
    if (msg.author?.handle) return `@${msg.author.handle}`;
    return "unknown";
  }

  // ── Action rail wiring: transforms + memory ────────────────────

  interface TransformEventDetail {
    op:
      | "summarize"
      | "condense"
      | "expand"
      | "rewrite"
      | "checklist"
      | "plan"
      | "extract"
      | "diagnose"
      | "counterargument"
      | "invert";
    messageId: string;
  }

  function buildTransformHistoryEntry(
    op: string,
    content: string,
    model: string | null,
  ): TransformHistoryEntry {
    return {
      op,
      at: new Date().toISOString(),
      preview: content.slice(0, 120),
      ...(persona ? { persona } : {}),
      ...(model ? { model } : {}),
    };
  }

  async function persistTransformHistory(
    message: CognitiveMessage,
    op: string,
    content: string,
    model: string | null,
  ): Promise<void> {
    const metadata = messageMeta(message);
    const nextHistory = [
      ...(metadata.transform_history ?? []),
      buildTransformHistoryEntry(op, content, model),
    ];

    try {
      const updated = await updateMessageMetadata(message.id, {
        transform_history: nextHistory,
      });
      applyMessageUpdate(updated);
    } catch (err) {
      console.warn("[logos/chatstream] transform history patch failed:", err);
      applyMessageUpdate({
        ...message,
        transform_history: nextHistory,
      } as CognitiveMessage);
    }
  }

  async function handleTransformEvent(detail: TransformEventDetail) {
    const msg = snapshot.messages.find((m) => m.id === detail.messageId) as CognitiveMessage | undefined;
    if (!msg) return;
    const body = (msg as Record<string, unknown>).body;
    if (typeof body !== "string" || !body.trim()) return;

    // Show loading strip
    activeTransforms.set(detail.messageId, { content: "", op: detail.op, model: null, loading: true });
    activeTransforms = new Map(activeTransforms); // trigger reactivity

    const result = await transform(body, detail.op, persona);
    if (result) {
      const model = (result.meta && typeof result.meta === "object"
        ? (result.meta as Record<string, unknown>).model as string | undefined
        : undefined) ?? null;
      await persistTransformHistory(msg, detail.op, result.transformed_content, model);
      activeTransforms.set(detail.messageId, {
        content: result.transformed_content,
        op: detail.op,
        model,
        loading: false,
      });
    } else {
      activeTransforms.set(detail.messageId, {
        content: "[ERR] Cognition service returned no result.",
        op: detail.op,
        model: null,
        loading: false,
      });
    }
    activeTransforms = new Map(activeTransforms);
  }

  async function handleMemoryEvent(detail: { messageId: string }) {
    const msg = snapshot.messages.find((m) => m.id === detail.messageId);
    if (!msg) return;
    const body = (msg as Record<string, unknown>).body;
    if (typeof body !== "string" || !body.trim()) return;

    // Show loading strip
    activeTransforms.set(detail.messageId, { content: "", op: "memory", model: null, loading: true });
    activeTransforms = new Map(activeTransforms);

    const result = await memoryQuery(body.slice(0, 500));
    if (result?.nodes?.length) {
      const lines = result.nodes.map(
        (n) => `#NODE-${n.id.slice(0, 12)}  (${n.score.toFixed(3)})  ${n.content.slice(0, 80)}`
      );
      activeTransforms.set(detail.messageId, {
        content: lines.join("\n"),
        op: "memory",
        model: null,
        loading: false,
      });
    } else {
      activeTransforms.set(detail.messageId, {
        content: "[MEMORY] No matching anchors found.",
        op: "memory",
        model: null,
        loading: false,
      });
    }
    activeTransforms = new Map(activeTransforms);
  }

  function dismissTransform(messageId: string) {
    activeTransforms.delete(messageId);
    activeTransforms = new Map(activeTransforms);
  }

  function applyTransform(messageId: string, content: string) {
    appliedOverrides.set(messageId, content);
    appliedOverrides = new Map(appliedOverrides);
    dismissTransform(messageId);
  }

  function useTransformAsDraft(content: string) {
    composerText = content;
    composerRef?.focus();
  }

  // ── Clarification handling ─────────────────────────────────────

  function getClarificationQuestion(msg: Record<string, unknown>): string | null {
    const msgId = String((msg as { id?: unknown }).id ?? "");
    // Check analyzed metadata first (live cognition result)
    const analysis = analyzedMeta.get(msgId);
    if (analysis?.clarification_question) return analysis.clarification_question;
    // Fallback to stored metadata
    const m = messageMeta(msg);
    const cq = m.clarification_question;
    if (typeof cq === "string" && cq.trim()) return cq.trim();
    return null;
  }

  function buildContextMessages(): Array<{ role: "user" | "assistant"; content: string }> | undefined {
    const userId = snapshot.user?.id;
    if (!userId) return undefined;
    return snapshot.messages
      .slice(-8)
      .filter((message) => typeof message.body === "string" && message.body.trim().length > 0)
      .map((message) => ({
        role: message.author_id === userId ? "user" : "assistant",
        content: message.body,
      }));
  }

  function buildMemoryHintIds(): string[] | undefined {
    const anchors = snapshot.messages
      .slice(-10)
      .flatMap((message) => {
        const meta = messageMeta(message as Record<string, unknown>);
        return Array.isArray(meta.memory_citations) ? meta.memory_citations : [];
      })
      .filter((value, index, all) => typeof value === "string" && all.indexOf(value) === index)
      .slice(-3);
    return anchors.length > 0 ? anchors : undefined;
  }

  async function handleSuggestReply() {
    const text = composerText.trim();
    if (!text) return;

    companionSuggestion = {
      content: "",
      model: null,
      loading: true,
      clarificationQuestion: null,
      followups: [],
      memoryPreview: [],
    };

    const result = await respond({
      content: text,
      persona,
      context_messages: buildContextMessages(),
      memory_hint_ids: buildMemoryHintIds(),
    });

    if (!result) {
      companionSuggestion = {
        content: "[ERR] Cognition service returned no companion reply.",
        model: null,
        loading: false,
        clarificationQuestion: null,
        followups: [],
        memoryPreview: [],
      };
      return;
    }

    companionSuggestion = {
      content: result.content,
      model: result.meta?.model ?? null,
      loading: false,
      clarificationQuestion: result.clarification_question ?? null,
      followups: result.suggested_followups ?? [],
      memoryPreview: result.meta?.memory_previews?.map((preview) => ({
        id: preview.id,
        content: preview.content,
        ...(typeof preview.score === "number" ? { score: preview.score } : {}),
        ...(preview.tags?.length ? { tags: preview.tags } : {}),
      })) ?? [],
    };
  }

  function applyCompanionSuggestion() {
    if (!companionSuggestion || companionSuggestion.loading) return;
    composerText = companionSuggestion.content;
    companionSuggestion = null;
    composerRef?.focus();
  }

  function dismissCompanionSuggestion() {
    companionSuggestion = null;
  }

  function toggleHistoryCollapsed() {
    historyCollapsed = !historyCollapsed;
  }

  function handleClarifyAsk(messageId: string, question: string) {
    const chId = snapshot.activeChannelId;
    if (!chId) return;
    sendMessage(chId, question);
    dismissedClarifications.add(messageId);
    dismissedClarifications = new Set(dismissedClarifications);
  }

  function dismissClarification(messageId: string) {
    dismissedClarifications.add(messageId);
    dismissedClarifications = new Set(dismissedClarifications);
  }

  // ── Keyboard navigation (spec §8.6) ────────────────────────────

  function getVisibleMessageIds(): string[] {
    if (!messageListRef) return [];
    const rows = messageListRef.querySelectorAll("[data-msg-id]");
    return Array.from(rows).map((el) => el.getAttribute("data-msg-id") ?? "").filter(Boolean);
  }

  function scrollToMessageId(id: string) {
    const el = messageListRef?.querySelector(`[data-msg-id="${id}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }

  function navigateMessage(direction: 1 | -1) {
    const ids = getVisibleMessageIds();
    if (ids.length === 0) return;
    const current = $activeMessageId;
    const idx = current ? ids.indexOf(current) : -1;
    const nextIdx = idx === -1 ? 0 : Math.min(Math.max(idx + direction, 0), ids.length - 1);
    const nextId = ids[nextIdx];
    if (nextId) {
      activeMessageId.set(nextId);
      scrollToMessageId(nextId);
    }
  }

  function openInspectorForActive() {
    const aid = $activeMessageId;
    if (!aid) return;
    const msg = snapshot.messages.find((m) => m.id === aid);
    if (msg) {
      inspecting = messageToLogos(msg);
    }
  }

  function handleListKeydown(e: KeyboardEvent) {
    // Only handle when not typing in composer
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      navigateMessage(1);
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      navigateMessage(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      openInspectorForActive();
    } else if (e.key === "Escape") {
      closeInspector();
    }
  }

  // ── Event listeners for MessageFrame CustomEvents ──────────────

  function handleBubbledTransform(e: Event) {
    const ce = e as CustomEvent<TransformEventDetail>;
    if (ce.detail?.messageId && ce.detail?.op) {
      e.stopPropagation();
      void handleTransformEvent(ce.detail);
    }
  }

  function handleBubbledMemory(e: Event) {
    const ce = e as CustomEvent<{ messageId: string }>;
    if (ce.detail?.messageId) {
      e.stopPropagation();
      void handleMemoryEvent(ce.detail);
    }
  }

  onMount(() => {
    boot();

    // Listen for bubbled CustomEvents from MessageFrame
    const listEl = messageListRef;
    if (listEl) {
      listEl.addEventListener("onTransform", handleBubbledTransform);
      listEl.addEventListener("onMemory", handleBubbledMemory);
    }

    // Focus the message list for keyboard nav
    messageListRef?.focus();
  });

  onDestroy(() => {
    messageListRef?.removeEventListener("onTransform", handleBubbledTransform);
    messageListRef?.removeEventListener("onMemory", handleBubbledMemory);
  });
</script>
<!-- ═══ LOGOS CHAT ═══ -->
<div class="chat">
  <header class="chat-top">
    <div class="chat-title">
      <span class="chat-sub">
        {#if activeWorkspaceName}{activeWorkspaceName}{activeChannelName ? ` / #${activeChannelName}` : ""}{:else}Select a channel{/if}
      </span>
    </div>
    <div class="chat-right">
      {#if snapshot.status === "booting"}<span class="pill pill-boot">Connecting…</span>
      {:else if snapshot.status === "error"}<span class="pill pill-err" title={snapshot.error ?? ""}>Error</span>
      {:else if snapshot.activeChannelId}<span class="pill pill-ok">{connectionLabel}</span>{/if}
    </div>
  </header>

  {#if notice}<div class="chat-notice">{notice}</div>{/if}

  <div class="chat-scroll" bind:this={messageListRef} tabindex="0" role="list" aria-label="Messages" onkeydown={handleListKeydown}>
    {#if snapshot.status === "booting"}
      <div class="chat-state">{#if readyHint}{readyHint}{:else}Connecting to your workspace…{/if}</div>
    {:else if snapshot.status === "error"}
      <div class="chat-state chat-state-err">{snapshot.error ?? "Connection error"}{#if readyHint}<div class="chat-hint">{readyHint}</div>{/if}</div>
    {:else if snapshot.messages.length === 0}
      <div class="chat-state">{snapshot.activeChannelId ? "No messages yet — say hello." : "Select a channel to begin."}{#if readyHint}<div class="chat-hint">{readyHint}</div>{/if}</div>
    {:else}
      {#if olderMessages.length > 0}
        <div class="history-row">
          <button type="button" class="history-btn" onclick={toggleHistoryCollapsed}>
            {#if historyCollapsed}Show earlier messages ({collapsedHiddenCount}){:else}Hide earlier messages{/if}
          </button>
        </div>
      {/if}
      {#if !historyCollapsed}
        {#each olderMessages as msg (msg.id)}
          {@const msgId = String(msg.id)}
          {@const logosMsg = messageToLogos(msg as CognitiveMessage)}
          <div class="msg msg-old" data-msg-id={msgId} onmouseenter={() => onRowFocus(msg)}>
            <MessageFrame message={logosMsg} onInspect={onInspect} active={$activeMessageId === msgId} compact={true} />
          </div>
        {/each}
      {/if}
      {#each recentMessages as msg (msg.id)}
        {@const msgId = String(msg.id)}
        {@const logosMsg = messageToLogos(msg as CognitiveMessage)}
        {@const rawMsg = msg as Record<string, unknown>}
        {@const clarifyQ = getClarificationQuestion(rawMsg)}
        {@const showClarify = clarifyQ != null && !dismissedClarifications.has(msgId)}
        {@const hasTransform = activeTransforms.has(msgId)}
        {@const tform = activeTransforms.get(msgId)}
        <div class="msg" class:msg-active={$activeMessageId === msgId} data-msg-id={msgId} onmouseenter={() => onRowFocus(msg)}>
          <MessageFrame message={logosMsg} onInspect={onInspect} active={$activeMessageId === msgId} />
          {#if inspecting?.id === msgId}
            <InspectorBlade message={inspecting} open={true} onClose={closeInspector} />
          {/if}
          {#if showClarify && clarifyQ}
            <ClarificationPrompt question={clarifyQ} onAsk={(q) => handleClarifyAsk(msgId, q)} onDismiss={() => dismissClarification(msgId)} />
          {/if}
          {#if hasTransform && tform}
            <ResultStrip result={tform.loading ? "…" : tform.content} op={tform.op} model={tform.model} messageId={msgId} onApply={applyTransform} onUseAsDraft={useTransformAsDraft} onDismiss={dismissTransform} />
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  {#if companionSuggestion}
    <div class="suggest-box">
      <div class="suggest-label">Companion suggestion</div>
      <div class="suggest-text">{companionSuggestion.content}</div>
      {#if companionSuggestion.memoryPreview.length > 0}
        <div class="suggest-memory">
          <span class="suggest-memory-label">MEMORY CITATIONS</span>
          {#each companionSuggestion.memoryPreview as mem}
            <span class="suggest-memory-node">#NODE-{mem.id.slice(0, 8)} ({mem.score?.toFixed(3) ?? "--"})</span>
          {/each}
        </div>
      {/if}
      {#if companionSuggestion.followups.length > 0}
        <div class="suggest-followups">
          <span class="suggest-followups-label">FOLLOW-UPS</span>
          {#each companionSuggestion.followups as fup}
            <button
              class="chip chip-followup"
              onclick={() => {
                composerText = fup;
                dismissCompanionSuggestion();
                composerRef?.focus();
              }}>{fup}</button>
          {/each}
        </div>
      {/if}
      <div class="suggest-actions">
        <button class="btn btn-ghost" onclick={dismissCompanionSuggestion}>Dismiss</button>
        <button class="btn btn-primary" onclick={applyCompanionSuggestion}>Use</button>
      </div>
    </div>
  {/if}

  {#if snapshot.status === "ready" && snapshot.activeChannelId}
    <div class="composer-dock">
      <div class="composer-context">
        {#if snapshot.workspaces.length > 0}
          <select class="select" value={snapshot.activeWorkspaceId ?? ""} onchange={onWsChange} aria-label="Workspace">
            {#each snapshot.workspaces as ws (ws.id)}<option value={ws.id}>{ws.name}</option>{/each}
          </select>
        {/if}
        <div class="channels">
          {#each snapshot.channels as ch (ch.id)}
            <button class="chip" class:chip-active={ch.id === snapshot.activeChannelId} onclick={() => onChannelClick(ch)}># {ch.name}</button>
          {/each}
        </div>
      </div>
      <div class="composer">
        <textarea bind:this={composerRef} bind:value={composerText} class="composer-input" placeholder="Type a message…" rows={2} onkeydown={onKeyDown}></textarea>
        <div class="composer-actions">
          <button class="btn btn-ghost" onclick={handleSuggestReply} disabled={!composerText.trim()}>Suggest</button>
          <button class="btn btn-primary btn-send" onclick={onSubmit} disabled={!composerText.trim()}>Send</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<svelte:window on:logos-transform={handleBubbledTransform} on:logos-memory={handleBubbledMemory} />

<style>
  .chat { display: flex; flex-direction: column; height: 100%; min-width: 0; background: var(--bg); }
  .chat-top { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--line); }
  .chat-title { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
  .chat-sub { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chat-right { margin-left: auto; }
  .pill { font-size: 11px; padding: 4px 10px; border-radius: var(--radius-pill); border: 1px solid var(--line-strong); color: var(--muted); }
  .pill-ok { color: var(--accent-verified); border-color: var(--accent-verified); }
  .pill-err { color: var(--accent-intent); border-color: var(--accent-intent); }
  .chat-notice { padding: 8px 18px; font-size: 12px; color: var(--accent-intent); background: var(--panel-2); border-bottom: 1px solid var(--line); }
  .chat-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 18px 8px; display: flex; flex-direction: column; gap: 6px; outline: none; }
  .chat-state { padding: 32px 12px; text-align: center; color: var(--muted); font-size: 14px; }
  .chat-state-err { color: var(--accent-intent); }
  .chat-hint { margin-top: 8px; font-size: 12px; color: var(--muted-2); }
  .history-row { display: flex; justify-content: center; padding: 4px 0 10px; }
  .history-btn { font-size: 12px; padding: 6px 14px; border-radius: var(--radius-pill); border: 1px solid var(--line-strong); background: var(--panel); color: var(--text); cursor: pointer; }
  .history-btn:hover { background: var(--hover-strong); }
  .msg { border-radius: var(--radius-lg); transition: background var(--motion-fast); }
  .msg:hover { background: var(--hover); }
  .msg-active { background: var(--hover-strong); }
  .msg-old { opacity: 0.72; }
  .suggest-box { margin: 0 18px 8px; padding: 12px 14px; border: 1px solid var(--line-strong); border-left: 2px solid var(--accent-thread); background: var(--panel-2); }
  .suggest-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-thread); margin-bottom: 6px; }
  .suggest-text { font-size: 13px; color: var(--text); margin-bottom: 10px; }
  .suggest-memory { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; margin-bottom: 8px; padding: 8px 10px; border: 1px solid var(--line); background: var(--panel); }
  .suggest-memory-label { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; color: var(--muted-2); }
  .suggest-memory-node { font-family: var(--font-mono); font-size: 9px; color: var(--accent-thread); }
  .suggest-followups { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; margin-bottom: 10px; }
  .suggest-followups-label { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; color: var(--muted-2); }
  .chip-followup { font-size: 11px; padding: 4px 10px; border: 1px solid var(--line-strong); background: transparent; color: var(--accent-thread); cursor: pointer; font-family: var(--font-body); }
  .chip-followup:hover { background: var(--hover-strong); color: var(--text-strong); border-color: var(--accent-thread); }
  .suggest-actions { display: flex; gap: 8px; }
  .composer-dock { padding: 12px 18px 16px; border-top: 1px solid var(--line); background: var(--bg); }
  .composer-context { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
  .select { background: var(--panel); color: var(--text); border: 1px solid var(--line-strong); border-radius: var(--radius); padding: 7px 10px; font-size: 13px; }
  .channels { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { font-size: 12px; padding: 5px 10px; border-radius: var(--radius-pill); border: 1px solid var(--line-strong); background: transparent; color: var(--muted); cursor: pointer; }
  .chip:hover { color: var(--text); }
  .chip-active { background: var(--panel); color: var(--text-strong); border-color: var(--accent-thread); }
  .composer { display: flex; gap: 10px; align-items: flex-end; }
  .composer-input { flex: 1; min-height: 52px; max-height: 160px; resize: vertical; padding: 14px 16px; border-radius: var(--radius-lg); border: 1px solid var(--line-strong); background: var(--panel); color: var(--text-strong); font-size: 15px; line-height: 1.5; }
  .composer-input:focus { outline: none; border-color: var(--accent-thread); }
  .composer-input::placeholder { color: var(--muted-2); }
  .composer-actions { display: flex; gap: 8px; }
  .btn { font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: var(--radius); border: 1px solid var(--line-strong); cursor: pointer; transition: all var(--motion-fast); }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: var(--text); }
  .btn-ghost:hover:not(:disabled) { background: var(--hover); }
  .btn-primary { background: var(--panel-raised); color: var(--text-strong); border-color: var(--accent-thread); }
  .btn-primary:hover:not(:disabled) { background: var(--hover-strong); }
  .btn-send { min-width: 88px; }
  @media (max-width: 640px) {
    .chat-top { padding: 12px 14px; }
    .chat-scroll { padding: 12px 12px 6px; }
    .composer-dock { padding: 10px 12px 14px; }
    .composer { flex-direction: column; }
    .composer-actions { width: 100%; }
    .composer-actions .btn { flex: 1; }
  }
</style>