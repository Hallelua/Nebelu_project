export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          created_at: string
          title: string
          body: string
          user_id: string
          is_public: boolean
          allowed_users: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          body: string
          user_id: string
          is_public?: boolean
          allowed_users?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          body?: string
          user_id?: string
          is_public?: boolean
          allowed_users?: string[] | null
        }
      }
      media_clips: {
        Row: {
          id: string
          created_at: string
          post_id: string
          user_id: string
          url: string
          type: 'audio' | 'video'
          duration: number
          trim_start: number
          trim_end: number
          background_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          post_id: string
          user_id: string
          url: string
          type: 'audio' | 'video'
          duration: number
          trim_start?: number
          trim_end?: number
          background_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          post_id?: string
          user_id?: string
          url?: string
          type?: 'audio' | 'video'
          duration?: number
          trim_start?: number
          trim_end?: number
          background_url?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          watermark_url: string
          watermark_size: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          watermark_url: string
          watermark_size?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          watermark_url?: string
          watermark_size?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}