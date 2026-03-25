export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type GenerateTextParams = {
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
};

export type GenerateTextResult = {
  text: string;
  raw?: unknown;
};

export interface AiProvider {
  generateText(params: GenerateTextParams): Promise<GenerateTextResult>;
}

