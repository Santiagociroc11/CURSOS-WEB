
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import supabase from '../../lib/supabase';
import { Enrollment } from '../../types/database';
import { Card, CardContent } from '../ui/Card';

export const StudentProgress: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [enrollments, setEnrollments] = useState<(Enrollment & { course: { title: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    const fetchEnrollments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select('*, course:courses(title)')
          .eq('user_id', userProfile.id);
        if (error) throw error;
        setEnrollments(data as any || []);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [userProfile]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Progreso</h1>
      <div className="space-y-4">
        {enrollments.map(enrollment => (
          <Card key={enrollment.id}>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">{enrollment.course.title}</h2>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
              </div>
              <p className="text-right text-sm text-gray-600 mt-1">{enrollment.progress_percentage}% completado</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
