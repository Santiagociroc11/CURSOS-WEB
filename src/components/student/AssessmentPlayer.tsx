
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Assessment, Question } from '../../types/database';
import { Button } from '../ui/Button';
import { useAuthContext } from '../../contexts/AuthContext';

export const AssessmentPlayer: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAssessment = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    try {
      const assessmentRes = await supabase.from('assessments').select('*, course:courses(*)').eq('id', assessmentId).single();
      if (assessmentRes.data) {
        setAssessment(assessmentRes.data as any);
        setTimeLeft(assessmentRes.data.time_limit_minutes * 60);
      }
      const questionsRes = await supabase.from('questions').select('*').eq('assessment_id', assessmentId).order('order_index');
      if (questionsRes.data) setQuestions(questionsRes.data);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && assessment) {
      handleSubmit();
    }
  }, [timeLeft, assessment]);

  const handleSubmit = async () => {
    if (!userProfile || !assessment) return;
    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_answer) score += q.points; });
    const passed = score >= assessment.passing_score;

    await supabase.from('attempt_results').insert([{
      user_id: userProfile.id,
      assessment_id: assessment.id,
      score,
      passed,
      answers,
    }]);

    if (passed) {
      // Check for course completion
      const { data: courseContents } = await supabase.from('content').select('id').eq('course_id', assessment.course_id);
      const { data: courseAssessments } = await supabase.from('assessments').select('id').eq('course_id', assessment.course_id);
      const { data: userProgress } = await supabase.from('progress').select('content_id').eq('user_id', userProfile.id).eq('completed', true);
      const { data: userAttempts } = await supabase.from('attempt_results').select('assessment_id').eq('user_id', userProfile.id).eq('passed', true);

      const allContentCompleted = courseContents?.every(c => userProgress?.some(p => p.content_id === c.id));
      const allAssessmentsPassed = courseAssessments?.every(a => userAttempts?.some(att => att.assessment_id === a.id));

      if (allContentCompleted && allAssessmentsPassed) {
        await supabase.from('certificates').insert([{
          user_id: userProfile.id,
          course_id: assessment.course_id,
          issued_at: new Date().toISOString(),
        }]);
        alert('Felicidades! Has completado el curso y obtenido un certificado.');
      }
    }

    alert(`Your score: ${score}. You ${passed ? 'passed' : 'failed'}.`);
    navigate(`/student/courses/${assessment.course_id}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{assessment?.title}</h1>
      <p>Time Left: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}</p>
      
      <div className="space-y-8 mt-8">
        {questions.map((q, i) => (
          <div key={q.id}>
            <p className="font-semibold">{i + 1}. {q.question_text}</p>
            {q.type === 'multiple_choice' && q.options.map((opt: string) => (
              <div key={opt}><label><input type="radio" name={q.id} value={opt} onChange={e => setAnswers(a => ({...a, [q.id]: e.target.value}))} /> {opt}</label></div>
            ))}
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} className="mt-8">Submit Assessment</Button>
    </div>
  );
};
