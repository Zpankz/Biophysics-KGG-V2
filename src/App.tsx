import React, { useState } from 'react';
import { TextInput } from './components/TextInput';
import Graph from './components/Graph';
import { ApiKeyInput } from './components/ApiKeyInput';
import { processText } from './utils/textProcessor';
import { getApiKey } from './utils/apiKeyStorage';
import { ThemeProvider } from './context/ThemeContext';

interface Node {
  id: string;
  group: number;
  context?: string[];
}

interface Link {
  source: string;
  target: string;
  value: number;
  type?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [apiKeySet, setApiKeySet] = useState(!!getApiKey());

  const handleTextSubmit = (text: string) => {
    const processedData = processText(text);
    setGraphData(processedData);
  };

  if (!apiKeySet) {
    return (
      <div className="min-h-screen bg-black py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            Unstructured Biophysics Knowledge Graph Generator
          </h1>
          <ApiKeyInput onKeySet={() => setApiKeySet(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          Unstructured Biophysics Knowledge Graph Generator
        </h1>
        
        <div className="flex flex-col items-center gap-8">
          <TextInput onTextSubmit={handleTextSubmit} />
          
          {graphData.nodes.length > 0 && (
            <div className="w-full max-w-4xl">
              <Graph data={graphData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;