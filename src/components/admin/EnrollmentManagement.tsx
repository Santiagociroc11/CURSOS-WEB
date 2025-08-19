import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  UserMinus,
  Check,
  X,
  Calendar,
  Clock,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { BulkOperations } from './BulkOperations';
import { useSelection } from '../../hooks/useSelection';
import supabase from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  category: string;
  difficulty_level: string;
  duration_hours: number;
  is_published: boolean;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  completed_at?: string;
  last_accessed_at?: string;
  user: User;
  course: Course;
}

export const EnrollmentManagement: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isBulkEnrollModalOpen, setIsBulkEnrollModalOpen] = useState(false);
  
  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<string[]>([]);
  const [bulkSelectedCourse, setBulkSelectedCourse] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');

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
      
      // Fetch enrollments with user and course data
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          user:users!enrollments_user_id_fkey(*),
          course:courses!enrollments_course_id_fkey(*)
        `)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      setEnrollments(enrollmentsData || []);

      // Fetch all users (students only)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch all published courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('title');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollUser = async () => {
    if (!selectedUserId || !selectedCourseId) return;

    try {
      // Check if enrollment already exists
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', selectedUserId)
        .eq('course_id', selectedCourseId)
        .single();

      if (existing) {
        alert('El usuario ya está inscrito en este curso');
        return;
      }

      const { error } = await supabase
        .from('enrollments')
        .insert([{
          user_id: selectedUserId,
          course_id: selectedCourseId,
          progress_percentage: 0,
          enrolled_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      await fetchData();
      setIsEnrollModalOpen(false);
      setSelectedUserId('');
      setSelectedCourseId('');
    } catch (error) {
      console.error('Error enrolling user:', error);
    }
  };

  const handleBulkEnroll = async () => {
    if (bulkSelectedUsers.length === 0 || !bulkSelectedCourse) return;

    try {
      // Get existing enrollments to avoid duplicates
      const { data: existing } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('course_id', bulkSelectedCourse)
        .in('user_id', bulkSelectedUsers);

      const existingUserIds = existing?.map(e => e.user_id) || [];
      const newEnrollments = bulkSelectedUsers
        .filter(userId => !existingUserIds.includes(userId))
        .map(userId => ({
          user_id: userId,
          course_id: bulkSelectedCourse,
          progress_percentage: 0,
          enrolled_at: new Date().toISOString()
        }));

      if (newEnrollments.length === 0) {
        alert('Todos los usuarios seleccionados ya están inscritos en este curso');
        return;
      }

      const { error } = await supabase
        .from('enrollments')
        .insert(newEnrollments);

      if (error) throw error;
      
      await fetchData();
      setIsBulkEnrollModalOpen(false);
      setBulkSelectedUsers([]);
      setBulkSelectedCourse('');
    } catch (error) {
      console.error('Error in bulk enrollment:', error);
    }
  };

  const handleUnenrollUser = async (enrollmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas desincribir a este usuario?')) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error unenrolling user:', error);
    }
  };

  const handleBulkUnenroll = async (enrollmentIds: string[]) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .in('id', enrollmentIds);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error in bulk unenroll:', error);
      throw error;
    }
  };

  const getSelectedEnrollments = () => {
    return enrollments.filter(enrollment => selectedIds.includes(enrollment.id));
  };

  const getStatusBadge = (enrollment: Enrollment) => {
    if (enrollment.completed_at) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completado</span>;
    }
    if (enrollment.progress_percentage > 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">En Progreso</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">No Iniciado</span>;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-200';
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = !searchTerm || 
      enrollment.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !courseFilter || enrollment.course_id === courseFilter;
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'completed' && enrollment.completed_at) ||
      (statusFilter === 'in_progress' && enrollment.progress_percentage > 0 && !enrollment.completed_at) ||
      (statusFilter === 'not_started' && enrollment.progress_percentage === 0);
    
    const matchesProgress = !progressFilter ||
      (progressFilter === 'low' && enrollment.progress_percentage < 25) ||
      (progressFilter === 'medium' && enrollment.progress_percentage >= 25 && enrollment.progress_percentage < 75) ||
      (progressFilter === 'high' && enrollment.progress_percentage >= 75);

    return matchesSearch && matchesCourse && matchesStatus && matchesProgress;
  });

  const stats = {
    total: enrollments.length,
    completed: enrollments.filter(e => e.completed_at).length,
    inProgress: enrollments.filter(e => e.progress_percentage > 0 && !e.completed_at).length,
    notStarted: enrollments.filter(e => e.progress_percentage === 0).length
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inscripciones</h1>
          <p className="text-gray-600 mt-2">Administra el acceso de usuarios a los cursos</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsBulkEnrollModalOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Inscripción Masiva
          </Button>
          <Button onClick={() => setIsEnrollModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Inscribir Usuario
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Inscripciones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">En Progreso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
            <div className="text-sm text-gray-600">No Iniciados</div>
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
                  placeholder="Buscar por usuario o curso..."
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
              <option value="completed">Completado</option>
              <option value="in_progress">En Progreso</option>
              <option value="not_started">No Iniciado</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
            >
              <option value="">Todo el progreso</option>
              <option value="low">Bajo (&lt; 25%)</option>
              <option value="medium">Medio (25-75%)</option>
              <option value="high">Alto (&gt; 75%)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected(filteredEnrollments.map(e => e.id))}
                      ref={(input) => {
                        if (input) input.indeterminate = isPartiallySelected(filteredEnrollments.map(e => e.id));
                      }}
                      onChange={() => {
                        if (isAllSelected(filteredEnrollments.map(e => e.id))) {
                          clearSelection();
                        } else {
                          selectAll(filteredEnrollments.map(e => e.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Curso</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Progreso</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Inscrito</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Último Acceso</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected(enrollment.id)}
                        onChange={() => toggleSelection(enrollment.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.user.full_name}</div>
                        <div className="text-sm text-gray-500">{enrollment.user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.course.title}</div>
                        <div className="text-sm text-gray-500">
                          {enrollment.course.category} • {enrollment.course.difficulty_level}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(enrollment.progress_percentage)}`}
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{enrollment.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(enrollment)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {enrollment.last_accessed_at 
                        ? new Date(enrollment.last_accessed_at).toLocaleDateString()
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-4 py-4">
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleUnenrollUser(enrollment.id)}
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredEnrollments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inscripciones</h3>
            <p className="text-gray-600 mb-4">Comienza inscribiendo usuarios en los cursos</p>
            <Button onClick={() => setIsEnrollModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Inscribir Usuario
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk Operations */}
      <BulkOperations
        selectedItems={getSelectedEnrollments()}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkUnenroll}
      />

      {/* Single Enrollment Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Inscribir Usuario"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Seleccionar usuario...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Seleccionar curso...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsEnrollModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEnrollUser}
              disabled={!selectedUserId || !selectedCourseId}
            >
              Inscribir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Enrollment Modal */}
      <Modal
        isOpen={isBulkEnrollModalOpen}
        onClose={() => setIsBulkEnrollModalOpen(false)}
        title="Inscripción Masiva"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Curso</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={bulkSelectedCourse}
              onChange={(e) => setBulkSelectedCourse(e.target.value)}
            >
              <option value="">Seleccionar curso...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuarios ({bulkSelectedUsers.length} seleccionados)
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {users.map(user => (
                <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={bulkSelectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelectedUsers(prev => [...prev, user.id]);
                      } else {
                        setBulkSelectedUsers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsBulkEnrollModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkEnroll}
              disabled={bulkSelectedUsers.length === 0 || !bulkSelectedCourse}
            >
              Inscribir {bulkSelectedUsers.length} usuario{bulkSelectedUsers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};