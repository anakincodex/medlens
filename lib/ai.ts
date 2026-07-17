// ============================================================
// MedLens AI — AI Client
// Shared provider adapter for model calls.
// Prefers Groq when configured, with Gemini kept as a fallback.
// ============================================================

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function stripCodeFences(text: string): string {
  if (!text.startsWith("```")) return text.trim();

  let cleaned = text.replace(/^```/, "").replace(/```$/, "");
  if (cleaned.startsWith("json")) {
    cleaned = cleaned.slice(4);
  }

  return cleaned.trim();
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error(JSON.stringify(result));
  }

  return stripCodeFences(text);
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not found in environment variables");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const result = await response.json();

  const text: string | undefined = result?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error(JSON.stringify(result));
  }

  return stripCodeFences(text);
}

/**
 * Calls the configured AI provider.
 * Groq is preferred when GROQ_API_KEY is present; Gemini remains
 * available as a fallback.
 */
export async function callAI(prompt: string): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    try {
      return await callGroq(prompt);
    } catch (err) {
      if (!process.env.GEMINI_API_KEY) {
        throw err;
      }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(prompt);
    } catch {
      // Fall through to the next configured provider.
    }
  }

  throw new Error("No AI provider key found. Set GROQ_API_KEY or GEMINI_API_KEY.");
}

/**
 * Calls the AI and parses the response as JSON, retrying once on
 * JSON parse failure (mirrors the 2-attempt retry loop in /process).
 */
export async function callAIForJSON<T = unknown>(
  prompt: string,
  attempts = 2
): Promise<{ parsed: T | null; raw: string | null }> {
  let raw: string | null = null;

  for (let i = 0; i < attempts; i++) {
    raw = await callAI(prompt);
    try {
      const parsed = JSON.parse(raw) as T;
      return { parsed, raw };
    } catch {
      continue;
    }
  }

  return { parsed: null, raw };
}
