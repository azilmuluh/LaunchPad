import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import {
  ArrowLeft, ExternalLink, CheckCircle2, Circle, Sparkles,
  FileText, MessageSquare, Send, Loader2, Download, Share2,
  Clock, Target, TrendingUp, Zap
} from 'lucide-react';
import SEO from '../components/SEO';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Application {
  id: string;
  opportunity_id: string;
  user_id: string;
  status: 'draft' | 'in_progress' | 'submitted' | 'accepted' | 'rejected';
  progress: number;
  checklist: ChecklistItem[];
  ai_plan?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

export default function ApplicationWorkspacePage({ user }: any) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [opportunity, setOpportunity] = useState<any>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Plan
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState('');

  // AI Chat Companion
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchOpportunityAndApplication();
  }, [id]);

  useEffect(() => {
    if (checklist.length > 0) {
      const completed = checklist.filter(item => item.completed).length;
      const newProgress = Math.round((completed / checklist.length) * 100);
      setProgress(newProgress);
      
      // Save to backend
      if (application) {
        updateApplication({ progress: newProgress, checklist });
      }
    }
  }, [checklist]);

  const fetchOpportunityAndApplication = async () => {
    setLoading(true);
    setError('');
    try {
      if (!id) {
        setError('No opportunity ID provided');
        return;
      }

      // First, try to get opportunity from localStorage (instant)
      const cachedOpp = localStorage.getItem(`lp_opp_${id}`);
      let oppData = null;
      
      if (cachedOpp) {
        try {
          oppData = JSON.parse(cachedOpp);
          console.log('[ApplicationWorkspace] Using cached opportunity:', oppData.title);
        } catch (e) {
          console.error('[ApplicationWorkspace] Failed to parse cached opportunity:', e);
        }
      }

      // If not in cache, try to fetch from API (this will likely 404 for now)
      if (!oppData) {
        const oppRes = await apiRequest(`/api/opportunities?id=${id}`);
        
        if (oppRes.ok) {
          const data = await oppRes.json();
          // API returns array, find matching ID
          if (data.items && Array.isArray(data.items)) {
            oppData = data.items.find((item: any) => item.id === id);
          }
        }
      }

      if (!oppData) {
        throw new Error('Opportunity not found. Please go back and click the opportunity again.');
      }

      // Verify we have the right opportunity
      if (oppData.id !== id) {
        console.warn(`[ApplicationWorkspace] ID mismatch: requested ${id}, got ${oppData.id}`);
      }

      setOpportunity(oppData);
      
      // Fetch or create application using the CORRECT item_id
      const appRes = await apiRequest(`/api/applications?item_id=${oppData.id}`);
      if (appRes.ok) {
        const appData = await appRes.json();
      
        // The API returns { application: ..., community_applications: ... }
        if (appData.application) {
          // Application exists
          const app = appData.application;
          setApplication(app);
          setChecklist(app.checklist || getDefaultChecklist());
          setAiPlan(app.ai_plan || '');
          setProgress(app.progress || 0);
        } else {
          // Create new application with correct item_id and opportunity snapshot
          const createRes = await apiRequest('/api/applications', {
            method: 'POST',
            body: JSON.stringify({
              item_id: oppData.id,
              opportunity: oppData,
              status: 'draft',
              checklist: getDefaultChecklist()
            })
          });
          if (createRes.ok) {
            const newApp = await createRes.json();
            setApplication(newApp);
            setChecklist(newApp.checklist || getDefaultChecklist());
            setAiPlan(newApp.ai_plan || '');
            setProgress(newApp.progress || 0);
          } else {
            const errorData = await createRes.json();
            throw new Error(errorData.error || 'Failed to create application');
          }
        }
      } else {
        const errorData = await appRes.json();
        throw new Error(errorData.error || 'Failed to fetch application data');
      }
    } catch (e: any) {
      console.error('[ApplicationWorkspace] Fetch error:', e);
      setError(e.message || 'Failed to load application workspace');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklist = (): ChecklistItem[] => {
    return [
      { id: '1', text: 'Review all eligibility requirements', completed: false },
      { id: '2', text: 'Gather required documents (ID, transcripts, certificates)', completed: false },
      { id: '3', text: 'Draft motivation letter/personal statement', completed: false },
      { id: '4', text: 'Request recommendation letters', completed: false },
      { id: '5', text: 'Prepare CV/Resume', completed: false },
      { id: '6', text: 'Complete online application form', completed: false },
      { id: '7', text: 'Proofread all materials', completed: false },
      { id: '8', text: 'Submit application before deadline', completed: false },
      { id: '9', text: 'Save confirmation email/receipt', completed: false },
      { id: '10', text: 'Follow up if required', completed: false },
    ];
  };

  const updateApplication = async (updates: Partial<Application>) => {
    if (!application || !opportunity) return;
    
    try {
      await apiRequest(`/api/applications`, {
        method: 'PUT',
        body: JSON.stringify({
          item_id: opportunity.id,
          ...updates
        })
      });
    } catch (e) {
      console.error('Failed to update application:', e);
    }
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
  };

  const generateAIPlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'generate_plan',
          item_id: opportunity.id,
          opportunity
        })
      });
      const data = await res.json();
      setAiPlan(data.ai_plan || 'Your personalized application strategy has been generated!');
      
      if (application) {
        setApplication(data);
        updateApplication({ ai_plan: data.ai_plan });
      }
    } catch (e) {
      console.error('Failed to generate AI plan:', e);
      setAiPlan('Failed to generate plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await apiRequest('/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: chatInput,
          context: {
            opportunity,
            application,
            checklist
          }
        })
      });
      const data = await res.json();
      
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: data.response || 'I can help you with your application. What would you like to know?' 
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      const errorMessage = { 
        role: 'assistant' as const, 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (progress < 100) {
      const confirm = window.confirm(
        `You've only completed ${progress}% of your checklist. Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    const finalConfirm = window.confirm(
      'Ready to submit? This will:\n' +
      '1. Mark your application as submitted\n' +
      '2. Save your progress\n' +
      '3. Redirect you to the official application page\n\n' +
      'Continue?'
    );

    if (!finalConfirm) return;

    try {
      // Update application status
      await updateApplication({ 
        status: 'submitted', 
        updated_at: new Date().toISOString() 
      });

      // Redirect to official application page
      if (opportunity.link) {
        window.open(opportunity.link, '_blank');
      }

      // Navigate back to feed
      setTimeout(() => {
        navigate('/feed');
      }, 1000);
    } catch (e) {
      console.error('Failed to submit application:', e);
      alert('Failed to track submission. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-black mb-4">Application Not Found</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>{error}</p>
          <button onClick={() => navigate('/feed')} className="nb-btn nb-btn-orange px-6 py-3">
            <ArrowLeft size={16} className="mr-2" />
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      <SEO
        title={`Apply - ${opportunity.title}`}
        description={`Application workspace for ${opportunity.title}`}
        noindex
      />

      {/* Header */}
      <div className="sticky top-0 z-40 border-b-2" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-bold hover:opacity-70"
              style={{ color: 'var(--ink)' }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}>
                <TrendingUp size={14} style={{ color: '#FF5C00' }} />
                <span className="text-xs font-black">{progress}% Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Opportunity Summary */}
            <div className="nb-card p-6">
              <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--ink)' }}>
                {opportunity.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm font-bold mb-4" style={{ color: 'var(--muted)' }}>
                {opportunity.deadline && (
                  <span className="flex items-center gap-1.5 text-orange-600">
                    <Clock size={14} /> Deadline: {opportunity.deadline}
                  </span>
                )}
                {opportunity.location && (
                  <span className="flex items-center gap-1.5">
                    <Target size={14} /> {opportunity.location}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium leading-relaxed mb-4" style={{ color: 'var(--ink)' }}>
                {opportunity.description || opportunity.snippet}
              </p>
            </div>

            {/* Requirements Summary */}
            <div className="nb-card p-6">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <FileText size={20} style={{ color: '#FF5C00' }} />
                Requirements Summary
              </h2>
              
              {opportunity.eligibility && (
                <div className="mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                    Eligibility
                  </h3>
                  <div className="space-y-2">
                    {opportunity.eligibility.split('•').filter(Boolean).map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        <CheckCircle2 size={14} className="mt-0.5" style={{ color: '#065F46' }} />
                        {item.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {opportunity.benefits && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                    Benefits
                  </h3>
                  <div className="space-y-2">
                    {opportunity.benefits.split('•').filter(Boolean).map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        <Zap size={14} className="mt-0.5" style={{ color: '#FF5C00' }} />
                        {item.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Engine - Interactive Checklist */}
            <div className="nb-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                  <Target size={20} style={{ color: '#FF5C00' }} />
                  Application Checklist
                </h2>
                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#FFF3EE', color: '#FF5C00' }}>
                  {progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 rounded-full mb-6" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    background: 'linear-gradient(90deg, #FF5C00, #FF8C42)', 
                    width: `${progress}%`,
                    boxShadow: progress > 0 ? '0 2px 8px rgba(255, 92, 0, 0.3)' : 'none'
                  }}
                />
              </div>

              <div className="space-y-3">
                {checklist.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className="w-full flex items-start gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: item.completed ? '#F0FDF4' : 'var(--surface)',
                      border: `2.5px solid ${item.completed ? '#BBF7D0' : 'var(--border)'}`,
                    }}
                  >
                    {item.completed ? (
                      <CheckCircle2 size={20} style={{ color: '#14532D' }} />
                    ) : (
                      <Circle size={20} style={{ color: 'var(--muted)' }} />
                    )}
                    <span
                      className="text-left text-sm font-bold flex-1"
                      style={{
                        color: item.completed ? '#14532D' : 'var(--ink)',
                        textDecoration: item.completed ? 'line-through' : 'none'
                      }}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generated Plan */}
            {aiPlan && (
              <div className="nb-card p-6">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                  <Sparkles size={20} style={{ color: '#FF5C00' }} />
                  Your AI Application Strategy
                </h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>
                    {aiPlan}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI Companion & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Actionable Controls */}
            <div className="nb-card p-6 sticky top-24 space-y-3">
              <h3 className="text-lg font-black mb-4" style={{ color: 'var(--ink)' }}>
                Quick Actions
              </h3>

              {!aiPlan && (
                <button
                  onClick={generateAIPlan}
                  disabled={generatingPlan}
                  className="nb-btn nb-btn-orange w-full py-3 flex items-center justify-center gap-2"
                >
                  {generatingPlan ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate AI Plan
                    </>
                  )}
                </button>
              )}

              {opportunity.link && (
                <a
                  href={opportunity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-btn w-full py-3 flex items-center justify-center gap-2"
                  style={{ background: '#001F3F', color: '#fff', borderColor: '#001F3F' }}
                >
                  <ExternalLink size={16} />
                  Official Apply Page
                </a>
              )}

              <button
                onClick={handleSubmitApplication}
                className="nb-btn w-full py-3 flex items-center justify-center gap-2"
                style={{ 
                  background: progress === 100 ? '#14532D' : 'var(--surface)', 
                  color: progress === 100 ? '#fff' : 'var(--ink)',
                  borderColor: progress === 100 ? '#14532D' : 'var(--border)'
                }}
              >
                <CheckCircle2 size={16} />
                {progress === 100 ? 'Submit Application' : 'Mark as Submitted'}
              </button>

              <button
                className="nb-btn nb-btn-ghost w-full py-2 flex items-center justify-center gap-2 text-xs"
              >
                <Share2 size={14} />
                Share Progress
              </button>
            </div>

            {/* AI Companion Sidebar */}
            <div className="nb-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF5C00, #FF8C42)' }}>
                  <MessageSquare size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: 'var(--ink)' }}>
                    AI Co-Pilot
                  </h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Refine your essays & CV
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {chatMessages.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                      Ask me to review your motivation letter, suggest improvements, or answer questions!
                    </p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl ${
                      msg.role === 'user' 
                        ? 'ml-auto bg-[#FF5C00] text-white' 
                        : 'mr-auto'
                    }`}
                    style={msg.role === 'assistant' ? { background: 'var(--surface)', border: '2px solid var(--border)' } : {}}
                  >
                    <p className="text-sm font-medium whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                    <Loader2 size={14} className="animate-spin" />
                    AI is typing...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="space-y-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="e.g., Can you review my motivation letter draft?"
                  className="nb-input w-full min-h-[80px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="nb-btn nb-btn-orange w-full py-2 flex items-center justify-center gap-2"
                >
                  {chatLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      Send
                    </>
                  )}
                </button>
              </div>

              {/* Quick Prompts */}
              <div className="mt-4 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Quick Prompts:
                </p>
                {[
                  'Review my motivation letter',
                  'Suggest CV improvements',
                  'Help with eligibility check',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setChatInput(prompt);
                      setTimeout(() => sendChatMessage(), 100);
                    }}
                    className="w-full text-left text-xs font-bold p-2 rounded-lg transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
