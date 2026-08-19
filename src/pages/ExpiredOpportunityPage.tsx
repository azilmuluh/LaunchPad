/**
 * ExpiredOpportunityPage
 *
 * Displays a user-friendly 404 page when an opportunity page has been
 * soft-deleted (deleted_at is not null) or simply does not exist.
 *
 * Validates: Requirements 2.7, 14.2
 */
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Search } from 'lucide-react';

export default function ExpiredOpportunityPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: 'var(--bg, #FFF7F0)' }}
    >
      {/* Illustration */}
      <div className="relative mb-10">
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center"
          style={{
            background: '#FFF3EE',
            border: '4px solid #0A0A0A',
            boxShadow: '6px 6px 0 #0A0A0A',
          }}
        >
          <Rocket size={56} className="text-orange-500" style={{ opacity: 0.8 }} />
        </div>
        {/* Orbit dot */}
        <div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: '#FF5C00', border: '3px solid #0A0A0A', color: '#fff' }}
        >
          ✕
        </div>
      </div>

      {/* Heading */}
      <h1 className="font-black text-3xl text-center mb-4 leading-tight" style={{ maxWidth: 360 }}>
        This opportunity has expired or is no longer available
      </h1>

      {/* Description */}
      <p className="text-sm font-bold text-center mb-10" style={{ color: 'var(--muted, #6B7280)', maxWidth: 400 }}>
        The page you're looking for has been removed because the opportunity's deadline has passed
        or it was taken down by the organiser. Don't worry — there are plenty more opportunities waiting for you!
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full" style={{ maxWidth: 380 }}>
        <button
          id="expired-opp-back-btn"
          onClick={() => navigate(-1)}
          className="nb-btn flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        <button
          id="expired-opp-browse-btn"
          onClick={() => navigate('/feed')}
          className="nb-btn flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black nb-btn-orange"
        >
          <Search size={16} />
          Browse Opportunities
        </button>
      </div>
    </div>
  );
}
