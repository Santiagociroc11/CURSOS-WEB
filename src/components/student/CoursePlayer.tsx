
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ChevronLeft, CheckCircle, ListChecks } from 'lucide-react';
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
  if (!course) return <div>Course not found.</div>;

  return (
    <div className="flex h-screen">
      <div className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b"><Button variant="ghost" size="sm" onClick={() => navigate('/student')}><ChevronLeft className="h-4 w-4 mr-2" />Mis Cursos</Button><h2 className="font-bold text-lg">{course.title}</h2></div>
        <div className="p-4"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${courseProgressPercentage}%` }}></div></div><p className="text-xs text-gray-600">{courseProgressPercentage}% completado</p></div>
        <nav>
          {modules.map(module => (
            <div key={module.id} className="border-t">
              <h3 className="font-semibold p-4 text-sm uppercase text-gray-500">{module.title}</h3>
              <ul>{module.content.map(content => <li key={content.id}><button onClick={() => setCurrentContent(content)} className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 ${currentContent?.id === content.id ? 'bg-blue-50' : ''}`}><CheckCircle className={`h-4 w-4 ${completedContentIds.has(content.id) ? 'text-green-500' : 'text-gray-300'}`} /><span>{content.title}</span></button></li>)}</ul>
            </div>
          ))}
          {assessments.length > 0 && (
            <div className="border-t">
              <h3 className="font-semibold p-4 text-sm uppercase text-gray-500">Evaluaciones</h3>
              <ul>{assessments.map(assessment => <li key={assessment.id}><Link to={`/student/assessments/${assessment.id}`} className="w-full text-left px-4 py-2 text-sm flex items-center space-x-3"><ListChecks className="h-4 w-4" /><span>{assessment.title}</span></Link></li>)}</ul>
            </div>
          )}
        </nav>
      </div>
      <main className="flex-1 overflow-y-auto">
        {currentContent ? (
          <div>
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
            <div className="p-6"><h1 className="text-2xl font-bold">{currentContent.title}</h1><Button onClick={handleMarkComplete} disabled={completedContentIds.has(currentContent.id)}>Marcar como Completado</Button></div>
            {currentContent.content_text && <div className="p-6 prose">{currentContent.content_text}</div>}
          </div>
        ) : <div>Selecciona un contenido</div>}
      </main>
    </div>
  );
};
