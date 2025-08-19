
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Assessment, Question } from '../../types/database';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Plus, Edit, Trash2, ChevronLeft } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

const QuestionForm: React.FC<{ question: Partial<Question> | null, onSave: (q: Partial<Question>) => void, onCancel: () => void }> = ({ question, onSave, onCancel }) => {
  const [formState, setFormState] = useState<Partial<Question>>({ question_text: '', type: 'multiple_choice', options: [], correct_answer: '', points: 1 });

  useEffect(() => {
    if (question) setFormState(question); else setFormState({ question_text: '', type: 'multiple_choice', options: [], correct_answer: '', points: 1 });
  }, [question]);

  const handleSave = () => onSave(formState);

  return (
    <div className="space-y-4">
      <Input label="Question Text" value={formState.question_text} onChange={e => setFormState(s => ({...s, question_text: e.target.value}))} />
      {/* Add more form fields for type, options, answer, points */}
      <div className="flex justify-end space-x-2"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={handleSave}>Save</Button></div>
    </div>
  );
};

export const QuestionManager: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!assessmentId) return;
    const assessmentRes = await supabase.from('assessments').select('*').eq('id', assessmentId).single();
    if (assessmentRes.data) setAssessment(assessmentRes.data);
    const questionsRes = await supabase.from('questions').select('*').eq('assessment_id', assessmentId).order('order_index');
    if (questionsRes.data) setQuestions(questionsRes.data);
  }, [assessmentId]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleSaveQuestion = async (formData: Partial<Question>) => {
    const action = formData.id ? supabase.from('questions').update(formData).eq('id', formData.id) : supabase.from('questions').insert([{ ...formData, assessment_id: assessmentId }]);
    await action;
    await fetchQuestions();
    setIsModalOpen(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('questions').delete().eq('id', id);
    await fetchQuestions();
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4 mr-2" />Volver</Button>
      <h1 className="text-3xl font-bold">Gestionar Preguntas para: {assessment?.title}</h1>
      <Card>
        <CardHeader><Button onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nueva Pregunta</Button></CardHeader>
        <CardContent>
          {questions.map(q => (
            <div key={q.id} className="p-2 border-b flex justify-between items-center">
              <p>{q.question_text}</p>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQuestion?.id ? 'Edit Question' : 'New Question'}>
        <QuestionForm question={editingQuestion} onSave={handleSaveQuestion} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
