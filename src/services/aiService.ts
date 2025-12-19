import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getActiveConfiguration } from '../lib/configManager';
import { getApiKey } from '../lib/apiKeyManager';
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

interface ProviderClients {
  openai: OpenAI | null;
  anthropic: Anthropic | null;
}

export class AIService {
  private clients: ProviderClients = {
    openai: null,
    anthropic: null
  };

  private async getOpenAIClient(apiKey: string): Promise<OpenAI> {
    if (!this.clients.openai) {
      this.clients.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    return this.clients.openai;
  }

  private async getAnthropicClient(apiKey: string): Promise<Anthropic> {
    if (!this.clients.anthropic) {
      this.clients.anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    return this.clients.anthropic;
  }

  async generateChatResponse(
    messages: ChatMessage[],
    graphData: GraphData
  ): Promise<string> {
    try {
      const { data: config, error: configError } = await getActiveConfiguration();

      if (configError || !config) {
        throw new AIServiceError('Failed to load model configuration. Please check your settings.');
      }

      const chatConfig = config.chat_config;
      const provider = chatConfig.provider.toLowerCase();
      const model = chatConfig.model;

      const { data: keyData, error: keyError } = await getApiKey(provider);

      if (keyError || !keyData) {
        throw new AIServiceError(`API key not found for ${provider}. Please add your API key in settings.`);
      }

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

      if (provider === 'openai') {
        return await this.generateOpenAIResponse(
          keyData.decrypted_key,
          model,
          messages,
          systemPrompt
        );
      } else if (provider === 'anthropic') {
        return await this.generateAnthropicResponse(
          keyData.decrypted_key,
          model,
          messages,
          systemPrompt
        );
      } else {
        throw new AIServiceError(`Provider ${provider} is not supported for chat yet.`);
      }
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

  private async generateOpenAIResponse(
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    const client = await this.getOpenAIClient(apiKey);

    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const response = await client.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.5,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AIServiceError('No response content received from OpenAI');
    }

    return content;
  }

  private async generateAnthropicResponse(
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    const client = await this.getAnthropicClient(apiKey);

    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const response = await client.messages.create({
      model,
      max_tokens: 4000,
      temperature: 0.5,
      system: systemPrompt,
      messages: formattedMessages
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new AIServiceError('Unexpected response type from Anthropic');
    }

    return content.text;
  }

  resetClient(): void {
    this.clients = {
      openai: null,
      anthropic: null
    };
  }
}

export const aiService = new AIService();
