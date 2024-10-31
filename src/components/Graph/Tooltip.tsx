import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TooltipProps {
  content: string;
  x: number;
  y: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, x, y }) => {
  return (
    <div
      className="absolute bg-black text-white px-4 py-2 rounded shadow-lg pointer-events-none max-w-md"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert prose-sm max-w-none"
        components={{
          p: ({ children }) => <p className="m-0">{children}</p>,
          ul: ({ children }) => <ul className="list-none p-0 m-0">{children}</ul>,
          li: ({ children }) => (
            <li className="whitespace-nowrap text-sm leading-tight mb-1">
              {children}
            </li>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};