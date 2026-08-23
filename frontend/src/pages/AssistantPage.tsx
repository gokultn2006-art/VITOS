import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react';
import { sampleAiQuestions } from '../data/mockData';
import type { ChatMessage as ChatMessageType } from '../types';
import { aiAssistantService } from '../services/api';
import { ChatMessage } from '../components/ChatMessage';
import { Button } from '../components/Button';

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'msg_init',
      sender: 'assistant',
      text: "👋 Hi Chris! I am your **VIT CampusOS AI Assistant**.\nI can help you navigate to classrooms (e.g. TT-624), locate Medical Centre & printers, check empty study rooms, and review your schedule. How can I assist you today?",
      timestamp: 'Just now',
      quickActions: [
        { label: 'Where is TT-624?', action: 'send', payload: 'Where is TT-624?' },
        { label: 'Find Free Classroom', action: 'send', payload: 'Which classroom is free right now?' },
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
      navigate(`/map?dest=${payload}`);
    } else if (action === 'route' && payload) {
      navigate(payload);
    } else if (action === 'send' && payload) {
      handleSend(payload);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 md:p-6 bg-gradient-to-r from-[#005F73] to-[#0A9396] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <Bot className="w-6 h-6 text-[#94D2BD]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base md:text-lg tracking-tight">VIT Campus Assistant</h2>
              <span className="text-[10px] font-bold bg-[#94D2BD] text-[#005F73] px-2 py-0.5 rounded-full uppercase">
                Gemini AI Engine
              </span>
            </div>
            <p className="text-xs text-teal-100/90">Grounded with VIT Vellore campus data & schedule</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title="Clear Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onQuickAction={handleQuickAction} />
        ))}

        {isTyping && (
          <div className="flex gap-3 my-4 items-center text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-[#005F73] text-white flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#94D2BD] animate-pulse" />
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#005F73] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#0A9396] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#94D2BD] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Bar */}
      <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200/60 overflow-x-auto flex gap-2 no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-[#005F73]" /> Try asking:
        </span>
        {sampleAiQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1 bg-white hover:bg-teal-50 hover:text-[#005F73] border border-slate-200 rounded-full text-xs text-slate-700 font-medium whitespace-nowrap transition-all shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 md:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about VIT Vellore campus, rooms, or timetable..."
          className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white transition-all"
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
    </div>
  );
};
