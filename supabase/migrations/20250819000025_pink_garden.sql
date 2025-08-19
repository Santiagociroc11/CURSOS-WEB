/*
  # Create enrollments table for LMS platform

  1. New Tables
    - `enrollments`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - references users table
      - `course_id` (uuid) - references courses table
      - `enrolled_at` (timestamp) - enrollment date
      - `completed_at` (timestamp, optional) - completion date
      - `progress_percentage` (integer) - course progress 0-100
      - `last_accessed_at` (timestamp, optional) - last access date

  2. Security
    - Enable RLS on `enrollments` table
    - Add policies for users to read their own enrollments
    - Add policies for admins to manage all enrollments
*/

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at timestamptz,
  UNIQUE(user_id, course_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON enrollments(progress_percentage);

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Users can read their own enrollments
CREATE POLICY "Users can read own enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all enrollments
CREATE POLICY "Admins can read all enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Course instructors can read enrollments for their courses
CREATE POLICY "Instructors can read own course enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Admins can insert enrollments
CREATE POLICY "Admins can insert enrollments"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can enroll themselves in published courses
CREATE POLICY "Users can enroll in published courses"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.is_published = true
    )
  );

-- Users can update their own enrollment progress
CREATE POLICY "Users can update own enrollment progress"
  ON enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can update all enrollments
CREATE POLICY "Admins can update all enrollments"
  ON enrollments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete enrollments
CREATE POLICY "Admins can delete enrollments"
  ON enrollments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );