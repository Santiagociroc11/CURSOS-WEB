
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Certificate } from '../../types/database';
import { useAuthContext } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Award, Download, Eye } from 'lucide-react';
import { certificateService } from '../../services/certificateService';

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
        <div className="grid grid-cols-1 gap-6">
          {certificates.map(cert => (
            <Card key={cert.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Award className="h-12 w-12 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900 truncate">
                        {cert.course.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Emitido el: {new Date(cert.issued_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="mt-2">
                        {cert.certificate_url ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Certificado disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Procesando...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-2 ml-4">
                    {cert.certificate_url ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(cert.certificate_url, '_blank')}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Ver</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await certificateService.downloadCertificate(
                                cert.certificate_url!,
                                `Certificado-${cert.course.title.replace(/\s+/g, '-')}.pdf`
                              );
                            } catch (error) {
                              console.error('Error downloading certificate:', error);
                              alert('Error al descargar el certificado. Intenta nuevamente.');
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Descargar</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        disabled
                        variant="outline"
                        className="text-gray-400"
                      >
                        Generando...
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Award className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aún no hay certificados</h3>
          <p className="text-gray-600">
            Completa tus cursos y pasa las evaluaciones para obtener tus certificados.
          </p>
        </div>
      )}
    </div>
  );
};
