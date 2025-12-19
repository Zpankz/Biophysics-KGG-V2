import type {
  ProviderAdapter,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
} from './types';

export class GroqAdapter implements ProviderAdapter {
  name = 'groq';
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
      },
      body: JSON.stringify({
        provider: 'groq',
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
    throw new Error('Streaming not yet implemented for Groq');
  }
}
