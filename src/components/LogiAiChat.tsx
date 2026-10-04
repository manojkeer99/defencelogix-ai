import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  User, 
  Terminal, 
  ShieldCheck, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LogiAiChatProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentTab: (tab: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: 'gemini' | 'rules_engine';
  suggestedActions?: string[];
  timestamp: string;
}

export const LogiAiChat: React.FC<LogiAiChatProps> = ({ isOpen, onClose, setCurrentTab }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `**[LOGIAI TACTICAL ADVISORY INITIALIZED]**\n\nGreetings, ${user?.name || 'Officer'}. I am LogiAI, your military logistics intelligence advisor for SIH Problem 26251.\n\nI monitor inventory burn rates, weather corridors, fleet sorties, and demand forecasts across all 10 synthetic forward nodes. How may I assist your command today?`,
      source: 'gemini',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'What items are predicted to have high demand?',
    'Which synthetic supply nodes have low inventory?',
    'Show projected inventory shortages.',
    'Summarize logistics performance.',
    'Generate a weekly logistics report.'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, userRole: user?.role || 'logistics_officer' })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          source: data.source,
          suggestedActions: data.suggestedActions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('API response failed');
      }
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `**[COMMUNICATION DEGRADED]**\nUnable to reach server inference engine. Running fallback operational diagnostic: Forward Node Alpha is in Critical status for winter diesel (DHA-50). Convoy transfer REC-OPT-1001 is awaiting command authorization.`,
        source: 'rules_engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-slate-950/95 border-l border-cyan-500/30 backdrop-blur-xl shadow-2xl flex flex-col justify-between text-slate-100">
      {/* Top Header */}
      <div className="p-4 border-b border-cyan-500/20 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-300">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base text-white tracking-wide">
                LogiAI
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                TACTICAL ASSISTANT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Role: {user?.role.toUpperCase()} • Clearance Level {user?.clearanceLevel.split(' - ')[0]}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-1">
              {msg.sender === 'user' ? (
                <>
                  <span>{user?.name || 'You'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400">LogiAI</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.source && (
                    <span className="text-slate-600">({msg.source})</span>
                  )}
                </>
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[90%] text-xs font-mono leading-relaxed whitespace-pre-line shadow-md ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-cyan-500/20 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text}

              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                    Suggested Command Actions:
                  </span>
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action)}
                      className="block text-[11px] text-left text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      → {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Consulting database & AI reasoning engine...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips & Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
        {/* Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/40 text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask LogiAI about stockouts, predictions, routes..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
