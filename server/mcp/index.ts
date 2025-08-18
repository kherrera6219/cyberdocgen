import { OperationsAgent } from "./agent";
import { OpenAIModule } from "./modules/openai";
import { ClaudeModule } from "./modules/claude";
import { GeminiModule } from "./modules/gemini";

export async function createOperationsAgent(): Promise<OperationsAgent> {
  const agent = new OperationsAgent();
  await agent.registerModule(new OpenAIModule());
  await agent.registerModule(new ClaudeModule());
  await agent.registerModule(new GeminiModule());
  return agent;
}
