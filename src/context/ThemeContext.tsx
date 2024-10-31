import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  colors: {
    background: string;
    surface: string;
    text: string;
    accent: string;
    button: string;
    nodes: string[];
  };
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: {
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    accent: '#ff00ff',
    button: '#00C8FF',
    nodes: ['#39FF14', '#FF00FF', '#9D00FF', '#00C8FF']
  },
  toggleTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark] = useState(true);

  const colors = {
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    accent: '#ff00ff',
    button: '#00C8FF',
    nodes: ['#39FF14', '#FF00FF', '#9D00FF', '#00C8FF']
  };

  const toggleTheme = () => {
    // Theme toggle functionality can be added here if needed
  };

  return (
    <ThemeContext.Provider value={{ colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};