import React, { useState, useEffect } from 'react';
import { Course } from '../../types/database';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Save, Eye, AlertCircle, Check, X } from 'lucide-react';

interface EnhancedCourseFormProps {
  course: Course | null;
  onSave: (formData: Partial<Course>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
  duration_hours?: string;
}

export const EnhancedCourseForm: React.FC<EnhancedCourseFormProps> = ({ 
  course, 
  onSave, 
  onCancel, 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner' as const,
    duration_hours: 0,
    thumbnail_url: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValid, setIsValid] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (course) {
      const newFormData = {
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty_level: course.difficulty_level,
        duration_hours: course.duration_hours,
        thumbnail_url: course.thumbnail_url || '',
      };
      setFormData(newFormData);
      setThumbnailPreview(course.thumbnail_url || null);
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty_level: 'beginner',
        duration_hours: 0,
        thumbnail_url: '',
      });
      setThumbnailPreview(null);
    }
    setErrors({});
    setIsDirty(false);
  }, [course]);

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'El título es requerido';
        if (value.length < 3) return 'El título debe tener al menos 3 caracteres';
        if (value.length > 100) return 'El título no puede exceder 100 caracteres';
        break;
      case 'description':
        if (!value.trim()) return 'La descripción es requerida';
        if (value.length < 10) return 'La descripción debe tener al menos 10 caracteres';
        if (value.length > 500) return 'La descripción no puede exceder 500 caracteres';
        break;
      case 'category':
        if (!value.trim()) return 'La categoría es requerida';
        break;
      case 'thumbnail_url':
        if (value && !isValidUrl(value)) return 'URL de imagen inválida';
        break;
      case 'duration_hours':
        if (value <= 0) return 'La duración debe ser mayor a 0';
        if (value > 1000) return 'La duración no puede exceder 1000 horas';
        break;
    }
    return undefined;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const validateForm = (data: typeof formData): FormErrors => {
    const newErrors: FormErrors = {};
    
    Object.entries(data).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key as keyof FormErrors] = error;
    });

    return newErrors;
  };

  const updateField = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setIsDirty(true);

    // Validate single field
    const fieldError = validateField(field, value);
    const newErrors = { ...errors };
    if (fieldError) {
      newErrors[field as keyof FormErrors] = fieldError;
    } else {
      delete newErrors[field as keyof FormErrors];
    }
    setErrors(newErrors);

    // Validate entire form
    const allErrors = validateForm(newFormData);
    setIsValid(Object.keys(allErrors).length === 0);

    // Handle thumbnail preview
    if (field === 'thumbnail_url' && value && isValidUrl(value)) {
      setThumbnailPreview(value);
    } else if (field === 'thumbnail_url') {
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm(formData);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length === 0) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error('Error saving course:', error);
      }
    }
  };

  const getFieldIcon = (field: keyof FormErrors) => {
    if (errors[field]) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    if (formData[field] && !errors[field]) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <Input
          label="Título del Curso"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Ej: Fundamentos de React"
          required
          error={errors.title}
          icon={getFieldIcon('title')}
        />
        <div className="mt-1 text-xs text-gray-500">
          {formData.title.length}/100 caracteres
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción *
        </label>
        <div className="relative">
          <textarea
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors ${
              errors.description 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            rows={4}
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Descripción detallada del curso, objetivos de aprendizaje, prerrequisitos..."
          />
          <div className="absolute top-2 right-2">
            {getFieldIcon('description')}
          </div>
        </div>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.description}
          </p>
        )}
        <div className="mt-1 text-xs text-gray-500">
          {formData.description.length}/500 caracteres
        </div>
      </div>

      {/* Category and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Categoría"
          value={formData.category}
          onChange={(e) => updateField('category', e.target.value)}
          placeholder="Ej: Programación, Diseño, Marketing"
          required
          error={errors.category}
          icon={getFieldIcon('category')}
          list="categories"
        />
        <datalist id="categories">
          <option value="Programación" />
          <option value="Diseño" />
          <option value="Marketing" />
          <option value="Data Science" />
          <option value="DevOps" />
          <option value="Inteligencia Artificial" />
        </datalist>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nivel de Dificultad *
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.difficulty_level}
            onChange={(e) => updateField('difficulty_level', e.target.value)}
          >
            <option value="beginner">🟢 Principiante</option>
            <option value="intermediate">🟡 Intermedio</option>
            <option value="advanced">🔴 Avanzado</option>
          </select>
        </div>
      </div>

      {/* Duration and Thumbnail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Duración (horas)"
          type="number"
          value={formData.duration_hours}
          onChange={(e) => updateField('duration_hours', parseInt(e.target.value) || 0)}
          placeholder="20"
          min="1"
          max="1000"
          required
          error={errors.duration_hours}
          icon={getFieldIcon('duration_hours')}
        />
        
        <div>
          <Input
            label="URL de Imagen de Portada"
            value={formData.thumbnail_url}
            onChange={(e) => updateField('thumbnail_url', e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            error={errors.thumbnail_url}
            icon={getFieldIcon('thumbnail_url')}
          />
          {thumbnailPreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
              <img 
                src={thumbnailPreview} 
                alt="Vista previa" 
                className="h-20 w-32 object-cover rounded border"
                onError={() => setThumbnailPreview(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Status */}
      {isDirty && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Tienes cambios sin guardar
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center space-x-2">
          {course && (
            <Button type="button" variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Vista Previa
            </Button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!isValid || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                {course ? 'Actualizar' : 'Crear'} Curso
              </div>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};