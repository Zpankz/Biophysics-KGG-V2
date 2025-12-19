import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface TextInputProps {
  onTextSubmit: (text: string) => Promise<void>;
}

export const TextInput: React.FC<TextInputProps> = ({ onTextSubmit }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !loading) {
      setLoading(true);
      try {
        await onTextSubmit(text);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 p-2 rounded-lg focus:ring-2 focus:outline-none"
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.surface,
            borderWidth: 1
          }}
          placeholder="Enter your text here..."
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: colors.button,
          color: colors.background
        }}
      >
        {loading ? 'Processing...' : 'Generate Graph'}
      </button>
    </form>
  );
};