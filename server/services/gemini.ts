import { logger } from "../utils/logger";
import { getGeminiClient as getSharedGeminiClient, resetAIClients } from "./aiClients";

export const getGeminiClient = () => getSharedGeminiClient();

export async function generateContentWithGemini(prompt: string): Promise<string> {
  try {
    const client = getSharedGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        maxOutputTokens: 2000,
      },
    });
    const text = response.text || "";
    return text;
  } catch (error) {
    logger.error("Error generating content with Gemini:", error);
    throw new Error("Failed to generate content with Gemini");
  }
}

export function resetGeminiClient(): void {
  resetAIClients();
}
