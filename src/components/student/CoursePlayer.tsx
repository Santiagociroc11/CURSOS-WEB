
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ChevronLeft, CheckCircle, ListChecks, FileText, Download, ExternalLink, Menu, X, Play, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Course, Module, Content, Progress, Assessment } from '../../types/database';
import supabase from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';

// Type definition for a module with its content
interface ModuleWithContent extends Module {
  content: Content[];
}

// Helper function to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string): string => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
};

// Helper function to check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper function to convert Google Drive URLs to embed format
const getGoogleDriveEmbedUrl = (url: string): string => {
  // Handle both sharing and file view URLs
  const shareRegex = /(?:https:\/\/drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
  const viewRegex = /(?:https:\/\/drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/;
  
  const shareMatch = url.match(shareRegex);
  const viewMatch = url.match(viewRegex);
  
  if (shareMatch) {
    return `https://drive.google.com/file/d/${shareMatch[1]}/preview`;
  } else if (viewMatch) {
    return `https://drive.google.com/file/d/${viewMatch[1]}/preview`;
  }
  
  return url;
};

// Helper function to check if URL is Google Drive
const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com');
};

// Helper function to translate content types to Spanish
const getContentTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    'video': 'Video',
    'document': 'Documento',
    'text': 'Texto',
    'audio': 'Audio',
    'quiz': 'Quiz',
    'reading': 'Lectura',
    'presentation': 'Presentación',
    'link': 'Enlace'
  };
  return typeLabels[type] || type;
};

export const CoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithContent[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModulesOverview, setShowModulesOverview] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [completionAnimation, setCompletionAnimation] = useState(false);

  const fetchCourseData = useCallback(async () => {
    console.log('fetchCourseData called with:', { courseId, userProfile: !!userProfile });
    
    if (!courseId) {
      console.error('No courseId provided');
      return;
    }
    
    if (!userProfile) {
      console.error('No userProfile available');
      return;
    }
    
    setLoading(true);
    try {
      // First, verify the user is enrolled in this course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('course_id', courseId)
        .single();

      if (enrollmentError || !enrollment) {
        console.error('User not enrolled in course or enrollment error:', enrollmentError);
        setAccessError('No tienes acceso a este curso. Contacta a tu administrador para obtener acceso.');
        setLoading(false);
        return;
      }
      console.log('Fetching course with ID:', courseId);
      const courseRes = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (courseRes.error) {
        console.error('Course fetch error:', courseRes.error);
        throw courseRes.error;
      }
      console.log('Course fetched successfully:', courseRes.data);
      setCourse(courseRes.data);

      console.log('Fetching modules for course:', courseId);
      const modulesRes = await supabase.from('modules').select('*, content(*)').eq('course_id', courseId).order('order_index').order('order_index', { foreignTable: 'content' });
      if (modulesRes.error) {
        console.error('Modules fetch error:', modulesRes.error);
        throw modulesRes.error;
      }
      console.log('Modules fetched successfully:', modulesRes.data);
      setModules(modulesRes.data as ModuleWithContent[]);

      const assessmentsRes = await supabase.from('assessments').select('*').eq('course_id', courseId);
      if (assessmentsRes.error) {
        console.error('Assessments fetch error:', assessmentsRes.error);
        throw assessmentsRes.error;
      }
      setAssessments(assessmentsRes.data);

      const contentIds = modulesRes.data.flatMap(m => m.content.map((c: Content) => c.id));
      if (contentIds.length > 0) {
        const progressRes = await supabase.from('progress').select('*').eq('user_id', userProfile.id).in('content_id', contentIds);
        if (progressRes.error) {
          console.error('Progress fetch error:', progressRes.error);
          throw progressRes.error;
        }
        setProgress(progressRes.data);

        // No seleccionar contenido automáticamente, mantener vista de módulos
        // const firstUncompleted = modulesRes.data.flatMap(m => m.content).find(c => !progressRes.data.some(p => p.content_id === c.id && p.completed));
        // const selectedContent = firstUncompleted || modulesRes.data?.[0]?.content?.[0] || null;
        // console.log('Selected content:', selectedContent);
        // setCurrentContent(selectedContent);
        setCurrentContent(null);
        setShowModulesOverview(true);
      } else {
        console.log('No content found for modules');
        setProgress([]);
        setCurrentContent(null);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      // Add more detailed error logging
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, userProfile]);

  useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) { // lg breakpoint
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [sidebarOpen]);

  const completedContentIds = useMemo(() => new Set(progress.filter(p => p.completed).map(p => p.content_id)), [progress]);

  const courseProgressPercentage = useMemo(() => {
    const totalContents = modules.reduce((acc, m) => acc + m.content.length, 0);
    if (totalContents === 0) return 0;
    return Math.round((completedContentIds.size / totalContents) * 100);
  }, [completedContentIds, modules]);

  const handleMarkComplete = async () => {
    if (!currentContent || !userProfile) return;
    try {
      // Trigger completion animation
      setCompletionAnimation(true);
      
      // Update progress in database
      await supabase.from('progress').upsert({ 
        user_id: userProfile.id, 
        content_id: currentContent.id, 
        completed: true, 
        completed_at: new Date().toISOString() 
      }, { onConflict: 'user_id,content_id' });
      
      // Update enrollment progress
      await supabase.from('enrollments').update({ 
        progress_percentage: courseProgressPercentage, 
        last_accessed_at: new Date().toISOString() 
      }).match({ user_id: userProfile.id, course_id: courseId });
      
      // Update local state without refetching (to avoid losing current position)
      setProgress(prev => [
        ...prev.filter(p => p.content_id !== currentContent.id),
        { 
          user_id: userProfile.id, 
          content_id: currentContent.id, 
          completed: true, 
          completed_at: new Date().toISOString() 
        }
      ]);
      
      // Hide animation after 2 seconds
      setTimeout(() => {
        setCompletionAnimation(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error marking as complete:', error);
      setCompletionAnimation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-ping mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Cargando tu curso</h2>
          <p className="text-gray-400 font-medium">Preparando el contenido para ti...</p>
          <div className="flex justify-center mt-6">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (accessError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">{accessError}</p>
          <Button onClick={() => navigate('/student')}>Volver a Mis Cursos</Button>
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Curso no encontrado</h2>
          <p className="text-gray-400 mb-6">El curso que buscas no existe o no está disponible.</p>
          <Button 
            onClick={() => navigate('/student')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a Mis Cursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.7) translateY(20px); 
            opacity: 0; 
          }
          to { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
      
      <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Completion Animation */}
      {completionAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center transform animate-scaleIn shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">¡Excelente!</h3>
            <p className="text-gray-600 mb-2">
              Has completado exitosamente:
            </p>
            <p className="text-gray-800 font-semibold text-lg mb-4">
              "{currentContent?.title}"
            </p>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Overlay - Solo mostrar cuando no estamos en vista de módulos */}
      {!showModulesOverview && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-in fade-in duration-300" 
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar sidebar"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSidebarOpen(false);
            }
          }}
        />
      )}
      
      {/* Sidebar - Solo mostrar cuando no estamos en vista de módulos */}
      {!showModulesOverview && (
      <div 
        className={`
          fixed lg:relative top-0 left-0 z-50 h-screen max-h-screen w-80 lg:w-80 xl:w-96 2xl:w-[400px] 
          bg-gray-900 border-r border-gray-700 shadow-2xl flex-shrink-0 flex flex-col
          overflow-x-hidden transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Navegación del curso"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setSidebarOpen(false);
          }
        }}
      >
        {/* Sidebar Header */}
          <div className="p-4 md:p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/student')}
              className="-ml-2 rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-white transition-all duration-200 hover:scale-105 group border border-white/20 hover:border-white/30 backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
              Mis Cursos
            </Button>
            
            {/* Close button for mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden -mr-2 rounded-xl bg-gray-700/50 hover:bg-gray-600 text-gray-200 hover:text-white transition-all duration-200 hover:scale-105 border border-gray-600/50 hover:border-gray-500"
              aria-label="Cerrar menú de navegación"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="font-bold text-lg md:text-xl text-white leading-tight mb-2 line-clamp-2">{course.title}</h2>
          <p className="text-sm text-gray-400">Curso interactivo</p>
        </div>

        {/* Progress Section */}
        <div className="p-4 md:p-6 border-b border-gray-700">
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-300">Progreso del curso</span>
              <span className="text-sm font-bold text-white">{courseProgressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out shadow-sm" 
                style={{ width: `${courseProgressPercentage}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            {completedContentIds.size} de {modules.reduce((acc, m) => acc + m.content.length, 0)} lecciones completadas
          </p>
        </div>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 max-h-[calc(100vh-300px)]">
          {modules.map((module) => (
            <div key={module.id} className="border-b border-gray-700">
              <h3 className="font-bold px-6 py-4 text-sm uppercase tracking-wider text-gray-400 bg-gray-800/50 truncate">
                {module.title}
              </h3>
              <ul className="space-y-1 pb-2">
                {module.content.map((content) => (
                  <li key={content.id}>
                    <button 
                      onClick={() => {
                        setCurrentContent(content);
                        setShowModulesOverview(false); // Change to content view
                        setSidebarOpen(false); // Close sidebar on mobile after selection
                      }} 
                      className={`
                        group w-full text-left py-3 text-sm flex items-center space-x-4 
                        transition-all duration-200 hover:bg-gray-800
                        ${currentContent?.id === content.id 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg mx-2 px-4 rounded-xl' 
                          : 'text-gray-300 hover:text-white px-6 hover:translate-x-1'
                        }
                      `}
                    >
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200
                        ${completedContentIds.has(content.id) 
                          ? 'bg-green-500 text-white' 
                          : currentContent?.id === content.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'
                        }
                      `}>
                        {completedContentIds.has(content.id) ? (
                        <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{content.title}</span>
                        <span className={`text-xs ${
                          currentContent?.id === content.id ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {getContentTypeLabel(content.type)}
                        </span>
                      </div>
                      
                      {/* Progress indicator */}
                      {completedContentIds.has(content.id) && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Assessments Section */}
          {assessments.length > 0 && (
            <div className="border-b border-gray-700">
              <h3 className="font-bold px-6 py-4 text-sm uppercase tracking-wider text-gray-400 bg-gray-800/50">
                Evaluaciones
              </h3>
              <ul className="space-y-1 pb-2">
                {assessments.map(assessment => (
                  <li key={assessment.id}>
                    <Link 
                      to={`/student/assessments/${assessment.id}`} 
                      className="group w-full text-left px-6 py-3 text-sm flex items-center space-x-4 
                                 text-gray-300 hover:text-white transition-all duration-200 
                                 hover:bg-gray-800 hover:translate-x-1"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-600 text-white group-hover:bg-purple-500 transition-all duration-200">
                        <ListChecks className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{assessment.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>
      )}
      <main className={`flex-1 min-w-0 overflow-y-auto ${showModulesOverview ? 'w-full bg-gray-900' : 'bg-gray-900'}`}>
        {showModulesOverview ? (
          // Vista de módulos
          <div className="min-h-full">
            {/* Header estilo Hotmart */}
            <div className="bg-gray-900 text-white">
              {/* Hero section del curso */}
              <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 md:px-8 py-6 sm:py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                  {/* Mobile back button */}
                  <div className="flex items-center gap-4 lg:hidden mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/student')}
                      className="rounded-lg hover:bg-white/10 text-white border-white/20"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Mis Cursos
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    {/* Contenido principal */}
                    <div className="lg:col-span-2">
                      <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        {course?.title}
                      </h1>
                      <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                        {course?.description}
                      </p>
                      
                      {/* Estadísticas */}
                      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">{modules.length}</span>
                          <span>módulos</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">{modules.reduce((acc, m) => acc + m.content.length, 0)}</span>
                          <span>lecciones</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">{assessments.length}</span>
                          <span>evaluaciones</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400 font-semibold">{courseProgressPercentage}%</span>
                          <span>completado</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview del curso */}
                    <div className="lg:col-span-1">
                      <div className="bg-black/30 rounded-lg p-6 backdrop-blur-sm border border-white/10">
                        <div className="aspect-[3/2] sm:aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center mb-4">
                          <Play className="h-8 w-8 sm:h-12 sm:w-12 text-white/70" />
                        </div>
                        <div className="text-center">
                          <div className="text-green-400 text-sm font-medium mb-1">
                            Progreso del curso
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-700 ease-out" 
                              style={{ width: `${courseProgressPercentage}%` }}
                            ></div>
                          </div>
                          <div className="text-white text-sm">
                            {completedContentIds.size} de {modules.reduce((acc, m) => acc + m.content.length, 0)} lecciones completadas
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de Rutas/Módulos estilo Hotmart */}
            <div className="bg-gray-900 min-h-screen">
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* Header de Rutas */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Rutas</h2>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400">Contenido organizado por módulos</p>
                    <div className="text-gray-400 text-sm">
                      Mostrar todos ({modules.length}) →
                    </div>
                  </div>
                </div>

                {/* Grid de módulos como cards */}
                {expandedModule === null ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {modules.map((module, moduleIndex) => {
                      const moduleProgress = Math.round((module.content.filter(c => completedContentIds.has(c.id)).length / module.content.length) * 100);
                      const gradients = [
                        'from-purple-600 to-blue-600',
                        'from-blue-600 to-cyan-600', 
                        'from-cyan-600 to-green-600',
                        'from-green-600 to-yellow-600',
                        'from-yellow-600 to-red-600',
                        'from-red-600 to-pink-600',
                        'from-pink-600 to-purple-600'
                      ];
                      const gradient = gradients[moduleIndex % gradients.length];
                      
                      return (
                        <div 
                          key={module.id}
                          className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                          onClick={() => setExpandedModule(module.id)}
                        >
                          <div className="relative overflow-hidden rounded-lg aspect-[3/2] sm:aspect-[4/3] mb-4">
                            {/* Imagen de fondo con gradiente */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`}>
                              <div className="absolute inset-0 bg-black/20"></div>
                            </div>
                            
                            {/* Contenido del card */}
                            <div className="relative h-full p-6 flex flex-col justify-between">
                              {/* Número del módulo */}
                              <div className="text-right">
                                <span className="text-white/70 text-sm font-medium">
                                  + Módulo {moduleIndex + 1} +
                                </span>
                              </div>
                              
                              {/* Título del módulo */}
                              <div className="text-center">
                                <h3 className="text-white text-xl md:text-2xl font-bold leading-tight mb-2">
                                  {module.title.toUpperCase().split(' ').map((word, i) => (
                                    <span key={i} className={i % 2 === 1 ? 'italic' : ''}>{word} </span>
                                  ))}
                                </h3>
                              </div>
                              
                              {/* Progreso */}
                              {moduleProgress > 0 && (
                                <div className="text-center">
                                  <div className="inline-flex items-center px-3 py-1 bg-black/30 rounded-full">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                    <span className="text-white text-sm font-medium">{moduleProgress}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Overlay hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                          </div>
                          
                          {/* Información del módulo */}
                          <div className="text-center">
                            <h4 className="text-white font-bold mb-1 group-hover:text-gray-300 transition-colors">
                              {module.title}
                            </h4>
                            <div className="text-gray-400 text-sm">
                              {module.content.length} lecciones • {module.duration_minutes} min
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Vista expandida del módulo seleccionado */
                  <div className="space-y-6">
                    {(() => {
                      const selectedModule = modules.find(m => m.id === expandedModule);
                      if (!selectedModule) return null;
                      
                      const moduleIndex = modules.findIndex(m => m.id === expandedModule);
                      const gradient = [
                        'from-purple-600 to-blue-600',
                        'from-blue-600 to-cyan-600', 
                        'from-cyan-600 to-green-600',
                        'from-green-600 to-yellow-600',
                        'from-yellow-600 to-red-600',
                        'from-red-600 to-pink-600',
                        'from-pink-600 to-purple-600'
                      ][moduleIndex % 7];

                      return (
                        <>
                          {/* Header del módulo expandido */}
                          <div className="flex items-center justify-between mb-8">
                            <button 
                              onClick={() => setExpandedModule(null)}
                              className="flex items-center bg-white/10 hover:bg-white/20 text-white hover:text-white transition-all duration-200 px-4 py-2 rounded-xl border border-white/20 hover:border-white/30 backdrop-blur-sm"
                            >
                              <ChevronLeft className="h-5 w-5 mr-2" />
                              Volver a rutas
                            </button>
                          </div>

                          {/* Hero del módulo */}
                          <div className={`relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r ${gradient}`}>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative p-8 md:p-12">
                              <div className="max-w-2xl">
                                <div className="text-white/80 text-sm font-medium mb-2">
                                  Módulo {moduleIndex + 1}
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                  {selectedModule.title}
                                </h2>
                                {selectedModule.description && (
                                  <p className="text-white/90 text-lg mb-6">{selectedModule.description}</p>
                                )}
                                <div className="flex items-center space-x-6 text-white/80">
                                  <span>{selectedModule.content.length} lecciones</span>
                                  <span>•</span>
                                  <span>{selectedModule.duration_minutes} minutos</span>
                                  <span>•</span>
                                  <span className="text-green-400 font-medium">
                                    {selectedModule.content.filter(c => completedContentIds.has(c.id)).length}/{selectedModule.content.length} completadas
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Lista de lecciones */}
                          <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                              <h3 className="text-xl font-bold text-white">Todos los contenidos</h3>
                            </div>
                            <div className="divide-y divide-gray-700">
                              {selectedModule.content.map((content, contentIndex) => (
                                <div 
                                  key={content.id}
                                  className="p-4 hover:bg-gray-750 transition-colors cursor-pointer group"
                                  onClick={() => {
                                    setCurrentContent(content);
                                    setShowModulesOverview(false);
                                    setExpandedModule(null);
                                  }}
                                >
                                  <div className="flex items-center space-x-4">
                                    {/* Número */}
                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 text-sm font-medium group-hover:bg-gray-600 transition-colors">
                                      {contentIndex + 1}
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0 w-16 h-10 bg-gray-700 rounded overflow-hidden relative">
                                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 flex items-center justify-center`}>
                                        {completedContentIds.has(content.id) ? (
                                          <CheckCircle className="h-4 w-4 text-white" />
                                        ) : (
                                          <Play className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      {content.duration_minutes > 0 && (
                                        <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 rounded">
                                          {content.duration_minutes}m
                                        </div>
                                      )}
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white font-medium mb-1 group-hover:text-gray-200 transition-colors">
                                        {content.title}
                                      </h4>
                                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                                        <span className="capitalize">{getContentTypeLabel(content.type)}</span>
                                        {content.duration_minutes > 0 && (
                                          <>
                                            <span>•</span>
                                            <span>{content.duration_minutes} min</span>
                                          </>
                                        )}
                                        {completedContentIds.has(content.id) && (
                                          <>
                                            <span>•</span>
                                            <span className="text-green-400 font-medium">Completado</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Estado */}
                                    <div className="flex-shrink-0">
                                      {completedContentIds.has(content.id) ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <div className="w-5 h-5 border-2 border-gray-600 rounded-full group-hover:border-gray-500 transition-colors"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Sección de evaluaciones - Solo mostrar si no hay módulo expandido */}
                {assessments.length > 0 && expandedModule === null && (
                  <div className="mt-16">
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Evaluaciones</h2>
                      <p className="text-gray-400">
                        {assessments.length} evaluación{assessments.length > 1 ? 'es' : ''} disponible{assessments.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assessments.map((assessment, assessmentIndex) => (
                        <Link
                          key={assessment.id}
                          to={`/student/assessments/${assessment.id}`}
                          className="group"
                        >
                          <div className="relative overflow-hidden rounded-lg aspect-[3/2] sm:aspect-[4/3] mb-4 transform transition-all duration-300 hover:scale-105">
                            {/* Fondo de evaluación */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 opacity-90">
                              <div className="absolute inset-0 bg-black/20"></div>
                            </div>
                            
                            {/* Contenido del card de evaluación */}
                            <div className="relative h-full p-6 flex flex-col justify-between">
                              {/* Tipo */}
                              <div className="text-right">
                                <span className="text-white/70 text-sm font-medium">
                                  + Evaluación {assessmentIndex + 1} +
                                </span>
                              </div>
                              
                              {/* Título */}
                              <div className="text-center">
                                <div className="mb-4">
                                  <ListChecks className="h-12 w-12 text-white mx-auto mb-2" />
                                </div>
                                <h3 className="text-white text-xl font-bold leading-tight">
                                  {assessment.title.toUpperCase()}
                                </h3>
                              </div>
                              
                              {/* Info */}
                              <div className="text-center">
                                <div className="inline-flex items-center px-3 py-1 bg-black/30 rounded-full">
                                  <span className="text-white text-sm font-medium">
                                    {assessment.passing_score}% mínimo
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Overlay hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                          </div>
                          
                          {/* Información de la evaluación */}
                          <div className="text-center">
                            <h4 className="text-white font-bold mb-1 group-hover:text-gray-300 transition-colors">
                              {assessment.title}
                            </h4>
                            <div className="text-gray-400 text-sm">
                              {assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : 'Sin límite'} • {assessment.passing_score}% mínimo
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
        ) : currentContent ? (
          <div className="flex flex-col min-h-full">
            {/* Header with title and complete button - FIRST */}
            <div className="p-4 sm:p-6 md:p-12 border-b border-gray-700 sticky top-0 z-20 backdrop-blur-sm bg-gray-800/95">
              <div className="max-w-full sm:max-w-4xl lg:max-w-6xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
                {/* Mobile menu button */}
                <div className="flex items-center gap-4 lg:hidden">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-white transition-all duration-200 hover:scale-105 border border-white/20 hover:border-white/30 backdrop-blur-sm"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Contenidos
                  </Button>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Breadcrumb / Back to modules */}
                  <div className="mb-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setShowModulesOverview(true);
                        setExpandedModule(null);
                      }}
                      className="-ml-2 rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-white transition-all duration-200 border border-white/20 hover:border-white/30 backdrop-blur-sm px-3 py-2"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Volver a rutas
                    </Button>
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 truncate">
                    {currentContent.title}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                      {getContentTypeLabel(currentContent.type)}
                    </span>
                    {completedContentIds.has(currentContent.id) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completado
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleMarkComplete} 
                  disabled={completedContentIds.has(currentContent.id) || completionAnimation}
                  className={`
                    px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 text-sm md:text-base
                    ${completedContentIds.has(currentContent.id) 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : completionAnimation
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg animate-pulse'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    }
                  `}
                >
                  {completedContentIds.has(currentContent.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Completado</span>
                      <span className="sm:hidden">✓</span>
                    </>
                  ) : completionAnimation ? (
                    <>
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 animate-spin" />
                      <span className="hidden sm:inline">¡Completado!</span>
                      <span className="sm:hidden">✓</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Marcar como Completado</span>
                      <span className="sm:hidden">Completar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Content Area - SECOND */}
            <div className="flex-1 bg-gray-900 p-4 sm:p-6 md:p-12 min-h-0">
              {/* Video Content */}
              {currentContent.type === 'video' && (
                <div className="relative aspect-video bg-gray-900 overflow-hidden shadow-2xl rounded-xl mb-8 max-w-full sm:max-w-4xl lg:max-w-6xl mx-auto border border-gray-700">
                  {currentContent.content_url ? (
                    <div className="w-full h-full">
                      {isYouTubeUrl(currentContent.content_url) ? (
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={getYouTubeEmbedUrl(currentContent.content_url)}
                          title={currentContent.title}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      ) : isGoogleDriveUrl(currentContent.content_url) ? (
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={getGoogleDriveEmbedUrl(currentContent.content_url)}
                          title={currentContent.title}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      ) : (
                        // @ts-ignore
                        <ReactPlayer 
                          url={currentContent.content_url} 
                          width="100%" 
                          height="100%" 
                          controls
                          playing={false}
                          onError={(error: any) => {
                            console.error('ReactPlayer error:', error);
                            console.error('URL that failed:', currentContent.content_url);
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white/70">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay URL de video disponible</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Document Content */}
              {currentContent.type === 'document' && (
                <div className="py-16 min-h-96">
                  <div className="max-w-4xl mx-auto text-center">
                    <div className="relative inline-block mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center shadow-xl">
                        <FileText className="h-12 w-12 text-gray-700" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                        <Download className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Material de Estudio</h3>
                    <p className="text-gray-300 mb-8 text-lg">Documento PDF disponible para descarga y estudio</p>
                    
                    {currentContent.content_url ? (
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(currentContent.content_url, '_blank')}
                          className="px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 hover:shadow-lg transition-all duration-200 hover:scale-105"
                        >
                          <ExternalLink className="h-5 w-5 mr-2" />
                          Ver Documento
                        </Button>
                        <Button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = currentContent.content_url!;
                            link.download = currentContent.title;
                            link.click();
                          }}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105"
                        >
                          <Download className="h-5 w-5 mr-2" />
                          Descargar PDF
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-800 rounded-xl p-6">
                        <p className="text-gray-400">No hay documento disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Text content */}
            {currentContent.type === 'text' && (
              <div className="py-16 max-w-5xl mx-auto">
                {currentContent.content_url && (
                  <div className="mb-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(currentContent.content_url, '_blank')}
                      className="px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Ver Enlace Externo
                    </Button>
                  </div>
                )}
                
                {/* Text content goes here directly instead of at the bottom */}
                {currentContent.content_text && (
                  <div className="prose prose-lg prose-invert max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ __html: currentContent.content_text }} 
                      className="text-gray-300 leading-relaxed"
                    />
                  </div>
                )}
                
                {/* If no content_text, show a placeholder */}
                {!currentContent.content_text && !currentContent.content_url && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Contenido de Texto</h3>
                    <p className="text-gray-400">Este contenido no tiene texto disponible.</p>
                  </div>
                )}
              </div>
            )}

            {/* Audio content */}
            {currentContent.type === 'audio' && (
              <div className="py-16">
                <div className="text-center max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-white mb-4">Audio</h3>
                  {currentContent.content_url ? (
                    <audio controls className="w-full max-w-md mx-auto">
                      <source src={currentContent.content_url} />
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  ) : (
                    <p className="text-gray-400">No hay audio disponible</p>
                  )}
                </div>
              </div>
            )}

            {/* Quiz content */}
            {currentContent.type === 'quiz' && (
              <div className="py-16">
                <div className="text-center max-w-2xl mx-auto">
                  <ListChecks className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white">Quiz Interactivo</h3>
                  <p className="text-gray-300 mt-2">Este contenido contiene un quiz interactivo</p>
                  {currentContent.content_url && (
                    <Button 
                      onClick={() => window.open(currentContent.content_url, '_blank')}
                      className="mt-4"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Iniciar Quiz
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Reading content */}
            {currentContent.type === 'reading' && (
              <div className="py-16">
                <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-2 mb-8">
                  <FileText className="h-6 w-6 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Material de Lectura</h3>
                </div>
                {currentContent.content_url && (
                  <div className="mb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(currentContent.content_url, '_blank')}
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Material
                    </Button>
                  </div>
                )}
                </div>
              </div>
            )}

            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-gray-900">
            {/* Mobile menu button when no content selected */}
            <div className="p-4 border-b border-gray-700 lg:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-white transition-all duration-200 hover:scale-105 border border-white/20 hover:border-white/30 backdrop-blur-sm"
              >
                <Menu className="h-4 w-4 mr-2" />
                Ver Contenidos del Curso
              </Button>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl px-8">
                <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Selecciona un contenido</h2>
                <p className="text-gray-400 text-lg mb-6">Elige una lección del menú para comenzar tu aprendizaje</p>
                
                {/* Additional mobile button */}
                <Button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Explorar Contenidos
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </>
  );
};
