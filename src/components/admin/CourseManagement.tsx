import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Course } from '../../types/database';
import supabase from '../../lib/supabase';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner' as const,
    duration_hours: 0,
    thumbnail_url: '',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

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
      // Mock data for demonstration
      setCourses([
        {
          id: '1',
          title: 'React Fundamentals',
          description: 'Aprende los conceptos básicos de React desde cero',
          thumbnail_url: 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=400',
          instructor_id: '1',
          duration_hours: 20,
          difficulty_level: 'beginner',
          category: 'Programación',
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Advanced Node.js',
          description: 'Desarrollo backend avanzado con Node.js y Express',
          thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=400',
          instructor_id: '1',
          duration_hours: 35,
          difficulty_level: 'advanced',
          category: 'Backend',
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    try {
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
            instructor_id: '1', // Current user ID
            is_published: false,
          }]);

        if (error) throw error;
      }

      await fetchCourses();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving course:', error);
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      difficulty_level: 'beginner',
      duration_hours: 0,
      thumbnail_url: '',
    });
    setEditingCourse(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty_level: course.difficulty_level,
      duration_hours: course.duration_hours,
      thumbnail_url: course.thumbnail_url || '',
    });
    setEditingCourse(course);
    setIsModalOpen(true);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600 mt-2">Administra el catálogo de cursos disponibles</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} hover>
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
                <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                <span className={`
                  px-2 py-1 text-xs rounded-full
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
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {course.category}
                </span>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditModal(course)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título del Curso"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Fundamentos de React"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del curso..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Categoría"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ej: Programación, Diseño"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de Dificultad
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Duración (horas)"
              type="number"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
              placeholder="20"
            />
            
            <Input
              label="URL de Imagen"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCourse}>
              {editingCourse ? 'Actualizar' : 'Crear'} Curso
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};