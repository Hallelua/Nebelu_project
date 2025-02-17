import type { Database } from './supabase';

export type Post = Database['public']['Tables']['posts']['Row'];
export type MediaClip = Database['public']['Tables']['media_clips']['Row'];