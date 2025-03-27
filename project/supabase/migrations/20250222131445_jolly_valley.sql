/*
  # Initial Schema Setup for News Classification App

  1. New Tables
    - user_history
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - article_id (text)
      - read_at (timestamp)
      - category (text)
    
    - user_preferences
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - preferred_categories (text[])
      - last_updated (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access
*/

-- Create user_history table
CREATE TABLE IF NOT EXISTS user_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  article_id text NOT NULL,
  read_at timestamptz DEFAULT now(),
  category text NOT NULL,
  title text NOT NULL,
  image_url text,
  description text
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  preferred_categories text[] DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own history"
  ON user_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON user_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);