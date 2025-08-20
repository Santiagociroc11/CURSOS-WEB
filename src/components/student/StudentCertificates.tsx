
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Certificate } from '../../types/database';
import { useAuthContext } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Award, Download, Eye, Gift, CheckCircle, AlertTriangle, Clock, Edit, X } from 'lucide-react';
import { certificateService } from '../../services/certificateService';

interface AvailableCertificate {
  course_id: string;
  course_title: string;
  content_completion: number;
  assessments_completed: boolean;
}

interface PendingCertificate {
  course_id: string;
  course_title: string;
  content_completion: number;
  assessments_completed: boolean;
  missing_content_percentage: number;
  missing_assessments: number;
  total_assessments: number;
}

export const StudentCertificates: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [certificates, setCertificates] = useState<(Certificate & { course: { title: string } })[]>([]);
  const [availableCertificates, setAvailableCertificates] = useState<AvailableCertificate[]>([]);
  const [pendingCertificates, setPendingCertificates] = useState<PendingCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [correctionCounts, setCorrectionCounts] = useState<Record<string, number>>({});

  const fetchAvailableCertificates = async () => {
    if (!userProfile) return;
    
    try {
      // Obtener todos los cursos en los que el usuario está inscrito
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id, course:courses(id, title)')
        .eq('user_id', userProfile.id);
      
      if (enrollmentError) throw enrollmentError;
      
      // Obtener certificados ya generados para excluirlos
      const { data: existingCerts } = await supabase
        .from('certificates')
        .select('course_id')
        .eq('user_id', userProfile.id);
      
      const existingCertCourseIds = existingCerts?.map(cert => cert.course_id) || [];
      
      const available: AvailableCertificate[] = [];
      const pending: PendingCertificate[] = [];
      
      // Verificar cada curso
      for (const enrollment of enrollments || []) {
        const courseId = enrollment.course_id;
        const courseTitle = (enrollment.course as any)?.title || 'Curso sin título';
        
        // Saltar si ya tiene certificado
        if (existingCertCourseIds.includes(courseId)) continue;
        
        // Obtener módulos del curso
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', courseId);
        
        const moduleIds = modules?.map(m => m.id) || [];
        
        // Obtener contenidos del curso
        const { data: contents } = moduleIds.length > 0 
          ? await supabase
              .from('content')
              .select('id')
              .in('module_id', moduleIds)
          : { data: [] };
        
        // Obtener progreso del usuario
        const { data: userProgress } = await supabase
          .from('progress')
          .select('content_id')
          .eq('user_id', userProfile.id)
          .eq('completed', true);
        
        // Obtener evaluaciones del curso
        const { data: assessments } = await supabase
          .from('assessments')
          .select('id')
          .eq('course_id', courseId);
        
        // Obtener intentos aprobados del usuario
        const { data: passedAttempts } = await supabase
          .from('attempt_results')
          .select('assessment_id')
          .eq('user_id', userProfile.id)
          .eq('passed', true);
        
        // Calcular estadísticas
        const totalContents = contents?.length || 0;
        const completedContents = contents?.filter(c => 
          userProgress?.some(p => p.content_id === c.id)
        ).length || 0;
        
        const contentCompletion = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;
        
        const totalAssessments = assessments?.length || 0;
        const completedAssessments = assessments?.filter(a =>
          passedAttempts?.some(att => att.assessment_id === a.id)
        ).length || 0;
        
        const assessmentsCompleted = totalAssessments === 0 || completedAssessments === totalAssessments;
        
        // Verificar si cumple requisitos (80% contenido + todas las evaluaciones)
        if (contentCompletion >= 80 && assessmentsCompleted) {
          available.push({
            course_id: courseId,
            course_title: courseTitle,
            content_completion: contentCompletion,
            assessments_completed: assessmentsCompleted
          });
        } else {
          // Agregar a certificados pendientes si no cumple requisitos
          const missingContentPercentage = Math.max(0, 80 - contentCompletion);
          const missingAssessments = Math.max(0, totalAssessments - completedAssessments);
          
          pending.push({
            course_id: courseId,
            course_title: courseTitle,
            content_completion: contentCompletion,
            assessments_completed: assessmentsCompleted,
            missing_content_percentage: missingContentPercentage,
            missing_assessments: missingAssessments,
            total_assessments: totalAssessments
          });
        }
      }
      
      setAvailableCertificates(available);
      setPendingCertificates(pending);
    } catch (error) {
      console.error('Error fetching available certificates:', error);
    }
  };

  useEffect(() => {
    if (!userProfile) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch existing certificates
        const { data, error } = await supabase
          .from('certificates')
          .select('*, course:courses(title)')
          .eq('user_id', userProfile.id);
        if (error) throw error;
        setCertificates(data as any || []);
        
        // Simular conteo de correcciones (en un caso real, esto vendría de la BD)
        const counts: Record<string, number> = {};
        data?.forEach(cert => {
          // Por ahora simulo que cada certificado tiene 0 correcciones
          // En una implementación real, esto vendría de un campo en la BD
          counts[cert.id] = 0;
        });
        setCorrectionCounts(counts);
        
        // Fetch available certificates
        await fetchAvailableCertificates();
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile]);

  const handleGenerateCertificate = async (courseId: string, courseName: string) => {
    if (!userProfile) return;
    
    setGeneratingCertificate(courseId);
    try {
      const certificateResult = await certificateService.generateCertificate(
        userProfile.full_name || userProfile.email,
        courseName
      );

      if (certificateResult.success) {
        // Guardar en la base de datos
        const { error } = await supabase.from('certificates').insert([{
          user_id: userProfile.id,
          course_id: courseId,
          certificate_url: certificateResult.certificate.download_url,
          issued_at: new Date().toISOString(),
        }]);

        if (error) throw error;
        
        // Actualizar las listas
        const newCertificate = {
          id: 'new-' + Date.now(),
          user_id: userProfile.id,
          course_id: courseId,
          certificate_url: certificateResult.certificate.download_url,
          issued_at: new Date().toISOString(),
          course: { title: courseName }
        };
        
        setCertificates(prev => [...prev, newCertificate as any]);
        setAvailableCertificates(prev => prev.filter(cert => cert.course_id !== courseId));
        
        // Descargar automáticamente
        await certificateService.downloadCertificate(
          certificateResult.certificate.download_url,
          `Certificado-${courseName.replace(/\s+/g, '-')}.pdf`
        );
      } else {
        throw new Error(certificateResult.message);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error al generar el certificado. Por favor, inténtalo de nuevo.');
    } finally {
      setGeneratingCertificate(null);
    }
  };

  const handleRegenerateCertificate = async (certificateId: string, courseTitle: string) => {
    if (!userProfile || !newName.trim()) return;
    
    const currentCorrections = correctionCounts[certificateId] || 0;
    if (currentCorrections >= 2) {
      alert('Has alcanzado el límite máximo de 2 correcciones de nombre para este certificado.');
      return;
    }
    
    setGeneratingCertificate(certificateId);
    try {
      const certificateResult = await certificateService.generateCertificate(
        newName.trim(),
        courseTitle
      );

      if (certificateResult.success) {
        // Actualizar el certificado existente en la base de datos
        const { error } = await supabase
          .from('certificates')
          .update({
            certificate_url: certificateResult.certificate.download_url,
            issued_at: new Date().toISOString(),
          })
          .eq('id', certificateId);

        if (error) throw error;
        
        // Actualizar la lista local
        setCertificates(prev => prev.map(cert => 
          cert.id === certificateId 
            ? { ...cert, certificate_url: certificateResult.certificate.download_url, issued_at: new Date().toISOString() }
            : cert
        ));
        
        // Descargar automáticamente
        await certificateService.downloadCertificate(
          certificateResult.certificate.download_url,
          `Certificado-${courseTitle.replace(/\s+/g, '-')}.pdf`
        );
        
        // Actualizar contador de correcciones
        setCorrectionCounts(prev => ({
          ...prev,
          [certificateId]: (prev[certificateId] || 0) + 1
        }));
        
        // Limpiar estados
        setEditingCertificate(null);
        setNewName('');
        
        const remainingCorrections = 2 - (correctionCounts[certificateId] || 0) - 1;
        alert(`¡Certificado regenerado exitosamente con el nuevo nombre! Te quedan ${remainingCorrections} corrección(es) disponible(s).`);
      } else {
        throw new Error(certificateResult.message);
      }
    } catch (error) {
      console.error('Error regenerating certificate:', error);
      alert('Error al regenerar el certificado. Por favor, inténtalo de nuevo.');
    } finally {
      setGeneratingCertificate(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-500 rounded-full animate-ping mx-auto"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cargando certificados</h2>
            <p className="text-gray-600 font-medium">Revisando tus logros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Certificados</h1>
      
      {/* Certificados disponibles para generar */}
      {availableCertificates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Gift className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-green-700">Certificados listos para generar</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {availableCertificates.map(cert => (
              <Card key={cert.course_id} className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                          {cert.course_title}
                        </h3>
                        <p className="text-sm text-green-700 mt-1 font-medium">
                          ¡Felicidades! Cumples todos los requisitos
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {cert.content_completion}% Contenido completado
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Todas las evaluaciones aprobadas
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleGenerateCertificate(cert.course_id, cert.course_title)}
                        disabled={generatingCertificate === cert.course_id}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 py-3"
                      >
                        {generatingCertificate === cert.course_id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generando...
                          </>
                        ) : (
                          <>
                            <Award className="h-4 w-4 mr-2" />
                            Generar Certificado
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Certificados pendientes por requisitos */}
      {pendingCertificates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-bold text-orange-700">Certificados pendientes</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Estos cursos necesitan requisitos adicionales para obtener el certificado
          </p>
          <div className="grid grid-cols-1 gap-4">
            {pendingCertificates.map(cert => (
              <Card key={cert.course_id} className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-orange-100 rounded-full">
                          <AlertTriangle className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                          {cert.course_title}
                        </h3>
                        <p className="text-sm text-orange-700 mt-1 font-medium">
                          Requisitos pendientes para obtener certificado
                        </p>
                        <div className="space-y-2 mt-3">
                          <div className="space-y-1">
                            <div className={`flex items-center space-x-2 ${cert.content_completion >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                              <div className={`w-2 h-2 rounded-full ${cert.content_completion >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                              <span className="text-xs font-medium">
                                Contenido: {cert.content_completion}% de 80% requerido
                                {cert.missing_content_percentage > 0 && ` (faltan ${cert.missing_content_percentage}%)`}
                              </span>
                            </div>
                            <div className={`flex items-center space-x-2 ${cert.assessments_completed ? 'text-green-600' : 'text-orange-600'}`}>
                              <div className={`w-2 h-2 rounded-full ${cert.assessments_completed ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                              <span className="text-xs font-medium">
                                Evaluaciones: {cert.total_assessments - cert.missing_assessments} de {cert.total_assessments} aprobadas
                                {cert.missing_assessments > 0 && ` (faltan ${cert.missing_assessments})`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 font-medium px-4 py-2"
                        disabled
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Requisitos pendientes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Certificados ya obtenidos */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Award className="h-6 w-6 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900">Certificados obtenidos</h2>
        </div>
        
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {certificates.map(cert => (
              <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <Award className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
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
                    <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 justify-end">
                      {cert.certificate_url ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(cert.certificate_url, '_blank')}
                            className="flex items-center space-x-1 flex-1 sm:flex-none justify-center"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
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
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1 flex-1 sm:flex-none justify-center"
                          >
                            <Download className="h-4 w-4" />
                            <span>Descargar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCertificate(cert.id);
                              setNewName(userProfile?.full_name || userProfile?.email || '');
                            }}
                            disabled={(correctionCounts[cert.id] || 0) >= 2}
                            className={`flex items-center space-x-1 flex-1 sm:flex-none justify-center ${
                              (correctionCounts[cert.id] || 0) >= 2 
                                ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                                : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                            }`}
                          >
                            <Edit className="h-4 w-4" />
                            <span>
                              {(correctionCounts[cert.id] || 0) >= 2 
                                ? 'Límite alcanzado' 
                                : `Corregir nombre (${2 - (correctionCounts[cert.id] || 0)} restantes)`}
                            </span>
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
                  
                  {/* Formulario de edición de nombre */}
                  {editingCertificate === cert.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">Corregir nombre en el certificado</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              Correcciones restantes: {2 - (correctionCounts[cert.id] || 0)} de 2
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCertificate(null);
                              setNewName('');
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nuevo nombre para el certificado
                            </label>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Ingresa el nombre correcto"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ Solo puedes corregir el nombre 2 veces por certificado. Asegúrate de escribirlo correctamente.
                            </p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCertificate(null);
                                setNewName('');
                              }}
                              className="text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRegenerateCertificate(cert.id, cert.course.title)}
                              disabled={!newName.trim() || generatingCertificate === cert.id}
                              className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              {generatingCertificate === cert.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Regenerando...
                                </>
                              ) : (
                                'Regenerar certificado'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
    </div>
  );
};
