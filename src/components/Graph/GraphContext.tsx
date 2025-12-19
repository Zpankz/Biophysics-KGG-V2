import React, { createContext, useContext } from 'react';
import type { GraphData } from './types';

interface GraphContextValue {
  graphData: GraphData;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export const useGraphContext = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraphContext must be used within GraphProvider');
  }
  return context;
};

interface GraphProviderProps {
  graphData: GraphData;
  children: React.ReactNode;
}

export const GraphProvider: React.FC<GraphProviderProps> = ({ graphData, children }) => {
  return (
    <GraphContext.Provider value={{ graphData }}>
      {children}
    </GraphContext.Provider>
  );
};
