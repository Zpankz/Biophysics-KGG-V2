import { useState, useEffect } from 'react';
import { saveApiKey, getApiKeys, deleteApiKey, type ApiKey } from '../../lib/apiKeyManager';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-5.2, GPT-4o, Embeddings' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 4.5 series' },
  { id: 'google', name: 'Google AI', description: 'Gemini 3 and 2.5 series' },
  { id: 'xai', name: 'xAI', description: 'Grok 4.1 Reasoning' },
  { id: 'groq', name: 'Groq', description: 'Llama 3.3, ultra-fast inference' },
  { id: 'cohere', name: 'Cohere', description: 'Embeddings & Reranking' },
  { id: 'voyage', name: 'Voyage AI', description: 'Embeddings & Reranking' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Voice & Audio' },
];

export function ApiKeyManagement() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const result = await getApiKeys();
    if (result.data) {
      setKeys(result.data);
    }
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProvider || !apiKey) return;

    setLoading(true);
    setMessage(null);

    const result = await saveApiKey(selectedProvider, apiKey, keyName || undefined);

    if (result.success) {
      setMessage({ type: 'success', text: 'API key saved successfully' });
      setApiKey('');
      setKeyName('');
      setSelectedProvider('');
      loadKeys();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save API key' });
    }

    setLoading(false);
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    const result = await deleteApiKey(keyId);
    if (result.success) {
      setMessage({ type: 'success', text: 'API key deleted successfully' });
      loadKeys();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete API key' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">API Key Management</h3>
        <p className="text-gray-400 text-sm">
          Add API keys for different AI providers. Keys are encrypted and stored securely.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-300 border border-green-700'
              : 'bg-red-900/30 text-red-300 border border-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveKey} className="space-y-4 p-4 bg-gray-800 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="">Select a provider...</option>
            {PROVIDERS.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} - {provider.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="sk-..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Key Name (Optional)
          </label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="My API Key"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save API Key'}
        </button>
      </form>

      <div className="space-y-3">
        <h4 className="text-lg font-medium text-white">Saved API Keys</h4>
        {keys.length === 0 ? (
          <p className="text-gray-400 text-sm">No API keys saved yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">
                    {PROVIDERS.find((p) => p.id === key.provider_name)?.name || key.provider_name}
                  </p>
                  {key.key_name && (
                    <p className="text-gray-400 text-sm">{key.key_name}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Added {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
