import { useState } from 'react';
import { TextInput } from './components/TextInput';
import Graph from './components/Graph';
import { processText } from './utils/textProcessor';
import { SettingsModal } from './components/Settings/SettingsModal';

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleTextSubmit = async (text: string) => {
    const processedData = await processText(text);
    setGraphData(processedData);
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            Multi-Provider Knowledge Graph Generator
          </h1>
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>

        <div className="flex flex-col items-center gap-8">
          <TextInput onTextSubmit={handleTextSubmit} />

          {graphData.nodes.length > 0 && (
            <div className="w-full max-w-4xl">
              <Graph data={graphData} />
            </div>
          )}
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;