import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Course, Module, Content, Assessment } from '../../types/database';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { EnhancedContentForm } from './EnhancedContentForm';
import { DragDropList } from './DragDropList';
import { DriveContentImporter } from './DriveContentImporter';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  FileText, 
  Link as LinkIcon, 
  Clock,
  Save,
  Eye,
  Settings,
  Copy,
  MoreVertical,
  Upload
} from 'lucide-react';

interface ModuleWithContent extends Module {
  content: Content[];
}

export const EnhancedCourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isDriveImporterOpen, setIsDriveImporterOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [importerModuleId, setImporterModuleId] = useState<string | null>(null);
  
  // Form states
  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: ''
  });
  
  // UI states
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'preview'>('content');

  // Drag and drop for modules
  const [isUpdatingModuleOrder, setIsUpdatingModuleOrder] = useState(false);

  const handleModuleReorder = async (reorderedModules: ModuleWithContent[]) => {
    try {
      setIsUpdatingModuleOrder(true);
      // Update module order in database
      const updates = reorderedModules.map((module, index) => 
        supabase.from('modules')
          .update({ order_index: index })
          .eq('id', module.id)
      );
      await Promise.all(updates);
      setModules(reorderedModules);
    } catch (error) {
      console.error('Error reordering modules:', error);
    } finally {
      setIsUpdatingModuleOrder(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      // Fetch course
      const courseRes = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (courseRes.error) throw courseRes.error;
      setCourse(courseRes.data);

      // Fetch modules with content
      const modulesRes = await supabase
        .from('modules')
        .select(`
          *,
          content(*)
        `)
        .eq('course_id', courseId)
        .order('order_index');
      
      if (modulesRes.error) throw modulesRes.error;
      
      const modulesWithSortedContent = modulesRes.data.map(module => ({
        ...module,
        content: (module.content as Content[]).sort((a, b) => a.order_index - b.order_index)
      }));
      
      console.log('Loaded modules:', modulesWithSortedContent);
      setModules(modulesWithSortedContent);

    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Module operations
  const handleSaveModule = async (formData: Partial<Module>) => {
    try {
      setSaving(true);
      if (editingModule) {
        const { error } = await supabase
          .from('modules')
          .update(formData)
          .eq('id', editingModule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('modules')
          .insert([{ 
            ...formData, 
            course_id: courseId,
            order_index: modules.length 
          }]);
        if (error) throw error;
      }
      
      await fetchData();
      setIsModuleModalOpen(false);
      setEditingModule(null);
    } catch (error) {
      console.error('Error saving module:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('¿Estás seguro? Esto eliminará el módulo y todo su contenido.')) return;
    
    try {
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting module:', error);
    }
  };

  const handleDuplicateModule = async (moduleId: string) => {
    try {
      setSaving(true);
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;

      // Create new module
      const { data: newModule, error: moduleError } = await supabase
        .from('modules')
        .insert([{
          course_id: courseId,
          title: `${module.title} (Copia)`,
          description: module.description,
          order_index: modules.length
        }])
        .select()
        .single();

      if (moduleError) throw moduleError;

      // Duplicate content
      if (module.content.length > 0) {
        const contentToDuplicate = module.content.map(content => ({
          module_id: newModule.id,
          title: content.title,
          type: content.type,
          content_url: content.content_url,
          content_text: content.content_text,
          order_index: content.order_index,
          duration_minutes: content.duration_minutes
        }));

        const { error: contentError } = await supabase
          .from('content')
          .insert(contentToDuplicate);

        if (contentError) throw contentError;
      }

      await fetchData();
    } catch (error) {
      console.error('Error duplicating module:', error);
    } finally {
      setSaving(false);
    }
  };

  // Content operations
  const handleSaveContent = async (formData: Partial<Content>) => {
    try {
      setSaving(true);
      if (editingContent) {
        const { error } = await supabase
          .from('content')
          .update(formData)
          .eq('id', editingContent.id);
        if (error) throw error;
      } else {
        const moduleContent = modules.find(m => m.id === currentModuleId)?.content || [];
        const { error } = await supabase
          .from('content')
          .insert([{ 
            ...formData, 
            module_id: currentModuleId,
            order_index: moduleContent.length
          }]);
        if (error) throw error;
      }
      
      await fetchData();
      setIsContentModalOpen(false);
      setEditingContent(null);
      setCurrentModuleId(null);
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contenido?')) return;
    
    try {
      const { error } = await supabase.from('content').delete().eq('id', contentId);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleContentReorder = async (moduleId: string, reorderedContent: Content[]) => {
    try {
      const updates = reorderedContent.map((content, index) => 
        supabase.from('content')
          .update({ order_index: index })
          .eq('id', content.id)
      );
      await Promise.all(updates);
      await fetchData();
    } catch (error) {
      console.error('Error reordering content:', error);
    }
  };

  // UI helpers
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4 text-red-500" />;
      case 'document': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'link': return <LinkIcon className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTotalDuration = (module: ModuleWithContent) => {
    return module.content.reduce((total, content) => total + (content.duration_minutes || 0), 0);
  };

  const openModuleModal = (module: Module | null = null) => {
    setEditingModule(module);
    if (module) {
      setModuleFormData({
        title: module.title,
        description: module.description || ''
      });
    } else {
      setModuleFormData({
        title: '',
        description: ''
      });
    }
    setIsModuleModalOpen(true);
  };

  const openContentModal = (moduleId: string, content: Content | null = null) => {
    setCurrentModuleId(moduleId);
    setEditingContent(content);
    setIsContentModalOpen(true);
  };

  const openDriveImporter = (moduleId: string) => {
    setImporterModuleId(moduleId);
    setIsDriveImporterOpen(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!course) return <div>Curso no encontrado.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600 mt-1">{course.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/student/courses/${courseId}`)}>
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button onClick={() => openModuleModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Módulo
          </Button>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{modules.length}</div>
            <div className="text-sm text-gray-600">Módulos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {modules.reduce((total, module) => total + module.content.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Contenidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(modules.reduce((total, module) => total + getTotalDuration(module), 0) / 60)}h
            </div>
            <div className="text-sm text-gray-600">Duración Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {course.is_published ? 'Publicado' : 'Borrador'}
            </div>
            <div className="text-sm text-gray-600">Estado</div>
          </CardContent>
        </Card>
      </div>

      {/* Modules */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Módulos del Curso</h2>
            <div className="flex space-x-2">
              {isUpdatingModuleOrder && <div className="text-sm text-blue-600">Reordenando...</div>}
              <Button size="sm" onClick={() => openModuleModal()}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Módulo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropList
            items={modules}
            onReorder={handleModuleReorder}
            keyExtractor={(module) => module.id}
            renderItem={(module, index, isDragging) => (
              <div className="p-4">
                {/* Module Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      {expandedModules.has(module.id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </button>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{module.title}</h3>
                      <p className="text-gray-600 text-sm">{module.description}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{module.content.length} contenidos</span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTotalDuration(module)} min
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openContentModal(module.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Contenido
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openDriveImporter(module.id)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Drive
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openModuleModal(module)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDuplicateModule(module.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleDeleteModule(module.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Module Content */}
                {expandedModules.has(module.id) && (
                  <div className="mt-4 pl-8">
                    <DragDropList
                      items={module.content}
                      onReorder={(reorderedContent) => handleContentReorder(module.id, reorderedContent)}
                      keyExtractor={(content) => content.id}
                      renderItem={(content, contentIndex) => (
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-3 flex-1">
                            {getContentIcon(content.type)}
                            <div>
                              <h4 className="font-medium">{content.title}</h4>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span className="capitalize">{content.type}</span>
                                {content.duration_minutes && (
                                  <>
                                    <span>•</span>
                                    <span>{content.duration_minutes} min</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openContentModal(module.id, content)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      className="bg-gray-50 rounded-lg p-2"
                    />
                    {module.content.length === 0 && (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <p>No hay contenido en este módulo</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => openContentModal(module.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar Contenido
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <Modal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title={editingModule ? 'Editar Módulo' : 'Nuevo Módulo'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título del Módulo"
            value={moduleFormData.title}
            onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ej: Introducción a React"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={moduleFormData.description}
              onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del contenido del módulo..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsModuleModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => handleSaveModule(moduleFormData)}
              disabled={saving || !moduleFormData.title.trim()}
            >
              {saving ? 'Guardando...' : 'Guardar Módulo'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        title={editingContent ? 'Editar Contenido' : 'Nuevo Contenido'}
        size="xl"
      >
        <EnhancedContentForm
          content={editingContent}
          onSave={handleSaveContent}
          onCancel={() => setIsContentModalOpen(false)}
          isSubmitting={saving}
        />
      </Modal>

      <Modal
        isOpen={isDriveImporterOpen}
        onClose={() => setIsDriveImporterOpen(false)}
        title="Importar desde Google Drive"
        size="xl"
      >
        {importerModuleId && (
          <DriveContentImporter
            moduleId={importerModuleId}
            onContentAdded={() => {
              fetchData(); // Refrescar datos del curso
              setIsDriveImporterOpen(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
};