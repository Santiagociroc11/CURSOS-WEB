import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  CheckCircle, 
  FileText, 
  ExternalLink,
  Clock,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Course, Module, Content } from '../../types/database';

export const CoursePlayer: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      // Mock data for demonstration
      const mockCourse: Course = {
        id: courseId!,
        title: 'React Fundamentals',
        description: 'Aprende los conceptos básicos de React desde cero con ejemplos prácticos y proyectos reales.',
        thumbnail_url: 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=800',
        instructor_id: '1',
        duration_hours: 20,
        difficulty_level: 'beginner',
        category: 'Programación',
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockModules: Module[] = [
        {
          id: '1',
          course_id: courseId!,
          title: 'Introducción a React',
          description: 'Conceptos básicos y configuración del entorno',
          order_index: 1,
          duration_minutes: 120,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          course_id: courseId!,
          title: 'Componentes y JSX',
          description: 'Creación de componentes y sintaxis JSX',
          order_index: 2,
          duration_minutes: 180,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          course_id: courseId!,
          title: 'Estado y Props',
          description: 'Manejo del estado y comunicación entre componentes',
          order_index: 3,
          duration_minutes: 150,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockContent: Content = {
        id: '1',
        module_id: '1',
        title: '¿Qué es React?',
        type: 'video',
        content_url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
        order_index: 1,
        duration_minutes: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCourse(mockCourse);
      setModules(mockModules);
      setCurrentContent(mockContent);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (moduleId: string) => {
    // In a real implementation, fetch content for this module
    console.log('Loading module:', moduleId);
  };

  const handleMarkComplete = () => {
    // Mark current content as completed
    console.log('Marking content as completed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Curso no encontrado</p>
        <Button onClick={() => navigate('/student')} className="mt-4">
          Volver a Mis Cursos
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Course Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => navigate('/student')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver a Mis Cursos
              </Button>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {course.duration_hours}h
                </span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  156 estudiantes
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600">{course.description}</p>
          </CardContent>
        </Card>

        {/* Video Player */}
        <Card>
          <CardContent className="p-0">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {currentContent?.type === 'video' && currentContent.content_url ? (
                <ReactPlayer
                  url={currentContent.content_url}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Selecciona un módulo para comenzar</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Info */}
        {currentContent && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentContent.title}</h2>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {currentContent.duration_minutes} min
                    </span>
                    <span className="capitalize flex items-center">
                      {currentContent.type === 'video' && <PlayCircle className="h-4 w-4 mr-1" />}
                      {currentContent.type === 'document' && <FileText className="h-4 w-4 mr-1" />}
                      {currentContent.type === 'link' && <ExternalLink className="h-4 w-4 mr-1" />}
                      {currentContent.type}
                    </span>
                  </div>
                </div>
                <Button onClick={handleMarkComplete} variant="secondary">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Completado
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar - Course Modules */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Contenido del Curso</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <p className="text-sm text-gray-600">35% completado</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {modules.map((module, index) => (
                <div key={module.id} className="border-b border-gray-100 last:border-b-0">
                  <button
                    onClick={() => handleModuleClick(module.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-2">
                            {index + 1}
                          </span>
                          <h4 className="text-sm font-medium text-gray-900">{module.title}</h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{module.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.duration_minutes} min
                        </div>
                      </div>
                      <div className="ml-2">
                        {index === 0 ? (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <PlayCircle className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};