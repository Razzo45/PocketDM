import type { RuntimeState, StateUpdate } from "./schemas";

export function enforceGuardrails(params: {
  previous: RuntimeState;
  next: RuntimeState;
  update: StateUpdate;
}): RuntimeState {
  const { previous, next } = params;

  // Hard rule: never drop existing lore/inventory entries implicitly.
  const inventory = Array.from(new Set([...previous.inventory, ...next.inventory]));
  const discoveredLore = Array.from(new Set([...previous.discoveredLore, ...next.discoveredLore]));
  const pinnedFacts = Array.from(new Set([...previous.pinnedFacts, ...next.pinnedFacts]));
  const commitments = Array.from(new Set([...previous.commitments, ...next.commitments]));

  // Clamp relationships and reject NaN.
  const npcRelationships: Record<string, number> = {};
  for (const [npcId, value] of Object.entries(next.npcRelationships)) {
    const n = Number.isFinite(value) ? value : 0;
    npcRelationships[npcId] = Math.max(-10, Math.min(10, Math.trunc(n)));
  }

  return {
    ...next,
    inventory,
    discoveredLore,
    pinnedFacts,
    commitments,
    npcRelationships,
  };
}

