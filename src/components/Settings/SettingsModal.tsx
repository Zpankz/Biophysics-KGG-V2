import { useState, useEffect } from 'react';
import { ApiKeyManagement } from './ApiKeyManagement';
import { ConfigurationSelector } from './ConfigurationSelector';
import { UsageAnalytics } from './UsageAnalytics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'api-keys' | 'configurations' | 'analytics';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('api-keys');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-gray-900 rounded-lg shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-gray-700 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'api-keys'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                API Keys
              </button>
              <button
                onClick={() => setActiveTab('configurations')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'configurations'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                Configurations
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                Usage & Analytics
              </button>
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'api-keys' && <ApiKeyManagement />}
            {activeTab === 'configurations' && <ConfigurationSelector />}
            {activeTab === 'analytics' && <UsageAnalytics />}
          </div>
        </div>
      </div>
    </div>
  );
}
