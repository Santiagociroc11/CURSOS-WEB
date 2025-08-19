
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Certificate } from '../../types/database';
import { useAuthContext } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Award } from 'lucide-react';

export const StudentCertificates: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [certificates, setCertificates] = useState<(Certificate & { course: { title: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*, course:courses(title)')
          .eq('user_id', userProfile.id);
        if (error) throw error;
        setCertificates(data as any || []);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [userProfile]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mis Certificados</h1>
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map(cert => (
            <Card key={cert.id}>
              <CardContent className="p-6 flex items-center space-x-4">
                <Award className="h-12 w-12 text-yellow-500" />
                <div>
                  <h2 className="text-xl font-semibold">{cert.course.title}</h2>
                  <p className="text-sm text-gray-500">Emitido el: {new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>Aún no has obtenido ningún certificado.</p>
      )}
    </div>
  );
};
