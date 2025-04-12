/*
  # Add Public Videos Feature

  1. New Tables
    - `public_videos`: Stores publicly shared videos
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `url` (text)
      - `duration` (float)
      - `views` (integer)
      - `public_url_id` (text, unique)

  2. Security
    - Enable RLS on public_videos table
    - Add policies for authenticated users
    - Add policies for public access
*/

-- Create public_videos table
CREATE TABLE IF NOT EXISTS public_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  duration float NOT NULL,
  views integer DEFAULT 0,
  public_url_id text UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex')
);

-- Enable RLS
ALTER TABLE public_videos ENABLE ROW LEVEL SECURITY;

-- Public videos policies
CREATE POLICY "Users can create their own public videos"
  ON public_videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public videos"
  ON public_videos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Public can view public videos"
  ON public_videos FOR SELECT
  TO anon USING (true);

CREATE POLICY "Users can delete their own public videos"
  ON public_videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own public videos"
  ON public_videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
