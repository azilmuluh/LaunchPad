import { useState } from 'react';
import {
  ExternalLink, Bookmark, BookmarkCheck, Clock,
  ChevronDown, ChevronUp, Users, Gift, MapPin, Building2, Sparkles, ArrowUpRight
} from 'lucide-react';
import RoadmapModal from './RoadmapModal';

const CAT: Record<string, { color: string; bg: string; border: string; emoji: string; label: string }> = {
  scholarship: { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', emoji: '\uD83C\uDF93', label: 'Scholarship' },
  internship:  { color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', emoji: '\uD83D\uDCBC', label: 'Internship'  },
  competition: { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', emoji: '\uD83C\uDFC6', label: 'Competition' },
  event:       { color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', emoji: '\uD83C\uDF89', label: 'Event'       },
  job:         { color: '#9A3412', bg: '#FFF7ED', border: '#FED7AA', emoji: '\uD83D\uDE80', label: 'Job'         },
  grant:       { color: '#14532D', bg: '#F0FDF4', border: '#BBF7D0', emoji: '\uD83D\uDCB0', label: 'Grant'       },
  opportunity: { color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', emoji: '\u2728',       label: 'Opportunity' },
};

function Bullets({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs font-bold" style={{ color }}>
          <span className="mt-0.5 font-black">\u2713</span> {item}
        </li>
      ))}
    </ul>
  );
}

export default function OpportunityCard({ item, isBookmarked, onBookmark, user }: any) {
  const [expanded,    setExpanded]    = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const cfg  = CAT[item.category] || CAT.opportunity;
  const desc = item.description || item.snippet || '';
  const eligs = (item.eligibility || '').split('\u2022').map((s: string) => s.trim()).filter(Boolean);
  const bens  = (item.benefits   || '').split('\u2022').map((s: string) => s.trim()).filter(Boolean);
  const hasExtra = eligs.length > 0 || bens.length > 0 || desc.length > 180;

  return (
    <>
      <article className="nb-card overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5">
        {/* Top accent stripe */}
        <div className="h-2" style={{ background: cfg.color }} />

        <div className="p-4 flex flex-col gap-3">
          {/* Row 1: badge + bookmark */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="nb-badge" style={{ color: cfg.color, borderColor: cfg.color, background: cfg.bg }}>
                {cfg.emoji} {cfg.label}
              </span>
              {item.verified && (
                <span className="nb-badge" style={{ color: '#065F46', borderColor: '#065F46', background: '#ECFDF5' }}>
                  \u2713 VERIFIED
                </span>
              )}
              {item.tag && (
                <span className="nb-tag" style={{ background: '#F5F0E8', color: '#666' }}>
                  #{item.tag.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <button onClick={onBookmark}
              className="nb-btn w-8 h-8 flex items-center justify-center"
              style={isBookmarked
                ? { background: '#FF5C00', color: '#fff', borderColor: '#FF5C00' }
                : { background: '#fff', color: '#666' }
              }>
              {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            </button>
          </div>

          {/* Title */}
          <h3 className="font-black text-base leading-snug" style={{ color: '#0A0A0A' }}>
            {item.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-3">
            {item.source && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#666' }}>
                <Building2 size={10} /> {item.source}
              </span>
            )}
            {item.location && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#666' }}>
                <MapPin size={10} /> {item.location}
              </span>
            )}
            {item.deadline && (
              <span className="nb-badge" style={{ color: '#92400E', borderColor: '#FDE68A', background: '#FFFBEB' }}>
                <Clock size={9} className="mr-0.5" /> {item.deadline}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#374151' }}>
            {expanded || desc.length <= 180 ? desc : desc.slice(0, 180) + '\u2026'}
          </p>

          {/* Expanded panels */}
          {expanded && (
            <div className="space-y-3">
              {eligs.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: '#EFF6FF', border: '2px solid #BFDBFE' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users size={12} style={{ color: '#1D4ED8' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#1D4ED8' }}>Eligibility</span>
                  </div>
                  <Bullets items={eligs} color="#1D4ED8" />
                </div>
              )}
              {bens.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: '#ECFDF5', border: '2px solid #A7F3D0' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Gift size={12} style={{ color: '#065F46' }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#065F46' }}>Benefits</span>
                  </div>
                  <Bullets items={bens} color="#065F46" />
                </div>
              )}
            </div>
          )}

          {/* Expand toggle */}
          {hasExtra && (
            <button onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-black transition-opacity hover:opacity-70 w-fit"
              style={{ color: cfg.color }}>
              {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Eligibility & Benefits</>}
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2" style={{ borderTop: '2px solid #f0ede6' }}>
            <button onClick={() => setShowRoadmap(true)}
              className="nb-btn flex-1 flex items-center justify-center gap-1.5 py-2 text-xs"
              style={{ background: '#FFF3EE', color: '#FF5C00', borderColor: '#FF5C00' }}>
              <Sparkles size={11} /> Get Roadmap
            </button>
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer"
                className="nb-btn flex-1 flex items-center justify-center gap-1.5 py-2 text-xs nb-btn-orange"
                onClick={e => e.stopPropagation()}>
                Apply Now <ArrowUpRight size={11} />
              </a>
            ) : (
              <div className="flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-xl"
                style={{ background: '#f0ede6', color: '#aaa', border: '2px solid #e0ddd6' }}>
                No Link
              </div>
            )}
          </div>
        </div>
      </article>

      {showRoadmap && (
        <RoadmapModal opportunity={item} user={user} onClose={() => setShowRoadmap(false)} />
      )}
    </>
  );
}
