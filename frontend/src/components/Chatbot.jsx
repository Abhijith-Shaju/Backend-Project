import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare,
  X,
  Trash2
} from 'lucide-react';
import clsx from 'clsx';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm your LogiFlow AI assistant. I have live access to your warehouses, drivers, and shipments. How can I help?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { prompt: input });
      const aiReply = { role: 'assistant', content: response.data.reply };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      const errorMsg = { 
        role: 'assistant', 
        content: "Error: " + (err.response?.data?.message || "Could not connect to the local AI. Please ensure Ollama is running.") 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ 
      role: 'assistant', 
      content: "Hello! I'm your LogiFlow AI assistant. I have live access to your warehouses, drivers, and shipments. How can I help?" 
    }]);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 bg-primary-500 hover:bg-primary-400 text-white rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center transition-all z-50 transform hover:scale-110"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden transform transition-all duration-300 ease-out origin-bottom-right">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/50">
                <Bot className="h-4 w-4 text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">LogiFlow AI</h3>
                <p className="text-[10px] text-primary-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearChat}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                title="Clear Chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={clsx(
                  "flex gap-3 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                  msg.role === 'user' ? "bg-primary-500 border-primary-400" : "bg-slate-800 border-slate-700"
                )}>
                  {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-slate-300" />}
                </div>
                <div className={clsx(
                  "rounded-2xl p-3 text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary-600/20 border border-primary-500/30 text-white" 
                    : "bg-slate-800/80 border border-slate-700/50 text-slate-200"
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border bg-slate-800 border-slate-700">
                  <Bot className="h-4 w-4 text-slate-300" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-3 text-slate-200 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about warehouses, drivers..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center bg-primary-500 hover:bg-primary-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
