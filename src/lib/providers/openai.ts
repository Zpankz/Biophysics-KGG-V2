import OpenAI from 'openai';
import type {
  ProviderAdapter,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamChunk,
} from './types';

export class OpenAIAdapter implements ProviderAdapter {
  name = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(config: ProviderConfig, model: string) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = model;
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    const messages: any[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    messages.push({ role: 'user', content: request.prompt });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4000,
    });

    return {
      text: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
      model: this.model,
    };
  }

  async completionStream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const messages: any[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    messages.push({ role: 'user', content: request.prompt });

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4000,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      const isComplete = chunk.choices[0]?.finish_reason !== null;

      if (text) {
        onChunk({ text, isComplete });
      }

      if (isComplete) {
        onChunk({ text: '', isComplete: true });
      }
    }
  }

  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: request.texts,
      dimensions: request.dimensions,
    });

    return {
      embeddings: response.data.map((item) => item.embedding),
      usage: {
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: this.model,
    };
  }
}
