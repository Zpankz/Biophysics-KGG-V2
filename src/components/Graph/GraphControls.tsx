import React from 'react';

interface GraphControlsProps {
  isPathwayMode: boolean;
  onTogglePathwayMode: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onResetView: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  isPathwayMode,
  onTogglePathwayMode,
  isFullscreen,
  onToggleFullscreen,
  onResetView,
  isChatOpen,
  onToggleChat
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full">
        {/* Color Legend */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-4 bg-black/80 rounded-full px-6 py-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#39FF14' }}></div>
            <span className="text-white text-sm">Molecules</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF00FF' }}></div>
            <span className="text-white text-sm">Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9D00FF' }}></div>
            <span className="text-white text-sm">Processes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00C8FF' }}></div>
            <span className="text-white text-sm">Components</span>
          </div>
        </div>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 z-50 flex gap-4 pointer-events-auto">
          <button
            onClick={onTogglePathwayMode}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isPathwayMode ? 'bg-yellow-400 text-black' : 'bg-[#FF00FF] text-white'
            }`}
          >
            {isPathwayMode ? 'Pathways' : 'Direct'}
          </button>
        </div>
        
        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full shadow-md pointer-events-auto hover:bg-gray-100 transition-colors"
        >
          {isFullscreen ? '↙' : '↗'}
        </button>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center gap-4 pointer-events-auto">
          <button
            onClick={onResetView}
            className="px-4 py-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>

          <button
            onClick={onToggleChat}
            className="px-4 py-2 bg-[#00C8FF] text-black rounded-full shadow-lg hover:bg-[#00a8ff] transition-colors font-medium"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}