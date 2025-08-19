
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle, Clock, Award, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Enrollment } from '../../types/database';
import supabase from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';
import { CourseCatalog } from './CourseCatalog';
import { getOptimizedProgressData, calculateProgressFromData, updateProgressInDB } from './OptimizedProgressCalculator';

export const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    if (!userProfile) return;
    try {
      // 🚀 OPTIMIZACIÓN: Una sola consulta por tabla en lugar de N+1
      const progressData = await getOptimizedProgressData(userProfile.id);
      const enrollmentsWithProgress = calculateProgressFromData(progressData);
      
      // Actualizar progreso en BD de manera optimizada
      await updateProgressInDB(enrollmentsWithProgress);
      
      // Ordenar por último acceso
      enrollmentsWithProgress.sort((a, b) => {
        const dateA = new Date(a.last_accessed_at || 0).getTime();
        const dateB = new Date(b.last_accessed_at || 0).getTime();
        return dateB - dateA;
      });
      
      setEnrollments(enrollmentsWithProgress);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleEnroll = async (courseId: string) => {
    if (!userProfile) return;
    try {
      const { error } = await supabase.from('enrollments').insert([{
        user_id: userProfile.id,
        course_id: courseId,
      }]);
      if (error) throw error;
      await fetchEnrollments();
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const totalProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 md:p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-600">{getGreeting()}, {userProfile?.full_name?.split(' ')[0]}</p>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Tu Campus Virtual
              </h1>
            </div>
          </div>
        </div>
      </div>


      {/* My Courses Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Mis Cursos</h2>
          {enrollments.length > 0 && (
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {enrollments.length} curso{enrollments.length !== 1 ? 's' : ''} activo{enrollments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {enrollments.map((enrollment, index) => (
              <Card 
                key={enrollment.id} 
                className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link to={`/student/courses/${enrollment.course.id}`}>
                  <div className="relative aspect-[4/3] sm:aspect-square bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                    {enrollment.course.thumbnail_url ? (
                      <img 
                        src={enrollment.course.thumbnail_url} 
                        alt={enrollment.course.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    
                    {/* Progress overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 sm:p-4">
                      <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${enrollment.progress_percentage}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </Link>

                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2 line-clamp-2 leading-tight">
                    {enrollment.course.title}
                  </h3>
                  
                  <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">Progreso del curso</span>
                      <span className="font-bold text-gray-900">{enrollment.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div 
                        className="bg-gradient-to-r from-gray-700 to-gray-900 h-2 sm:h-3 rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${enrollment.progress_percentage}%` }} 
                      />
                    </div>
                  </div>

                  <Link to={`/student/courses/${enrollment.course.id}`}>
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-3 font-semibold transition-all duration-200 hover:scale-105 group">
                      <PlayCircle className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
                      {enrollment.progress_percentage > 0 ? 'Continuar Aprendiendo' : 'Comenzar Curso'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">¡Comienza tu aventura de aprendizaje!</h3>
              <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                Aún no te has inscrito a ningún curso. Explora nuestro catálogo y encuentra el curso perfecto para ti.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
};
