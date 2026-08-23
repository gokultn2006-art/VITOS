import React from 'react';
import { Bot, User as UserIcon, Navigation2, ExternalLink } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';
import { Button } from './Button';

interface ChatMessageProps {
  message: ChatMessageType;
  onQuickAction?: (action: string, payload?: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onQuickAction }) => {
  const isAssistant = message.sender === 'assistant';

  return (
    <div className={`flex gap-3 my-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-[#005F73] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <Bot className="w-4 h-4 text-[#94D2BD]" />
        </div>
      )}

      <div className={`max-w-2xl ${isAssistant ? 'w-full' : ''}`}>
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
            isAssistant
              ? 'bg-white border border-slate-200/80 text-slate-800 shadow-xs'
              : 'bg-[#005F73] text-white rounded-br-none shadow-xs'
          }`}
        >
          <div className="whitespace-pre-line">{message.text}</div>

          {/* Suggested Locations */}
          {message.suggestedLocations && message.suggestedLocations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Related Campus Locations
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.suggestedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{loc.name}</p>
                      <p className="text-[10px] text-slate-500">{loc.category}</p>
                    </div>
                    {onQuickAction && (
                      <button
                        onClick={() => onQuickAction('navigate', loc.code)}
                        className="p-1.5 rounded-lg bg-[#005F73] text-white hover:bg-[#0A9396] transition-colors"
                        title="Navigate"
                      >
                        <Navigation2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Chips */}
          {message.quickActions && message.quickActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.quickActions.map((qa, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  icon={qa.action === 'navigate' ? <Navigation2 className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                  onClick={() => onQuickAction && onQuickAction(qa.action, qa.payload)}
                >
                  {qa.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[9px] text-slate-400 mt-1 px-1 inline-block">
          {message.timestamp}
        </span>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-[#0A9396] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <UserIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
