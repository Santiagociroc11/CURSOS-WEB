import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, TrendingUp, PlayCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Course, Enrollment } from '../../types/database';
import supabase from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchEnrollments();
    }
  }, [userProfile]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', userProfile?.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      // Mock data for demonstration
      setEnrollments([
        {
          id: '1',
          user_id: userProfile?.id || '',
          course_id: '1',
          enrolled_at: new Date().toISOString(),
          progress_percentage: 65,
          last_accessed_at: new Date().toISOString(),
          course: {
            id: '1',
            title: 'React Fundamentals',
            description: 'Aprende los conceptos básicos de React desde cero',
            thumbnail_url: 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=400',
            instructor_id: '1',
            duration_hours: 20,
            difficulty_level: 'beginner',
            category: 'Programación',
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        {
          id: '2',
          user_id: userProfile?.id || '',
          course_id: '2',
          enrolled_at: new Date().toISOString(),
          progress_percentage: 20,
          last_accessed_at: new Date().toISOString(),
          course: {
            id: '2',
            title: 'UI/UX Design Masterclass',
            description: 'Diseña interfaces modernas y experiencias de usuario excepcionales',
            thumbnail_url: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
            instructor_id: '2',
            duration_hours: 30,
            difficulty_level: 'intermediate',
            category: 'Diseño',
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const completedCourses = enrollments.filter(e => e.progress_percentage === 100);
  const inProgressCourses = enrollments.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100);
  const totalHoursStudied = enrollments.reduce((acc, e) => acc + ((e.course?.duration_hours || 0) * (e.progress_percentage / 100)), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">¡Hola, {userProfile?.full_name}!</h1>
        <p className="text-blue-100">Continúa tu aprendizaje donde lo dejaste</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cursos Inscritos</p>
                <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressCourses.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-gray-900">{completedCourses.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Estudiadas</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(totalHoursStudied)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      {inProgressCourses.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Continúa Aprendiendo</h2>
            <p className="text-gray-600">Retoma donde lo dejaste</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inProgressCourses.slice(0, 2).map((enrollment) => (
                <div key={enrollment.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {enrollment.course?.thumbnail_url ? (
                        <img 
                          src={enrollment.course.thumbnail_url} 
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{enrollment.course?.title}</h3>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progreso</span>
                          <span>{enrollment.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                      <Button size="sm" className="mt-3">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Continuar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Courses */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Mis Cursos</h2>
          <p className="text-gray-600">Todos tus cursos disponibles</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3">
                  {enrollment.course?.thumbnail_url ? (
                    <img 
                      src={enrollment.course.thumbnail_url} 
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-900 mb-2">{enrollment.course?.title}</h3>
                
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{enrollment.course?.duration_hours}h</span>
                  <span className="capitalize">{enrollment.course?.difficulty_level}</span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>{enrollment.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <Button 
                  variant={enrollment.progress_percentage === 100 ? 'secondary' : 'primary'} 
                  size="sm" 
                  className="w-full"
                >
                  {enrollment.progress_percentage === 100 ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completado
                    </>
                  ) : enrollment.progress_percentage > 0 ? (
                    <>
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Comenzar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};