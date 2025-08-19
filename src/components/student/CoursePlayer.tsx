
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ChevronLeft, CheckCircle, ListChecks, FileText, Download, ExternalLink } from 'lucide-react';
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
    <div className="flex h-screen bg-gray-50">
      <div className="w-96 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-xl overflow-y-auto">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100/50 bg-gradient-to-br from-white to-gray-50/50">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/student')}
            className="mb-4 -ml-2 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 group"
          >
            <ChevronLeft className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
            Mis Cursos
          </Button>
          <h2 className="font-bold text-xl text-gray-900 leading-tight mb-2">{course.title}</h2>
          <p className="text-sm text-gray-600">Curso interactivo</p>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-100/50">
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
                      onClick={() => setCurrentContent(content)} 
                      className={`
                        group w-full text-left px-6 py-3 text-sm flex items-center space-x-4 
                        transition-all duration-200 hover:bg-gray-50 hover:translate-x-1
                        ${currentContent?.id === content.id 
                          ? 'bg-gray-900 text-white shadow-lg mx-3 rounded-2xl' 
                          : 'text-gray-700 hover:text-gray-900'
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
                        <span className={`text-xs capitalize ${
                          currentContent?.id === content.id ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {content.type}
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
      <main className="flex-1 overflow-y-auto">
        {currentContent ? (
          <div>
            {/* Render content based on type */}
            {currentContent.type === 'video' && (
              <div className="aspect-video bg-black">
                {currentContent.content_url ? (
                  <div className="w-full h-full">
                    {isYouTubeUrl(currentContent.content_url) ? (
                      // Use iframe directly for YouTube videos
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={getYouTubeEmbedUrl(currentContent.content_url)}
                        title={currentContent.title}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      // Use ReactPlayer for other video sources
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
                  <div className="flex items-center justify-center h-full text-white">
                    No hay URL de video disponible
                  </div>
                )}
              </div>
            )}

            {/* Document content */}
            {currentContent.type === 'document' && (
              <div className="p-6 bg-gray-50 min-h-64">
                <div className="flex items-center justify-center space-x-4">
                  <FileText className="h-16 w-16 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Documento</h3>
                    {currentContent.content_url ? (
                      <div className="space-y-2 mt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(currentContent.content_url, '_blank')}
                          className="mr-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Documento
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = currentContent.content_url!;
                            link.download = currentContent.title;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-600">No hay documento disponible</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Text content */}
            {currentContent.type === 'text' && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contenido de Texto</h3>
                </div>
                {currentContent.content_url && (
                  <div className="mb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(currentContent.content_url, '_blank')}
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Enlace Externo
                    </Button>
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

            {/* Header with title and complete button */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentContent.title}</h1>
                  <p className="text-sm text-gray-600 mt-1 capitalize">
                    Tipo: {currentContent.type}
                  </p>
                </div>
                <Button 
                  onClick={handleMarkComplete} 
                  disabled={completedContentIds.has(currentContent.id)}
                  variant={completedContentIds.has(currentContent.id) ? "outline" : "default"}
                >
                  {completedContentIds.has(currentContent.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completado
                    </>
                  ) : (
                    'Marcar como Completado'
                  )}
                </Button>
              </div>
            </div>

            {/* Text content section */}
            {currentContent.content_text && (
              <div className="p-6">
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentContent.content_text }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Selecciona un contenido</h2>
              <p className="text-gray-600 mt-2">Elige un tema del menú lateral para comenzar</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
