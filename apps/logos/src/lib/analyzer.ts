/**
 * PROJECT LOGOS — Message Analysis Cache & Concurrency Limiter
 *
 * Module-level singleton cache for POST /analyze results.
 * Ensures each message is analyzed at most once, caps in-flight
 * requests at MAX_CONCURRENT, and marks failures so they
 * never retry. Degrades gracefully — callers check getCachedAnalysis()
 * and render "--" when analysis is pending or failed.
 */

import { analyze, type AnalysisResult } from "./cognition";

// ── Module-level state ──

/** messageId → AnalysisResult (or null = failed). Absent = not yet attempted. */
const cache = new Map<string, AnalysisResult | null>();

/** Messages currently waiting for or in-flight. */
const pending = new Set<string>();

/** Current number of in-flight POST /analyze calls. */
let inflight = 0;

/** Maximum concurrent analysis calls. */
const MAX_CONCURRENT = 3;

// ── Public API ──

/**
 * Synchronous cache lookup. Returns:
 *   AnalysisResult  — analysis completed successfully
 *   null            — analysis failed (do not retry)
 *   undefined       — not yet attempted
 */
export function getCachedAnalysis(
  messageId: string,
): AnalysisResult | null | undefined {
  return cache.get(messageId);
}

/** True if this message has been analyzed (success or failure). */
export function isAnalysisDone(messageId: string): boolean {
  return cache.has(messageId);
}

/** True if analysis failed for this message id. */
export function isAnalysisFailed(messageId: string): boolean {
  return cache.has(messageId) && cache.get(messageId) === null;
}

/**
 * Fire-and-forget analysis trigger. If the message hasn't been analyzed
 * yet and isn't already pending, enqueue it with concurrency control.
 * Returns the existing cached result or null; callers should poll
 * getCachedAnalysis() to pick up the result later.
 */
export async function analyzeMessage(
  messageId: string,
  content: string,
): Promise<AnalysisResult | null> {
  // Already done — return cached
  if (cache.has(messageId)) return cache.get(messageId) ?? null;

  // Already queued — don't duplicate
  if (pending.has(messageId)) return null;

  pending.add(messageId);

  // Concurrency gate: wait for a slot
  while (inflight >= MAX_CONCURRENT) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  inflight++;
  try {
    const result = await analyze(content);
    cache.set(messageId, result);
    return result;
  } catch {
    cache.set(messageId, null); // mark failed — never retry
    return null;
  } finally {
    inflight--;
    pending.delete(messageId);
  }
}
