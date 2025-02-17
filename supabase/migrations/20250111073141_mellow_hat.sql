/*
  # Enable email confirmation

  1. Changes
    - Enable email confirmation requirement for new signups
    - Add policy to only allow confirmed email users
*/

-- Enable email confirmation requirement
ALTER TABLE auth.users
  ADD CONSTRAINT users_email_confirmed_check
  CHECK (email_confirmed_at IS NOT NULL);

-- Create policy for confirmed emails only
CREATE POLICY "Only confirmed email users can access"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = profiles.id
      AND auth.users.email_confirmed_at IS NOT NULL
    )
  );