
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Certificate } from '../../types/database';
import { Card, CardContent, CardHeader } from '../ui/Card';

export const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<(Certificate & { user: { full_name: string }, course: { title: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*, user:users(full_name), course:courses(title)');
        if (error) throw error;
        setCertificates(data as any || []);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Certificados</h1>
      <Card>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead><tr><th>Estudiante</th><th>Curso</th><th>Fecha de Emisión</th></tr></thead>
            <tbody>
              {certificates.map(cert => (
                <tr key={cert.id}>
                  <td>{cert.user.full_name}</td>
                  <td>{cert.course.title}</td>
                  <td>{new Date(cert.issued_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
