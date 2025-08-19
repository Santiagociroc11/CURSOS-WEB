/*
  # Create attempt_results table for LMS platform

  1. New Tables
    - `attempt_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - references users table
      - `assessment_id` (uuid) - references assessments table
      - `score` (integer) - achieved score percentage
      - `passed` (boolean) - whether attempt passed
      - `answers` (jsonb) - user answers
      - `started_at` (timestamp) - attempt start time
      - `completed_at` (timestamp, optional) - attempt completion time

  2. Security
    - Enable RLS on `attempt_results` table
    - Add policies for users to manage their own attempts
    - Add policies for admins and instructors to view results
*/

CREATE TABLE IF NOT EXISTS attempt_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attempt_results_user_id ON attempt_results(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_results_assessment_id ON attempt_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attempt_results_score ON attempt_results(score);

-- Enable RLS
ALTER TABLE attempt_results ENABLE ROW LEVEL SECURITY;

-- Users can read their own attempt results
CREATE POLICY "Users can read own attempt results"
  ON attempt_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own attempt results
CREATE POLICY "Users can insert own attempt results"
  ON attempt_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own attempt results
CREATE POLICY "Users can update own attempt results"
  ON attempt_results
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all attempt results
CREATE POLICY "Admins can read all attempt results"
  ON attempt_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructors can read attempt results for their courses
CREATE POLICY "Instructors can read own course attempt results"
  ON attempt_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      JOIN courses ON courses.id = assessments.course_id
      WHERE assessments.id = attempt_results.assessment_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Admins can manage all attempt results
CREATE POLICY "Admins can manage all attempt results"
  ON attempt_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );