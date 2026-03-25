import { RuntimeStateSchema, type RuntimeState, type StateUpdate } from "./schemas";
import { enforceGuardrails } from "./validators";

export function applyStateUpdate(previous: RuntimeState, update: StateUpdate): RuntimeState {
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
  };

  for (const rel of update.npcRelationshipDeltas) {
    const current = next.npcRelationships[rel.npcId] ?? 0;
    next.npcRelationships[rel.npcId] = Math.max(-10, Math.min(10, current + rel.delta));
  }

  for (const q of update.questStageUpdates) {
    next.questStages[q.questId] = q.newStage;
  }

  const parsed = RuntimeStateSchema.parse(next);
  return enforceGuardrails({ previous, next: parsed, update });
}

