import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/auth';
import OpportunityCard from '../components/OpportunityCard';
import { Bookmark } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function BookmarksPage({ user }: any) {
  const { t } = useI18n();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [bookmarkSet, setBookmarkSet] = useState(new Set<string>());

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res  = await apiRequest('/api/bookmarks');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookmarks(data);
          setBookmarkSet(new Set(data.map((b: any) => b.link)));
          // Cache for offline
          localStorage.setItem(`lp_bookmarks_${user?.id}`, JSON.stringify(data));
        }
      } else { throw new Error('Offline or error'); }
    } catch (err) { 
      console.error('Bookmarks offline fallback:', err); 
      const cached = localStorage.getItem(`lp_bookmarks_${user?.id}`);
      if (cached) {
        const data = JSON.parse(cached);
        setBookmarks(data);
        setBookmarkSet(new Set(data.map((b: any) => b.link)));
      }
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const handleRemove = async (link: string) => {
    await apiRequest('/api/bookmarks', { method: 'DELETE', body: JSON.stringify({ link }) });
    setBookmarks(prev => prev.filter(b => b.link !== link));
    setBookmarkSet(prev => { const s = new Set(prev); s.delete(link); return s; });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="nb-card nb-card-navy p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,216,0,0.15)', border: '2px solid #FFD600' }}>
            <Bookmark size={18} style={{ color: '#FFD600' }} />
          </div>
          <div>
            <h1 className="text-white font-black text-xl">{t('saved_opps')}</h1>
            <p className="text-sm font-bold" style={{ color: '#FFD600' }}>
              {bookmarks.length} {t('saved')}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="nb-card p-5 animate-pulse" style={{ height: '220px' }}>
              <div className="h-3 w-1/3 rounded mb-3" style={{ background: '#e0ddd6' }} />
              <div className="h-4 w-4/5 rounded mb-2" style={{ background: '#e0ddd6' }} />
              <div className="h-3 w-full rounded" style={{ background: '#e0ddd6' }} />
            </div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="nb-card p-16 text-center">
          <Bookmark size={48} className="mx-auto mb-4" style={{ color: '#ddd' }} />
          <h3 className="font-black text-xl mb-2">{t('no_bookmarks')}</h3>
          <p className="font-bold" style={{ color: '#999' }}>{t('save_opps_desc')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bookmarks.map((item: any, idx: number) => (
              <OpportunityCard
                key={`${item.link}-${idx}`}
                item={item}
                user={user}
                isBookmarked={bookmarkSet.has(item.link)}
                onBookmark={() => handleRemove(item.link)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
