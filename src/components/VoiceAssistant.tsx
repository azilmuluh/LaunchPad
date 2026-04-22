import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../lib/auth';
import { Mic, MicOff, X, Volume2, VolumeX, Loader, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceAssistant({ user, onClose }: any) {
  const [listening, setListening]   = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [thinking, setThinking]     = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages]     = useState<Message[]>([]);
  const [muted, setMuted]           = useState(false);
  const [supported, setSupported]   = useState(true);
  const [pulseLevel, setPulseLevel] = useState(0);

  const recogRef    = useRef<any>(null);
  const synthRef    = useRef<SpeechSynthesisUtterance | null>(null);
  const contextRef  = useRef<Message[]>([]);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const pulseTimer  = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        handleUserSpeech(t);
      }
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recogRef.current = recog;

    // Greeting
    const greet = `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I'm your LaunchPad voice assistant. Ask me to find opportunities, improve your profile, or guide you through the app.`;
    setMessages([{ role: 'assistant', content: greet }]);
    speak(greet);

    return () => {
      recog.abort();
      window.speechSynthesis.cancel();
      clearInterval(pulseTimer.current);
    };
  }, []);

  useEffect(() => {
    contextRef.current = messages;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = 1.05;
    utt.pitch = 1.0;
    utt.volume = 1;
    // Prefer a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')
    );
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => { setSpeaking(false); startListening(); };
    utt.onerror = () => setSpeaking(false);
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [muted]);

  const startListening = useCallback(() => {
    if (!recogRef.current || speaking || thinking) return;
    try {
      setTranscript('');
      setListening(true);
      recogRef.current.start();
      // Animate pulse
      let level = 0;
      pulseTimer.current = setInterval(() => {
        level = Math.random() * 100;
        setPulseLevel(level);
      }, 150);
    } catch {}
  }, [speaking, thinking]);

  const stopListening = () => {
    recogRef.current?.stop();
    setListening(false);
    clearInterval(pulseTimer.current);
    setPulseLevel(0);
  };

  const handleUserSpeech = async (text: string) => {
    if (!text.trim()) return;
    clearInterval(pulseTimer.current);
    setPulseLevel(0);
    setListening(false);
    setTranscript('');

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const context = contextRef.current.slice(-8);
      const res = await apiRequest('/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, context }),
      });

      if (!res.ok) throw new Error('AI error');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      setThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              full += parsed.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: full };
                return updated;
              });
            }
          } catch {}
        }
      }

      // Speak a condensed version (first 2 sentences)
      const spoken = full.split(/[.!?]/).slice(0, 2).join('. ').trim();
      if (spoken) speak(spoken + '.');

    } catch (err) {
      setThinking(false);
      const errMsg = 'Sorry, I had trouble processing that. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      speak(errMsg);
    }
  };

  const handleMicClick = () => {
    if (listening) stopListening();
    else startListening();
  };

  const toggleMute = () => {
    setMuted(m => !m);
    if (!muted) window.speechSynthesis.cancel();
  };

  if (!supported) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="nb-card p-8 max-w-sm w-full text-center">
        <Mic size={40} className="mx-auto mb-4" style={{ color: '#FF5C00' }} />
        <h3 className="font-black text-xl mb-2">Voice Not Supported</h3>
        <p className="font-bold text-sm mb-4" style={{ color: '#999' }}>
          Your browser doesn't support speech recognition. Try Chrome or Edge.
        </p>
        <button onClick={onClose} className="nb-btn nb-btn-orange px-6 py-2.5 text-sm">Close</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#F5F0E8', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: '#0B1E3D', borderBottom: '2.5px solid #0A0A0A' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#FF5C00', border: '2px solid #FFD600' }}>
              <Mic size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">Voice Assistant</p>
              <p className="text-xs font-bold" style={{ color: '#FFD600' }}>
                {thinking ? 'Thinking...' : speaking ? 'Speaking...' : listening ? 'Listening...' : 'Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute}
              className="nb-btn w-8 h-8 flex items-center justify-center"
              style={{ background: muted ? '#E53935' : '#fff', color: muted ? '#fff' : '#0A0A0A' }}>
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button onClick={onClose}
              className="nb-btn nb-btn-ghost w-8 h-8 flex items-center justify-center"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '300px', maxHeight: '400px' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black"
                style={msg.role === 'user'
                  ? { background: '#FF5C00', color: '#fff', border: '2px solid #0A0A0A' }
                  : { background: '#0B1E3D', color: '#FFD600', border: '2px solid #0A0A0A' }
                }>
                {msg.role === 'user' ? user?.full_name?.charAt(0)?.toUpperCase() : <Sparkles size={12} />}
              </div>
              <div className="max-w-xs rounded-2xl px-4 py-2.5 text-sm font-medium"
                style={msg.role === 'user'
                  ? { background: '#FF5C00', color: '#fff', borderBottomRightRadius: '4px', border: '2px solid #0A0A0A' }
                  : { background: '#fff', color: '#0A0A0A', borderBottomLeftRadius: '4px', border: '2px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }
                }>
                {msg.content || (thinking && i === messages.length - 1 ? '...' : '')}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#0B1E3D', color: '#FFD600', border: '2px solid #0A0A0A' }}>
                <Loader size={12} className="animate-spin" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl text-sm font-bold" style={{ background: '#fff', border: '2px solid #0A0A0A' }}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Live transcript */}
        {(listening || transcript) && (
          <div className="px-5 py-2" style={{ background: '#FFFBEB', borderTop: '2px solid #FFD600' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#92400E' }}>Hearing...</p>
            <p className="text-sm font-bold" style={{ color: '#0A0A0A', minHeight: '20px' }}>
              {transcript || 'Listening for your voice...'}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="px-5 py-4 flex items-center justify-center gap-4"
          style={{ borderTop: '2.5px solid #0A0A0A', background: '#fff' }}>

          {/* Waveform bars */}
          <div className="flex items-center gap-0.5 h-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1 rounded-full transition-all duration-100"
                style={{
                  height: listening ? `${8 + (Math.sin((Date.now() / 100) + i) + 1) * pulseLevel * 0.12}px` : '4px',
                  background: listening ? '#FF5C00' : '#ddd',
                  maxHeight: '32px',
                  minHeight: '4px',
                }} />
            ))}
          </div>

          {/* Big mic button */}
          <button
            onClick={handleMicClick}
            disabled={thinking || speaking}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: listening ? '#E53935' : '#FF5C00',
              border: '3px solid #0A0A0A',
              boxShadow: listening ? '0 0 0 6px rgba(229,57,53,0.25), 4px 4px 0 #0A0A0A' : '4px 4px 0 #0A0A0A',
            }}>
            {listening ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </button>

          <div className="flex items-center gap-0.5 h-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1 rounded-full transition-all duration-100"
                style={{
                  height: speaking ? `${8 + Math.abs(Math.sin((Date.now() / 80) + i * 0.8)) * 20}px` : '4px',
                  background: speaking ? '#0B1E3D' : '#ddd',
                  maxHeight: '32px',
                  minHeight: '4px',
                }} />
            ))}
          </div>
        </div>

        <p className="text-center text-xs font-bold pb-3" style={{ color: '#aaa' }}>
          {listening ? 'Tap mic to stop' : 'Tap mic to speak'}
        </p>
      </div>
    </div>
  );
}
