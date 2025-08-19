
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Course, Module, Content, Assessment } from '../../types/database';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ModuleList } from './ModuleList';
import { ModuleForm } from './ModuleForm';
import { ContentForm } from './ContentForm';
import { AssessmentList } from './AssessmentList';
import { AssessmentForm } from './AssessmentForm';
import { Card, CardContent, CardHeader } from '../ui/Card';

export const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const courseRes = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (courseRes.error) throw courseRes.error;
      setCourse(courseRes.data);

      const modulesRes = await supabase.from('modules').select('*').eq('course_id', courseId).order('order_index');
      if (modulesRes.error) throw modulesRes.error;
      setModules(modulesRes.data);

      const assessmentsRes = await supabase.from('assessments').select('*').eq('course_id', courseId);
      if (assessmentsRes.error) throw assessmentsRes.error;
      setAssessments(assessmentsRes.data);

    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchContents = useCallback(async (moduleId: string) => {
    const { data, error } = await supabase.from('content').select('*').eq('module_id', moduleId).order('order_index');
    if (error) console.error('Error fetching contents', error); else setContents(data);
  }, []);

  useEffect(() => {
    if (activeModuleId) fetchContents(activeModuleId); else setContents([]);
  }, [activeModuleId, fetchContents]);

  const handleSaveModule = async (formData: Partial<Module>) => {
    const action = editingModule ? supabase.from('modules').update({ ...formData }).eq('id', editingModule.id) : supabase.from('modules').insert([{ ...formData, course_id: courseId }]);
    const { error } = await action;
    if (error) console.error('Error saving module', error); else { await fetchData(); setIsModuleModalOpen(false); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('modules').delete().eq('id', moduleId);
    if (error) console.error('Error deleting module', error); else await fetchData();
  };

  const handleSaveContent = async (formData: Partial<Content>) => {
    const action = editingContent ? supabase.from('content').update({ ...formData }).eq('id', editingContent.id) : supabase.from('content').insert([{ ...formData, module_id: currentModuleId }]);
    const { error } = await action;
    if (error) console.error('Error saving content', error); else { if (activeModuleId) await fetchContents(activeModuleId); setIsContentModalOpen(false); }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('content').delete().eq('id', contentId);
    if (error) console.error('Error deleting content', error); else if (activeModuleId) await fetchContents(activeModuleId);
  };

  const handleSaveAssessment = async (formData: Partial<Assessment>) => {
    const action = editingAssessment ? supabase.from('assessments').update({ ...formData }).eq('id', editingAssessment.id) : supabase.from('assessments').insert([{ ...formData, course_id: courseId }]);
    const { error } = await action;
    if (error) console.error('Error saving assessment', error); else { await fetchData(); setIsAssessmentModalOpen(false); }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('assessments').delete().eq('id', assessmentId);
    if (error) console.error('Error deleting assessment', error); else await fetchData();
  };

  const handleManageQuestions = (assessmentId: string) => {
    navigate(`/admin/assessments/${assessmentId}/questions`);
  };

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      
      <Card>
        <CardHeader><div className="flex justify-between items-center"><h2 className="text-xl font-semibold">Modules</h2><Button onClick={() => { setEditingModule(null); setIsModuleModalOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Module</Button></div></CardHeader>
        <CardContent><ModuleList modules={modules} activeModuleId={activeModuleId} onModuleClick={(id) => setActiveModuleId(p => p === id ? null : id)} onEditModule={(m) => { setEditingModule(m); setIsModuleModalOpen(true); }} onDeleteModule={handleDeleteModule} contents={contents} onAddContent={(id) => { setEditingContent(null); setCurrentModuleId(id); setIsContentModalOpen(true); }} onEditContent={(c) => { setEditingContent(c); setIsContentModalOpen(true); }} onDeleteContent={handleDeleteContent} /></CardContent>
      </Card>

      <Card>
        <CardHeader><div className="flex justify-between items-center"><h2 className="text-xl font-semibold">Assessments</h2><Button onClick={() => { setEditingAssessment(null); setIsAssessmentModalOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Assessment</Button></div></CardHeader>
        <CardContent><AssessmentList assessments={assessments} onEdit={(a) => { setEditingAssessment(a); setIsAssessmentModalOpen(true); }} onDelete={handleDeleteAssessment} onManageQuestions={handleManageQuestions} /></CardContent>
      </Card>

      <Modal isOpen={isModuleModalOpen} onClose={() => setIsModuleModalOpen(false)} title={editingModule ? 'Edit Module' : 'New Module'}><ModuleForm module={editingModule} onSave={handleSaveModule} onCancel={() => setIsModuleModalOpen(false)} /></Modal>
      <Modal isOpen={isContentModalOpen} onClose={() => setIsContentModalOpen(false)} title={editingContent ? 'Edit Content' : 'New Content'}><ContentForm content={editingContent} onSave={handleSaveContent} onCancel={() => setIsContentModalOpen(false)} /></Modal>
      <Modal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} title={editingAssessment ? 'Edit Assessment' : 'New Assessment'}><AssessmentForm assessment={editingAssessment} onSave={handleSaveAssessment} onCancel={() => setIsAssessmentModalOpen(false)} /></Modal>
    </div>
  );
};
