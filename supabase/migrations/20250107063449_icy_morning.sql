/*
  # Initial Schema Setup for Nebelu

  1. New Tables
    - `posts`: Stores post details and visibility settings
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `title` (text)
      - `body` (text)
      - `user_id` (uuid, references auth.users)
      - `is_public` (boolean)
      - `allowed_users` (uuid array)
    
    - `media_clips`: Stores media clip information
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `post_id` (uuid, references posts)
      - `user_id` (uuid, references auth.users)
      - `url` (text)
      - `type` (enum: audio, video)
      - `duration` (float)
      - `trim_start` (float)
      - `trim_end` (float)
      - `background_url` (text, nullable)
    
    - `system_settings`: Stores global system settings
      - `id` (uuid, primary key)
      - `watermark_url` (text)
      - `watermark_size` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - System admin policies for system_settings table
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  body text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT false,
  allowed_users uuid[] DEFAULT NULL
);

-- Create media_clips table
CREATE TABLE IF NOT EXISTS media_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  type text CHECK (type IN ('audio', 'video')) NOT NULL,
  duration float NOT NULL,
  trim_start float DEFAULT 0,
  trim_end float DEFAULT NULL,
  background_url text DEFAULT NULL
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watermark_url text NOT NULL,
  watermark_size integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_public = true OR
    auth.uid() = ANY(allowed_users)
  );

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Media clips policies
CREATE POLICY "Users can create their own media clips"
  ON media_clips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view media clips of visible posts"
  ON media_clips FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = media_clips.post_id
      AND (
        posts.user_id = auth.uid() OR
        posts.is_public = true OR
        auth.uid() = ANY(posts.allowed_users)
      )
    )
  );

CREATE POLICY "Users can update their own media clips"
  ON media_clips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media clips"
  ON media_clips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- System settings policies
CREATE POLICY "System admins can manage system settings"
  ON system_settings
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = current_setting('app.system_admin_email', true)
    )
  );