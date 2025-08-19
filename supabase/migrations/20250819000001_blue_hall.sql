/*
  # Create courses table for LMS platform

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text) - course title
      - `description` (text) - course description
      - `thumbnail_url` (text, optional) - course thumbnail image
      - `instructor_id` (uuid) - references users table
      - `duration_hours` (integer) - estimated course duration
      - `difficulty_level` (text) - beginner/intermediate/advanced
      - `category` (text) - course category
      - `is_published` (boolean) - whether course is published
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `courses` table
    - Add policies for public read access to published courses
    - Add policies for admins to manage all courses
    - Add policies for instructors to manage their own courses
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  thumbnail_url text,
  instructor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_hours integer NOT NULL DEFAULT 0,
  difficulty_level text NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Anyone can read published courses
CREATE POLICY "Anyone can read published courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Admins can read all courses
CREATE POLICY "Admins can read all courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructors can read their own courses
CREATE POLICY "Instructors can read own courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

-- Admins can insert courses
CREATE POLICY "Admins can insert courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all courses
CREATE POLICY "Admins can update all courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructors can update their own courses
CREATE POLICY "Instructors can update own courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid());

-- Admins can delete courses
CREATE POLICY "Admins can delete courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for courses table
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();