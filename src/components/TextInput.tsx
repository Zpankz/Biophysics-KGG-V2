import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface TextInputProps {
  onTextSubmit: (text: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({ onTextSubmit }) => {
  const [text, setText] = useState('');
  const { colors } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onTextSubmit(text);
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
        className="px-4 py-2 rounded transition-colors"
        style={{
          backgroundColor: colors.button,
          color: colors.background
        }}
      >
        Generate Graph
      </button>
    </form>
  );
};