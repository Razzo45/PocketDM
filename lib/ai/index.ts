import type { AiProvider } from "./provider";
import { OpenRouterProvider } from "./providers/openrouter";

export function getAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER ?? "openrouter").toLowerCase();

  switch (provider) {
    case "openrouter":
      return new OpenRouterProvider();
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }
}

