
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Assessment, Question } from '../../types/database';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { useAuthContext } from '../../contexts/AuthContext';
import { Clock, CheckCircle, Award, Download } from 'lucide-react';
import { certificateService } from '../../services/certificateService';

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
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState<{url: string, courseName: string} | null>(null);
  const [hasPassedAttempt, setHasPassedAttempt] = useState(false);
  const [passedAttemptData, setPassedAttemptData] = useState<{score: number, passed_at: string} | null>(null);
  const [existingCertificate, setExistingCertificate] = useState<{id: string, url?: string, issued_at: string} | null>(null);

  const fetchAssessment = useCallback(async () => {
    if (!assessmentId || !userProfile) return;
    setLoading(true);
    try {
      const assessmentRes = await supabase.from('assessments').select('*, course:courses(*)').eq('id', assessmentId).single();
      if (assessmentRes.data) {
        setAssessment(assessmentRes.data as any);
        setTimeLeft(assessmentRes.data.time_limit_minutes * 60);
        
        // Verificar si el usuario ya tiene un intento aprobado
        const { data: attemptData, error: attemptError } = await supabase
          .from('attempt_results')
          .select('score, started_at, passed')
          .eq('user_id', userProfile.id)
          .eq('assessment_id', assessmentId)
          .eq('passed', true)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (attemptError) {
          console.error('Error checking passed attempts:', attemptError);
        }
        
        if (attemptData) {
          setHasPassedAttempt(true);
          setPassedAttemptData({
            score: attemptData.score,
            passed_at: attemptData.started_at
          });
          
          // Verificar si ya existe un certificado para este curso
          const { data: certificateData, error: certError } = await supabase
            .from('certificates')
            .select('id, certificate_url, issued_at')
            .eq('user_id', userProfile.id)
            .eq('course_id', assessmentRes.data.course_id)
            .maybeSingle();
          
          if (certError) {
            console.error('Error checking existing certificate:', certError);
          }
          
          if (certificateData) {
            setExistingCertificate({
              id: certificateData.id,
              url: certificateData.certificate_url,
              issued_at: certificateData.issued_at
            });
          }
        }
      }
      
      // Solo cargar preguntas si no ha pasado el intento
      if (!hasPassedAttempt) {
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
      }
    } finally {
      setLoading(false);
    }
  }, [assessmentId, userProfile, hasPassedAttempt]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  useEffect(() => {
    if (timeLeft > 0 && !hasPassedAttempt) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && assessment && !hasPassedAttempt) {
      handleSubmit();
    }
  }, [timeLeft, assessment, hasPassedAttempt]);

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
        // Primero obtener todos los módulos del curso, luego su contenido
        const { data: courseModules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', assessment.course_id);
        
        const moduleIds = courseModules?.map(m => m.id) || [];
        console.log('Course modules found:', courseModules?.length, 'Module IDs:', moduleIds);
        
        const { data: courseContents, error: contentError } = moduleIds.length > 0 
          ? await supabase.from('content').select('id').in('module_id', moduleIds)
          : { data: [], error: null };
        
        if (contentError) {
          console.error('Error fetching course content:', contentError);
        }
        console.log('Course content found:', courseContents?.length);
        const { data: courseAssessments } = await supabase.from('assessments').select('id').eq('course_id', assessment.course_id);
        const { data: userProgress } = await supabase.from('progress').select('content_id').eq('user_id', userProfile.id).eq('completed', true);
        const { data: userAttempts } = await supabase.from('attempt_results').select('assessment_id').eq('user_id', userProfile.id).eq('passed', true);

        console.log('User progress:', userProgress?.length, 'Course assessments:', courseAssessments?.length, 'User attempts:', userAttempts?.length);
        
        const allContentCompleted = courseContents?.every(c => userProgress?.some(p => p.content_id === c.id));
        const allAssessmentsPassed = courseAssessments?.every(a => userAttempts?.some(att => att.assessment_id === a.id));

        console.log('All content completed:', allContentCompleted, 'All assessments passed:', allAssessmentsPassed);

        if (allContentCompleted && allAssessmentsPassed) {
          // Generar certificado usando la API externa
          setGeneratingCertificate(true);
          try {
            const courseResponse = await supabase
              .from('courses')
              .select('title')
              .eq('id', assessment.course_id)
              .single();
            
            const courseName = courseResponse.data?.title || 'Curso Completado';
            
            const certificateResult = await certificateService.generateCertificate(
              userProfile.full_name, 
              courseName
            );

            if (certificateResult.success) {
              // Guardar certificado en la base de datos con la URL
              await supabase.from('certificates').insert([{
                user_id: userProfile.id,
                course_id: assessment.course_id,
                certificate_url: certificateResult.certificate.download_url,
                issued_at: new Date().toISOString(),
              }]);
              
              setCertificateGenerated({
                url: certificateResult.certificate.download_url,
                courseName: courseName
              });
            } else {
              console.error('Error generating certificate:', certificateResult.message);
              // Guardar certificado sin URL como fallback
              await supabase.from('certificates').insert([{
                user_id: userProfile.id,
                course_id: assessment.course_id,
                issued_at: new Date().toISOString(),
              }]);
              alert('¡Felicidades! Has completado el curso. El certificado se generará en breve.');
            }
          } catch (error) {
            console.error('Error in certificate generation process:', error);
            // Guardar certificado sin URL como fallback
            await supabase.from('certificates').insert([{
              user_id: userProfile.id,
              course_id: assessment.course_id,
              issued_at: new Date().toISOString(),
            }]);
            alert('¡Felicidades! Has completado el curso. El certificado se generará en breve.');
          } finally {
            setGeneratingCertificate(false);
          }
        }
      }

      alert(`Tu puntuación: ${percentageScore}%. ${passed ? '¡Has aprobado!' : 'No has aprobado esta vez.'}`);
      
      // Si no se generó certificado, navegar inmediatamente
      if (!certificateGenerated) {
        navigate(`/student/courses/${assessment.course_id}`);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Error al enviar el examen. Por favor, inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateCertificateForPassed = async () => {
    if (!userProfile || !assessment) return;
    
    setGeneratingCertificate(true);
    try {
      // Verificar si el curso está completamente terminado
      // Primero obtener todos los módulos del curso, luego su contenido
      const { data: courseModules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', assessment.course_id);
      
      const moduleIds = courseModules?.map(m => m.id) || [];
      console.log('Course modules found:', courseModules?.length, 'Module IDs:', moduleIds);
      
      const { data: courseContents, error: contentError } = moduleIds.length > 0 
        ? await supabase.from('content').select('id').in('module_id', moduleIds)
        : { data: [], error: null };
      
      if (contentError) {
        console.error('Error fetching course content:', contentError);
      }
      console.log('Course content found:', courseContents?.length);
      const { data: courseAssessments } = await supabase.from('assessments').select('id').eq('course_id', assessment.course_id);
      const { data: userProgress } = await supabase.from('progress').select('content_id').eq('user_id', userProfile.id).eq('completed', true);
      const { data: userAttempts } = await supabase.from('attempt_results').select('assessment_id').eq('user_id', userProfile.id).eq('passed', true);

      console.log('User progress:', userProgress?.length, 'Course assessments:', courseAssessments?.length, 'User attempts:', userAttempts?.length);
      
      const allContentCompleted = courseContents?.every(c => userProgress?.some(p => p.content_id === c.id));
      const allAssessmentsPassed = courseAssessments?.every(a => userAttempts?.some(att => att.assessment_id === a.id));

      console.log('All content completed:', allContentCompleted, 'All assessments passed:', allAssessmentsPassed);

      if (!allContentCompleted || !allAssessmentsPassed) {
        alert('Debes completar todo el contenido del curso y aprobar todas las evaluaciones para generar el certificado.');
        return;
      }

      const courseResponse = await supabase
        .from('courses')
        .select('title')
        .eq('id', assessment.course_id)
        .single();
      
      const courseName = courseResponse.data?.title || 'Curso Completado';
      
      const certificateResult = await certificateService.generateCertificate(
        userProfile.full_name, 
        courseName
      );

      if (certificateResult.success) {
        // Actualizar o insertar certificado en la base de datos
        const { error } = await supabase.from('certificates').upsert([{
          user_id: userProfile.id,
          course_id: assessment.course_id,
          certificate_url: certificateResult.certificate.download_url,
          issued_at: new Date().toISOString(),
        }], { onConflict: 'user_id,course_id' });

        if (error) throw error;
        
        setExistingCertificate({
          id: 'new',
          url: certificateResult.certificate.download_url,
          issued_at: new Date().toISOString()
        });
        
        setCertificateGenerated({
          url: certificateResult.certificate.download_url,
          courseName: courseName
        });
      } else {
        console.error('Error generating certificate:', certificateResult.message);
        alert(`Error al generar el certificado: ${certificateResult.message}`);
      }
    } catch (error) {
      console.error('Error in certificate generation process:', error);
      alert('Error al generar el certificado. Por favor, inténtalo de nuevo.');
    } finally {
      setGeneratingCertificate(false);
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

  // Si el usuario ya pasó la evaluación, mostrar interfaz de certificado
  if (hasPassedAttempt && passedAttemptData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header de evaluación completada */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{assessment?.title}</h1>
                  <p className="text-green-700 font-medium mt-1">¡Evaluación Aprobada!</p>
                  <p className="text-gray-600 text-sm">
                    Puntuación obtenida: <strong>{passedAttemptData.score}%</strong> - 
                    Completado el {new Date(passedAttemptData.passed_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Sección de certificado */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Certificado del Curso</h2>
                <p className="text-gray-600">Obtén tu certificado oficial de finalización</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {existingCertificate ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">Certificado Disponible</h3>
                      <p className="text-green-700 text-sm">
                        Emitido el {new Date(existingCertificate.issued_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {existingCertificate.url ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => window.open(existingCertificate.url, '_blank')}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Award className="h-4 w-4" />
                      <span>Ver Certificado</span>
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await certificateService.downloadCertificate(
                            existingCertificate.url!,
                            `Certificado-${(assessment as any)?.course?.title?.replace(/\s+/g, '-') || 'Curso'}.pdf`
                          );
                        } catch (error) {
                          console.error('Error downloading certificate:', error);
                          alert('Error al descargar el certificado. Intenta nuevamente.');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar Certificado</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-700 text-sm">
                        Tu certificado está siendo procesado. Pronto estará disponible para descargar.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateCertificateForPassed}
                      disabled={generatingCertificate}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                    >
                      <Award className="h-4 w-4" />
                      <span>{generatingCertificate ? 'Procesando...' : 'Regenerar Certificado'}</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Award className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Generar Certificado</h3>
                      <p className="text-blue-700 text-sm">
                        Has completado exitosamente esta evaluación. Genera tu certificado oficial.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleGenerateCertificateForPassed}
                  disabled={generatingCertificate}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                  size="lg"
                >
                  <Award className="h-5 w-5" />
                  <span>{generatingCertificate ? 'Generando Certificado...' : 'Generar Certificado'}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón para volver al curso */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">¿Listo para continuar?</h3>
                <p className="text-gray-600 text-sm">Regresa al curso para explorar más contenido</p>
              </div>
              <Button
                onClick={() => navigate(`/student/courses/${assessment?.course_id}`)}
                variant="outline"
              >
                Volver al Curso
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modales (mismos que antes) */}
        {generatingCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Generando Certificado</h3>
                <p className="text-gray-600">Por favor espera mientras procesamos tu certificado...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {certificateGenerated && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-lg mx-4">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Certificado Generado!</h3>
                  <p className="text-gray-600 mb-4">
                    Tu certificado para <strong>"{certificateGenerated.courseName}"</strong> ha sido generado exitosamente.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={async () => {
                      try {
                        await certificateService.downloadCertificate(
                          certificateGenerated.url,
                          `Certificado-${certificateGenerated.courseName.replace(/\s+/g, '-')}.pdf`
                        );
                      } catch (error) {
                        console.error('Error downloading certificate:', error);
                        alert('Error al descargar el certificado. Intenta nuevamente.');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Certificado
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCertificateGenerated(null);
                      // Refrescar la página para mostrar el certificado actualizado
                      window.location.reload();
                    }}
                  >
                    Continuar
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  También puedes encontrar tu certificado en la sección "Mis Certificados"
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

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
            
            {q.type === 'text' && (
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

      {/* Modal de generación de certificado */}
      {generatingCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Generando Certificado</h3>
              <p className="text-gray-600">Por favor espera mientras procesamos tu certificado...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de certificado generado */}
      {certificateGenerated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-lg mx-4">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Felicidades!</h3>
                <p className="text-gray-600 mb-4">
                  Has completado exitosamente el curso <strong>"{certificateGenerated.courseName}"</strong> y has obtenido tu certificado.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={async () => {
                    try {
                      await certificateService.downloadCertificate(
                        certificateGenerated.url,
                        `Certificado-${certificateGenerated.courseName.replace(/\s+/g, '-')}.pdf`
                      );
                    } catch (error) {
                      console.error('Error downloading certificate:', error);
                      alert('Error al descargar el certificado. Intenta nuevamente.');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Certificado
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setCertificateGenerated(null);
                    navigate(`/student/courses/${assessment?.course_id}`);
                  }}
                >
                  Continuar
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                También puedes encontrar tu certificado en la sección "Mis Certificados"
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
