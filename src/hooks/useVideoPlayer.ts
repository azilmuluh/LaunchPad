/**
 * Custom hook for managing video player state and performance
 * Handles autoplay, muting, lazy loading, and error recovery
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BlipVideoError } from '../types/blips';

interface UseVideoPlayerOptions {
  blipId: string;
  videoUrl: string;
  embedId: string | null;
  videoSource: string;
  isActive: boolean;
  autoplay?: boolean;
}

const MAX_RETRY_COUNT = 2;

export function useVideoPlayer(options: UseVideoPlayerOptions) {
  const { blipId, videoUrl, embedId, videoSource, isActive, autoplay = true } = options;
  
  const [error, setError] = useState<BlipVideoError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Track view when video becomes active
  useEffect(() => {
    if (isActive && !error) {
      trackView();
    }
  }, [isActive, error]); // eslint-disable-line react-hooks/exhaustive-deps

  const trackView = useCallback(async () => {
    try {
      await fetch('/api/blips/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blip_id: blipId }),
      });
    } catch (err) {
      console.warn('[useVideoPlayer] Failed to track view:', err);
    }
  }, [blipId]);

  const handleError = useCallback(() => {
    setError(prev => {
      const retryCount = (prev?.retry_count ?? 0) + 1;
      return {
        blip_id: blipId,
        error_type: retryCount > MAX_RETRY_COUNT ? 'load_failed' : 'load_failed',
        retry_count: retryCount,
      };
    });
    setIsLoading(false);
  }, [blipId]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  // Handle video element autoplay
  useEffect(() => {
    if (videoRef.current && isActive && autoplay) {
      videoRef.current.play().catch(() => {
        // Autoplay failed (likely due to browser policy)
        console.debug('[useVideoPlayer] Autoplay prevented');
      });
    } else if (videoRef.current && !isActive) {
      videoRef.current.pause();
    }
  }, [isActive, autoplay]);

  return {
    error,
    isLoading,
    isMuted,
    videoRef,
    iframeRef,
    handleError,
    handleLoad,
    retry,
    toggleMute,
    canRetry: (error?.retry_count ?? 0) < MAX_RETRY_COUNT,
  };
}
