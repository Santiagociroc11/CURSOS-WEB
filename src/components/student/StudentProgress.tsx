
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import supabase from '../../lib/supabase';
import { Enrollment } from '../../types/database';
import { Card, CardContent } from '../ui/Card';
import { BookOpen, CheckCircle, Award, Target } from 'lucide-react';

interface EnrollmentWithProgress extends Omit<Enrollment, 'course'> {
  course: { 
    title: string;
    id: string;
  };
  realProgress: {
    contentCompleted: number;
    totalContent: number;
    contentPercentage: number;
    assessmentsCompleted: number;
    totalAssessments: number;
    assessmentPercentage: number;
    overallPercentage: number;
  };
}

export const StudentProgress: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    const fetchEnrollmentsWithProgress = async () => {
      setLoading(true);
      try {
        // Obtener inscripciones básicas
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*, course:courses(title, id)')
          .eq('user_id', userProfile.id);
        
        if (enrollmentsError) throw enrollmentsError;
        
        const enrollmentsWithProgress: EnrollmentWithProgress[] = [];
        
        // Para cada inscripción, calcular el progreso real
        for (const enrollment of (enrollmentsData || [])) {
          const courseId = enrollment.course_id;
          
          // 1. Obtener módulos del curso
          const { data: courseModules } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', courseId);
          
          const moduleIds = courseModules?.map(m => m.id) || [];
          
          // 2. Obtener contenido de los módulos
          const { data: courseContents } = moduleIds.length > 0 
            ? await supabase.from('content').select('id').in('module_id', moduleIds)
            : { data: [] };
          
          // 3. Obtener evaluaciones del curso
          const { data: courseAssessments } = await supabase
            .from('assessments')
            .select('id')
            .eq('course_id', courseId);
          
          // 4. Obtener progreso del usuario para este curso
          const contentIds = courseContents?.map(c => c.id) || [];
          const { data: userProgress } = contentIds.length > 0
            ? await supabase
                .from('progress')
                .select('content_id')
                .eq('user_id', userProfile.id)
                .eq('completed', true)
                .in('content_id', contentIds)
            : { data: [] };
          
          // 5. Obtener evaluaciones aprobadas del usuario para este curso
          const assessmentIds = courseAssessments?.map(a => a.id) || [];
          const { data: userAttempts } = assessmentIds.length > 0
            ? await supabase
                .from('attempt_results')
                .select('assessment_id')
                .eq('user_id', userProfile.id)
                .eq('passed', true)
                .in('assessment_id', assessmentIds)
            : { data: [] };
          
          // 6. Calcular estadísticas
          const totalContent = courseContents?.length || 0;
          const contentCompleted = userProgress?.length || 0;
          const contentPercentage = totalContent > 0 ? Math.round((contentCompleted / totalContent) * 100) : 0;
          
          const totalAssessments = courseAssessments?.length || 0;
          const assessmentsCompleted = userAttempts?.length || 0;
          const assessmentPercentage = totalAssessments > 0 ? Math.round((assessmentsCompleted / totalAssessments) * 100) : 0;
          
          // 7. Calcular progreso general (70% contenido + 30% evaluaciones)
          const overallPercentage = totalContent > 0 || totalAssessments > 0
            ? Math.round((contentPercentage * 0.7) + (assessmentPercentage * 0.3))
            : 0;
          
          // 8. Actualizar el progreso en la tabla enrollments si es diferente
          const currentStoredProgress = enrollment.progress_percentage || 0;
          if (Math.abs(currentStoredProgress - overallPercentage) > 1) { // Solo actualizar si hay diferencia significativa
            await supabase
              .from('enrollments')
              .update({ 
                progress_percentage: overallPercentage,
                last_accessed_at: new Date().toISOString()
              })
              .eq('id', enrollment.id);
          }
          
          enrollmentsWithProgress.push({
            ...enrollment,
            course: enrollment.course as { title: string; id: string },
            realProgress: {
              contentCompleted,
              totalContent,
              contentPercentage,
              assessmentsCompleted,
              totalAssessments,
              assessmentPercentage,
              overallPercentage
            }
          });
        }
        
        setEnrollments(enrollmentsWithProgress);
      } catch (error) {
        console.error('Error fetching enrollments with progress:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollmentsWithProgress();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Calculando tu progreso real...</p>
        </div>
      </div>
    );
  }

  const totalProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + e.realProgress.overallPercentage, 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mi Progreso</h1>
        
        {/* Progreso general */}
        <div className="flex items-center space-x-3">
          <Target className="h-8 w-8 text-gray-600" />
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{totalProgress}%</div>
            <div className="text-sm text-gray-600">Progreso General</div>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos inscritos</h3>
            <p className="text-gray-600">Inscríbete en algunos cursos para ver tu progreso aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {enrollments.map(enrollment => (
            <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {enrollment.course.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Inscrito el {new Date(enrollment.enrolled_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {enrollment.realProgress.overallPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">Completado</div>
                  </div>
                </div>

                {/* Barra de progreso principal */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${enrollment.realProgress.overallPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Detalles del progreso */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Progreso de contenido */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Contenido del Curso</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-blue-700">
                        {enrollment.realProgress.contentCompleted} de {enrollment.realProgress.totalContent} lecciones
                      </span>
                      <span className="font-semibold text-blue-900">
                        {enrollment.realProgress.contentPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${enrollment.realProgress.contentPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Progreso de evaluaciones */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Evaluaciones</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-green-700">
                        {enrollment.realProgress.assessmentsCompleted} de {enrollment.realProgress.totalAssessments} aprobadas
                      </span>
                      <span className="font-semibold text-green-900">
                        {enrollment.realProgress.assessmentPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${enrollment.realProgress.assessmentPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Estado del curso */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {enrollment.realProgress.overallPercentage === 100 ? (
                        <>
                          <Award className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium text-green-700">¡Curso Completado!</span>
                        </>
                      ) : enrollment.realProgress.overallPercentage >= 80 ? (
                        <>
                          <Target className="h-5 w-5 text-blue-500" />
                          <span className="font-medium text-blue-700">Casi terminado</span>
                        </>
                      ) : enrollment.realProgress.overallPercentage >= 50 ? (
                        <>
                          <BookOpen className="h-5 w-5 text-orange-500" />
                          <span className="font-medium text-orange-700">En progreso</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-5 w-5 text-gray-500" />
                          <span className="font-medium text-gray-700">Recién comenzado</span>
                        </>
                      )}
                    </div>
                    
                    {enrollment.last_accessed_at && (
                      <span className="text-xs text-gray-500">
                        Último acceso: {new Date(enrollment.last_accessed_at).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
