/*
  # Create content table for LMS platform

  1. New Tables
    - `content`
      - `id` (uuid, primary key)
      - `module_id` (uuid) - references modules table
      - `title` (text) - content title
      - `type` (text) - video/document/presentation/link/text
      - `content_url` (text, optional) - URL for external content
      - `content_text` (text, optional) - text content
      - `order_index` (integer) - order within module
      - `duration_minutes` (integer) - estimated content duration
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `content` table
    - Add policies based on module access permissions
*/

CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('video', 'document', 'presentation', 'link', 'text')),
  content_url text,
  content_text text,
  order_index integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT content_has_content CHECK (
    (content_url IS NOT NULL AND content_url != '') OR 
    (content_text IS NOT NULL AND content_text != '')
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_module_id ON content(module_id);
CREATE INDEX IF NOT EXISTS idx_content_order ON content(module_id, order_index);

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Users can read content of modules they have access to
CREATE POLICY "Users can read accessible content"
  ON content
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = content.module_id
      AND (
        courses.is_published = true
        OR courses.instructor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
    )
  );

-- Admins can insert content
CREATE POLICY "Admins can insert content"
  ON content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update content
CREATE POLICY "Admins can update content"
  ON content
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Course instructors can manage content in their courses
CREATE POLICY "Instructors can manage own course content"
  ON content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = content.module_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Admins can delete content
CREATE POLICY "Admins can delete content"
  ON content
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for content table
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();