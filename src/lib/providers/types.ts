export interface CompletionRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface CompletionResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

export interface EmbeddingRequest {
  texts: string[];
  dimensions?: number;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage: {
    totalTokens: number;
  };
  model: string;
}

export interface RerankRequest {
  query: string;
  documents: string[];
  topK?: number;
}

export interface RerankResponse {
  results: Array<{
    index: number;
    score: number;
    document: string;
  }>;
  model: string;
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export interface ProviderAdapter {
  name: string;

  completion(request: CompletionRequest): Promise<CompletionResponse>;

  completionStream?(
    request: CompletionRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void>;

  embedding?(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  rerank?(request: RerankRequest): Promise<RerankResponse>;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  organizationId?: string;
}
