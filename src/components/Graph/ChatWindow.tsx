import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService, AIServiceError } from '../../services/aiService';
import { useGraphContext } from './GraphContext';

interface ChatWindowProps {
  onClose: () => void;
}

type UserMessage = {
  role: 'user';
  content: string;
};

type AssistantMessage = {
  role: 'assistant';
  content: string;
};

type Message = UserMessage | AssistantMessage;

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const { graphData } = useGraphContext();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'How can I help you understand the graph?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: UserMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const content = await aiService.generateChatResponse(
        [...messages, userMessage],
        graphData
      );

      const assistantMessage: AssistantMessage = {
        role: 'assistant',
        content
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);

      let errorMessage = 'Sorry, there was an error processing your request.';
      if (error instanceof AIServiceError) {
        errorMessage = error.message;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Draggable
      handle=".chat-handle"
      nodeRef={chatWindowRef}
      bounds="parent"
      defaultPosition={{ x: 0, y: 0 }}
    >
      <div
        ref={chatWindowRef}
        className="absolute bg-[#000000] rounded-lg shadow-xl border border-gray-800 resize overflow-hidden"
        style={{
          width: '33.333%',
          height: '400px',
          minWidth: '320px',
          minHeight: '200px',
          maxWidth: '90vw',
          maxHeight: '70vh',
          bottom: '0',
          left: '0',
          zIndex: 1000
        }}
      >
        <div className="flex flex-col h-full">
          <div className="chat-handle flex justify-between items-center p-3 bg-[#000000] border-b border-gray-800 cursor-move">
            <h3 className="text-white font-semibold select-none">Graph Assistant</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user' ? 'ml-auto bg-[#00C8FF]' : 'mr-auto bg-[#111111]'
                } max-w-[80%] rounded-lg p-3`}
              >
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  className={`prose prose-sm max-w-none ${
                    msg.role === 'user' ? 'text-black' : 'text-white'
                  }`}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    h1: ({ children }) => <h1 className="text-[#00C8FF] text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-[#00C8FF] text-lg font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-[#00C8FF] text-base font-bold mb-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-[#00C8FF] text-sm font-bold mb-2">{children}</h4>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    code: ({ children }) => (
                      <code className={`px-1 rounded ${
                        msg.role === 'user' ? 'bg-[#00a8ff]' : 'bg-[#1a1a1a]'
                      }`}>
                        {children}
                      </code>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="text-[#00C8FF] px-2 py-1 font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-2 py-1 border-t border-gray-800">
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[#00C8FF] pl-3 italic">{children}</blockquote>
                    )
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-[#000000] border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the graph..."
                className="flex-1 px-3 py-2 bg-[#111111] text-white rounded-lg border border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00C8FF] pointer-events-auto"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[#00C8FF] text-black rounded-lg hover:bg-[#00a8ff] disabled:opacity-50 font-medium pointer-events-auto"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Draggable>
  );
}