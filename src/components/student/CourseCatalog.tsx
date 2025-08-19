
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Course } from '../../types/database';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { BookOpen } from 'lucide-react';

interface CourseCatalogProps {
  onEnroll: (courseId: string) => Promise<void>;
  enrolledCourseIds: string[];
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ onEnroll, enrolledCourseIds }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true);
        if (error) throw error;
        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Cargando cursos...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const isEnrolled = enrolledCourseIds.includes(course.id);
        return (
          <Card key={course.id} hover>
            <div className="aspect-square bg-gray-200 rounded-t-xl overflow-hidden">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><BookOpen className="h-12 w-12" /></div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
              <p className="text-gray-600 text-sm mt-1 mb-3 line-clamp-2">{course.description}</p>
              {isEnrolled ? (
                <Link to={`/student/courses/${course.id}`}>
                  <Button variant="outline" className="w-full">Ir al Curso</Button>
                </Link>
              ) : (
                <Button onClick={() => onEnroll(course.id)} className="w-full">Inscribirse</Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
