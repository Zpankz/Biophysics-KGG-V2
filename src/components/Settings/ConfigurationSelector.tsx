import { useState, useEffect } from 'react';
import {
  getAllConfigurations,
  setActiveConfiguration,
  type ModelConfiguration,
} from '../../lib/configManager';

export function ConfigurationSelector() {
  const [configurations, setConfigurations] = useState<ModelConfiguration[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  async function loadConfigurations() {
    setLoading(true);
    const result = await getAllConfigurations();
    if (result.data) {
      setConfigurations(result.data);
      const active = result.data.find((c) => c.is_active);
      if (active) {
        setActiveConfigId(active.id);
      }
    }
    setLoading(false);
  }

  async function handleSelectConfiguration(configId: string) {
    setMessage(null);
    const result = await setActiveConfiguration(configId);

    if (result.success) {
      setMessage({ type: 'success', text: 'Configuration activated successfully' });
      setActiveConfigId(configId);
      loadConfigurations();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to activate configuration' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Model Configurations</h3>
        <p className="text-gray-400 text-sm">
          Select a pre-configured model setup or create your own custom configuration.
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

      <div className="space-y-4">
        {configurations.map((config) => (
          <div
            key={config.id}
            className={`p-5 rounded-lg border-2 transition-all ${
              activeConfigId === config.id
                ? 'bg-blue-900/30 border-blue-500'
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-white">{config.config_name}</h4>
                  {config.is_system_default && (
                    <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                      System Default
                    </span>
                  )}
                  {activeConfigId === config.id && (
                    <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded">
                      Active
                    </span>
                  )}
                </div>
                {config.description && (
                  <p className="text-gray-400 text-sm mt-1">{config.description}</p>
                )}
              </div>
              {activeConfigId !== config.id && (
                <button
                  onClick={() => handleSelectConfiguration(config.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Activate
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <ConfigDetail
                label="Extraction"
                config={config.extraction_config as any}
              />
              <ConfigDetail
                label="Embedding"
                config={config.embedding_config as any}
              />
              <ConfigDetail
                label="Chat"
                config={config.chat_config as any}
              />
              <ConfigDetail
                label="Reranking"
                config={config.reranking_config as any}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h4 className="text-white font-medium mb-2">Create Custom Configuration</h4>
        <p className="text-gray-400 text-sm mb-3">
          Want to create a custom configuration? This feature is coming soon!
        </p>
        <button
          disabled
          className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
        >
          Create Custom (Coming Soon)
        </button>
      </div>
    </div>
  );
}

interface ConfigDetailProps {
  label: string;
  config: { provider: string; model: string; params?: any };
}

function ConfigDetail({ label, config }: ConfigDetailProps) {
  return (
    <div className="p-3 bg-gray-900 rounded-lg">
      <p className="text-gray-400 text-xs uppercase font-medium mb-1">{label}</p>
      <p className="text-white text-sm font-medium">{config.provider}</p>
      <p className="text-gray-400 text-xs">{config.model}</p>
    </div>
  );
}
