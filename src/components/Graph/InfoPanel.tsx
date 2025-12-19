import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Node } from './types';

interface InfoPanelProps {
  infoPanel: {
    node: Node;
    relationships: {
      directRelationships: Array<{
        node: Node;
        relationship: {
          type?: string;
          weight: number;
        };
      }>;
    };
    context?: string[];
  };
  isGeneratingSummary: boolean;
  aiSummary: string | null;
  colors: {
    text: string;
    surface: string;
    background: string;
  };
}

export const InfoPanel = React.memo<InfoPanelProps>(({
  infoPanel,
  isGeneratingSummary,
  aiSummary,
  colors
}) => {
  return (
    <div 
      className="absolute right-0 top-0 w-1/3 h-full bg-opacity-90 shadow-lg rounded-l-lg p-4 overflow-y-auto"
      style={{ backgroundColor: colors.surface }}
    >
      <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
        {infoPanel.node.id}
      </h3>
      
      {isGeneratingSummary ? (
        <div className="mb-4" style={{ color: colors.text }}>
          Generating insights...
        </div>
      ) : (
        aiSummary && (
          <div className="mb-4 space-y-2">
            <h4 className="font-semibold" style={{ color: colors.text }}>
              Key Insights:
            </h4>
            <div className="p-3 rounded" style={{ backgroundColor: colors.background }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-invert prose-sm max-w-none"
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 text-white">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2 text-white">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2 text-white">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="mb-1 text-white">
                      {children}
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="px-1 rounded text-white" style={{ backgroundColor: colors.surface }}>
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-3 italic text-white">
                      {children}
                    </blockquote>
                  )
                }}
              >
                {aiSummary}
              </ReactMarkdown>
            </div>
          </div>
        )
      )}

      <div className="mb-4">
        <h4 className="font-semibold mb-2" style={{ color: colors.text }}>
          Key Relationships:
        </h4>
        <div className="space-y-2">
          {infoPanel.relationships.directRelationships.map((rel, i) => (
            <div key={i} className="p-2 rounded" style={{ backgroundColor: colors.background }}>
              <p className="font-medium text-white">
                {rel.node.id}
              </p>
              <p className="text-sm text-white">
                {rel.relationship.type || 'relates to'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {infoPanel.context && (
        <div>
          <h4 className="font-semibold mb-2" style={{ color: colors.text }}>
            Original Context:
          </h4>
          <div className="space-y-2">
            {infoPanel.context.map((ctx, i) => (
              <div 
                key={i} 
                className="p-2 rounded text-sm text-white" 
                style={{ backgroundColor: colors.background }}
              >
                {ctx}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});