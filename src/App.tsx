import { useState, useRef } from 'react';
import { TextInput } from './components/TextInput';
import { UnifiedForceGraph } from './components/ForceGraph';
import { processText } from './utils/textProcessor';
import { SettingsModal } from './components/Settings/SettingsModal';
import type { GraphData } from './components/ForceGraph/types';
import type { VisualizationMode, LayoutAlgorithm, GraphRef } from './components/ForceGraph/types';

function App() {
  const graphRef = useRef<GraphRef>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('2d');
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('force');
  const [pathwayMode, setPathwayMode] = useState(false);

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
            <div className="w-full" style={{ height: '800px' }}>
              {/* Visualization Controls */}
              <div className="flex gap-4 mb-4 flex-wrap">
                {/* Mode Switcher */}
                <div className="flex gap-2 bg-gray-900 p-2 rounded-lg">
                  <span className="text-gray-400 text-sm self-center mr-2">Mode:</span>
                  <button
                    onClick={() => setVisualizationMode('2d')}
                    className={`px-4 py-2 rounded transition-colors ${
                      visualizationMode === '2d'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    2D
                  </button>
                  <button
                    onClick={() => setVisualizationMode('3d')}
                    className={`px-4 py-2 rounded transition-colors ${
                      visualizationMode === '3d'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    3D
                  </button>
                  <button
                    onClick={() => setVisualizationMode('ar')}
                    className={`px-4 py-2 rounded transition-colors ${
                      visualizationMode === 'ar'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    AR
                  </button>
                  <button
                    onClick={() => setVisualizationMode('vr')}
                    className={`px-4 py-2 rounded transition-colors ${
                      visualizationMode === 'vr'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    VR
                  </button>
                </div>

                {/* Layout Switcher */}
                <div className="flex gap-2 bg-gray-900 p-2 rounded-lg">
                  <span className="text-gray-400 text-sm self-center mr-2">Layout:</span>
                  <button
                    onClick={() => setLayoutAlgorithm('force')}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      layoutAlgorithm === 'force'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Force
                  </button>
                  <button
                    onClick={() => setLayoutAlgorithm('dagre')}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      layoutAlgorithm === 'dagre'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Dagre
                  </button>
                  <button
                    onClick={() => setLayoutAlgorithm('auto')}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      layoutAlgorithm === 'auto'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Auto
                  </button>
                </div>

                {/* Pathway Mode Toggle */}
                <button
                  onClick={() => setPathwayMode(!pathwayMode)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    pathwayMode
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {pathwayMode ? '🔥 Pathway Mode' : 'Standard Mode'}
                </button>

                {/* Utility Buttons */}
                <button
                  onClick={() => graphRef.current?.zoomToFit?.(400, 20)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Fit to View
                </button>
              </div>

              {/* Graph Visualization */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800" style={{ height: '700px' }}>
                <UnifiedForceGraph
                  ref={graphRef}
                  data={graphData}
                  mode={visualizationMode}
                  layoutAlgorithm={layoutAlgorithm}
                  enablePathwayMode={pathwayMode}
                  enableMultiSelection={true}
                  onNodeClick={(node) => {
                    console.log('Node clicked:', node);
                  }}
                />
              </div>

              {/* Mode-specific instructions */}
              {visualizationMode === 'ar' && (
                <div className="mt-4 p-4 bg-purple-900 bg-opacity-50 rounded-lg text-white">
                  <h3 className="font-bold mb-2">🔮 AR Mode Instructions:</h3>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Point your camera at a Hiro marker</li>
                    <li>Keep the marker in view for best experience</li>
                    <li>Tap nodes to interact with the 3D graph</li>
                    <li>Move your device to explore from different angles</li>
                  </ol>
                </div>
              )}

              {visualizationMode === 'vr' && (
                <div className="mt-4 p-4 bg-purple-900 bg-opacity-50 rounded-lg text-white">
                  <h3 className="font-bold mb-2">🥽 VR Mode Instructions:</h3>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Put on your VR headset (Quest, Vive, etc.)</li>
                    <li>Use controllers to interact with nodes</li>
                    <li>Navigate using thumbsticks or teleport</li>
                    <li>Trigger button to select nodes</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;