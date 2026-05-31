import { logger } from "../utils/logger";
import { getGeminiClient as getSharedGeminiClient, resetAIClients } from "./aiClients";

// Gemini model IDs — updated May 2026
// Primary & Fallback: gemini-3.5-flash — frontier Flash model for agentic and coding tasks
const GEMINI_PRO_MODEL = "gemini-3.5-flash";
const GEMINI_FLASH_MODEL = "gemini-3.5-flash";

export const getGeminiClient = () => getSharedGeminiClient();

/**
 * Generate content using Gemini 2.5 Pro (primary) with automatic fallback
 * to Gemini 2.0 Flash if the Pro model is unavailable.
 */
export async function generateContentWithGemini(
  prompt: string,
  opts: { fast?: boolean; maxOutputTokens?: number } = {}
): Promise<string> {
  const model = opts.fast ? GEMINI_FLASH_MODEL : GEMINI_PRO_MODEL;
  const maxOutputTokens = opts.maxOutputTokens ?? 2000;

  try {
    const client = getSharedGeminiClient();
    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: { maxOutputTokens },
    });
    return response.text || "";
  } catch (error) {
    // Graceful fallback to Flash if Pro fails
    if (model === GEMINI_PRO_MODEL) {
      logger.warn("Gemini 3.1 Pro failed, falling back to Gemini 3.1 Flash-Lite", { error });
      try {
        const client = getSharedGeminiClient();
        const response = await client.models.generateContent({
          model: GEMINI_FLASH_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { maxOutputTokens },
        });
        return response.text || "";
      } catch (fallbackError) {
        logger.error("Gemini fallback also failed", { fallbackError });
        throw new Error("Failed to generate content with Gemini (both Pro and Flash-Lite unavailable)");
      }
    }
    logger.error("Error generating content with Gemini:", error);
    throw new Error("Failed to generate content with Gemini");
  }
}

export { GEMINI_PRO_MODEL, GEMINI_FLASH_MODEL };

export function resetGeminiClient(): void {
  resetAIClients();
}
