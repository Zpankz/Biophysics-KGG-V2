import React, { useState } from 'react';
import { setApiKey } from '../utils/apiKeyStorage';
import { useTheme } from '../context/ThemeContext';

interface ApiKeyInputProps {
  onKeySet: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySet }) => {
  const [key, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const { colors } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim().startsWith('sk-')) {
      setError('Invalid API key format');
      return;
    }
    setApiKey(key.trim());
    onKeySet();
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-lg shadow-lg" style={{ backgroundColor: colors.surface }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>Enter OpenAI API Key</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKeyInput(e.target.value)}
            className="w-full p-2 rounded focus:ring-2 focus:outline-none"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.surface,
              borderWidth: 1
            }}
            placeholder="sk-..."
          />
        </div>
        {error && <p style={{ color: colors.accent }} className="text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: colors.button,
            color: colors.background
          }}
        >
          Set API Key
        </button>
      </form>
    </div>
  );
};