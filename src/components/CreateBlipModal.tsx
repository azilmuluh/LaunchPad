import { useState, useRef } from 'react';
import { apiRequest } from '../lib/auth';
import { X, Video, Send, Loader2, Link as LinkIcon, Upload, Mic, StopCircle, RefreshCw } from 'lucide-react';

export default function CreateBlipModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'url' | 'upload' | 'record'>('url');
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    video_url: '',
    apply_link: '',
    tags: ''
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        chunksRef.current = [];
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e) {
      alert('Camera access denied or not available');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const submit = async () => {
    if (!form.title) return;
    if (mode === 'url' && !form.video_url) return;
    if (mode === 'upload' && !uploadFile) return;
    if (mode === 'record' && !recordedBlob) return;

    setLoading(true);
    try {
      let videoUrl = form.video_url;

      // In a real app, you would upload the file/blob to Supabase Storage here
      // For now, we'll simulate it by using the object URL or a placeholder
      if (mode === 'upload' && uploadFile) {
        videoUrl = URL.createObjectURL(uploadFile); // Placeholder
      } else if (mode === 'record' && recordedBlob) {
        videoUrl = URL.createObjectURL(recordedBlob); // Placeholder
      }

      const res = await apiRequest('/api/blips', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          video_url: videoUrl,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden border-4 border-black shadow-[8px_8px_0_#000]">
        <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#FDFCFB]">
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Video size={18} /> Create a Blip
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X size={20} /></button>
        </div>

        <div className="flex border-b-4 border-black bg-gray-50">
          {(['url', 'upload', 'record'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-[#FFD600] text-black' : 'hover:bg-gray-100 text-gray-500'}`}
              style={mode === m ? { borderRight: m !== 'record' ? '4px solid black' : 'none' } : { borderRight: m !== 'record' ? '4px solid black' : 'none' }}>
              {m === 'url' && <LinkIcon size={12} className="inline mr-1" />}
              {m === 'upload' && <Upload size={12} className="inline mr-1" />}
              {m === 'record' && <Mic size={12} className="inline mr-1" />}
              {m}
            </button>
          ))}
        </div>
        
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div>
            <label className="block text-xs font-black uppercase mb-1.5 ml-1">Title</label>
            <input 
              type="text" 
              className="nb-input w-full" 
              placeholder="e.g. 3 Tips for a Tech Resume"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {mode === 'url' && (
            <div>
              <label className="block text-xs font-black uppercase mb-1.5 ml-1">Video URL (YouTube/Direct)</label>
              <input 
                type="text" 
                className="nb-input w-full" 
                placeholder="https://youtube.com/watch?v=..."
                value={form.video_url}
                onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
              />
            </div>
          )}

          {mode === 'upload' && (
            <div className="nb-card p-6 border-dashed border-4 border-gray-300 text-center cursor-pointer hover:border-[#FF5C00] transition-all"
              onClick={() => document.getElementById('blip-file')?.click()}>
              <input id="blip-file" type="file" accept="video/*" className="hidden" 
                onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              <Upload size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="font-black text-xs uppercase">{uploadFile ? uploadFile.name : 'Choose Video File'}</p>
            </div>
          )}

          {mode === 'record' && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-black">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {recordedBlob && !recording && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <p className="text-white font-black text-xs uppercase tracking-widest">Video Recorded!</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!recording ? (
                  <button onClick={startRecording} className="nb-btn-navy flex-1 py-2 flex items-center justify-center gap-2 text-xs font-black uppercase">
                    <Mic size={14} /> {recordedBlob ? 'Record Again' : 'Start Recording'}
                  </button>
                ) : (
                  <button onClick={stopRecording} className="nb-btn-orange flex-1 py-2 flex items-center justify-center gap-2 text-xs font-black uppercase">
                    <StopCircle size={14} /> Stop Recording
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase mb-1.5 ml-1">Summary (Short description)</label>
            <textarea 
              className="nb-input w-full h-20 resize-none" 
              placeholder="What is this video about?"
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase mb-1.5 ml-1">Tags (Comma separated)</label>
              <input 
                type="text" 
                className="nb-input w-full" 
                placeholder="tech, tips, resume"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1.5 ml-1">Apply/Source Link (Optional)</label>
              <input 
                type="text" 
                className="nb-input w-full" 
                placeholder="https://..."
                value={form.apply_link}
                onChange={e => setForm(f => ({ ...f, apply_link: e.target.value }))}
              />
            </div>
          </div>

          <button 
            onClick={submit}
            disabled={loading || !form.title || (mode === 'url' && !form.video_url) || (mode === 'upload' && !uploadFile) || (mode === 'record' && !recordedBlob)}
            className="nb-btn-orange w-full py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Post Blip</>}
          </button>
        </div>
      </div>
    </div>
  );
}

