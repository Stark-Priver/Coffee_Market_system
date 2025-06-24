/*
  # SMS Messaging System Database Schema

  1. New Tables
    - `sms_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `recipient_phone` (text)
      - `recipient_name` (text)
      - `message` (text)
      - `status` (enum: pending, sent, delivered, failed)
      - `twilio_message_id` (text, nullable)
      - `sent_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `message_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `name` (text)
      - `content` (text)
      - `variables` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for better query performance
*/

-- Create enum for SMS status
CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Create sms_messages table
CREATE TABLE IF NOT EXISTS sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_phone text NOT NULL,
  recipient_name text NOT NULL,
  message text NOT NULL,
  status sms_status DEFAULT 'pending',
  twilio_message_id text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for sms_messages
CREATE POLICY "Users can view own SMS messages"
  ON sms_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS messages"
  ON sms_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS messages"
  ON sms_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SMS messages"
  ON sms_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for message_templates
CREATE POLICY "Users can view own message templates"
  ON message_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own message templates"
  ON message_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own message templates"
  ON message_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own message templates"
  ON message_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sms_messages_updated_at
  BEFORE UPDATE ON sms_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();