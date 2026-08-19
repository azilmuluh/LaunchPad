/**
 * BlipCard Component
 * Optimized video card with lazy loading and performance features
 */

import { memo } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, ExternalLink, Volume2, VolumeX, Calendar, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { useBlipEngagement } from '../hooks/useBlipEngagement';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import type { Blip } from '../types/blips';

interface BlipCardProps {
  blip: Blip;
  isActive: boolean;
  onCommentClick: () => void;
  onShare: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

function BlipCardComponent({ blip, isActive, onCommentClick, onShare, onDelete, canDelete }: BlipCardProps) {
  const engagement = useBlipEngagement({
    blipId: blip.id,
    initialState: {
      liked: blip.is_liked,
      bookmarked: blip.is_bookmarked,
      likes_count: blip.likes_count,
      comments_count: blip.comments_count,
    },
  });

  const video = useVideoPlayer({
    blipId: blip.id,
    videoUrl: blip.video_url,
    embedId: blip.embed_id,
    videoSource: blip.video_source,
    isActive,
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blip.title,
          text: blip.summary || blip.title,
          url: blip.apply_link || window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const url = blip.apply_link || window.location.href;
    navigator.clipboard.writeText(url);
    onShare();
  };

  const renderVideo = () => {
    if (video.error && !video.canRetry) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 gap-4">
          <AlertCircle size={48} className="text-red-500" />
          <p className="text-white font-bold text-sm text-center">Unable to load video</p>
          {blip.video_url && (
            <a
              href={blip.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="nb-btn-orange px-4 py-2 text-xs flex items-center gap-2"
            >
              <ExternalLink size={14} />
              Open Directly
            </a>
          )}
        </div>
      );
    }

    if (video.error && video.canRetry) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 gap-4">
          <AlertCircle size={48} className="text-orange-500" />
          <p className="text-white font-bold text-sm">Video failed to load</p>
          <button onClick={video.retry} className="nb-btn-orange px-4 py-2 text-xs flex items-center gap-2">
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      );
    }

    if (blip.video_source === 'youtube' && blip.embed_id) {
      const cleanId = blip.embed_id.split('?')[0].split('&')[0];
      return (
        <iframe
          ref={video.iframeRef}
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${cleanId}?autoplay=${isActive ? 1 : 0}&mute=${video.isMuted ? 1 : 0}&loop=1&playlist=${cleanId}&controls=1&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}&playsinline=1`}
          title={blip.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          onLoad={video.handleLoad}
          onError={video.handleError}
          style={{ border: 'none' }}
        />
      );
    }

    return (
      <video
        ref={video.videoRef}
        className="w-full h-full object-contain"
        src={blip.video_url}
        autoPlay={isActive}
        muted={video.isMuted}
        loop
        playsInline
        controls
        onLoadedData={video.handleLoad}
        onError={video.handleError}
        style={{ border: 'none' }}
      />
    );
  };

  return (
    <div className="relative w-full h-full bg-neutral-900">
      {/* Video Layer */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {renderVideo()}
      </div>

      {/* Loading Overlay */}
      {video.isLoading && !video.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Sound Toggle */}
      <button
        onClick={video.toggleMute}
        className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-20"
        aria-label={video.isMuted ? 'Unmute' : 'Mute'}
      >
        {video.isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
      </button>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
        <div className="relative flex gap-4 p-6">
          {/* Left: Content Info */}
          <div className="flex-1 pointer-events-auto">
            <div className="mb-4">
              {blip.verified && (
                <span className="inline-block px-2 py-1 bg-[#FFD600] text-black text-[10px] font-black uppercase tracking-wider rounded mb-2">
                  Verified
                </span>
              )}
              {blip.type === 'opportunity' && (
                <span className="inline-block px-2 py-1 bg-green-500 text-black text-[10px] font-black uppercase tracking-wider rounded mb-2 ml-2">
                  Opportunity
                </span>
              )}
            </div>

            <h3 className="text-white font-black text-xl mb-2 drop-shadow-lg leading-tight">
              {blip.title}
            </h3>

            {blip.summary && (
              <p className="text-white/90 text-sm mb-3 drop-shadow-lg line-clamp-2">
                {blip.summary}
              </p>
            )}

            {blip.tags && blip.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {blip.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {blip.type === 'opportunity' && (
              <div className="space-y-2 mb-4">
                {blip.deadline && (
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <Calendar size={14} />
                    <span>Deadline: {blip.deadline}</span>
                  </div>
                )}
                {blip.eligibility && (
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <Users size={14} />
                    <span>{blip.eligibility}</span>
                  </div>
                )}
              </div>
            )}

            {blip.apply_link && (
              <a
                href={blip.apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFD600] hover:bg-[#FFE433] text-black font-black uppercase text-sm rounded-lg transition-colors"
              >
                {blip.type === 'opportunity' ? 'Apply Now' : 'Learn More'}
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {/* Right: Engagement Actions */}
          <div className="flex flex-col items-center gap-6 pointer-events-auto">
            {/* Like */}
            <button
              onClick={engagement.toggleLike}
              disabled={engagement.isLiking}
              className="flex flex-col items-center gap-1 group"
              aria-label={engagement.liked ? 'Unlike' : 'Like'}
            >
              <div className="p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-colors">
                <Heart
                  size={24}
                  className={engagement.liked ? 'fill-red-500 text-red-500' : 'text-white group-hover:scale-110 transition-transform'}
                />
              </div>
              <span className="text-white text-xs font-bold">{engagement.likes_count}</span>
            </button>

            {/* Comment */}
            <button
              onClick={onCommentClick}
              className="flex flex-col items-center gap-1 group"
              aria-label="Comments"
            >
              <div className="p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-colors">
                <MessageCircle size={24} className="text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-white text-xs font-bold">{engagement.comments_count}</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={engagement.toggleBookmark}
              disabled={engagement.isBookmarking}
              className="flex flex-col items-center gap-1 group"
              aria-label={engagement.bookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <div className="p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-colors">
                <Bookmark
                  size={24}
                  className={engagement.bookmarked ? 'fill-[#FFD600] text-[#FFD600]' : 'text-white group-hover:scale-110 transition-transform'}
                />
              </div>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 group"
              aria-label="Share"
            >
              <div className="p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-colors">
                <Share2 size={24} className="text-white group-hover:scale-110 transition-transform" />
              </div>
            </button>

            {/* Delete (if allowed) */}
            {canDelete && onDelete && (
              <button
                onClick={onDelete}
                className="mt-4 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                aria-label="Delete blip"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const BlipCard = memo(BlipCardComponent);
