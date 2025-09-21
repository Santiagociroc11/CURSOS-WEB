import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award,
  Clock,
  CheckCircle,
  UserPlus,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { QueueMonitor } from './QueueMonitor';
import supabase from '../../lib/supabase';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'progress' | 'assessment' | 'certificate';
  user: string;
  action: string;
  course: string;
  timestamp: string;
  time_ago: string;
}

interface MonthlyData {
  month: string;
  inscripciones: number;
  certificados: number;
  evaluaciones_aprobadas: number;
}

interface CoursePerformanceData {
  curso: string;
  estudiantes: number;
  completados: number;
  tasa_completacion: number;
}

// Función para formatear tiempo relativo
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'ahora mismo';
  if (diffInMinutes < 60) return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  
  return `hace ${Math.floor(diffInWeeks / 4)} mes${Math.floor(diffInWeeks / 4) > 1 ? 'es' : ''}`;
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    completionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [coursePerformanceData, setCoursePerformanceData] = useState<CoursePerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener actividad reciente
  const fetchRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];

      // 1. Inscripciones recientes
      const { data: recentEnrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_at,
          user:users(full_name),
          course:courses(title)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(5);

      recentEnrollments?.forEach(enrollment => {
        const user = Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
        const course = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
        
        activities.push({
          id: `enrollment-${enrollment.id}`,
          type: 'enrollment',
          user: user?.full_name || 'Usuario desconocido',
          action: 'se inscribió en',
          course: course?.title || 'Curso desconocido',
          timestamp: enrollment.enrolled_at,
          time_ago: formatTimeAgo(enrollment.enrolled_at)
        });
      });

      // 2. Contenido completado reciente
      const { data: recentProgress } = await supabase
        .from('progress')
        .select(`
          id,
          completed_at,
          user:users(full_name),
          content:content(
            title,
            module:modules(
              course:courses(title)
            )
          )
        `)
        .eq('completed', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5);

      recentProgress?.forEach(progress => {
        if (progress.completed_at) {
          const user = Array.isArray(progress.user) ? progress.user[0] : progress.user;
          const content = Array.isArray(progress.content) ? progress.content[0] : progress.content;
          const module = Array.isArray(content?.module) ? content.module[0] : content?.module;
          const course = Array.isArray(module?.course) ? module.course[0] : module?.course;
          
          const contentTitle = content?.title || 'Contenido desconocido';
          const courseTitle = course?.title || 'Curso desconocido';
          
          activities.push({
            id: `progress-${progress.id}`,
            type: 'progress',
            user: user?.full_name || 'Usuario desconocido',
            action: `completó "${contentTitle}" en`,
            course: courseTitle,
            timestamp: progress.completed_at,
            time_ago: formatTimeAgo(progress.completed_at)
          });
        }
      });

      // 3. Evaluaciones aprobadas recientes
      const { data: recentAttempts } = await supabase
        .from('attempt_results')
        .select(`
          id,
          started_at,
          score,
          user:users(full_name),
          assessment:assessments(
            title,
            course:courses(title)
          )
        `)
        .eq('passed', true)
        .order('started_at', { ascending: false })
        .limit(5);

      recentAttempts?.forEach(attempt => {
        const user = Array.isArray(attempt.user) ? attempt.user[0] : attempt.user;
        const assessment = Array.isArray(attempt.assessment) ? attempt.assessment[0] : attempt.assessment;
        const course = Array.isArray(assessment?.course) ? assessment.course[0] : assessment?.course;
        
        activities.push({
          id: `assessment-${attempt.id}`,
          type: 'assessment',
          user: user?.full_name || 'Usuario desconocido',
          action: `aprobó la evaluación (${attempt.score}%)`,
          course: course?.title || 'Curso desconocido',
          timestamp: attempt.started_at,
          time_ago: formatTimeAgo(attempt.started_at)
        });
      });

      // 4. Certificados generados recientes
      const { data: recentCertificates } = await supabase
        .from('certificates')
        .select(`
          id,
          issued_at,
          user:users(full_name),
          course:courses(title)
        `)
        .order('issued_at', { ascending: false })
        .limit(5);

      recentCertificates?.forEach(certificate => {
        const user = Array.isArray(certificate.user) ? certificate.user[0] : certificate.user;
        const course = Array.isArray(certificate.course) ? certificate.course[0] : certificate.course;
        
        activities.push({
          id: `certificate-${certificate.id}`,
          type: 'certificate',
          user: user?.full_name || 'Usuario desconocido',
          action: 'obtuvo certificado de',
          course: course?.title || 'Curso desconocido',
          timestamp: certificate.issued_at,
          time_ago: formatTimeAgo(certificate.issued_at)
        });
      });

      // Ordenar todas las actividades por fecha y tomar las 10 más recientes
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    }
  };

  // Función para obtener datos mensuales
  const fetchMonthlyData = async () => {
    try {
      const currentDate = new Date();
      const monthsData: MonthlyData[] = [];
      
      // Obtener datos de los últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
        
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
        const startDate = date.toISOString();
        const endDate = nextMonth.toISOString();

        // Inscripciones del mes
        const { count: enrollmentsCount } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .gte('enrolled_at', startDate)
          .lt('enrolled_at', endDate);

        // Certificados del mes
        const { count: certificatesCount } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .gte('issued_at', startDate)
          .lt('issued_at', endDate);

        // Evaluaciones aprobadas del mes
        const { count: passedAssessmentsCount } = await supabase
          .from('attempt_results')
          .select('*', { count: 'exact', head: true })
          .eq('passed', true)
          .gte('started_at', startDate)
          .lt('started_at', endDate);

        monthsData.push({
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          inscripciones: enrollmentsCount || 0,
          certificados: certificatesCount || 0,
          evaluaciones_aprobadas: passedAssessmentsCount || 0
        });
      }

      setMonthlyData(monthsData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      setMonthlyData([]);
    }
  };

  // Función para obtener rendimiento por curso
  const fetchCoursePerformance = async () => {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          enrollments(count),
          certificates(count)
        `)
        .eq('is_published', true);

      if (courses) {
        const performanceData: CoursePerformanceData[] = [];

        for (const course of courses) {
          // Contar inscripciones
          const { count: enrollmentsCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Contar certificados (completaciones)
          const { count: completionsCount } = await supabase
            .from('certificates')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          const estudiantes = enrollmentsCount || 0;
          const completados = completionsCount || 0;
          const tasaCompletacion = estudiantes > 0 ? Math.round((completados / estudiantes) * 100) : 0;

          if (estudiantes > 0) { // Solo mostrar cursos con inscripciones
            performanceData.push({
              curso: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
              estudiantes,
              completados,
              tasa_completacion: tasaCompletacion
            });
          }
        }

        // Ordenar por número de estudiantes (descendente) y tomar los top 6
        performanceData.sort((a, b) => b.estudiantes - a.estudiantes);
        setCoursePerformanceData(performanceData.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching course performance:', error);
      setCoursePerformanceData([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        await Promise.all([
          fetchStats(),
          fetchRecentActivity(),
          fetchMonthlyData(),
          fetchCoursePerformance()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para obtener estadísticas reales
  const fetchStats = async () => {
    try {
      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Fetch enrollments count
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      // Calculate real completion rate based on certificates vs enrollments
      const { count: certificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      const completionRate = enrollmentsCount && enrollmentsCount > 0 
        ? Math.round(((certificatesCount || 0) / enrollmentsCount) * 100) 
        : 0;

      setStats({
        totalCourses: coursesCount || 0,
        totalStudents: studentsCount || 0,
        totalEnrollments: enrollmentsCount || 0,
        completionRate,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalCourses: 0,
        totalStudents: 0,
        totalEnrollments: 0,
        completionRate: 0,
      });
    }
  };

  // Función para obtener ícono y color según el tipo de actividad
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'enrollment':
        return { icon: UserPlus, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'progress':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'assessment':
        return { icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'certificate':
        return { icon: Award, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const statCards = [
    {
      title: 'Cursos Publicados',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Cursos disponibles'
    },
    {
      title: 'Estudiantes Registrados',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Usuarios estudiantes'
    },
    {
      title: 'Total Inscripciones',
      value: stats.totalEnrollments,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Inscripciones totales'
    },
    {
      title: 'Tasa de Certificación',
      value: `${stats.completionRate}%`,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Estudiantes certificados'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Datos en tiempo real de la plataforma educativa</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Actividad Mensual (Últimos 6 meses)</h3>
            <p className="text-sm text-gray-600">Inscripciones, certificados y evaluaciones aprobadas</p>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => `Mes: ${value}`}
                    formatter={(value, name) => [value, name]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="inscripciones" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    name="Inscripciones"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="certificados" 
                    stroke="#059669" 
                    strokeWidth={2}
                    name="Certificados"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="evaluaciones_aprobadas" 
                    stroke="#7C3AED" 
                    strokeWidth={2}
                    name="Evaluaciones Aprobadas"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay datos mensuales disponibles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses Performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Top Cursos por Inscripciones</h3>
            <p className="text-sm text-gray-600">Cursos más populares con tasa de certificación</p>
          </CardHeader>
          <CardContent>
            {coursePerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={coursePerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="curso" type="category" width={120} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Tasa de Certificación') return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="estudiantes" fill="#2563EB" name="Inscritos" />
                  <Bar dataKey="completados" fill="#059669" name="Certificados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay datos de cursos disponibles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchRecentActivity}
                className="text-sm"
              >
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const iconConfig = getActivityIcon(activity.type);
                  const IconComponent = iconConfig.icon;
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`w-8 h-8 ${iconConfig.bgColor} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <IconComponent className={`h-4 w-4 ${iconConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-5">
                          <span className="font-medium text-gray-900">{activity.user}</span>{' '}
                          <span className="text-gray-700">{activity.action}</span>{' '}
                          <span className="font-medium text-blue-600">{activity.course}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time_ago}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No hay actividad reciente</p>
                  <p className="text-gray-400 text-xs mt-1">Las actividades aparecerán aquí cuando los usuarios interactúen con la plataforma</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start h-12">
                <BookOpen className="h-4 w-4 mr-2" />
                Crear Nuevo Curso
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <Users className="h-4 w-4 mr-2" />
                Gestionar Usuarios
              </Button>
              <Button variant="outline" className="justify-start h-12">
                <Award className="h-4 w-4 mr-2" />
                Generar Reportes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};