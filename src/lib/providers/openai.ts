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
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig, model: string) {
    this.apiKey = config.apiKey;
    this.model = model;
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-completion`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        provider: 'openai',
        model: this.model,
        request: request,
        apiKey: this.apiKey,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI completion error: ${error}`);
    }

    const data = await response.json();
    return data;
  }

  async completionStream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    throw new Error('Streaming not yet implemented via Edge Function');
  }

  async embedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error('Embeddings not yet implemented via Edge Function');
  }
}
