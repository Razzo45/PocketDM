import { RuntimeStateSchema, type RuntimeState, type StateUpdate } from "./schemas";
import { enforceGuardrails } from "./validators";

export function applyStateUpdate(
  previous: RuntimeState,
  update: StateUpdate,
  opts?: { rollResult?: { value: number; reason: string }; resolvedPromptKey?: string; turnNumber?: number },
): RuntimeState {
  const next: RuntimeState = {
    ...previous,
    currentLocationId: update.currentLocationId ?? previous.currentLocationId,
    currentSceneId: update.currentSceneId ?? previous.currentSceneId,
    discoveredLore: [...previous.discoveredLore, ...update.discoveredLoreAdditions],
    inventory: [
      ...previous.inventory,
      ...update.inventoryAdd.filter((x) => !previous.inventory.includes(x)),
    ].filter((x) => !update.inventoryRemove.includes(x)),
    npcRelationships: { ...previous.npcRelationships },
    questStages: { ...previous.questStages },
    pinnedFacts: [...previous.pinnedFacts],
    commitments: [...previous.commitments],
    resolvedRollPromptKeys: [...previous.resolvedRollPromptKeys],
  };

  for (const rel of update.npcRelationshipDeltas) {
    const current = next.npcRelationships[rel.npcId] ?? 0;
    next.npcRelationships[rel.npcId] = Math.max(-10, Math.min(10, current + rel.delta));
  }

  for (const q of update.questStageUpdates) {
    const prevStage = next.questStages[q.questId];
    const prevCompleted = typeof prevStage === "string" && prevStage.toLowerCase().includes("complete");
    const nextCompleted = q.newStage.toLowerCase().includes("complete");
    if (prevCompleted && !nextCompleted) continue;
    next.questStages[q.questId] = q.newStage;
  }

  for (const fact of update.commitmentFacts) {
    if (!next.commitments.includes(fact)) {
      next.commitments.push(fact);
      next.pinnedFacts.push(fact);
    }
  }

  if (opts?.resolvedPromptKey && !next.resolvedRollPromptKeys.includes(opts.resolvedPromptKey)) {
    next.resolvedRollPromptKeys.push(opts.resolvedPromptKey);
  }

  if (opts?.rollResult) {
    next.lastRoll = {
      type: "d20",
      value: opts.rollResult.value,
      reason: opts.rollResult.reason,
      turnNumber: opts.turnNumber ?? 0,
    };
  }

  const parsed = RuntimeStateSchema.parse(next);
  return enforceGuardrails({ previous, next: parsed, update });
}

