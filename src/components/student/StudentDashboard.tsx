
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Enrollment } from '../../types/database';
import supabase from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';
import { CourseCatalog } from './CourseCatalog';

export const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    if (!userProfile) return;
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('user_id', userProfile.id)
        .order('last_accessed_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      setEnrollments(data || []);
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
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Cursos</h1>
        <p className="text-gray-600 mt-2">Continúa tu aprendizaje y explora nuevos cursos.</p>
      </div>

      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} hover>
              <Link to={`/student/courses/${enrollment.course.id}`}>
                <div className="aspect-video bg-gray-200 rounded-t-xl overflow-hidden">
                  {enrollment.course.thumbnail_url ? (
                    <img src={enrollment.course.thumbnail_url} alt={enrollment.course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><BookOpen className="h-12 w-12" /></div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg">{enrollment.course.title}</h3>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>{enrollment.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }} />
                  </div>
                </div>
                <Link to={`/student/courses/${enrollment.course.id}`} className="mt-4 block">
                  <Button className="w-full">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {enrollment.progress_percentage > 0 ? 'Continuar' : 'Comenzar'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">Aún no te has inscrito a ningún curso</h3>
          <p className="text-sm text-gray-500 mt-1">Explora el catálogo y encuentra tu próxima aventura de aprendizaje.</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Explorar Nuevos Cursos</h2>
          <p className="text-gray-600 mt-1">Encuentra tu próximo desafío.</p>
        </div>
        <CourseCatalog onEnroll={handleEnroll} enrolledCourseIds={enrollments.map(e => e.course_id)} />
      </div>
    </div>
  );
};
