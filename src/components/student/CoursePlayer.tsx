
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ChevronLeft, CheckCircle, ListChecks, FileText, Download, ExternalLink, Menu, X } from 'lucide-react';
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

        const firstUncompleted = modulesRes.data.flatMap(m => m.content).find(c => !progressRes.data.some(p => p.content_id === c.id && p.completed));
        const selectedContent = firstUncompleted || modulesRes.data?.[0]?.content?.[0] || null;
        console.log('Selected content:', selectedContent);
        if (selectedContent) {
          console.log('Content URL:', selectedContent.content_url);
          console.log('Content type:', selectedContent.type);
        }
        setCurrentContent(selectedContent);
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

  const completedContentIds = useMemo(() => new Set(progress.filter(p => p.completed).map(p => p.content_id)), [progress]);

  const courseProgressPercentage = useMemo(() => {
    const totalContents = modules.reduce((acc, m) => acc + m.content.length, 0);
    if (totalContents === 0) return 0;
    return Math.round((completedContentIds.size / totalContents) * 100);
  }, [completedContentIds, modules]);

  const handleMarkComplete = async () => {
    if (!currentContent || !userProfile) return;
    try {
      await supabase.from('progress').upsert({ user_id: userProfile.id, content_id: currentContent.id, completed: true, completed_at: new Date().toISOString() }, { onConflict: 'user_id,content_id' });
      await supabase.from('enrollments').update({ progress_percentage: courseProgressPercentage, last_accessed_at: new Date().toISOString() }).match({ user_id: userProfile.id, course_id: courseId });
      fetchCourseData(); // Refetch to get next uncompleted
    } catch (error) {
      console.error('Error marking as complete:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
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
  if (!course) return <div>Course not found.</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 z-50 h-full w-80 lg:w-72 xl:w-80 2xl:w-96 
        bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-xl overflow-y-auto flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 md:p-6 border-b border-gray-100/50 bg-gradient-to-br from-white to-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/student')}
              className="-ml-2 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 group"
            >
              <ChevronLeft className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
              Mis Cursos
            </Button>
            
            {/* Close button for mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden -mr-2 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="font-bold text-lg md:text-xl text-gray-900 leading-tight mb-2 line-clamp-2">{course.title}</h2>
          <p className="text-sm text-gray-600">Curso interactivo</p>
        </div>

        {/* Progress Section */}
        <div className="p-4 md:p-6 border-b border-gray-100/50">
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Progreso del curso</span>
              <span className="text-sm font-bold text-gray-900">{courseProgressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-700 to-gray-900 h-3 rounded-full transition-all duration-700 ease-out shadow-sm" 
                style={{ width: `${courseProgressPercentage}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {completedContentIds.size} de {modules.reduce((acc, m) => acc + m.content.length, 0)} lecciones completadas
          </p>
        </div>
        {/* Navigation */}
        <nav className="flex-1">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border-b border-gray-100/50">
              <h3 className="font-bold px-6 py-4 text-sm uppercase tracking-wider text-gray-500 bg-gray-50/50">
                {module.title}
              </h3>
              <ul className="space-y-1 pb-2">
                {module.content.map((content, contentIndex) => (
                  <li key={content.id}>
                    <button 
                      onClick={() => {
                        setCurrentContent(content);
                        setSidebarOpen(false); // Close sidebar on mobile after selection
                      }} 
                      className={`
                        group w-full text-left py-3 text-sm flex items-center space-x-4 
                        transition-all duration-200 hover:bg-gray-50
                        ${currentContent?.id === content.id 
                          ? 'bg-gray-900 text-white shadow-lg mx-2 px-4 rounded-xl' 
                          : 'text-gray-700 hover:text-gray-900 px-6 hover:translate-x-1'
                        }
                      `}
                    >
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200
                        ${completedContentIds.has(content.id) 
                          ? 'bg-gray-100 text-gray-800' 
                          : currentContent?.id === content.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                        }
                      `}>
                        <CheckCircle className="h-4 w-4" />
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
                        <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Assessments Section */}
          {assessments.length > 0 && (
            <div className="border-b border-gray-100/50">
              <h3 className="font-bold px-6 py-4 text-sm uppercase tracking-wider text-gray-500 bg-gray-50/50">
                Evaluaciones
              </h3>
              <ul className="space-y-1 pb-2">
                {assessments.map(assessment => (
                  <li key={assessment.id}>
                    <Link 
                      to={`/student/assessments/${assessment.id}`} 
                      className="group w-full text-left px-6 py-3 text-sm flex items-center space-x-4 
                                 text-gray-700 hover:text-gray-900 transition-all duration-200 
                                 hover:bg-gray-50 hover:translate-x-1"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-all duration-200">
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
      <main className="flex-1 overflow-y-auto bg-white min-w-0">
        {currentContent ? (
          <div className="h-full flex flex-col">
            {/* Header with title and complete button - FIRST */}
            <div className="p-4 md:p-8 border-b border-gray-100/50 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                {/* Mobile menu button */}
                <div className="flex items-center gap-4 lg:hidden">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Contenidos
                  </Button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2 truncate">
                    {currentContent.title}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {getContentTypeLabel(currentContent.type)}
                    </span>
                    {completedContentIds.has(currentContent.id) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-white">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completado
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleMarkComplete} 
                  disabled={completedContentIds.has(currentContent.id)}
                  className={`
                    px-4 md:px-6 py-2 md:py-3 rounded-2xl font-semibold transition-all duration-200 hover:scale-105 text-sm md:text-base
                    ${completedContentIds.has(currentContent.id) 
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                    }
                  `}
                >
                  {completedContentIds.has(currentContent.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Completado</span>
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
            <div className="flex-1">
              {/* Video Content */}
              {currentContent.type === 'video' && (
                <div className="relative aspect-video bg-gray-900 overflow-hidden shadow-lg">
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
                <div className="p-12 bg-gradient-to-br from-gray-50 to-white min-h-96">
                  <div className="max-w-2xl mx-auto text-center">
                    <div className="relative inline-block mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center shadow-xl">
                        <FileText className="h-12 w-12 text-gray-700" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                        <Download className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Material de Estudio</h3>
                    <p className="text-gray-600 mb-8 text-lg">Documento PDF disponible para descarga y estudio</p>
                    
                    {currentContent.content_url ? (
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(currentContent.content_url, '_blank')}
                          className="px-6 py-3 rounded-2xl border-2 hover:shadow-lg transition-all duration-200 hover:scale-105"
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
                          className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 transition-all duration-200 hover:scale-105"
                        >
                          <Download className="h-5 w-5 mr-2" />
                          Descargar PDF
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-2xl p-6">
                        <p className="text-gray-600">No hay documento disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Text content */}
            {currentContent.type === 'text' && (
              <div className="p-8 max-w-4xl mx-auto">
                {currentContent.content_url && (
                  <div className="mb-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(currentContent.content_url, '_blank')}
                      className="px-6 py-3 rounded-2xl border-2 hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Ver Enlace Externo
                    </Button>
                  </div>
                )}
                
                {/* Text content goes here directly instead of at the bottom */}
                {currentContent.content_text && (
                  <div className="prose prose-lg prose-gray max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ __html: currentContent.content_text }} 
                      className="text-gray-700 leading-relaxed"
                    />
                  </div>
                )}
                
                {/* If no content_text, show a placeholder */}
                {!currentContent.content_text && !currentContent.content_url && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Contenido de Texto</h3>
                    <p className="text-gray-600">Este contenido no tiene texto disponible.</p>
                  </div>
                )}
              </div>
            )}

            {/* Audio content */}
            {currentContent.type === 'audio' && (
              <div className="p-6 bg-gray-50">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio</h3>
                  {currentContent.content_url ? (
                    <audio controls className="w-full max-w-md mx-auto">
                      <source src={currentContent.content_url} />
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  ) : (
                    <p className="text-gray-600">No hay audio disponible</p>
                  )}
                </div>
              </div>
            )}

            {/* Quiz content */}
            {currentContent.type === 'quiz' && (
              <div className="p-6 bg-blue-50">
                <div className="text-center">
                  <ListChecks className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">Quiz Interactivo</h3>
                  <p className="text-gray-600 mt-2">Este contenido contiene un quiz interactivo</p>
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
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Material de Lectura</h3>
                </div>
                {currentContent.content_url && (
                  <div className="mb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(currentContent.content_url, '_blank')}
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Material
                    </Button>
                  </div>
                )}
              </div>
            )}

            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
            {/* Mobile menu button when no content selected */}
            <div className="p-4 border-b border-gray-100/50 lg:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSidebarOpen(true)}
                className="rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-105"
              >
                <Menu className="h-4 w-4 mr-2" />
                Ver Contenidos del Curso
              </Button>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Selecciona un contenido</h2>
                <p className="text-gray-600 text-lg mb-6">Elige una lección del menú para comenzar tu aprendizaje</p>
                
                {/* Additional mobile button */}
                <Button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-6 py-3"
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
  );
};
