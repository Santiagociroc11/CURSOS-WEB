/*
  # Create progress table for LMS platform

  1. New Tables
    - `progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - references users table
      - `content_id` (uuid) - references content table
      - `completed` (boolean) - whether content is completed
      - `completed_at` (timestamp, optional) - completion date
      - `time_spent_minutes` (integer) - time spent on content

  2. Security
    - Enable RLS on `progress` table
    - Add policies for users to manage their own progress
    - Add policies for admins to read all progress
*/

CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  time_spent_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_content_id ON progress(content_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON progress(completed);

-- Enable RLS
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can read own progress"
  ON progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all progress
CREATE POLICY "Admins can read all progress"
  ON progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Course instructors can read progress for their courses
CREATE POLICY "Instructors can read own course progress"
  ON progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content
      JOIN modules ON modules.id = content.module_id
      JOIN courses ON courses.id = modules.course_id
      WHERE content.id = progress.content_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all progress
CREATE POLICY "Admins can manage all progress"
  ON progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for progress table
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update enrollment progress when content progress changes
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
  course_id_var uuid;
  total_content integer;
  completed_content integer;
  new_progress integer;
BEGIN
  -- Get the course ID for this content
  SELECT courses.id INTO course_id_var
  FROM content
  JOIN modules ON modules.id = content.module_id
  JOIN courses ON courses.id = modules.course_id
  WHERE content.id = NEW.content_id;

  -- Count total content in the course
  SELECT COUNT(*) INTO total_content
  FROM content
  JOIN modules ON modules.id = content.module_id
  WHERE modules.course_id = course_id_var;

  -- Count completed content for this user in the course
  SELECT COUNT(*) INTO completed_content
  FROM progress
  JOIN content ON content.id = progress.content_id
  JOIN modules ON modules.id = content.module_id
  WHERE modules.course_id = course_id_var
  AND progress.user_id = NEW.user_id
  AND progress.completed = true;

  -- Calculate new progress percentage
  IF total_content > 0 THEN
    new_progress := ROUND((completed_content::float / total_content::float) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update enrollment progress
  UPDATE enrollments
  SET 
    progress_percentage = new_progress,
    completed_at = CASE WHEN new_progress = 100 THEN now() ELSE NULL END,
    last_accessed_at = now()
  WHERE user_id = NEW.user_id AND course_id = course_id_var;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update enrollment progress when content progress changes
CREATE TRIGGER update_enrollment_progress_trigger
  AFTER INSERT OR UPDATE ON progress
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_progress();