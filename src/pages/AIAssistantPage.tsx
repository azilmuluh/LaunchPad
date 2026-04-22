import { useState, useRef, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/auth';
import { useLocation } from 'react-router-dom';
import {
  Send, Bot, Trash2, RefreshCw, Paperclip, Smile,
  Target, X, Image, FileText, Mic, ChevronDown
} from 'lucide-react';

// ── Emoji picker (inline, no external lib) ────────────────────────────────────
const EMOJI_GROUPS = [
  { label: 'Smileys', emojis: ['😀','😂','😊','🥰','😎','🤔','😅','🙏','🔥','💪','👏','✅','⭐','🎉','🚀','💡','📚','🎓','💼','🏆'] },
  { label: 'Hands',   emojis: ['👍','👎','👋','🤝','✌️','🤞','💯','👌','🫡','🙌','🫶','💪','🤜','🤛','👊','✊','🫵','👆','👇','👉'] },
  { label: 'Objects', emojis: ['📝','📄','📊','📈','💻','📱','🎯','🗓️','⏰','🔑','💰','🌍','🏫','🏥','✈️','🎪','🎭','🎨','🎵','🎮'] },
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  return (
    <div className="absolute bottom-full mb-2 left-0 z-50 nb-card p-3 w-72" style={{ background: '#fff' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {EMOJI_GROUPS.map((g, i) => (
            <button key={i} onClick={() => setTab(i)}
              className="px-2 py-1 rounded text-xs font-bold transition-all"
              style={tab === i ? { background: '#FF5C00', color: '#fff' } : { color: '#666' }}>
              {g.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <div className="grid grid-cols-10 gap-0.5">
        {EMOJI_GROUPS[tab].emojis.map(e => (
          <button key={e} onClick={() => onSelect(e)}
            className="text-xl hover:bg-gray-100 rounded p-0.5 transition-all">{e}</button>
        ))}
      </div>
    </div>
  );
}

// ── Message formatter ─────────────────────────────────────────────────────────
function formatMsg(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<p class="font-black text-sm mt-2 mb-1" style="color:#FF5C00">$1</p>')
    .replace(/^## (.+)$/gm, '<p class="font-black text-base mt-3 mb-1">$1</p>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:16px;margin-bottom:4px">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:16px;margin-bottom:4px"><strong>$1.</strong> $2</li>')
    .replace(/\n/g, '<br />');
}

type Msg = {
  role: string;
  content: string;
  streaming?: boolean;
  image?: string;   // data URL preview
  filename?: string;
};

export default function AIAssistantPage({ user }: any) {
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: `Hey ${user.full_name?.split(' ')[0]}! 👋 I'm your LaunchPad AI — your personal opportunity advisor.\n\nI can help you:\n- **Find scholarships, internships & competitions** tailored to your profile\n- **Break down your goals** into actionable steps\n- **Review essays, CVs, and applications**\n- **Prepare for interviews** and competitions\n\nWhat would you like to work on today?`,
  }]);
  const [input,      setInput]      = useState('');
  const [streaming,  setStreaming]  = useState(false);
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [goals,      setGoals]      = useState<any[]>([]);
  const [showGoals,  setShowGoals]  = useState(false);
  const [attachment, setAttachment] = useState<{ base64: string; name: string; preview?: string } | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const location   = useLocation();

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Handle navigation state (e.g. from Goals page)
  useEffect(() => {
    const state = location.state as any;
    if (state?.prompt) {
      setTimeout(() => sendMessage(state.prompt), 300);
      window.history.replaceState({}, '');
    }
  }, []);

  // Load goals for context
  useEffect(() => {
    apiRequest('/api/goals').then(r => r.json()).then(d => { if (Array.isArray(d)) setGoals(d); }).catch(() => {});
  }, []);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      setAttachment({
        base64,
        name: file.name,
        preview: file.type.startsWith('image/') ? base64 : undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if ((!content && !attachment) || streaming) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setShowEmoji(false);

    const userMsg: Msg = {
      role: 'user',
      content: content || (attachment ? `[Attached: ${attachment.name}]` : ''),
      image: attachment?.preview,
      filename: attachment?.name,
    };
    const imageBase64 = attachment?.base64 || null;
    setAttachment(null);

    const context = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }]);
    setStreaming(true);

    try {
      const res = await apiRequest('/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify({ message: content, context, imageBase64, goals }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'AI error'); }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const p = JSON.parse(data);
            if (p.content) {
              acc += p.content;
              setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: acc, streaming: true }; return u; });
            }
          } catch {}
        }
      }
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: acc, streaming: false }; return u; });
    } catch (err: any) {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `Sorry, I ran into an error: ${err.message}. Please try again.`, streaming: false }; return u; });
    } finally {
      setStreaming(false);
    }
  }, [input, attachment, streaming, messages, goals]);

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: `Hey ${user.full_name?.split(' ')[0]}! What can I help you with?`,
  }]);

  const QUICK = [
    'Help me find a fully funded scholarship for 2026',
    'Review my CV and suggest improvements',
    'Break down my goal into action steps',
    'How do I prepare for IYMC 2026?',
    'What competitions suit my profile?',
    'Help me write a scholarship essay',
  ];

  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px)', background: '#F5F0E8' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ background: '#0B1E3D', borderBottom: '2.5px solid #0A0A0A' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: '#FF5C00', border: '2px solid #FFD600' }}>
            <Bot size={16} className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: '#00C853', border: '1.5px solid #0B1E3D' }} />
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">LaunchPad AI</p>
            <p className="font-bold" style={{ color: '#00C853', fontSize: '10px' }}>Online · NVIDIA Powered</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {goals.length > 0 && (
            <button onClick={() => setShowGoals(g => !g)}
              className="nb-btn px-2.5 py-1.5 text-xs flex items-center gap-1.5"
              style={{ background: 'rgba(255,214,0,0.15)', color: '#FFD600', borderColor: 'rgba(255,214,0,0.4)' }}>
              <Target size={11} /> {goals.length} Goal{goals.length !== 1 ? 's' : ''}
            </button>
          )}
          <button onClick={clearChat}
            className="nb-btn px-2.5 py-1.5 text-xs flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            <Trash2 size={11} /> Clear
          </button>
        </div>
      </div>

      {/* Goals panel */}
      {showGoals && goals.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3" style={{ background: '#FFFBEB', borderBottom: '2px solid #FFD600' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#92400E' }}>Your Active Goals</p>
          <div className="flex flex-wrap gap-2">
            {goals.filter(g => g.status === 'active').map(g => (
              <button key={g.id} onClick={() => { sendMessage(`Tell me the next steps I should take toward my goal: "${g.title}"`); setShowGoals(false); }}
                className="nb-btn px-3 py-1.5 text-xs flex items-center gap-1.5"
                style={{ background: '#fff', color: '#0A0A0A' }}>
                <Target size={10} style={{ color: '#FF5C00' }} /> {g.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ overscrollBehavior: 'contain' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-white text-xs"
              style={msg.role === 'user'
                ? { background: '#FF5C00', border: '2px solid #0A0A0A' }
                : { background: '#0B1E3D', border: '2px solid #0A0A0A' }
              }>
              {msg.role === 'user' ? (user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover rounded-xl" /> : initials) : <Bot size={13} />}
            </div>

            {/* Bubble */}
            <div className="max-w-[80%] sm:max-w-[70%]">
              {/* Image attachment preview */}
              {msg.image && (
                <div className="mb-1 rounded-xl overflow-hidden" style={{ border: '2px solid #0A0A0A', maxWidth: '200px' }}>
                  <img src={msg.image} alt="attachment" className="w-full object-cover" />
                </div>
              )}
              {msg.filename && !msg.image && (
                <div className="mb-1 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold"
                  style={{ background: '#EFF6FF', border: '2px solid #BFDBFE', color: '#1D4ED8' }}>
                  <FileText size={12} /> {msg.filename}
                </div>
              )}
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-relaxed font-medium"
                style={msg.role === 'user'
                  ? { background: '#FF5C00', color: '#fff', borderBottomRightRadius: '4px', border: '2px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
                  : { background: '#fff', color: '#0A0A0A', borderBottomLeftRadius: '4px', border: '2px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
                }>
                {msg.role === 'assistant'
                  ? <div dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }} />
                  : <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                }
                {msg.streaming && (
                  <span className="inline-flex gap-0.5 ml-1">
                    {[0,1,2].map(j => <span key={j} className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: `${j*0.15}s` }} />)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="pt-2">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#aaa' }}>Quick Start</p>
            <div className="flex flex-col gap-1.5">
              {QUICK.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="nb-btn text-left px-3 py-2 text-xs w-full"
                  style={{ background: '#fff', color: '#0A0A0A' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0" style={{ background: '#F5F0E8', borderTop: '2.5px solid #0A0A0A', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Attachment preview */}
        {attachment && (
          <div className="px-4 pt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#EFF6FF', border: '2px solid #BFDBFE', color: '#1D4ED8' }}>
              {attachment.preview ? <Image size={12} /> : <FileText size={12} />}
              {attachment.name}
            </div>
            <button onClick={() => setAttachment(null)} className="nb-btn nb-btn-ghost p-1">
              <X size={12} />
            </button>
          </div>
        )}

        <div className="px-4 py-3 relative">
          {showEmoji && (
            <EmojiPicker
              onSelect={e => { setInput(p => p + e); inputRef.current?.focus(); }}
              onClose={() => setShowEmoji(false)}
            />
          )}

          <div className="flex items-end gap-2">
            {/* Toolbar */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-1">
              <button onClick={() => setShowEmoji(e => !e)}
                className="nb-btn nb-btn-ghost w-9 h-9 flex items-center justify-center"
                style={showEmoji ? { background: '#FFD600', borderColor: '#FFD600' } : {}}>
                <Smile size={16} />
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="nb-btn nb-btn-ghost w-9 h-9 flex items-center justify-center">
                <Paperclip size={16} />
              </button>
              <input ref={fileRef} type="file" className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            </div>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Ask anything... (Shift+Enter for new line)"
              disabled={streaming}
              rows={1}
              className="nb-input flex-1 text-sm resize-none disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto', lineHeight: '1.5', paddingTop: '10px', paddingBottom: '10px' }}
            />

            {/* Send */}
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !attachment) || streaming}
              className="nb-btn nb-btn-orange w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-40">
              {streaming ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
