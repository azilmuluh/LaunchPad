import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { apiRequest, queryClient } from '../lib/auth';

export interface Draft {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  checklist: Array<{ id: string; text: string; completed: boolean }>;
  notes?: string;
  progress: number;
  created_at: string;
  last_updated: string;
}

/**
 * Fetch all saved draft applications for the current user
 */
export function useSavedDrafts() {
  return useQuery({
    queryKey: ['saved-drafts'],
    queryFn: async (): Promise<Draft[]> => {
      const res = await apiRequest('/api/applications?status=draft');
      if (!res.ok) throw new Error('Failed to fetch drafts');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Save application draft
 */
export function useSaveDraft() {
  return useMutation({
    mutationFn: async (draftData: {
      opportunity_id: string;
      checklist: Array<{ id: string; text: string; completed: boolean }>;
      notes?: string;
      progress: number;
    }) => {
      const res = await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          ...draftData,
          status: 'draft',
          auto_save: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to save draft');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-drafts'] });
    },
  });
}

/**
 * Delete a draft application
 */
export function useDeleteDraft() {
  return useMutation({
    mutationFn: async (draftId: string) => {
      const res = await apiRequest(`/api/applications/${draftId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete draft');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-drafts'] });
    },
  });
}

/**
 * Resume a draft - fetch it for editing
 */
export function useResumeDraft(draftId: string | undefined) {
  return useQuery({
    queryKey: ['resume-draft', draftId],
    queryFn: async (): Promise<Draft> => {
      const res = await apiRequest(`/api/applications/${draftId}`);
      if (!res.ok) throw new Error('Failed to load draft');
      return res.json();
    },
    enabled: !!draftId,
  });
}

/**
 * Debounced auto-save hook for drafts
 */
interface DraftData {
  opportunity_id: string;
  checklist: Array<{ id: string; text: string; completed: boolean }>;
  notes?: string;
  progress: number;
}

export function useAutoSaveDraft(draftData: DraftData, enabled = true) {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  const saveDraft = useSaveDraft();

  useEffect(() => {
    if (!enabled) return;

    const currentState = JSON.stringify(draftData);

    if (currentState === lastSavedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveDraft.mutateAsync(draftData);
        lastSavedRef.current = currentState;
        setIsSaving(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setIsSaving(false);
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [draftData, enabled, saveDraft]);

  return { isSaving, isDirty: lastSavedRef.current !== JSON.stringify(draftData) };
}
