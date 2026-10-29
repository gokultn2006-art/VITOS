import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Sparkles, RefreshCw, Key, CheckCircle2, ExternalLink, X } from 'lucide-react';
import { sampleAiQuestions } from '../data/mockData';
import type { ChatMessage as ChatMessageType } from '../types';
import { aiAssistantService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../components/ChatMessage';
import { Button } from '../components/Button';

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [aiStatus, setAiStatus] = useState<{
    gemini_active: boolean;
    model: string;
    has_api_key: boolean;
    engine: string;
  }>({
    gemini_active: false,
    model: 'gemini-3.8-flash',
    has_api_key: false,
    engine: 'VIT Campus Knowledge Engine (Active Fallback)'
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);

  useEffect(() => {
    aiAssistantService.getStatus().then(setAiStatus).catch(() => {});
  }, []);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setKeySaving(true);
    try {
      const res = await aiAssistantService.configureKey(keyInput.trim());
      setAiStatus(res);
      setKeySaveSuccess(true);
      setTimeout(() => {
        setShowKeyModal(false);
        setKeySaveSuccess(false);
        setKeyInput('');
      }, 1200);
    } catch {
      alert('Failed to configure Gemini API Key. Please verify backend connection.');
    } finally {
      setKeySaving(false);
    }
  };

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'msg_init',
      sender: 'assistant',
      text: "👋 Hi! I am your **VIT CampusOS AI Assistant**.\nI am grounded with the complete VIT Vellore campus directory, academic blocks, classrooms, and pedestrian walking paths.\n\nAsk me anything — like *\"Find printer shop next to me\"*, *\"Where is TT-624?\"*, *\"Where is Medical Centre?\"*, or *\"Food Mall canteens\"*!",
      timestamp: 'Just now',
      quickActions: [
        { label: '🖨️ Nearest Printer Shop', action: 'send', payload: 'Where is printer shop next to me?' },
        { label: '🏫 Where is TT-624?', action: 'send', payload: 'Where is TT-624?' },
        { label: '🏥 Medical Centre & Emergency', action: 'send', payload: 'Where is the medical centre and ambulance?' },
        { label: '📚 Central Library', action: 'send', payload: 'Where is the Central Library?' },
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim()) return;

    const userMsg: ChatMessageType = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsTyping(true);

    try {
      const responseMsg = await aiAssistantService.sendMessage(text);
      setMessages((prev) => [...prev, responseMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Sorry, I encountered an issue connecting to the AI engine. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string, payload?: string) => {
    if (action === 'navigate' && payload) {
      if (payload.startsWith('/map')) {
        navigate(payload);
      } else {
        navigate(`/map?dest=${encodeURIComponent(payload)}`);
      }
    } else if (action === 'route' && payload) {
      if (payload.startsWith('tel:')) {
        window.location.href = payload;
      } else {
        navigate(payload);
      }
    } else if (action === 'send' && payload) {
      handleSend(payload);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 md:p-6 bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-amber-300/40">
            <Bot className="w-6 h-6 text-[#FFBA08]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base md:text-lg tracking-tight">VIT Campus Assistant</h2>
            </div>
            <p className="text-xs text-stone-200">
              {aiStatus.gemini_active
                ? 'Fine-tuned Gemini with live VIT directory grounding & map links'
                : 'Using internal VIT campus knowledge engine (add key for Gemini LLM)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowKeyModal(true)}
              className="p-2 text-[#FFBA08] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Configure Gemini API Key"
            >
              <Key className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-2 text-[#FFBA08] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Clear Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-50/50">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onQuickAction={handleQuickAction} />
        ))}

        {isTyping && (
          <div className="flex gap-3 my-4 items-center text-stone-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-[#03071E] border border-amber-400/30 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#FFBA08] animate-pulse" />
            </div>
            <div className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#9D0208] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#DC2F02] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#FAA307] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Bar */}
      <div className="px-4 py-2 bg-stone-100/80 border-t border-stone-200/60 overflow-x-auto flex gap-2 no-scrollbar">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-[#DC2F02]" /> Try asking:
        </span>
        {sampleAiQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1 bg-white hover:bg-amber-50 hover:text-[#9D0208] hover:border-amber-300 border border-stone-200 rounded-full text-xs text-stone-700 font-medium whitespace-nowrap transition-all shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 md:p-4 bg-white border-t border-stone-200 flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about VIT Vellore campus, rooms, or timetable..."
          className="flex-1 px-4 py-3 bg-stone-100 border border-stone-200 rounded-2xl text-xs md:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white transition-all"
        />
        <Button
          variant="primary"
          size="md"
          icon={<Send className="w-4 h-4" />}
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || isTyping}
        >
          Send
        </Button>
      </div>

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#9D0208] flex items-center justify-center">
                  <Key className="w-5 h-5 text-[#DC2F02]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#03071E] text-base">Gemini AI Configuration</h3>
                  <p className="text-xs text-stone-500">Fine-tuned for VIT Vellore CampusOS</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 mb-4 text-xs text-stone-600 space-y-1.5">
              <p className="font-semibold text-stone-800">
                Active Engine: <span className="text-[#9D0208]">{aiStatus.engine}</span>
              </p>
              <p>
                Connecting your Gemini key unlocks full conversational intelligence, multi-turn student advice, and auto-linked walking navigation across all 148+ VIT campus buildings.
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#DC2F02] font-semibold hover:underline mt-1"
              >
                Get a free Google Gemini API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-mono placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:bg-white"
                />
              </div>

              {keySaveSuccess && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Gemini API Key activated successfully!
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowKeyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim() || keySaving}
                >
                  {keySaving ? 'Saving...' : 'Save & Activate'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
