import React from 'react';
import { Bot, Navigation2, ExternalLink, MapPin, Send } from 'lucide-react';
import type { ChatMessage as ChatMessageType, ChatSuggestedLocation, CampusLocation } from '../types';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

interface ChatMessageProps {
  message: ChatMessageType;
  onQuickAction?: (action: string, payload?: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onQuickAction }) => {
  const { user } = useAuth();
  const isAssistant = message.sender === 'assistant';

  // Inline text formatter for links, bold, code, and accents
  const renderInline = (content: string, depth = 0): React.ReactNode => {
    if (depth > 2) return content;

    // Clean lonely trailing asterisks without breaking closing ** tags (e.g., **GDN**)
    const cleaned = content.replace(/(?<!\*)\b([A-Z0-9]{2,})\*(?!\*)/g, '$1');

    // Tokenizer matching markdown links (including bold-wrapped links **[text](url)**), bold **text**, inline `code`, and clean *italic*
    const tokenRegex = /((?:\*\*)?\[\s*[^\]]+?\s*\]\([^)]+\)(?:\*\*)?|\*\*[^*]+?\*\*|`[^`]+?`|(?<=\s|^)\*[^*\s][^*]*?[^*\s]\*(?=\s|[.,;:!?]|$))/g;
    const parts = cleaned.split(tokenRegex);

    return parts.map((part, pIdx) => {
      if (!part) return null;

      // 1. Link matching: [Label](URL), [ 📍 Label ](URL), or **[Label](URL)**
      const linkMatch = part.match(/^(?:\*\*)?\[\s*([^\]]+?)\s*\]\(([^)]+)\)(?:\*\*)?$/);
      if (linkMatch) {
        const rawLabel = linkMatch[1];
        const url = linkMatch[2];
        const cleanLabel = rawLabel.replace(/^[📍🗺️\s]+/, '').replace(/^\*\*|\*\*$/g, '').trim();

        return (
          <button
            key={pIdx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickAction) {
                onQuickAction('navigate', url);
              }
            }}
            className="inline-flex items-center gap-1.5 font-bold text-[#9D0208] bg-amber-50 hover:bg-amber-100 hover:text-[#6A040F] px-2.5 py-0.5 mx-1 my-0.5 rounded-lg border border-amber-300/80 transition-all text-xs cursor-pointer shadow-2xs group align-baseline font-sans active:scale-95"
            title="Open on Campus Map"
          >
            <MapPin className="w-3.5 h-3.5 text-[#DC2F02] group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-semibold">{cleanLabel}</span>
          </button>
        );
      }

      // 2. Bold matching: **text**
      const boldMatch = part.match(/^\*\*([^*]+?)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={pIdx} className="font-extrabold text-[#03071E]">
            {renderInline(boldMatch[1], depth + 1)}
          </strong>
        );
      }

      // 3. Inline code: `code`
      const codeMatch = part.match(/^`([^`]+?)`$/);
      if (codeMatch) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">
            {codeMatch[1]}
          </code>
        );
      }

      // 4. Italic matching: *text*
      const italicMatch = part.match(/^\*([^*]+?)\*$/);
      if (italicMatch) {
        return (
          <em key={pIdx} className="italic text-slate-700">
            {renderInline(italicMatch[1], depth + 1)}
          </em>
        );
      }

      return <React.Fragment key={pIdx}>{part}</React.Fragment>;
    });
  };

  // Block-level markdown formatter
  const renderFormattedText = (text: string) => {
    const rawLines = text.split('\n');
    const elements: React.ReactNode[] = [];

    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Empty line -> spacing
      if (!trimmed) {
        elements.push(<div key={`space_${idx}`} className="h-2" />);
        return;
      }

      // Horizontal rule: --- or ***
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`hr_${idx}`} className="my-3 border-t border-slate-200/80" />);
        return;
      }

      // Headings: ###, ##, #
      if (trimmed.startsWith('### ')) {
        const title = trimmed.replace(/^###\s+/, '');
        elements.push(
          <div key={`h3_${idx}`} className="mt-4 mb-2 pt-1 pb-1 flex items-center gap-2 border-b border-amber-200/70">
            <span className="w-1.5 h-4 rounded-full bg-[#DC2F02] inline-block shrink-0" />
            <h4 className="font-bold text-[#9D0208] text-sm tracking-tight">
              {renderInline(title)}
            </h4>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        const title = trimmed.replace(/^##\s+/, '');
        elements.push(
          <div key={`h2_${idx}`} className="mt-4 mb-2 pb-1 border-b border-stone-200/80">
            <h3 className="font-extrabold text-[#03071E] text-base">
              {renderInline(title)}
            </h3>
          </div>
        );
        return;
      }

      // Emergency / Alert Callout Banner
      if (trimmed.includes('🚨') || trimmed.startsWith('> ') || trimmed.includes('CRITICAL MEDICAL NOTE')) {
        const calloutText = trimmed.replace(/^>\s*/, '');
        elements.push(
          <div
            key={`callout_${idx}`}
            className="my-3 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs shadow-2xs leading-relaxed space-y-1"
          >
            {renderInline(calloutText)}
          </div>
        );
        return;
      }

      // Bullet List Item: * item, - item, • item
      const bulletMatch = trimmed.match(/^([*\-•])\s+(.+)$/);
      if (bulletMatch) {
        const itemContent = bulletMatch[2];
        elements.push(
          <div key={`bullet_${idx}`} className="flex items-start gap-2.5 my-1.5 pl-1 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2F02] mt-2 shrink-0 shadow-2xs" />
            <div className="flex-1 text-stone-800 text-xs md:text-sm">
              {renderInline(itemContent)}
            </div>
          </div>
        );
        return;
      }

      // Numbered List Item: 1. item, 2. item
      const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numMatch) {
        const num = numMatch[1];
        const itemContent = numMatch[2];
        elements.push(
          <div key={`num_${idx}`} className="flex items-start gap-2.5 my-1.5 pl-1 leading-relaxed">
            <span className="text-[11px] font-bold text-[#9D0208] bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-300/70 mt-0.5 shrink-0 shadow-2xs">
              {num}
            </span>
            <div className="flex-1 text-stone-800 text-xs md:text-sm">
              {renderInline(itemContent)}
            </div>
          </div>
        );
        return;
      }

      // Regular Paragraph
      const isIndented = line.startsWith('   ') || line.startsWith('  ');
      elements.push(
        <p key={`p_${idx}`} className={`my-1.5 text-slate-700 text-xs md:text-sm leading-relaxed ${isIndented ? 'pl-6 -mt-1 text-stone-600' : ''}`}>
          {renderInline(line)}
        </p>
      );
    });

    return elements;
  };

  const getNavigatePayload = (loc: CampusLocation | ChatSuggestedLocation): string => {
    const lat = (loc as any).latitude ?? (loc as any).lat;
    const lng = (loc as any).longitude ?? (loc as any).lng;
    if (lat != null && lng != null) {
      const nameEnc = encodeURIComponent(loc.name);
      return `/map?destName=${nameEnc}&lat=${lat}&lng=${lng}&destId=${loc.id}`;
    }
    if ((loc as any).code) {
      return `/map?dest=${encodeURIComponent((loc as any).code)}`;
    }
    return `/map?destName=${encodeURIComponent(loc.name)}`;
  };

  return (
    <div className={`flex gap-3 my-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-[#03071E] border border-amber-400/30 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
          <Bot className="w-4 h-4 text-[#FFBA08]" />
        </div>
      )}

      <div className={`max-w-2xl ${isAssistant ? 'w-full' : ''}`}>
        <div
          className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed ${
            isAssistant
              ? 'bg-white border border-stone-200/90 text-[#03071E] shadow-sm'
              : 'bg-gradient-to-r from-[#6A040F] to-[#9D0208] text-white rounded-br-none shadow-sm'
          }`}
        >
          <div className="space-y-1">
            {renderFormattedText(message.text)}
          </div>

          {/* Suggested Locations */}
          {message.suggestedLocations && message.suggestedLocations.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-stone-100 space-y-2.5">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#9D0208]" />
                <span>Recommended Campus Locations</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {message.suggestedLocations.map((loc) => {
                  const subtext = (loc as any).building || (loc as any).location_name || loc.category || 'Campus Facility';
                  const payload = getNavigatePayload(loc);

                  return (
                    <div
                      key={String(loc.id)}
                      className="bg-stone-50/80 hover:bg-amber-50/60 p-3 rounded-xl border border-stone-200/80 hover:border-amber-300 transition-all flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#03071E] text-xs truncate">{loc.name}</p>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5">{subtext}</p>
                      </div>
                      {onQuickAction && (
                        <button
                          onClick={() => onQuickAction('navigate', payload)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#9D0208] hover:bg-[#6A040F] text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 cursor-pointer"
                          title="Open on Navigation Map"
                        >
                          <Navigation2 className="w-3 h-3 text-[#FFBA08]" />
                          <span>Map</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action Chips */}
          {message.quickActions && message.quickActions.length > 0 && (
            <div className="mt-3.5 pt-2 flex flex-wrap gap-2">
              {message.quickActions.map((qa, idx) => {
                const isNav = qa.action === 'navigate';
                const isSend = qa.action === 'send';
                return (
                  <Button
                    key={idx}
                    variant={isNav ? 'primary' : 'outline'}
                    size="sm"
                    icon={
                      isNav ? (
                        <Navigation2 className="w-3 h-3 text-[#FFBA08]" />
                      ) : isSend ? (
                        <Send className="w-3 h-3 text-[#9D0208]" />
                      ) : (
                        <ExternalLink className="w-3 h-3" />
                      )
                    }
                    onClick={() => onQuickAction && onQuickAction(qa.action, qa.payload)}
                  >
                    {qa.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <span className="text-[10px] font-medium text-stone-400 mt-1 px-1 inline-block">
          {message.timestamp}
        </span>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs mt-1">
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt={user?.name || 'User'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};
