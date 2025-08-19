/*
  # Create assessments and questions tables for LMS platform

  1. New Tables
    - `assessments`
      - `id` (uuid, primary key)
      - `course_id` (uuid) - references courses table
      - `title` (text) - assessment title
      - `description` (text) - assessment description
      - `passing_score` (integer) - minimum score to pass
      - `max_attempts` (integer) - maximum attempts allowed
      - `time_limit_minutes` (integer, optional) - time limit
      - `is_active` (boolean) - whether assessment is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `questions`
      - `id` (uuid, primary key)
      - `assessment_id` (uuid) - references assessments table
      - `question_text` (text) - question content
      - `type` (text) - multiple_choice/true_false/text/essay
      - `options` (jsonb, optional) - answer options for multiple choice
      - `correct_answer` (text) - correct answer
      - `points` (integer) - points for this question
      - `order_index` (integer) - question order

  2. Security
    - Enable RLS on both tables
    - Add appropriate access policies
*/

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  time_limit_minutes integer CHECK (time_limit_minutes > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  type text NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'text', 'essay')),
  options jsonb,
  correct_answer text NOT NULL,
  points integer NOT NULL DEFAULT 1 CHECK (points > 0),
  order_index integer NOT NULL DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(assessment_id, order_index);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Assessment policies
CREATE POLICY "Users can read assessments for accessible courses"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assessments.course_id
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

CREATE POLICY "Admins can manage assessments"
  ON assessments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Instructors can manage own course assessments"
  ON assessments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assessments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Question policies
CREATE POLICY "Users can read questions for accessible assessments"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      JOIN courses ON courses.id = assessments.course_id
      WHERE assessments.id = questions.assessment_id
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

CREATE POLICY "Admins can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Instructors can manage own course questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      JOIN courses ON courses.id = assessments.course_id
      WHERE assessments.id = questions.assessment_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();