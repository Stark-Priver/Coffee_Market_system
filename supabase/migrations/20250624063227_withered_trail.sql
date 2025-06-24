/*
  # Complete Coffee Marketing System Database Schema

  1. New Tables
    - `profiles` - User profile information
    - `feedback` - Customer feedback records  
    - `sms_messages` - SMS message tracking
    - `message_templates` - Reusable message templates

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Proper foreign key relationships

  3. Performance
    - Indexes on frequently queried columns
    - Automatic timestamp updates
    - Efficient query patterns
*/

-- Create profiles table first
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  account_number text NOT NULL,
  coffee_type text NOT NULL,
  coffee_weight decimal NOT NULL CHECK (coffee_weight > 0),
  customer_location text NOT NULL,
  coffee_quality integer NOT NULL CHECK (coffee_quality >= 1 AND coffee_quality <= 5),
  delivery_experience integer NOT NULL CHECK (delivery_experience >= 1 AND delivery_experience <= 5),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enum for SMS status
DO $$ BEGIN
  CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Feedback policies
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SMS messages policies
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

-- Message templates policies
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
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_customer_name ON feedback(customer_name);
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_recipient_phone ON sms_messages(recipient_phone);
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
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_messages_updated_at
  BEFORE UPDATE ON sms_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default message templates
INSERT INTO message_templates (user_id, name, content, variables) VALUES
  (
    '00000000-0000-0000-0000-000000000000', -- This will be replaced by actual user_id when used
    'Coffee Quality Follow-up',
    'Hi {customerName}, thank you for your recent coffee purchase of {coffeeType}. We hope you enjoyed the quality! Please let us know if you have any feedback.',
    ARRAY['customerName', 'coffeeType']
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Delivery Confirmation',
    'Hello {customerName}, your {coffeeWeight}kg of {coffeeType} has been delivered to {location}. Thank you for choosing our service!',
    ARRAY['customerName', 'coffeeWeight', 'coffeeType', 'location']
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Feedback Request',
    'Dear {customerName}, we would love to hear about your experience with our {coffeeType}. Your feedback helps us improve our service. Reply with your rating 1-5.',
    ARRAY['customerName', 'coffeeType']
  )
ON CONFLICT DO NOTHING;