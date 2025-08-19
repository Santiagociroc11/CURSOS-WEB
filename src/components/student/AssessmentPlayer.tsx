
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Assessment, Question } from '../../types/database';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { useAuthContext } from '../../contexts/AuthContext';
import { Clock, FileText, CheckCircle } from 'lucide-react';

export const AssessmentPlayer: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      if (questionsRes.data) {
        // Parse options JSON string to array
        const parsedQuestions = questionsRes.data.map(question => {
          let parsedOptions = [];
          if (question.options) {
            try {
              parsedOptions = typeof question.options === 'string' 
                ? JSON.parse(question.options) 
                : question.options;
            } catch (e) {
              console.error('Error parsing question options:', e);
              parsedOptions = [];
            }
          }
          
          return {
            ...question,
            options: Array.isArray(parsedOptions) ? parsedOptions : []
          };
        });
        setQuestions(parsedQuestions);
      }
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
    if (!userProfile || !assessment || submitting) return;
    
    setSubmitting(true);
    try {
      let score = 0;
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      
      questions.forEach(q => { 
        if (answers[q.id] === q.correct_answer) score += q.points; 
      });
      
      const percentageScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed = percentageScore >= assessment.passing_score;

      const { error } = await supabase.from('attempt_results').insert([{
        user_id: userProfile.id,
        assessment_id: assessment.id,
        score: percentageScore,
        passed,
        answers: JSON.stringify(answers),
      }]);

      if (error) throw error;

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
          alert('¡Felicidades! Has completado el curso y obtenido un certificado.');
        }
      }

      alert(`Tu puntuación: ${percentageScore}%. ${passed ? '¡Has aprobado!' : 'No has aprobado esta vez.'}`);
      navigate(`/student/courses/${assessment.course_id}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Error al enviar el examen. Por favor, inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Evaluación no encontrada</h2>
        <p className="text-gray-600 mt-2">No se pudo cargar la evaluación solicitada.</p>
        <Button onClick={() => navigate('/student')} className="mt-4">
          Volver a Mis Cursos
        </Button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="text-gray-600 mt-2">{assessment.description}</p>
            </div>
            <div className="text-right">
              <div className={`flex items-center space-x-2 text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                <Clock className="h-5 w-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Tiempo restante</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
              <div className="text-sm text-gray-600">Preguntas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{answeredQuestions}</div>
              <div className="text-sm text-gray-600">Respondidas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{assessment.passing_score}%</div>
              <div className="text-sm text-gray-600">Mínimo para aprobar</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">
                  {i + 1}. {q.question_text}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {q.points} pts
                  </span>
                  {answers[q.id] && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
            
            {q.type === 'multiple_choice' && Array.isArray(q.options) && q.options.map((opt: string, optIndex: number) => (
              opt.trim() && (
                <div key={`${q.id}-option-${optIndex}`} className="mb-2">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name={q.id} 
                      value={opt} 
                      checked={answers[q.id] === opt}
                      onChange={e => setAnswers(a => ({...a, [q.id]: e.target.value}))} 
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>{opt}</span>
                  </label>
                </div>
              )
            ))}
            
            {q.type === 'true_false' && (
              <div className="space-y-2">
                <div key={`${q.id}-true`}>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name={q.id} 
                      value="true" 
                      checked={answers[q.id] === 'true'}
                      onChange={e => setAnswers(a => ({...a, [q.id]: e.target.value}))} 
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>Verdadero</span>
                  </label>
                </div>
                <div key={`${q.id}-false`}>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name={q.id} 
                      value="false" 
                      checked={answers[q.id] === 'false'}
                      onChange={e => setAnswers(a => ({...a, [q.id]: e.target.value}))} 
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>Falso</span>
                  </label>
                </div>
              </div>
            )}
            
            {q.type === 'short_answer' && (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe tu respuesta..."
                value={answers[q.id] || ''}
                onChange={e => setAnswers(a => ({...a, [q.id]: e.target.value}))}
              />
            )}
            
            {q.type === 'essay' && (
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe tu respuesta..."
                value={answers[q.id] || ''}
                onChange={e => setAnswers(a => ({...a, [q.id]: e.target.value}))}
              />
            )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Has respondido {answeredQuestions} de {totalQuestions} preguntas
              </p>
              {answeredQuestions < totalQuestions && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Algunas preguntas no han sido respondidas
                </p>
              )}
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="px-8"
            >
              {submitting ? 'Enviando...' : 'Enviar Evaluación'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
