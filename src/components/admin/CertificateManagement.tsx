
import React, { useState, useEffect, useMemo } from 'react';
import supabase from '../../lib/supabase';
import { Certificate } from '../../types/database';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Award, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface CertificateWithDetails extends Certificate {
  user: { 
    full_name: string;
    email: string;
  };
  course: { 
    title: string;
    category: string;
  };
}

interface CertificateStats {
  total: number;
  thisMonth: number;
  withUrl: number;
  withoutUrl: number;
}

export const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stats, setStats] = useState<CertificateStats>({
    total: 0,
    thisMonth: 0,
    withUrl: 0,
    withoutUrl: 0
  });

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          user:users(full_name, email),
          course:courses(title, category)
        `)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      const certificatesData = data as CertificateWithDetails[] || [];
      setCertificates(certificatesData);

      // Calcular estadísticas
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats: CertificateStats = {
        total: certificatesData.length,
        thisMonth: certificatesData.filter(cert => 
          new Date(cert.issued_at) >= startOfMonth
        ).length,
        withUrl: certificatesData.filter(cert => cert.certificate_url).length,
        withoutUrl: certificatesData.filter(cert => !cert.certificate_url).length
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Obtener lista única de cursos para el filtro
  const availableCourses = useMemo(() => {
    const courses = [...new Set(certificates.map(cert => cert.course.title))];
    return courses.sort();
  }, [certificates]);

  // Filtrar certificados
  const filteredCertificates = useMemo(() => {
    return certificates.filter(cert => {
      const matchesSearch = 
        cert.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.course.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = selectedCourse === 'all' || cert.course.title === selectedCourse;
      
      const matchesStatus = 
        selectedStatus === 'all' ||
        (selectedStatus === 'with-url' && cert.certificate_url) ||
        (selectedStatus === 'without-url' && !cert.certificate_url);
      
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [certificates, searchTerm, selectedCourse, selectedStatus]);

  const handleDownloadCertificate = async (certificateUrl: string, studentName: string, courseTitle: string) => {
    try {
      const response = await fetch(certificateUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificado-${studentName}-${courseTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error al descargar el certificado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando certificados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Certificados</h1>
          <p className="text-gray-600 mt-2">Administra y supervisa todos los certificados emitidos</p>
        </div>
        <Button onClick={fetchCertificates} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con URL</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withUrl}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Procesando</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withoutUrl}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar estudiante, email o curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Course Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Todos los cursos</option>
                {availableCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="with-url">Con certificado</option>
                <option value="without-url">Procesando</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">
                {filteredCertificates.length} de {certificates.length} certificados
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table/Grid */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {certificates.length === 0 ? 'No hay certificados' : 'No se encontraron certificados'}
            </h3>
            <p className="text-gray-600">
              {certificates.length === 0 
                ? 'Los certificados aparecerán aquí cuando los estudiantes completen los cursos.'
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCertificates.map((certificate) => (
            <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {certificate.user.full_name}
                        </h3>
                        {certificate.certificate_url && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-medium">{certificate.course.title}</span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {certificate.course.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(certificate.issued_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{certificate.user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {certificate.certificate_url ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(certificate.certificate_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadCertificate(
                            certificate.certificate_url!,
                            certificate.user.full_name,
                            certificate.course.title
                          )}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Procesando...</span>
                      </div>
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
