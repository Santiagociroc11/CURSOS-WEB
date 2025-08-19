export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'student';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// User without password for frontend use
export interface PublicUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  instructor_id: string;
  duration_hours: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  instructor?: User;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Content {
  id: string;
  module_id: string;
  title: string;
  type: 'video' | 'document' | 'presentation' | 'link' | 'text' | 'audio' | 'quiz' | 'reading';
  content_url?: string;
  content_text?: string;
  order_index: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  module?: Module;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string;
  progress_percentage: number;
  last_accessed_at?: string;
  user?: User;
  course?: Course;
}

export interface Progress {
  id: string;
  user_id: string;
  content_id: string;
  completed: boolean;
  completed_at?: string;
  time_spent_minutes: number;
  user?: User;
  content?: Content;
}

export interface Assessment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'text' | 'essay';
  options?: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

export interface AttemptResult {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  started_at: string;
  completed_at?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_url?: string;
  issued_at: string;
  user?: User;
  course?: Course;
}