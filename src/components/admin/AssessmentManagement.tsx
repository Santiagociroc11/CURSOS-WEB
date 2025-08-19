import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Clock, 
  Target, 
  BookOpen,
  FileCheck,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EnhancedAssessmentForm } from './EnhancedAssessmentForm';
import { BulkOperations } from './BulkOperations';
import { useSelection } from '../../hooks/useSelection';
import { Assessment, Question, Course } from '../../types/database';
import supabase from '../../lib/supabase';

interface AssessmentWithDetails extends Assessment {
  course?: Course;
  questions_count?: number;
  total_points?: number;
  attempts_count?: number;
}

export const AssessmentManagement: React.FC = () => {
  const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selection for bulk operations
  const {
    selectedIds,
    selectedCount,
    isSelected,
    toggle: toggleSelection,
    selectAll,
    clear: clearSelection,
    isAllSelected,
    isPartiallySelected
  } = useSelection({
    multiSelect: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch assessments with course info and question counts
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          course:courses(*),
          questions(id, points)
        `)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Process assessments to add counts
      const processedAssessments = assessmentsData?.map(assessment => {
        const questionsCount = assessment.questions?.length || 0;
        const totalPoints = assessment.questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0;
        
        return {
          ...assessment,
          questions_count: questionsCount,
          total_points: totalPoints,
          attempts_count: 0 // TODO: Calculate from attempts
        };
      }) || [];

      setAssessments(processedAssessments);

      // Fetch courses for filters
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('title');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async (formData: Partial<Assessment>, questions: Partial<Question>[]) => {
    try {
      setSubmitting(true);
      
      if (editingAssessment) {
        // Update existing assessment
        const { error: assessmentError } = await supabase
          .from('assessments')
          .update(formData)
          .eq('id', editingAssessment.id);

        if (assessmentError) throw assessmentError;

        // Delete existing questions first
        await supabase
          .from('questions')
          .delete()
          .eq('assessment_id', editingAssessment.id);

        // Insert updated questions
        if (questions.length > 0) {
          const questionsToInsert = questions.map(q => ({
            assessment_id: editingAssessment.id,
            question_text: q.question_text,
            type: q.question_type, // Map question_type to type
            options: JSON.stringify(q.options), // Convert array to JSON string
            correct_answer: q.correct_answer,
            points: q.points,
            order_index: q.order_index
          }));

          const { error: questionsError } = await supabase
            .from('questions')
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
        
      } else {
        // Create new assessment
        const { data: newAssessment, error: assessmentError } = await supabase
          .from('assessments')
          .insert([formData])
          .select()
          .single();

        if (assessmentError) throw assessmentError;

        // Create questions
        if (questions.length > 0) {
          const questionsToInsert = questions.map(q => ({
            assessment_id: newAssessment.id,
            question_text: q.question_text,
            type: q.question_type, // Map question_type to type
            options: JSON.stringify(q.options), // Convert array to JSON string
            correct_answer: q.correct_answer,
            points: q.points,
            order_index: q.order_index
          }));

          const { error: questionsError } = await supabase
            .from('questions')
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
      }

      await fetchData();
      setIsModalOpen(false);
      setEditingAssessment(null);
    } catch (error) {
      console.error('Error saving assessment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta evaluación? Esto también eliminará todas las preguntas y resultados asociados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

  const handleBulkDelete = async (assessmentIds: string[]) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .in('id', assessmentIds);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  };

  const openCreateModal = () => {
    setEditingAssessment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setIsModalOpen(true);
  };

  const getSelectedAssessments = () => {
    return assessments.filter(assessment => selectedIds.includes(assessment.id));
  };

  const getDifficultyColor = (passingScore: number) => {
    if (passingScore >= 80) return 'bg-red-100 text-red-800';
    if (passingScore >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getDifficultyLabel = (passingScore: number) => {
    if (passingScore >= 80) return 'Difícil';
    if (passingScore >= 70) return 'Medio';
    return 'Fácil';
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = !searchTerm || 
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.course?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !courseFilter || assessment.course_id === courseFilter;
    
    const matchesStatus = !statusFilter ||
      (statusFilter === 'active' && assessment.is_active) ||
      (statusFilter === 'inactive' && !assessment.is_active);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const stats = {
    total: assessments.length,
    active: assessments.filter(a => a.is_active).length,
    inactive: assessments.filter(a => !a.is_active).length,
    avgPassingScore: Math.round(assessments.reduce((sum, a) => sum + a.passing_score, 0) / assessments.length) || 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Evaluaciones</h1>
          <p className="text-gray-600 mt-2">Crea y administra exámenes para certificación</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Evaluación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Evaluaciones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Activas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactivas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.avgPassingScore}%</div>
            <div className="text-sm text-gray-600">Promedio Mínimo</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar evaluaciones..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">Todos los cursos</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Selection Header */}
      {filteredAssessments.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isAllSelected(filteredAssessments.map(a => a.id))}
              ref={(input) => {
                if (input) input.indeterminate = isPartiallySelected(filteredAssessments.map(a => a.id));
              }}
              onChange={() => {
                if (isAllSelected(filteredAssessments.map(a => a.id))) {
                  clearSelection();
                } else {
                  selectAll(filteredAssessments.map(a => a.id));
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">
              {selectedCount > 0 ? `${selectedCount} seleccionados` : 'Seleccionar todo'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {filteredAssessments.length} de {assessments.length} evaluaciones
          </div>
        </div>
      )}

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id} hover className="relative">
            {/* Selection Checkbox */}
            <div className="absolute top-3 left-3 z-10">
              <input
                type="checkbox"
                checked={isSelected(assessment.id)}
                onChange={() => toggleSelection(assessment.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <CardContent className="p-6 pt-12">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg pr-2">{assessment.title}</h3>
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${assessment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {assessment.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getDifficultyColor(assessment.passing_score)}`}>
                    {getDifficultyLabel(assessment.passing_score)}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assessment.description}</p>
              
              {assessment.course && (
                <div className="text-sm text-gray-500 mb-3 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {assessment.course.title}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{assessment.questions_count || 0}</div>
                  <div className="text-gray-500">Preguntas</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 flex items-center justify-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {assessment.time_limit_minutes || 0}m
                  </div>
                  <div className="text-gray-500">Tiempo</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 flex items-center justify-center">
                    <Target className="h-3 w-3 mr-1" />
                    {assessment.passing_score}%
                  </div>
                  <div className="text-gray-500">Mínimo</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditModal(assessment)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {/* TODO: View results */}}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {/* TODO: View attempts */}}
                >
                  <Users className="h-3 w-3" />
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDeleteAssessment(assessment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || courseFilter || statusFilter
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera evaluación'
              }
            </p>
            {!searchTerm && !courseFilter && !statusFilter && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Evaluación
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Operations */}
      <BulkOperations
        selectedItems={getSelectedAssessments()}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title=""
        size="full"
      >
        <EnhancedAssessmentForm
          assessment={editingAssessment}
          onSave={handleSaveAssessment}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={submitting}
          courses={courses}
        />
      </Modal>
    </div>
  );
};