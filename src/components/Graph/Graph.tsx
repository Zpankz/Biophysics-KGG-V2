import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../../context/ThemeContext';
import { analyzeGraph, getMultiHopRelationships } from '../../utils/graphAnalytics';
import { generateSummary } from '../../utils/textSummarizer';
import { InfoPanel } from './InfoPanel';
import { Tooltip } from './Tooltip';
import { GraphControls } from './GraphControls';
import { ChatWindow } from './ChatWindow';
import { initializeGraph } from './graphUtils';
import type { Node, Link, GraphProps } from './types';

export const Graph: React.FC<GraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<any, any> | null>(null);
  const { colors } = useTheme();

  const [isPathwayMode, setIsPathwayMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
  const [infoPanel, setInfoPanel] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const handleNodeHover = (event: MouseEvent, d: Node) => {
    const relationships = getMultiHopRelationships(d.id, null, data);
    let tooltipContent = '';

    if (isPathwayMode) {
      tooltipContent = 'Important Pathway Connections:\n' +
        relationships.directRelationships
          .map((rel, i) => `${i + 1}. ${d.id} → ${rel.relationship.type || 'relates to'} → ${rel.node.id}`)
          .join('\n');
    } else {
      tooltipContent = 'Important Direct Relationships:\n' +
        relationships.directRelationships
          .map((rel, i) => `${i + 1}. ${d.id} → ${rel.relationship.type || 'relates to'} → ${rel.node.id}`)
          .join('\n');
    }

    setTooltip({
      content: tooltipContent,
      x: event.pageX,
      y: event.pageY - 10
    });
  };

  const handleNodeLeave = () => {
    setTooltip(null);
  };

  const handleNodeClick = async (event: MouseEvent, d: Node) => {
    event.stopPropagation();
    setSelectedNode(d.id);
    
    const relationships = getMultiHopRelationships(d.id, null, data);
    setInfoPanel({
      node: d,
      relationships,
      context: d.context
    });

    setIsGeneratingSummary(true);
    try {
      const connectedNodes = relationships.directRelationships.map(r => r.node.id);
      const summary = await generateSummary([d.id, ...connectedNodes], relationships.directRelationships);
      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setAiSummary('Error generating summary');
    }
    setIsGeneratingSummary(false);
  };

  const handleResetView = () => {
    if (!svgRef.current || !simulationRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = containerRef.current?.clientWidth || 0;
    const height = containerRef.current?.clientHeight || 0;

    const nodes = data.nodes;
    const centerX = d3.mean(nodes, d => (d as any).x) || width / 2;
    const centerY = d3.mean(nodes, d => (d as any).y) || height / 2;

    const bounds = {
      left: d3.min(nodes, d => (d as any).x) || 0,
      right: d3.max(nodes, d => (d as any).x) || width,
      top: d3.min(nodes, d => (d as any).y) || 0,
      bottom: d3.max(nodes, d => (d as any).y) || height
    };

    const dx = bounds.right - bounds.left;
    const dy = bounds.bottom - bounds.top;
    const scale = 0.9 / Math.max(dx / width, dy / height);

    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(scale)
          .translate(-centerX, -centerY)
      );

    simulationRef.current
      .alpha(0.3)
      .restart();
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.nodes.length) return;

    const { simulation, zoom } = initializeGraph({
      svg: svgRef.current,
      container: containerRef.current,
      data,
      colors,
      isPathwayMode,
      onNodeHover: handleNodeHover,
      onNodeLeave: handleNodeLeave,
      onNodeClick: handleNodeClick
    });

    simulationRef.current = simulation;
    zoomRef.current = zoom;

    return () => {
      simulation.stop();
    };
  }, [data, colors, isPathwayMode]);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="relative w-full h-[600px] rounded-lg overflow-hidden"
        style={{ backgroundColor: colors.background }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
        />
        
        <GraphControls
          isPathwayMode={isPathwayMode}
          onTogglePathwayMode={() => setIsPathwayMode(!isPathwayMode)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onResetView={handleResetView}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
        />

        {tooltip && (
          <Tooltip
            content={tooltip.content}
            x={tooltip.x}
            y={tooltip.y}
          />
        )}
        
        {infoPanel && (
          <InfoPanel
            infoPanel={infoPanel}
            isGeneratingSummary={isGeneratingSummary}
            aiSummary={aiSummary}
            colors={colors}
          />
        )}
        
        {isChatOpen && (
          <ChatWindow
            graphData={data}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Graph;