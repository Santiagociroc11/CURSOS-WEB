import React, { useState, useEffect } from 'react';
import { Assessment, Question } from '../../types/database';
import supabase from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  HelpCircle,
  CheckCircle,
  List,
  Type,
  ToggleLeft,
  Save,
  Eye,
  AlertCircle
} from 'lucide-react';

interface EnhancedAssessmentFormProps {
  assessment: Assessment | null;
  onSave: (formData: Partial<Assessment>, questions: Partial<Question>[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  courses?: Array<{id: string, title: string}>;
}

interface QuestionFormData {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer?: string;
  points: number;
  order_index: number;
}

const QUESTION_TYPES = [
  { 
    value: 'multiple_choice', 
    label: 'Opción Múltiple', 
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Pregunta con varias opciones, una correcta'
  },
  { 
    value: 'true_false', 
    label: 'Verdadero/Falso', 
    icon: <ToggleLeft className="h-4 w-4" />,
    description: 'Pregunta con respuesta de verdadero o falso'
  },
  { 
    value: 'short_answer', 
    label: 'Respuesta Corta', 
    icon: <Type className="h-4 w-4" />,
    description: 'Respuesta de texto breve'
  },
  { 
    value: 'essay', 
    label: 'Ensayo', 
    icon: <List className="h-4 w-4" />,
    description: 'Respuesta de texto extenso'
  }
];

export const EnhancedAssessmentForm: React.FC<EnhancedAssessmentFormProps> = ({
  assessment,
  onSave,
  onCancel,
  isSubmitting = false,
  courses = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit_minutes: 60,
    max_attempts: 3,
    is_active: true,
    course_id: ''
  });

  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionFormData | null>(null);
  const [questionFormData, setQuestionFormData] = useState<QuestionFormData>({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
    order_index: 0
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assessment) {
      setFormData({
        title: assessment.title,
        description: assessment.description || '',
        passing_score: assessment.passing_score,
        time_limit_minutes: assessment.time_limit_minutes || 60,
        max_attempts: assessment.max_attempts || 3,
        is_active: assessment.is_active !== false,
        course_id: assessment.course_id || ''
      });
      
      // Load existing questions if editing
      loadExistingQuestions(assessment.id);
    } else {
      // Reset questions when creating new assessment
      setQuestions([]);
    }
  }, [assessment]);

  const loadExistingQuestions = async (assessmentId: string) => {
    try {
      const { data: questionsData, error } = await supabase
        .from('questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('order_index');

      if (error) throw error;

      const formattedQuestions: QuestionFormData[] = questionsData?.map(question => {
        // Parse options if they're stored as JSON string
        let parsedOptions = [];
        if (question.options) {
          try {
            parsedOptions = typeof question.options === 'string' 
              ? JSON.parse(question.options) 
              : question.options;
          } catch (e) {
            console.error('Error parsing options:', e);
            parsedOptions = [];
          }
        }

        return {
          id: question.id,
          question_text: question.question_text,
          question_type: question.type, // Using 'type' instead of 'question_type'
          options: parsedOptions,
          correct_answer: question.correct_answer || '',
          points: question.points,
          order_index: question.order_index
        };
      }) || [];

      setQuestions(formattedQuestions);
      console.log('Loaded questions:', formattedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'El título es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.course_id) newErrors.course_id = 'Debe seleccionar un curso';
    if (formData.passing_score < 1 || formData.passing_score > 100) {
      newErrors.passing_score = 'La puntuación debe estar entre 1 y 100';
    }
    if (questions.length === 0) newErrors.questions = 'Debe agregar al menos una pregunta';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await onSave(formData, questions);
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  const openQuestionModal = (question: QuestionFormData | null = null) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionFormData(question);
    } else {
      setEditingQuestion(null);
      setQuestionFormData({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1,
        order_index: questions.length
      });
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!questionFormData.question_text.trim()) {
      alert('El texto de la pregunta es requerido');
      return;
    }

    if (questionFormData.question_type === 'multiple_choice') {
      const validOptions = questionFormData.options?.filter(opt => opt.trim()) || [];
      if (validOptions.length < 2) {
        alert('Debe tener al menos 2 opciones válidas');
        return;
      }
      if (!questionFormData.correct_answer?.trim()) {
        alert('Debe seleccionar la respuesta correcta');
        return;
      }
    }

    if (editingQuestion) {
      // Update existing question
      setQuestions(prev => prev.map(q => 
        q.order_index === editingQuestion.order_index ? questionFormData : q
      ));
    } else {
      // Add new question
      setQuestions(prev => [...prev, questionFormData]);
    }

    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (orderIndex: number) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      setQuestions(prev => prev.filter(q => q.order_index !== orderIndex));
    }
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    
    // Update order indices
    const updatedQuestions = newQuestions.map((q, index) => ({
      ...q,
      order_index: index
    }));
    
    setQuestions(updatedQuestions);
  };

  const getTotalPoints = () => {
    return questions.reduce((total, q) => total + q.points, 0);
  };

  const renderQuestionPreview = (question: QuestionFormData) => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              option.trim() && (
                <label key={index} className="flex items-center space-x-2">
                  <input type="radio" name={`q-${question.order_index}`} disabled />
                  <span className={option === question.correct_answer ? 'font-medium text-green-600' : ''}>
                    {option}
                  </span>
                </label>
              )
            ))}
          </div>
        );
      case 'true_false':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="radio" name={`q-${question.order_index}`} disabled />
              <span className={question.correct_answer === 'true' ? 'font-medium text-green-600' : ''}>
                Verdadero
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name={`q-${question.order_index}`} disabled />
              <span className={question.correct_answer === 'false' ? 'font-medium text-green-600' : ''}>
                Falso
              </span>
            </label>
          </div>
        );
      case 'short_answer':
        return (
          <input 
            type="text" 
            placeholder="Respuesta corta..." 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled
          />
        );
      case 'essay':
        return (
          <textarea 
            placeholder="Respuesta extensa..." 
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled
          />
        );
      default:
        return null;
    }
  };

  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Vista Previa: {formData.title}</h2>
          <Button onClick={() => setPreviewMode(false)}>
            <Edit className="h-4 w-4 mr-2" />
            Volver a Editar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">{formData.title}</h3>
            <p className="text-gray-600">{formData.description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Información del Examen:</h4>
                <div className="mt-2 text-sm text-gray-600">
                  <p>• Tiempo límite: {formData.time_limit_minutes} minutos</p>
                  <p>• Puntuación mínima: {formData.passing_score}%</p>
                  <p>• Intentos máximos: {formData.max_attempts}</p>
                  <p>• Total de puntos: {getTotalPoints()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">
                      {index + 1}. {question.question_text}
                    </h4>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {question.points} pts
                    </span>
                  </div>
                  {renderQuestionPreview(question)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Evaluación'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {assessment ? 'Editar Evaluación' : 'Nueva Evaluación'}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
        </div>
      </div>

      {/* Assessment Details */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Detalles de la Evaluación</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Título de la Evaluación"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ej: Examen Final de React"
            required
            error={errors.title}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe qué evalúa este examen..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.course_id}
              onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
              required
            >
              <option value="">Seleccionar curso...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            {errors.course_id && (
              <p className="mt-1 text-sm text-red-600">{errors.course_id}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Puntuación Mínima (%)"
              type="number"
              value={formData.passing_score}
              onChange={(e) => setFormData(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
              min="1"
              max="100"
              error={errors.passing_score}
            />

            <Input
              label="Tiempo Límite (min)"
              type="number"
              value={formData.time_limit_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 60 }))}
              min="1"
            />

            <Input
              label="Intentos Máximos"
              type="number"
              value={formData.max_attempts}
              onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))}
              min="1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is-active" className="text-sm text-gray-700">
              Evaluación activa
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Preguntas ({questions.length})</h3>
              <p className="text-sm text-gray-600">Total de puntos: {getTotalPoints()}</p>
            </div>
            <Button onClick={() => openQuestionModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Pregunta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errors.questions && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.questions}</span>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay preguntas</h3>
              <p className="text-sm mb-4">Comienza agregando preguntas para tu evaluación</p>
              <Button onClick={() => openQuestionModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Pregunta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium bg-white px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {QUESTION_TYPES.find(t => t.value === question.question_type)?.label}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {question.points} pts
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {question.question_text}
                        </p>
                        {question.question_type === 'multiple_choice' && (
                          <div className="text-xs text-gray-600">
                            <strong>Respuesta correcta:</strong> {question.correct_answer}
                          </div>
                        )}
                        {question.question_type === 'true_false' && (
                          <div className="text-xs text-gray-600">
                            <strong>Respuesta correcta:</strong> {question.correct_answer === 'true' ? 'Verdadero' : 'Falso'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openQuestionModal(question)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteQuestion(question.order_index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Evaluación
            </>
          )}
        </Button>
      </div>

      {/* Question Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Texto de la Pregunta"
            value={questionFormData.question_text}
            onChange={(e) => setQuestionFormData(prev => ({ ...prev, question_text: e.target.value }))}
            placeholder="Escribe tu pregunta aquí..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pregunta
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUESTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setQuestionFormData(prev => ({ 
                    ...prev, 
                    question_type: type.value as any,
                    options: type.value === 'multiple_choice' ? ['', '', '', ''] : undefined,
                    correct_answer: ''
                  }))}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    questionFormData.question_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {type.icon}
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Question Type Specific Fields */}
          {questionFormData.question_type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opciones de Respuesta
              </label>
              <div className="space-y-2">
                {questionFormData.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={questionFormData.correct_answer === option}
                      onChange={() => setQuestionFormData(prev => ({ ...prev, correct_answer: option }))}
                      className="h-4 w-4 text-blue-600"
                      disabled={!option.trim()}
                    />
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(questionFormData.options || [])];
                        newOptions[index] = e.target.value;
                        setQuestionFormData(prev => ({ ...prev, options: newOptions }));
                      }}
                      placeholder={`Opción ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Selecciona la opción correcta marcando el círculo correspondiente
              </p>
            </div>
          )}

          {questionFormData.question_type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Respuesta Correcta
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="true-false-answer"
                    value="true"
                    checked={questionFormData.correct_answer === 'true'}
                    onChange={(e) => setQuestionFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Verdadero</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="true-false-answer"
                    value="false"
                    checked={questionFormData.correct_answer === 'false'}
                    onChange={(e) => setQuestionFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>Falso</span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Puntos"
              type="number"
              value={questionFormData.points}
              onChange={(e) => setQuestionFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              min="1"
              max="10"
            />
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsQuestionModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuestion}>
              {editingQuestion ? 'Actualizar' : 'Agregar'} Pregunta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};