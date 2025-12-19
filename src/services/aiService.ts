import OpenAI from 'openai';
import { getApiKey } from '../utils/apiKeyStorage';
import type { GraphData } from '../components/Graph/types';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new AIServiceError('API key not found. Please add your API key in settings.');
      }

      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }

    return this.client;
  }

  async generateChatResponse(
    messages: ChatMessage[],
    graphData: GraphData
  ): Promise<string> {
    try {
      const client = this.getClient();

      const systemPrompt = `You are analyzing a knowledge graph with the following data:
Nodes: ${JSON.stringify(graphData.nodes)}
Links: ${JSON.stringify(graphData.links)}

Provide concise, specific answers about the relationships and patterns in this graph.
Use markdown formatting for better readability:
- Use bullet points for lists
- Use **bold** for emphasis
- Use \`code\` for entity names
- Use > for important insights
- Use tables when comparing multiple items`;

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.5,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError('No response content received from AI');
      }

      return content;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new AIServiceError(`Failed to generate response: ${error.message}`, error);
      }

      throw new AIServiceError('An unknown error occurred while generating response', error);
    }
  }

  resetClient(): void {
    this.client = null;
  }
}

export const aiService = new AIService();
