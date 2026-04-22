import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/auth';
import {
  ArrowLeft, Users, MessageCircle, CheckSquare, BookOpen,
  Send, Plus, Trash2, ExternalLink, Clock, Lock, Globe,
  UserMinus, AlertTriangle, X, Check
} from 'lucide-react';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${dy}d`;
}

type Space = 'chat' | 'tasks' | 'resources' | 'members';

export default function CirclePage({ user }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle,   setCircle]   = useState<any>(null);
  const [members,  setMembers]  = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [space,    setSpace]    = useState<Space>('chat');
  const [loading,  setLoading]  = useState(true);

  // Chat
  const [messages,  setMessages]  = useState<any[]>([]);
  const [msgText,   setMsgText]   = useState('');
  const [sending,   setSending]   = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Tasks
  const [tasks,       setTasks]       = useState<any[]>([]);
  const [myCompletions, setMyCompletions] = useState<number[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm,    setTaskFormData] = useState({ title: '', description: '', due_date: '', xp_reward: 20 });

  // Resources
  const [resources,   setResources]   = useState<any[]>([]);
  const [showResForm, setShowResForm] = useState(false);
  const [resForm,     setResFormData] = useState({ title: '', url: '', description: '', type: 'link' });

  const isAdmin = isCreator;
  const setTaskField = (k: string, v: any) => setTaskFormData(f => ({ ...f, [k]: v }));
  const setResField  = (k: string, v: any) => setResFormData(f => ({ ...f, [k]: v }));

  useEffect(() => { loadCircle(); }, [id]);

  useEffect(() => {
    if (space === 'chat' && isMember) loadMessages();
    if (space === 'tasks') loadTasks();
    if (space === 'resources') loadResources();
  }, [space, isMember]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const loadCircle = async () => {
    setLoading(true);
    try {
      const r = await apiRequest(`/api/circles?action=get&id=${id}`);
      const d = await r.json();
      setCircle(d.circle);
      setMembers(d.members || []);
      setIsMember(d.isMember || false);
      setIsCreator(d.isCreator || false);
      setTasks(d.tasks || []);
      setResources(d.resources || []);
      setMyCompletions(d.myCompletions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadMessages = async () => {
    const r = await apiRequest(`/api/circles?action=messages&circle_id=${id}`);
    const d = await r.json();
    if (Array.isArray(d)) setMessages(d);
  };

  const loadTasks = async () => {
    const r = await apiRequest(`/api/circles?action=get&id=${id}`);
    const d = await r.json();
    if (d.tasks) setTasks(d.tasks);
  };

  const loadResources = async () => {
    const r = await apiRequest(`/api/circles?action=get&id=${id}`);
    const d = await r.json();
    if (d.resources) setResources(d.resources);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || sending) return;
    setSending(true);
    try {
      const r = await apiRequest('/api/circles?action=message', {
        method: 'POST',
        body: JSON.stringify({ circle_id: id, content: msgText.trim() }),
      });
      const d = await r.json();
      if (r.ok) { setMessages(p => [...p, d]); setMsgText(''); }
    } catch {}
    setSending(false);
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) return;
    const r = await apiRequest('/api/circles?action=task', {
      method: 'POST',
      body: JSON.stringify({ circle_id: id, ...taskForm }),
    });
    const d = await r.json();
    if (r.ok) { setTasks(p => [d, ...p]); setShowTaskForm(false); setTaskFormData({ title: '', description: '', due_date: '', xp_reward: 20 }); }
  };

  const completeTask = async (taskId: number) => {
    if (myCompletions.includes(taskId)) return;
    const r = await apiRequest('/api/circles?action=complete-task', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, circle_id: id }),
    });
    if (r.ok) setMyCompletions(p => [...p, taskId]);
  };

  const addResource = async () => {
    if (!resForm.title.trim() || !resForm.url.trim()) return;
    const r = await apiRequest('/api/circles?action=resource', {
      method: 'POST',
      body: JSON.stringify({ circle_id: id, ...resForm }),
    });
    const d = await r.json();
    if (r.ok) { setResources(p => [d, ...p]); setShowResForm(false); setResFormData({ title: '', url: '', description: '', type: 'link' }); }
  };

  const kickMember = async (targetId: number) => {
    if (!confirm('Remove this member from the circle?')) return;
    await apiRequest('/api/circles?action=kick', {
      method: 'DELETE',
      body: JSON.stringify({ circle_id: id, target_user_id: targetId }),
    });
    setMembers(p => p.filter(m => m.user_id !== targetId));
  };

  const leaveCircle = async () => {
    if (!confirm('Leave this circle?')) return;
    await apiRequest('/api/circles?action=leave', {
      method: 'DELETE',
      body: JSON.stringify({ circle_id: id }),
    });
    navigate('/community');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#F5F0E8' }}>
      <div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!circle) return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <p className="font-black text-xl mb-4" style={{ color: '#0A0A0A' }}>Circle not found</p>
      <button onClick={() => navigate('/community')} className="nb-btn nb-btn-orange px-5 py-2.5 text-sm">Back</button>
    </div>
  );

  if (!isMember) return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <div className="nb-card p-8">
        <Lock size={40} className="mx-auto mb-4" style={{ color: '#FF5C00' }} />
        <h2 className="font-black text-xl mb-2" style={{ color: '#0A0A0A' }}>Members Only</h2>
        <p className="font-bold text-sm mb-6" style={{ color: '#666' }}>Join this circle to access the chat, tasks, and resources.</p>
        <button onClick={() => navigate('/community')} className="nb-btn nb-btn-orange px-5 py-2.5 text-sm">Back to Community</button>
      </div>
    </div>
  );

  const SPACES: { id: Space; icon: any; label: string }[] = [
    { id: 'chat',      icon: MessageCircle, label: 'Chat'      },
    { id: 'tasks',     icon: CheckSquare,   label: 'Tasks'     },
    { id: 'resources', icon: BookOpen,      label: 'Resources' },
    { id: 'members',   icon: Users,         label: 'Members'   },
  ];

  const INP = 'nb-input w-full';
  const LBL = 'block text-xs font-black uppercase tracking-widest mb-1.5';

  return (
    <div className="flex flex-col h-screen" style={{ background: '#F5F0E8' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3" style={{ background: '#F5F0E8', borderBottom: '2.5px solid #0A0A0A' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/community')} className="nb-btn nb-btn-ghost p-1.5">
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                {circle.is_private ? <Lock size={12} style={{ color: '#999' }} /> : <Globe size={12} style={{ color: '#00C853' }} />}
                <h1 className="font-black text-base" style={{ color: '#0A0A0A' }}>{circle.name}</h1>
                {isAdmin && <span className="nb-badge" style={{ color: '#FF5C00', borderColor: '#FF5C00', background: '#FFF3EE' }}>Admin</span>}
              </div>
              <p className="text-xs font-bold" style={{ color: '#999' }}>{members.length} members</p>
            </div>
          </div>
          {!isAdmin && (
            <button onClick={leaveCircle} className="nb-btn nb-btn-ghost px-3 py-1.5 text-xs" style={{ color: '#E53935' }}>
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Space tabs */}
      <div className="flex-shrink-0 px-4 py-2" style={{ borderBottom: '2px solid #e0ddd6' }}>
        <div className="max-w-3xl mx-auto flex gap-1.5">
          {SPACES.map(({ id: sid, icon: Icon, label }) => (
            <button key={sid} onClick={() => setSpace(sid)}
              className="nb-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
              style={space === sid
                ? { background: '#0B1E3D', color: '#fff', borderColor: '#0B1E3D' }
                : { background: '#fff', color: '#0A0A0A' }
              }>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Space content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto h-full flex flex-col px-4">

          {/* CHAT */}
          {space === 'chat' && (
            <>
              <div ref={chatRef} className="flex-1 overflow-y-auto py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <MessageCircle size={32} className="mx-auto mb-2" style={{ color: '#ddd' }} />
                    <p className="font-bold text-sm" style={{ color: '#999' }}>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map(m => {
                  const isMe = m.user_id === user.id;
                  return (
                    <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black text-white"
                        style={{ background: `hsl(${(m.user_name?.charCodeAt(0)||200)%360},55%,38%)`, border: '1.5px solid #0A0A0A' }}>
                        {m.user_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && <span className="text-xs font-black mb-0.5" style={{ color: '#666' }}>{m.user_name}</span>}
                        <div className="px-3 py-2 rounded-xl text-sm font-medium"
                          style={isMe
                            ? { background: '#FF5C00', color: '#fff', border: '2px solid #0A0A0A', borderRadius: '12px 12px 4px 12px' }
                            : { background: '#fff', color: '#0A0A0A', border: '2px solid #0A0A0A', borderRadius: '12px 12px 12px 4px' }
                          }>
                          {m.content}
                        </div>
                        <span className="text-xs font-bold mt-0.5" style={{ color: '#ccc' }}>{timeAgo(m.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex-shrink-0 py-3 flex gap-2" style={{ borderTop: '2px solid #e0ddd6' }}>
                <input value={msgText} onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..." className="nb-input flex-1" />
                <button onClick={sendMessage} disabled={!msgText.trim() || sending}
                  className="nb-btn nb-btn-orange px-4 py-2 disabled:opacity-40">
                  <Send size={15} />
                </button>
              </div>
            </>
          )}

          {/* TASKS */}
          {space === 'tasks' && (
            <div className="flex-1 overflow-y-auto py-4">
              {isAdmin && (
                <div className="mb-4">
                  {!showTaskForm ? (
                    <button onClick={() => setShowTaskForm(true)}
                      className="nb-btn nb-btn-orange flex items-center gap-1.5 px-4 py-2 text-sm">
                      <Plus size={13} /> Add Task
                    </button>
                  ) : (
                    <div className="nb-card p-4 mb-4">
                      <h4 className="font-black text-sm mb-3" style={{ color: '#0A0A0A' }}>New Task</h4>
                      <div className="space-y-3">
                        <div>
                          <label className={LBL} style={{ color: '#666' }}>Title *</label>
                          <input className={INP} value={taskForm.title} onChange={e => setTaskField('title', e.target.value)} placeholder="Task title" />
                        </div>
                        <div>
                          <label className={LBL} style={{ color: '#666' }}>Description</label>
                          <textarea className="nb-input w-full resize-none" rows={2}
                            value={taskForm.description} onChange={e => setTaskField('description', e.target.value)}
                            placeholder="What should members do?" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={LBL} style={{ color: '#666' }}>Due Date</label>
                            <input type="date" className={INP} value={taskForm.due_date} onChange={e => setTaskField('due_date', e.target.value)} />
                          </div>
                          <div>
                            <label className={LBL} style={{ color: '#666' }}>XP Reward</label>
                            <input type="number" className={INP} value={taskForm.xp_reward} onChange={e => setTaskField('xp_reward', parseInt(e.target.value))} min={5} max={100} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setShowTaskForm(false)} className="nb-btn nb-btn-ghost flex-1 py-2 text-sm">Cancel</button>
                          <button onClick={createTask} disabled={!taskForm.title.trim()}
                            className="nb-btn nb-btn-orange flex-1 py-2 text-sm disabled:opacity-40">Create Task</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tasks.length === 0 ? (
                <div className="text-center py-10">
                  <CheckSquare size={32} className="mx-auto mb-2" style={{ color: '#ddd' }} />
                  <p className="font-bold text-sm" style={{ color: '#999' }}>
                    {isAdmin ? 'No tasks yet. Add the first task for members.' : 'No tasks assigned yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(t => {
                    const done = myCompletions.includes(t.id);
                    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !done;
                    return (
                      <div key={t.id} className="nb-card p-4"
                        style={done ? { background: '#E8FFF0', borderColor: '#00C853' } : isOverdue ? { background: '#FFF0F0', borderColor: '#E53935' } : {}}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {done && <Check size={14} style={{ color: '#00C853' }} />}
                              {isOverdue && <AlertTriangle size={14} style={{ color: '#E53935' }} />}
                              <h4 className="font-black text-sm" style={{ color: '#0A0A0A' }}>{t.title}</h4>
                              <span className="nb-badge" style={{ color: '#FF5C00', borderColor: '#FF5C00', background: '#FFF3EE' }}>
                                +{t.xp_reward} XP
                              </span>
                            </div>
                            {t.description && <p className="text-xs font-medium mb-2" style={{ color: '#666' }}>{t.description}</p>}
                            {t.due_date && (
                              <p className="text-xs font-bold" style={{ color: isOverdue ? '#E53935' : '#999' }}>
                                <Clock size={10} className="inline mr-1" />
                                Due: {new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {isOverdue && ' (OVERDUE)'}
                              </p>
                            )}
                          </div>
                          {!isAdmin && !done && (
                            <button onClick={() => completeTask(t.id)}
                              className="nb-btn nb-btn-orange px-3 py-1.5 text-xs flex-shrink-0">
                              Mark Done
                            </button>
                          )}
                          {done && <span className="text-xs font-black" style={{ color: '#00C853' }}>Done!</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* RESOURCES */}
          {space === 'resources' && (
            <div className="flex-1 overflow-y-auto py-4">
              <div className="mb-4">
                {!showResForm ? (
                  <button onClick={() => setShowResForm(true)}
                    className="nb-btn nb-btn-navy flex items-center gap-1.5 px-4 py-2 text-sm">
                    <Plus size={13} /> Add Resource
                  </button>
                ) : (
                  <div className="nb-card p-4 mb-4">
                    <h4 className="font-black text-sm mb-3" style={{ color: '#0A0A0A' }}>Add Resource</h4>
                    <div className="space-y-3">
                      <div>
                        <label className={LBL} style={{ color: '#666' }}>Title *</label>
                        <input className={INP} value={resForm.title} onChange={e => setResField('title', e.target.value)} placeholder="Resource title" />
                      </div>
                      <div>
                        <label className={LBL} style={{ color: '#666' }}>URL / Link *</label>
                        <input type="url" className={INP} value={resForm.url} onChange={e => setResField('url', e.target.value)} placeholder="https://..." />
                      </div>
                      <div>
                        <label className={LBL} style={{ color: '#666' }}>Description</label>
                        <textarea className="nb-input w-full resize-none" rows={2}
                          value={resForm.description} onChange={e => setResField('description', e.target.value)}
                          placeholder="What is this resource about?" />
                      </div>
                      <div>
                        <label className={LBL} style={{ color: '#666' }}>Type</label>
                        <div className="flex gap-2">
                          {['link', 'document', 'video', 'article'].map(t => (
                            <button key={t} onClick={() => setResField('type', t)}
                              className="nb-btn px-2.5 py-1 text-xs capitalize"
                              style={resForm.type === t ? { background: '#0B1E3D', color: '#fff' } : { background: '#fff' }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowResForm(false)} className="nb-btn nb-btn-ghost flex-1 py-2 text-sm">Cancel</button>
                        <button onClick={addResource} disabled={!resForm.title.trim() || !resForm.url.trim()}
                          className="nb-btn nb-btn-navy flex-1 py-2 text-sm disabled:opacity-40">Add</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {resources.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen size={32} className="mx-auto mb-2" style={{ color: '#ddd' }} />
                  <p className="font-bold text-sm" style={{ color: '#999' }}>No resources yet. Share something useful!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map(r => (
                    <div key={r.id} className="nb-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="nb-badge" style={{ color: '#0B1E3D', borderColor: '#0B1E3D', background: '#EEF2FF' }}>
                              {r.type || 'link'}
                            </span>
                            <h4 className="font-black text-sm truncate" style={{ color: '#0A0A0A' }}>{r.title}</h4>
                          </div>
                          {r.description && <p className="text-xs font-medium mb-2" style={{ color: '#666' }}>{r.description}</p>}
                          <p className="text-xs font-bold" style={{ color: '#999' }}>by {r.uploaded_by_name}</p>
                        </div>
                        <a href={r.url} target="_blank" rel="noopener noreferrer"
                          className="nb-btn nb-btn-navy px-3 py-1.5 text-xs flex items-center gap-1 flex-shrink-0">
                          Open <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MEMBERS */}
          {space === 'members' && (
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="nb-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
                        style={{ background: `hsl(${(m.user_name?.charCodeAt(0)||200)%360},55%,38%)`, border: '2px solid #0A0A0A' }}>
                        {m.user_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-sm" style={{ color: '#0A0A0A' }}>{m.user_name}</p>
                        <p className="text-xs font-bold" style={{ color: m.role === 'creator' ? '#FF5C00' : '#999' }}>
                          {m.role === 'creator' ? 'Admin' : 'Member'}
                        </p>
                      </div>
                    </div>
                    {isAdmin && m.user_id !== user.id && (
                      <button onClick={() => kickMember(m.user_id)}
                        className="nb-btn px-2.5 py-1.5 text-xs flex items-center gap-1"
                        style={{ color: '#E53935', borderColor: '#E53935', background: '#FFF0F0' }}>
                        <UserMinus size={11} /> Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
