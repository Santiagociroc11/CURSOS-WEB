
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactPlayer from 'react-player/youtube';
import { ChevronLeft, PlayCircle, CheckCircle, FileText, ExternalLink, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Course, Module, Content, Progress, Assessment } from '../../types/database';
import supabase from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';

// Type definition for a module with its content
interface ModuleWithContent extends Module {
  contents: Content[];
}

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
    if (!courseId || !userProfile) return;
    setLoading(true);
    try {
      const courseRes = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (courseRes.error) throw courseRes.error;
      setCourse(courseRes.data);

      const modulesRes = await supabase.from('modules').select('*, contents(*)').eq('course_id', courseId).order('order_index').order('order_index', { foreignTable: 'contents' });
      if (modulesRes.error) throw modulesRes.error;
      setModules(modulesRes.data as ModuleWithContent[]);

      const assessmentsRes = await supabase.from('assessments').select('*').eq('course_id', courseId);
      if (assessmentsRes.error) throw assessmentsRes.error;
      setAssessments(assessmentsRes.data);

      const progressRes = await supabase.from('progress').select('*').eq('user_id', userProfile.id).in('content_id', modulesRes.data.flatMap(m => m.contents.map(c => c.id)));
      if (progressRes.error) throw progressRes.error;
      setProgress(progressRes.data);

      const firstUncompleted = modulesRes.data.flatMap(m => m.contents).find(c => !progressRes.data.some(p => p.content_id === c.id && p.completed));
      setCurrentContent(firstUncompleted || modulesRes.data?.[0]?.contents?.[0] || null);

    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, userProfile]);

  useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

  const completedContentIds = useMemo(() => new Set(progress.filter(p => p.completed).map(p => p.content_id)), [progress]);

  const courseProgressPercentage = useMemo(() => {
    const totalContents = modules.reduce((acc, m) => acc + m.contents.length, 0);
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
              <ul>{module.contents.map(content => <li key={content.id}><button onClick={() => setCurrentContent(content)} className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 ${currentContent?.id === content.id ? 'bg-blue-50' : ''}`}><CheckCircle className={`h-4 w-4 ${completedContentIds.has(content.id) ? 'text-green-500' : 'text-gray-300'}`} /><span>{content.title}</span></button></li>)}</ul>
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
            <div className="aspect-video bg-black"><ReactPlayer url={currentContent.content_url || ''} width="100%" height="100%" controls playing /></div>
            <div className="p-6"><h1 className="text-2xl font-bold">{currentContent.title}</h1><Button onClick={handleMarkComplete} disabled={completedContentIds.has(currentContent.id)}>Marcar como Completado</Button></div>
            {currentContent.content_text && <div className="p-6 prose">{currentContent.content_text}</div>}
          </div>
        ) : <div>Selecciona un contenido</div>}
      </main>
    </div>
  );
};
