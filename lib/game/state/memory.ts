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

export function buildContextBundle(params: {
  state: RuntimeState;
  recentTurns: Array<{ role: "player" | "dm"; content: string }>;
  pinnedFacts: string[];
  compactFacts: string[];
}) {
  return {
    state: buildCompactStateForContext(params.state),
    pinnedFacts: params.pinnedFacts.slice(0, 25),
    compactFacts: params.compactFacts.slice(0, 25),
    recentTurns: selectRecentTurnsForContext(params.recentTurns, 10),
  };
}

