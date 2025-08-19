import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Users, BookOpen, Filter, Search, Grid, List, Check, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { EnhancedCourseForm } from './EnhancedCourseForm';
import { BulkOperations } from './BulkOperations';
import { useSelection } from '../../hooks/useSelection';
import { useAuthContext } from '../../contexts/AuthContext';
import { Course } from '../../types/database';
import supabase from '../../lib/supabase';

export const EnhancedCourseManagement: React.FC = () => {
  const { userProfile } = useAuthContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Selection
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
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchTerm, categoryFilter, statusFilter, difficultyFilter]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = courses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }

    // Status filter
    if (statusFilter) {
      const isPublished = statusFilter === 'published';
      filtered = filtered.filter(course => course.is_published === isPublished);
    }

    // Difficulty filter
    if (difficultyFilter) {
      filtered = filtered.filter(course => course.difficulty_level === difficultyFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleSaveCourse = async (formData: Partial<Course>) => {
    if (!userProfile?.id) {
      console.error('No user profile available');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCourse.id);

        if (error) throw error;
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert([{
            ...formData,
            instructor_id: userProfile.id, // Use actual user UUID
            is_published: false,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
      }

      await fetchCourses();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving course:', error);
      console.error('Form data being sent:', formData);
      console.error('User ID being used:', userProfile?.id);
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error message:', error.message);
        alert(`Error al crear el curso: ${error.message}`);
      } else {
        alert('Error desconocido al crear el curso');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const handleTogglePublished = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId);

      if (error) throw error;
      await fetchCourses();
    } catch (error) {
      console.error('Error toggling course publication status:', error);
      alert('Error al cambiar el estado del curso');
    }
  };

  const handleBulkDelete = async (courseIds: string[]) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .in('id', courseIds);

      if (error) throw error;
      await fetchCourses();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  };

  const handleBulkDuplicate = async (courseIds: string[]) => {
    try {
      const coursesToDuplicate = courses.filter(course => courseIds.includes(course.id));
      
      const duplicatePromises = coursesToDuplicate.map(course => {
        const { id, created_at, updated_at, ...courseData } = course;
        return supabase
          .from('courses')
          .insert([{
            ...courseData,
            title: `${course.title} (Copia)`,
            is_published: false,
          }]);
      });

      await Promise.all(duplicatePromises);
      await fetchCourses();
    } catch (error) {
      console.error('Error in bulk duplicate:', error);
      throw error;
    }
  };

  const handleBulkEdit = async (courseIds: string[], changes: Record<string, any>) => {
    try {
      // Filter out empty changes
      const validChanges = Object.fromEntries(
        Object.entries(changes).filter(([_, value]) => value !== '' && value !== undefined)
      );

      if (Object.keys(validChanges).length === 0) return;

      const { error } = await supabase
        .from('courses')
        .update({
          ...validChanges,
          updated_at: new Date().toISOString(),
        })
        .in('id', courseIds);

      if (error) throw error;
      await fetchCourses();
    } catch (error) {
      console.error('Error in bulk edit:', error);
      throw error;
    }
  };

  const handleBulkPublish = async (courseIds: string[]) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', courseIds);

      if (error) throw error;
      await fetchCourses();
      clearSelection();
    } catch (error) {
      console.error('Error in bulk publish:', error);
      throw error;
    }
  };

  const handleBulkUnpublish = async (courseIds: string[]) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .in('id', courseIds);

      if (error) throw error;
      await fetchCourses();
      clearSelection();
    } catch (error) {
      console.error('Error in bulk unpublish:', error);
      throw error;
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const getUniqueCategories = () => {
    return Array.from(new Set(courses.map(course => course.category).filter(Boolean)));
  };

  const handleSelectAll = () => {
    if (isAllSelected(filteredCourses.map(c => c.id))) {
      clearSelection();
    } else {
      selectAll(filteredCourses.map(c => c.id));
    }
  };

  const getSelectedCourses = () => {
    return courses.filter(course => selectedIds.includes(course.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const courseStats = {
    total: courses.length,
    published: courses.filter(c => c.is_published).length,
    draft: courses.filter(c => !c.is_published).length,
    avgDuration: Math.round(courses.reduce((sum, c) => sum + c.duration_hours, 0) / courses.length) || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600 mt-2">Administra el catálogo de cursos disponibles</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{courseStats.total}</div>
            <div className="text-sm text-gray-600">Total de Cursos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{courseStats.published}</div>
            <div className="text-sm text-gray-600">Publicados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{courseStats.draft}</div>
            <div className="text-sm text-gray-600">Borradores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{courseStats.avgDuration}h</div>
            <div className="text-sm text-gray-600">Duración Promedio</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar cursos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="published">Publicado</option>
                <option value="draft">Borrador</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="">Todas las dificultades</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Header */}
      {filteredCourses.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isAllSelected(filteredCourses.map(c => c.id))}
              ref={(input) => {
                if (input) input.indeterminate = isPartiallySelected(filteredCourses.map(c => c.id));
              }}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">
              {selectedCount > 0 ? `${selectedCount} seleccionados` : 'Seleccionar todo'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {filteredCourses.length} de {courses.length} cursos
          </div>
        </div>
      )}

      {/* Courses Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} hover className="relative">
              {/* Selection Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected(course.id)}
                  onChange={() => toggleSelection(course.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="aspect-video bg-gray-200 rounded-t-xl overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <BookOpen className="h-12 w-12" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg pr-2">{course.title}</h3>
                  <span className={`
                    px-2 py-1 text-xs rounded-full whitespace-nowrap
                    ${course.is_published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  `}>
                    {course.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span className="capitalize">{course.difficulty_level}</span>
                  <span>{course.duration_hours}h</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {course.category}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Link 
                    to={`/admin/courses/${course.id}`}
                    className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 px-3 py-1.5 text-sm flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Editar
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(course)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant={course.is_published ? "outline" : "default"} 
                    size="sm" 
                    onClick={() => handleTogglePublished(course.id, course.is_published)}
                    className={course.is_published ? "text-orange-600 hover:text-orange-800" : "bg-green-600 hover:bg-green-700 text-white"}
                  >
                    {course.is_published ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected(filteredCourses.map(c => c.id))}
                        ref={(input) => {
                          if (input) input.indeterminate = isPartiallySelected(filteredCourses.map(c => c.id));
                        }}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Curso</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Dificultad</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Duración</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected(course.id)}
                          onChange={() => toggleSelection(course.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 flex-shrink-0">
                            {course.thumbnail_url ? (
                              <img 
                                src={course.thumbnail_url} 
                                alt={course.title}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{course.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{course.category}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 capitalize">{course.difficulty_level}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{course.duration_hours}h</td>
                      <td className="px-4 py-4">
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${course.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                          }
                        `}>
                          {course.is_published ? 'Publicado' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <Link 
                            to={`/admin/courses/${course.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => openEditModal(course)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleTogglePublished(course.id, course.is_published)}
                            className={course.is_published ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
                            title={course.is_published ? "Despublicar curso" : "Publicar curso"}
                          >
                            {course.is_published ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter || statusFilter || difficultyFilter
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer curso'
              }
            </p>
            {!searchTerm && !categoryFilter && !statusFilter && !difficultyFilter && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Curso
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Operations */}
      <BulkOperations
        selectedItems={getSelectedCourses()}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkDuplicate={handleBulkDuplicate}
        onBulkEdit={handleBulkEdit}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        editableFields={[
          { key: 'category', label: 'Categoría', type: 'text' },
          { key: 'difficulty_level', label: 'Dificultad', type: 'select', options: ['beginner', 'intermediate', 'advanced'] },
          { key: 'is_published', label: 'Estado', type: 'select', options: ['true', 'false'] }
        ]}
      />

      {/* Create/Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
        size="xl"
      >
        <EnhancedCourseForm
          course={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={submitting}
        />
      </Modal>
    </div>
  );
};