import { prisma } from "./prisma.js";

const KEYS = {
  GOOGLE_AI_API_KEY: "google_ai_api_key",
  GOOGLE_AI_MODEL: "google_ai_model",
} as const;

export async function getConfig(key: string): Promise<string | null> {
  const row = await prisma.config.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  await prisma.config.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getAIConfig(): Promise<{ apiKey: string | null; model: string }> {
  const apiKey =
    (await getConfig(KEYS.GOOGLE_AI_API_KEY)) ??
    process.env.GOOGLE_AI_API_KEY ??
    null;
  const model =
    (await getConfig(KEYS.GOOGLE_AI_MODEL)) ??
    process.env.GOOGLE_AI_MODEL ??
    "gemini-2.0-flash";
  return { apiKey, model };
}

export async function setAIConfig(data: { apiKey?: string; model?: string }): Promise<void> {
  if (data.apiKey !== undefined) await setConfig(KEYS.GOOGLE_AI_API_KEY, data.apiKey);
  if (data.model !== undefined) await setConfig(KEYS.GOOGLE_AI_MODEL, data.model);
}
