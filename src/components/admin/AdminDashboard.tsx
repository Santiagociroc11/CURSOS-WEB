import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import supabase from '../../lib/supabase';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  completionRate: number;
}

const mockProgressData = [
  { month: 'Ene', estudiantes: 45, completados: 12 },
  { month: 'Feb', estudiantes: 52, completados: 18 },
  { month: 'Mar', estudiantes: 48, completados: 25 },
  { month: 'Abr', estudiantes: 61, completados: 28 },
  { month: 'May', estudiantes: 55, completados: 35 },
  { month: 'Jun', estudiantes: 67, completados: 42 },
];

const mockCourseData = [
  { curso: 'React Fundamentals', estudiantes: 45, completados: 38 },
  { curso: 'Node.js Backend', estudiantes: 32, completados: 25 },
  { curso: 'Database Design', estudiantes: 28, completados: 22 },
  { curso: 'UI/UX Design', estudiantes: 51, completados: 35 },
];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch courses count
        const { count: coursesCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });

        // Fetch students count
        const { count: studentsCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // Fetch enrollments count
        const { count: enrollmentsCount } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true });

        // Calculate completion rate (mock for now)
        const completionRate = enrollmentsCount ? Math.round((enrollmentsCount * 0.7) / enrollmentsCount * 100) : 0;

        setStats({
          totalCourses: coursesCount || 0,
          totalStudents: studentsCount || 0,
          totalEnrollments: enrollmentsCount || 0,
          completionRate,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set mock data for demonstration
        setStats({
          totalCourses: 24,
          totalStudents: 156,
          totalEnrollments: 289,
          completionRate: 73,
        });
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Cursos',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
    },
    {
      title: 'Estudiantes Activos',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%',
    },
    {
      title: 'Inscripciones',
      value: stats.totalEnrollments,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+15%',
    },
    {
      title: 'Tasa de Finalización',
      value: `${stats.completionRate}%`,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+5%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen general de la plataforma educativa</p>
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
                  <p className="text-sm text-green-600 mt-1">{stat.change} vs mes anterior</p>
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
        {/* Progress Over Time */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Progreso Mensual</h3>
            <p className="text-sm text-gray-600">Estudiantes activos vs completados</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="estudiantes" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  name="Estudiantes Activos"
                />
                <Line 
                  type="monotone" 
                  dataKey="completados" 
                  stroke="#059669" 
                  strokeWidth={2}
                  name="Cursos Completados"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Courses Performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Curso</h3>
            <p className="text-sm text-gray-600">Inscripciones vs finalizaciones</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockCourseData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="curso" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="estudiantes" fill="#2563EB" name="Inscritos" />
                <Bar dataKey="completados" fill="#059669" name="Completados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: 'María García', action: 'completó', course: 'React Fundamentals', time: 'hace 2 horas' },
                { user: 'Carlos López', action: 'se inscribió en', course: 'Node.js Backend', time: 'hace 4 horas' },
                { user: 'Ana Martínez', action: 'inició', course: 'UI/UX Design', time: 'hace 6 horas' },
                { user: 'Luis Rodríguez', action: 'completó', course: 'Database Design', time: 'hace 1 día' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {activity.action === 'completó' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                      <span className="font-medium text-blue-600">{activity.course}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
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