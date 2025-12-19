import { OpenAIAdapter } from './openai';
import { AnthropicAdapter } from './anthropic';
import type { ProviderAdapter, ProviderConfig } from './types';
import { getApiKey } from '../apiKeyManager';

export async function createProvider(
  providerName: string,
  modelName: string,
  customApiKey?: string
): Promise<ProviderAdapter> {
  let apiKey = customApiKey;

  if (!apiKey) {
    const result = await getApiKey(providerName);
    if (!result.data) {
      throw new Error(`No API key configured for provider: ${providerName}`);
    }
    apiKey = result.data.decrypted_key;
  }

  const config: ProviderConfig = {
    apiKey,
  };

  switch (providerName.toLowerCase()) {
    case 'openai':
      return new OpenAIAdapter(config, modelName);

    case 'anthropic':
      return new AnthropicAdapter(config, modelName);

    case 'google':
    case 'xai':
    case 'groq':
    case 'cohere':
    case 'voyage':
    case 'elevenlabs':
      throw new Error(`Provider ${providerName} not yet implemented. Coming soon!`);

    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

export async function createProviderForTask(
  config: { provider: string; model: string; params: any },
  customApiKey?: string
): Promise<ProviderAdapter> {
  return createProvider(config.provider, config.model, customApiKey);
}
