import type { RuntimeState } from "./schemas";

export function selectRecentTurnsForContext<T extends { role: string; content: string }>(
  turns: T[],
  maxTurns: number,
): T[] {
  if (turns.length <= maxTurns) return turns;
  return turns.slice(-maxTurns);
}

export function buildCompactStateForContext(state: RuntimeState): RuntimeState {
  // Keep it small; avoid sending huge arrays to the model.
  return {
    ...state,
    inventory: state.inventory.slice(-20),
    discoveredLore: state.discoveredLore.slice(-20),
  };
}

