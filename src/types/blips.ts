/**
 * Blips Feature Type Definitions
 * World-class type safety for the video feed feature
 */

export type BlipType = 'opportunity' | 'info';
export type VideoSource = 'youtube' | 'instagram' | 'tiktok' | 'user_upload' | 'direct';
export type BlipStatus = 'published' | 'draft' | 'archived' | 'under_review';

export interface Blip {
  id: string;
  type: BlipType;
  video_source: VideoSource;
  video_url: string;
  embed_id: string | null;
  thumbnail: string | null;
  title: string;
  summary: string | null;
  tags: string[];
  apply_link: string | null;
  deadline: string | null;
  eligibility: string | null;
  verified: boolean;
  likes_count: number;
  comments_count: number;
  views: number;
  creator_id: string | null;
  is_user_generated: boolean;
  status: BlipStatus;
  created_at: string;
  // Client-side computed properties
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface CreateBlipDTO {
  title: string;
  summary?: string;
  video_url: string;
  tags?: string[];
  apply_link?: string;
  type?: BlipType;
}

export interface BlipComment {
  id: string;
  user_id: string;
  item_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface BlipEngagementState {
  liked: boolean;
  bookmarked: boolean;
  likes_count: number;
  comments_count: number;
}

export interface BlipFetchParams {
  page?: number;
  search?: string;
  type?: BlipType;
  limit?: number;
}

export interface BlipVideoError {
  blip_id: string;
  error_type: 'load_failed' | 'not_found' | 'unsupported';
  retry_count: number;
}
