import type {
  ProviderAdapter,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
} from './types';

export class AnthropicAdapter implements ProviderAdapter {
  name = 'anthropic';
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig, model: string) {
    this.apiKey = config.apiKey;
    this.model = model;
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens ?? 4000,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();

    return {
      text: data.content[0]?.text || '',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
      model: this.model,
    };
  }

  async completionStream(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens ?? 4000,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onChunk({ text: '', isComplete: true });
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ text: '', isComplete: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              onChunk({ text: parsed.delta.text, isComplete: false });
            } else if (parsed.type === 'message_stop') {
              onChunk({ text: '', isComplete: true });
            }
          } catch (e) {
          }
        }
      }
    }
  }
}
