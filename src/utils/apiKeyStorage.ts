// Store API key in memory (not persisted)
let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

export function getApiKey(): string | null {
  return apiKey;
}

export function clearApiKey() {
  apiKey = null;
}