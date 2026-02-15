import { logger } from "../utils/logger";

export type PromptTemplateKey =
  | "document_generation"
  | "content_generation"
  | "chat_assistant"
  | "export_generation"
  | "mcp_agent";

export interface PromptTemplateDefinition {
  key: PromptTemplateKey;
  version: string;
  template: string;
  updatedAt: string;
}

export interface RenderedPromptTemplate {
  key: PromptTemplateKey;
  version: string;
  prompt: string;
}

const PROMPT_TEMPLATES: Record<PromptTemplateKey, PromptTemplateDefinition> = {
  document_generation: {
    key: "document_generation",
    version: "1.0.0",
    updatedAt: "2026-02-15",
    template:
      "[template=document_generation@1.0.0] Generate {documentTitle} for framework {framework} and company {companyName}.",
  },
  content_generation: {
    key: "content_generation",
    version: "1.0.0",
    updatedAt: "2026-02-15",
    template: "[template=content_generation@1.0.0] Task: {taskSummary}",
  },
  chat_assistant: {
    key: "chat_assistant",
    version: "1.0.0",
    updatedAt: "2026-02-15",
    template: "[template=chat_assistant@1.0.0] Framework={framework}; UserMessage={userMessage}",
  },
  export_generation: {
    key: "export_generation",
    version: "1.0.0",
    updatedAt: "2026-02-15",
    template: "[template=export_generation@1.0.0] Generate {documentType} for framework {framework}.",
  },
  mcp_agent: {
    key: "mcp_agent",
    version: "1.0.0",
    updatedAt: "2026-02-15",
    template: "[template=mcp_agent@1.0.0] Agent={agentId}; Prompt={prompt}",
  },
};

class PromptTemplateRegistry {
  getTemplate(key: PromptTemplateKey): PromptTemplateDefinition {
    switch (key) {
      case "document_generation":
        return PROMPT_TEMPLATES.document_generation;
      case "content_generation":
        return PROMPT_TEMPLATES.content_generation;
      case "chat_assistant":
        return PROMPT_TEMPLATES.chat_assistant;
      case "export_generation":
        return PROMPT_TEMPLATES.export_generation;
      case "mcp_agent":
        return PROMPT_TEMPLATES.mcp_agent;
      default: {
        const exhaustiveCheck: never = key;
        throw new Error(`Unsupported prompt template key: ${exhaustiveCheck}`);
      }
    }
  }

  listTemplates(): PromptTemplateDefinition[] {
    return Object.values(PROMPT_TEMPLATES);
  }

  renderTemplate(
    key: PromptTemplateKey,
    variables: Record<string, string | number | boolean | null | undefined>
  ): RenderedPromptTemplate {
    const definition = this.getTemplate(key);
    let rendered = definition.template;

    for (const [name, value] of Object.entries(variables)) {
      const normalizedValue = value === null || value === undefined ? "" : String(value);
      const placeholder = `{${name}}`;
      if (rendered.includes(placeholder)) {
        rendered = rendered.split(placeholder).join(normalizedValue);
      }
    }

    // Strip unresolved placeholders so they do not leak template internals.
    rendered = rendered.replace(/\{[a-zA-Z0-9_]+\}/g, "");

    logger.debug("Rendered prompt template", { key, version: definition.version });
    return {
      key,
      version: definition.version,
      prompt: rendered,
    };
  }
}

export const promptTemplateRegistry = new PromptTemplateRegistry();
