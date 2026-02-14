import crypto from "crypto";
import { documentAnalysisService, type RAGContext } from "./documentAnalysis";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { aiGuardrailsService } from "./aiGuardrailsService";
import { getOpenAIClient, getAnthropicClient } from "./aiClients";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userId: string;
  metadata?: {
    framework?: string;
    documentRefs?: string[];
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  framework?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatResponse {
  content: string;
  confidence: number;
  sources: string[];
  suggestions: string[];
  followUpQuestions: string[];
}

/**
 * AI-powered compliance chatbot with RAG capabilities
 */
export class ComplianceChatbot {
  private readonly sessionHistory = new Map<string, ChatMessage[]>();
  
  /**
   * Process user message and generate intelligent response
   * Includes AI guardrails for prompt shields and output moderation
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId?: string,
    framework?: string,
    organizationId?: string,
  ): Promise<ChatResponse> {
    const requestId = crypto.randomUUID();
    
    try {
      // Pre-check guardrails on user input
      const inputCheck = await aiGuardrailsService.checkGuardrails(message, null, {
        requestId,
        modelProvider: 'multi-model',
        modelName: 'chat-assistant',
        userId,
        ipAddress: undefined,
      });

      if (!inputCheck.allowed) {
        logger.warn('Guardrails blocked chat message', { 
          requestId, 
          action: inputCheck.action,
          severity: inputCheck.severity 
        });
        return {
          content: "I'm unable to process this request. Please rephrase your question to focus on compliance-related topics.",
          confidence: 0,
          sources: [],
          suggestions: ["Ask about compliance frameworks", "Request document guidance", "Inquire about security controls"],
          followUpQuestions: [],
        };
      }

      // Use sanitized message if PII was redacted
      const sanitizedMessage = inputCheck.sanitizedPrompt || message;

      // Get user's documents for RAG context
      const userDocs = await this.getUserDocumentContext(userId, organizationId);
      
      // Get chat history for context
      const chatHistory = sessionId ? await this.getChatHistory(sessionId) : [];
      
      // Search for relevant document content
      const relevantDocs = await documentAnalysisService.searchSimilarContent(
        sanitizedMessage,
        userDocs,
        3
      );

      // Generate response using multi-model approach
      const response = await this.generateIntelligentResponse(
        sanitizedMessage,
        chatHistory,
        relevantDocs,
        framework
      );

      // Post-check guardrails on AI output
      const outputCheck = await aiGuardrailsService.checkGuardrails(sanitizedMessage, response.content, {
        requestId,
        modelProvider: 'multi-model',
        modelName: 'chat-assistant',
        userId,
      });

      // Use sanitized response if needed
      if (outputCheck.sanitizedResponse) {
        response.content = outputCheck.sanitizedResponse;
      }

      if (!outputCheck.allowed && outputCheck.action === 'blocked') {
        return {
          content: "I apologize, but I cannot provide that specific information. Please ask a different question.",
          confidence: 0,
          sources: [],
          suggestions: ["Ask about compliance frameworks", "Request document guidance"],
          followUpQuestions: [],
        };
      }

      if (sessionId) {
        const now = new Date();
        this.appendToChatHistory(sessionId, {
          id: crypto.randomUUID(),
          role: 'user',
          content: sanitizedMessage,
          timestamp: now,
          userId,
          metadata: { framework },
        });
        this.appendToChatHistory(sessionId, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          userId,
          metadata: {
            framework,
            documentRefs: response.sources,
            confidence: response.confidence,
          },
        });
      }

      return response;
    } catch (error) {
      logger.error("Chatbot processing failed:", error);
      throw new Error("Failed to process message");
    }
  }

  /**
   * Generate intelligent response using RAG and chat history
   */
  private async generateIntelligentResponse(
    message: string,
    history: ChatMessage[],
    relevantDocs: RAGContext[],
    framework?: string
  ): Promise<ChatResponse> {
    const contextText = relevantDocs
      .map(doc => `[${doc.metadata.filename}]: ${doc.content.substring(0, 500)}...`)
      .join('\n\n');

    const historyText = history
      .slice(-6) // Last 3 exchanges
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are a specialized cybersecurity compliance assistant with expertise in ${framework || 'multiple frameworks'} including ISO 27001, SOC 2, FedRAMP, and NIST 800-53.

Your role is to:
1. Provide accurate, actionable compliance guidance
2. Reference specific documents when available
3. Suggest practical implementation steps
4. Identify compliance gaps and risks
5. Recommend best practices

Guidelines:
- Be concise but comprehensive
- Always cite document sources when referencing them
- Provide specific, actionable advice
- Highlight any compliance risks or gaps
- Suggest follow-up questions for deeper exploration

Available Documents:
${contextText}

Recent Conversation:
${historyText}`;

    const userPrompt = `User Question: ${message}

Please provide a helpful response that:
1. Answers the specific question
2. References relevant documents if applicable
3. Provides actionable next steps
4. Suggests 2-3 related follow-up questions
5. Indicates confidence level in the response

Format your response as JSON with:
- content: Main response text
- confidence: Number 0-100 indicating response confidence
- sources: Array of document filenames referenced
- suggestions: Array of actionable recommendations
- followUpQuestions: Array of 2-3 related questions`;

    try {
      // Use Anthropic for complex reasoning and analysis
      const response = await getAnthropicClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
        ]
      });

      const responseText = (response.content[0] as any).text;
      
      // Try to parse JSON response
      try {
        return JSON.parse(responseText);
      } catch {
        // Fallback to structured parsing
        return this.parseResponseText(responseText, relevantDocs);
      }
    } catch (error) {
      logger.error("Response generation failed:", error);
      
      // Fallback to OpenAI
      return this.generateFallbackResponse(message, relevantDocs, framework);
    }
  }

  /**
   * Fallback response generation using OpenAI
   */
  private async generateFallbackResponse(
    message: string,
    relevantDocs: RAGContext[],
    framework?: string
  ): Promise<ChatResponse> {
    const contextText = relevantDocs
      .map(doc => `${doc.metadata.filename}: ${doc.content.substring(0, 300)}`)
      .join('\n\n');

    const prompt = `As a compliance expert, answer this question: ${message}

Available context:
${contextText}

Framework: ${framework || 'General compliance'}

Provide a helpful, actionable response.`;

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000
      });

      const content = response.choices[0].message.content || "I apologize, but I couldn't generate a response at this time.";

      return {
        content,
        confidence: 70,
        sources: relevantDocs.map(doc => doc.metadata.filename),
        suggestions: ["Review your current compliance documentation", "Consider updating your policies"],
        followUpQuestions: ["What specific compliance areas need attention?", "How can I improve my security posture?"]
      };
    } catch (error) {
      logger.error("Fallback response failed:", error);
      throw new Error("Failed to generate response");
    }
  }

  /**
   * Get user's document context for RAG
   */
  private async getUserDocumentContext(userId: string, organizationId?: string): Promise<RAGContext[]> {
    try {
      // Scope by organization when possible, then narrow to user-owned documents.
      const userDocs = await storage.getDocuments(organizationId);
      const filteredDocs = userDocs.filter((doc: any) =>
        doc.createdBy === userId || doc.userId === userId
      );
      
      return filteredDocs.map((doc: any) => ({
        documentId: doc.id.toString(),
        content: doc.content || '',
        metadata: {
          type: doc.documentType || doc.type,
          framework: doc.framework || '',
          uploadDate: doc.createdAt
            ? new Date(doc.createdAt).toISOString()
            : new Date().toISOString(),
          filename: doc.title
        }
      }));
    } catch (error) {
      logger.error("Failed to get user document context:", error);
      return [];
    }
  }

  /**
   * Get chat history for context
   */
  private async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.sessionHistory.get(sessionId) || [];
  }

  private appendToChatHistory(sessionId: string, message: ChatMessage): void {
    const current = this.sessionHistory.get(sessionId) || [];
    current.push(message);
    // Keep latest 20 messages for context window and memory control.
    this.sessionHistory.set(sessionId, current.slice(-20));
  }

  /**
   * Parse response text when JSON parsing fails
   */
  private parseResponseText(text: string, relevantDocs: RAGContext[]): ChatResponse {
    return {
      content: text,
      confidence: 80,
      sources: relevantDocs.map(doc => doc.metadata.filename),
      suggestions: ["Consider reviewing related documentation", "Implement recommended controls"],
      followUpQuestions: ["What are the next steps?", "How can I verify compliance?"]
    };
  }

  /**
   * Generate conversation title from first message
   */
  async generateConversationTitle(firstMessage: string): Promise<string> {
    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `Generate a concise title (3-6 words) for a compliance conversation that starts with: "${firstMessage}"`
        }],
        max_tokens: 20
      });

      return response.choices[0].message.content?.trim() || "Compliance Discussion";
    } catch {
      return "Compliance Discussion";
    }
  }

  /**
   * Suggest initial questions for new users
   */
  getSuggestedQuestions(framework?: string): string[] {
    const baseQuestions = [
      "What are the key requirements for my industry?",
      "How do I start implementing security controls?",
      "What documentation do I need for compliance?",
      "How can I assess my current security posture?"
    ];

    const frameworkQuestions: Record<string, string[]> = {
      'iso27001': [
        "What are the mandatory ISO 27001 controls?",
        "How do I conduct a risk assessment?",
        "What is required for the Statement of Applicability?"
      ],
      'soc2': [
        "What are the SOC 2 Trust Service Criteria?",
        "How do I prepare for a SOC 2 audit?",
        "What evidence do auditors need to see?"
      ],
      'fedramp': [
        "What are FedRAMP security control baselines?",
        "How do I achieve FedRAMP authorization?",
        "What documentation is required for FedRAMP?"
      ],
      'nist': [
        "How do I implement NIST Cybersecurity Framework?",
        "What are the NIST 800-53 control families?",
        "How do I conduct a NIST compliance assessment?"
      ]
    };

    if (!framework) {
      return baseQuestions;
    }

    const frameworkQuestionMap = new Map<string, string[]>(Object.entries(frameworkQuestions));
    return frameworkQuestionMap.get(framework) || baseQuestions;
  }
}

export const complianceChatbot = new ComplianceChatbot();
