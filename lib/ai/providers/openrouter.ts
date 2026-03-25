import type { AiProvider, GenerateTextParams, GenerateTextResult } from "../provider";

type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class OpenRouterProvider implements AiProvider {
  private apiKey: string;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    const apiKey = opts?.apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY");
    }
    this.apiKey = apiKey;
    this.model = opts?.model ?? process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-lite";
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: params.messages as OpenRouterChatMessage[],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxOutputTokens ?? 800,
        response_format: params.jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as any;
    const text = json?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new Error("OpenRouter response missing message content");
    }
    return { text, raw: json };
  }
}

