import React, { useEffect, useRef, useState, useMemo, useCallback, useReducer } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../../context/ThemeContext';
import { analyzeGraph, getMultiHopRelationships } from '../../utils/graphAnalytics';
import { generateSummary } from '../../utils/textSummarizer';
import { InfoPanel } from './InfoPanel';
import { Tooltip } from './Tooltip';
import { GraphControls } from './GraphControls';
import { ChatWindow } from './ChatWindow';
import { initializeGraph } from './graphUtils';
import { GraphProvider } from './GraphContext';
import { ErrorBoundary } from '../ErrorBoundary';
import type { Node, Link, GraphProps } from './types';

interface GraphState {
  isPathwayMode: boolean;
  isFullscreen: boolean;
  isChatOpen: boolean;
  tooltip: { content: string; x: number; y: number } | null;
  infoPanel: any;
  aiSummary: string | null;
  isGeneratingSummary: boolean;
  selectedNode: string | null;
}

type GraphAction =
  | { type: 'TOGGLE_PATHWAY_MODE' }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'SET_TOOLTIP'; payload: { content: string; x: number; y: number } | null }
  | { type: 'CLEAR_TOOLTIP' }
  | { type: 'SET_INFO_PANEL'; payload: any }
  | { type: 'SET_AI_SUMMARY'; payload: string | null }
  | { type: 'SET_GENERATING_SUMMARY'; payload: boolean }
  | { type: 'SET_SELECTED_NODE'; payload: string | null };

const initialState: GraphState = {
  isPathwayMode: false,
  isFullscreen: false,
  isChatOpen: false,
  tooltip: null,
  infoPanel: null,
  aiSummary: null,
  isGeneratingSummary: false,
  selectedNode: null,
};

function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'TOGGLE_PATHWAY_MODE':
      return { ...state, isPathwayMode: !state.isPathwayMode };
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload };
    case 'TOGGLE_CHAT':
      return { ...state, isChatOpen: !state.isChatOpen };
    case 'SET_TOOLTIP':
      return { ...state, tooltip: action.payload };
    case 'CLEAR_TOOLTIP':
      return { ...state, tooltip: null };
    case 'SET_INFO_PANEL':
      return { ...state, infoPanel: action.payload };
    case 'SET_AI_SUMMARY':
      return { ...state, aiSummary: action.payload };
    case 'SET_GENERATING_SUMMARY':
      return { ...state, isGeneratingSummary: action.payload };
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload };
    default:
      return state;
  }
}

export const Graph: React.FC<GraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const { colors } = useTheme();

  const [state, dispatch] = useReducer(graphReducer, initialState);

  useEffect(() => {
    const handleFullscreenChange = () => {
      dispatch({ type: 'SET_FULLSCREEN', payload: !!document.fullscreenElement });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  const handleNodeHover = useCallback((event: MouseEvent, d: Node) => {
    const relationships = getMultiHopRelationships(d.id, null, data);
    let tooltipContent = '';

    if (state.isPathwayMode) {
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

    dispatch({
      type: 'SET_TOOLTIP',
      payload: {
        content: tooltipContent,
        x: event.pageX,
        y: event.pageY - 10
      }
    });
  }, [data, state.isPathwayMode]);

  const handleNodeLeave = useCallback(() => {
    dispatch({ type: 'CLEAR_TOOLTIP' });
  }, []);

  const handleNodeClick = useCallback(async (event: MouseEvent, d: Node) => {
    event.stopPropagation();
    dispatch({ type: 'SET_SELECTED_NODE', payload: d.id });

    const relationships = getMultiHopRelationships(d.id, null, data);
    dispatch({
      type: 'SET_INFO_PANEL',
      payload: {
        node: d,
        relationships,
        context: d.context
      }
    });

    dispatch({ type: 'SET_GENERATING_SUMMARY', payload: true });
    try {
      const connectedNodes = relationships.directRelationships.map(r => r.node.id);
      const summary = await generateSummary([d.id, ...connectedNodes], relationships.directRelationships);
      dispatch({ type: 'SET_AI_SUMMARY', payload: summary });
    } catch (error) {
      console.error('Error generating summary:', error);
      dispatch({ type: 'SET_AI_SUMMARY', payload: 'Error generating summary' });
    }
    dispatch({ type: 'SET_GENERATING_SUMMARY', payload: false });
  }, [data]);

  const handleResetView = useCallback(() => {
    if (!svgRef.current || !simulationRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = containerRef.current?.clientWidth || 0;
    const height = containerRef.current?.clientHeight || 0;

    const nodes = data.nodes;
    const centerX = d3.mean(nodes, d => d.x || 0) || width / 2;
    const centerY = d3.mean(nodes, d => d.y || 0) || height / 2;

    const bounds = {
      left: d3.min(nodes, d => d.x || 0) || 0,
      right: d3.max(nodes, d => d.x || width) || width,
      top: d3.min(nodes, d => d.y || 0) || 0,
      bottom: d3.max(nodes, d => d.y || height) || height
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
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.nodes.length) return;

    const { simulation, zoom } = initializeGraph({
      svg: svgRef.current,
      container: containerRef.current,
      data,
      colors,
      isPathwayMode: state.isPathwayMode,
      onNodeHover: handleNodeHover,
      onNodeLeave: handleNodeLeave,
      onNodeClick: handleNodeClick
    });

    simulationRef.current = simulation;
    zoomRef.current = zoom;

    return () => {
      simulation.stop();
    };
  }, [data, colors, state.isPathwayMode, handleNodeHover, handleNodeLeave, handleNodeClick]);

  const togglePathwayMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_PATHWAY_MODE' });
  }, []);

  const toggleChat = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAT' });
  }, []);

  return (
    <ErrorBoundary>
      <GraphProvider graphData={data}>
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
              isPathwayMode={state.isPathwayMode}
              onTogglePathwayMode={togglePathwayMode}
              isFullscreen={state.isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onResetView={handleResetView}
              isChatOpen={state.isChatOpen}
              onToggleChat={toggleChat}
            />

            {state.tooltip && (
              <Tooltip
                content={state.tooltip.content}
                x={state.tooltip.x}
                y={state.tooltip.y}
              />
            )}

            {state.infoPanel && (
              <InfoPanel
                infoPanel={state.infoPanel}
                isGeneratingSummary={state.isGeneratingSummary}
                aiSummary={state.aiSummary}
                colors={colors}
              />
            )}

            {state.isChatOpen && (
              <ChatWindow
                onClose={toggleChat}
              />
            )}
          </div>
        </div>
      </GraphProvider>
    </ErrorBoundary>
  );
};

export default Graph;