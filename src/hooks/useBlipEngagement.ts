/**
 * Custom hook for managing blip engagement (likes, bookmarks, comments)
 * Provides optimistic updates and error handling
 */

import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/auth';
import type { BlipEngagementState } from '../types/blips';

interface UseBlipEngagementOptions {
  blipId: string;
  initialState?: Partial<BlipEngagementState>;
  onLikeChange?: (liked: boolean) => void;
  onBookmarkChange?: (bookmarked: boolean) => void;
}

export function useBlipEngagement(options: UseBlipEngagementOptions) {
  const { blipId, initialState = {}, onLikeChange, onBookmarkChange } = options;
  
  const [state, setState] = useState<BlipEngagementState>({
    liked: initialState.liked ?? false,
    bookmarked: initialState.bookmarked ?? false,
    likes_count: initialState.likes_count ?? 0,
    comments_count: initialState.comments_count ?? 0,
  });

  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const toggleLike = useCallback(async () => {
    if (isLiking) return;

    const previousState = { ...state };
    const newLiked = !state.liked;

    // Optimistic update
    setState(prev => ({
      ...prev,
      liked: newLiked,
      likes_count: prev.likes_count + (newLiked ? 1 : -1),
    }));

    setIsLiking(true);

    try {
      const response = await apiRequest('/api/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          item_id: blipId,
          item_type: 'blip',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      
      // Update with server response
      setState(prev => ({
        ...prev,
        liked: data.liked,
      }));

      onLikeChange?.(data.liked);
    } catch (error) {
      // Revert on error
      setState(previousState);
      console.error('[useBlipEngagement] Like error:', error);
    } finally {
      setIsLiking(false);
    }
  }, [blipId, state, isLiking, onLikeChange]);

  const toggleBookmark = useCallback(async () => {
    if (isBookmarking) return;

    const previousState = { ...state };
    const newBookmarked = !state.bookmarked;

    // Optimistic update
    setState(prev => ({
      ...prev,
      bookmarked: newBookmarked,
    }));

    setIsBookmarking(true);

    try {
      const response = await apiRequest('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: blipId,
          item_type: 'blip',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        bookmarked: data.bookmarked,
      }));

      onBookmarkChange?.(data.bookmarked);
    } catch (error) {
      // Revert on error
      setState(previousState);
      console.error('[useBlipEngagement] Bookmark error:', error);
    } finally {
      setIsBookmarking(false);
    }
  }, [blipId, state, isBookmarking, onBookmarkChange]);

  const incrementComments = useCallback(() => {
    setState(prev => ({
      ...prev,
      comments_count: prev.comments_count + 1,
    }));
  }, []);

  return {
    ...state,
    isLiking,
    isBookmarking,
    toggleLike,
    toggleBookmark,
    incrementComments,
  };
}
