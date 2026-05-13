import { useState, useRef, useEffect } from 'react';
import { Bot, Mic, X, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/auth';

// Add type for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AIFAB({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');
  const [lastAction, setLastAction] = useState<any>(null);
  const [undoing, setUndoing] = useState(false);
  const navigate = useNavigate();

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInput(currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          // If input exists, we could auto-send here, but letting the user confirm is safer.
        };
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (navigator.vibrate) navigator.vibrate(50);
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    setResponse('');
    setLastAction(null);
    
    try {
      const res = await apiRequest('/api/ai-agent', {
        method: 'POST',
        body: JSON.stringify({ message: input, user_id: user.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResponse(data.message || 'Action completed.');
      if (data.result) setLastAction(data.result);
      
      // Handle Navigation action if returned
      if (data.action === 'NAVIGATE' && data.route) {
        setOpen(false);
        navigate(data.route);
      }
      
    } catch (err: any) {
      console.error(err);
      setResponse('Sorry, I encountered an error processing that request.');
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  return (
    <>
      {/* The Floating Button */}
      <div className="fixed bottom-20 right-4 z-[90]">
        <button 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setOpen(true);
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0_#0A0A0A] border-[3px] border-[#0A0A0A]"
          style={{ background: 'linear-gradient(135deg, #FF5C00, #FFD600)' }}
        >
          <Bot size={28} className="text-white" />
        </button>
      </div>

      {/* The Chat Overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          
          <div className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-black relative flex flex-col"
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            <div className="p-4 flex items-center justify-between border-b-2 border-black" style={{ background: '#FF5C00' }}>
              <div className="flex items-center gap-2 text-white">
                <Bot size={20} />
                <span className="font-black text-sm">LaunchPad Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center min-h-[200px] bg-slate-50">
              {response ? (
                <div className="text-center font-bold text-slate-800 text-lg mb-4 animate-fade-in">
                  {response}
                </div>
              ) : (
                <div className="text-center text-slate-500 font-bold mb-6">
                  {isListening ? "I'm listening..." : "How can I help you today?"}
                </div>
              )}

              {lastAction?.type === 'GOAL_CREATED' && (
                <div className="w-full mb-4 p-4 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0_#0A0A0A]">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Executed</p>
                  <p className="font-black text-sm text-slate-800">Created goal: {lastAction.title || 'New goal'}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setOpen(false); navigate('/profile'); }}
                      className="flex-1 nb-btn px-3 py-2 text-xs"
                      style={{ background: '#FFD600' }}
                    >
                      Open Profile
                    </button>
                    <button
                      disabled={undoing || !lastAction.goal_id}
                      onClick={async () => {
                        if (!lastAction.goal_id) return;
                        setUndoing(true);
                        try {
                          await apiRequest('/api/goals', { method: 'DELETE', body: JSON.stringify({ id: lastAction.goal_id }) });
                          setResponse('Undone — I deleted the goal.');
                          setLastAction(null);
                        } catch {
                          setResponse("I couldn't undo that right now.");
                        }
                        setUndoing(false);
                      }}
                      className="flex-1 nb-btn px-3 py-2 text-xs"
                      style={{ background: '#fff' }}
                    >
                      {undoing ? 'Undoing…' : 'Undo'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 w-full relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white border-2 border-black rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 ring-[#FF5C00]/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                
                {input.trim() ? (
                  <button 
                    onClick={handleSend}
                    disabled={isProcessing}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[#FF5C00] text-white rounded-2xl border-2 border-black hover:bg-[#E65300] transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                ) : (
                  <button 
                    onClick={toggleListen}
                    className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl border-2 border-black transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#FFD600] text-black hover:bg-[#FACC15]'}`}
                  >
                    <Mic size={20} />
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
      `}} />
    </>
  );
}
