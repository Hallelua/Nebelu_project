/*
  # Add Photo Stories Feature

  1. New Tables
    - `photo_stories`: Stores temporary photo stories
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
      - `photo_url` (text)
      - `caption` (text)
      - `expires_at` (timestamp)
      - `public_url_id` (text, unique)

  2. Security
    - Enable RLS on photo_stories table
    - Add policies for authenticated users
    - Add policies for public access
*/

-- Create photo_stories table
CREATE TABLE IF NOT EXISTS photo_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  caption text NOT NULL,
  expires_at timestamptz NOT NULL,
  public_url_id text UNIQUE NOT NULL
);

-- Enable RLS
ALTER TABLE photo_stories ENABLE ROW LEVEL SECURITY;

-- Photo stories policies
CREATE POLICY "Users can create their own photo stories"
  ON photo_stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view photo stories"
  ON photo_stories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Public can view photo stories"
  ON photo_stories FOR SELECT
  TO anon USING (true);

CREATE POLICY "Users can delete their own photo stories"
  ON photo_stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM photo_stories
  WHERE expires_at < NOW();
END;
$$;

-- Create a scheduled job to run every hour
SELECT cron.schedule(
  'cleanup-expired-stories',
  '0 * * * *', -- Every hour
  'SELECT cleanup_expired_stories()'
);
