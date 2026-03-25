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
    npcRelationships,
  };
}

