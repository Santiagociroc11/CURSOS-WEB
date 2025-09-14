import React, { useState, useEffect } from 'react';
import { Content } from '../../types/database';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RichTextEditor } from '../common/RichTextEditor';
import { ContentExamples } from './ContentExamples';
import { 
  Play, 
  FileText, 
  Link as LinkIcon, 
  Image, 
  AlertCircle, 
  Check, 
  X, 
  Eye,
  Save,
  Loader2
} from 'lucide-react';

interface EnhancedContentFormProps {
  content: Content | null;
  onSave: (formData: Partial<Content>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  title?: string;
  content_url?: string;
  content_text?: string;
  duration_minutes?: string;
}

// Helper to detect YouTube URLs
const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
};

// Helper to detect Google Drive URLs
const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com');
};

// Helper to check if URL is a supported video URL
const isSupportedVideoUrl = (url: string): boolean => {
  return isYouTubeUrl(url) || isGoogleDriveUrl(url);
};

// Helper to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string): string => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
};

// Helper to convert Google Drive URLs to embed format
const getGoogleDriveEmbedUrl = (url: string): string => {
  const shareRegex = /(?:https:\/\/drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
  const viewRegex = /(?:https:\/\/drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/;
  
  const shareMatch = url.match(shareRegex);
  const viewMatch = url.match(viewRegex);
  
  if (shareMatch) {
    return `https://drive.google.com/file/d/${shareMatch[1]}/preview`;
  } else if (viewMatch) {
    return `https://drive.google.com/file/d/${viewMatch[1]}/preview`;
  }
  
  return url;
};

// Helper to validate URLs
const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const EnhancedContentForm: React.FC<EnhancedContentFormProps> = ({ 
  content, 
  onSave, 
  onCancel, 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    type: 'video',
    content_url: '',
    content_text: '',
    order_index: 0,
    duration_minutes: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isValid, setIsValid] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData(content);
      if (content.content_url) {
        generatePreview(content.content_url, content.type);
      }
    } else {
      setFormData({
        title: '',
        type: 'video',
        content_url: '',
        content_text: '',
        order_index: 0,
        duration_minutes: 0,
      });
      setPreviewContent(null);
    }
    setErrors({});
    setIsDirty(false);
  }, [content]);

  const validateField = (name: string, value: any, type?: string): string | undefined => {
    switch (name) {
      case 'title':
        if (!value?.trim()) return 'El título es requerido';
        if (value.length < 3) return 'El título debe tener al menos 3 caracteres';
        if (value.length > 100) return 'El título no puede exceder 100 caracteres';
        break;
      case 'content_url':
        if (type !== 'text' && !value?.trim()) return 'La URL es requerida para este tipo de contenido';
        if (value && !isValidUrl(value)) return 'URL inválida';
        if (type === 'video' && value && !isSupportedVideoUrl(value)) return 'Para videos, se requiere una URL de YouTube o Google Drive';
        break;
      case 'content_text':
        if (type === 'text' && !value?.trim()) return 'El contenido de texto es requerido';
        if (type === 'text' && value && value.replace(/<[^>]*>/g, '').trim().length < 10) {
          return 'El contenido debe tener al menos 10 caracteres de texto (sin contar HTML)';
        }
        break;
      case 'duration_minutes':
        if (value < 0) return 'La duración no puede ser negativa';
        if (value > 600) return 'La duración no puede exceder 600 minutos';
        break;
    }
    return undefined;
  };

  const validateForm = (data: typeof formData): FormErrors => {
    const newErrors: FormErrors = {};
    
    ['title', 'content_url', 'content_text', 'duration_minutes'].forEach(field => {
      const error = validateField(field, data[field as keyof typeof data], data.type);
      if (error) newErrors[field as keyof FormErrors] = error;
    });

    return newErrors;
  };

  const generatePreview = async (url: string, type: string) => {
    if (!url || !isValidUrl(url)) {
      setPreviewContent(null);
      return;
    }

    setIsLoadingPreview(true);
    try {
      switch (type) {
        case 'video':
          if (isYouTubeUrl(url)) {
            setPreviewContent(getYouTubeEmbedUrl(url));
          } else if (isGoogleDriveUrl(url)) {
            setPreviewContent(getGoogleDriveEmbedUrl(url));
          } else {
            setPreviewContent(url);
          }
          break;
        case 'image':
          setPreviewContent(url);
          break;
        default:
          setPreviewContent(url);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const updateField = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setIsDirty(true);

    // Special handling for type changes
    if (field === 'type') {
      // Clear previous content when type changes
      newFormData.content_url = '';
      newFormData.content_text = '';
      setPreviewContent(null);
    }

    // Generate preview for URL changes
    if (field === 'content_url' && value) {
      generatePreview(value, newFormData.type || 'video');
    }

    // Validate single field
    const fieldError = validateField(field, value, newFormData.type);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm(formData);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length === 0) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error('Error saving content:', error);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const renderPreview = () => {
    if (isLoadingPreview) {
      return (
        <div className="flex items-center justify-center h-32 bg-gray-100 rounded border">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (!previewContent) return null;

    switch (formData.type) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded overflow-hidden">
            <iframe
              src={previewContent}
              width="100%"
              height="100%"
              allowFullScreen
              title="Video preview"
            />
          </div>
        );
      case 'image':
        return (
          <img 
            src={previewContent} 
            alt="Preview" 
            className="max-h-32 rounded border object-cover"
            onError={() => setPreviewContent(null)}
          />
        );
      default:
        return (
          <div className="p-4 bg-gray-50 rounded border">
            <p className="text-sm text-gray-600">
              Vista previa disponible en: <a href={previewContent} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Abrir enlace</a>
            </p>
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Título del Contenido"
        value={formData.title || ''}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="Ej: Introducción a los componentes"
        required
        error={errors.title}
        icon={getFieldIcon('title')}
      />

      {/* Content Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Contenido *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { value: 'video', label: 'Video', icon: <Play className="h-4 w-4" /> },
            { value: 'document', label: 'Documento', icon: <FileText className="h-4 w-4" /> },
            { value: 'link', label: 'Enlace', icon: <LinkIcon className="h-4 w-4" /> },
            { value: 'image', label: 'Imagen', icon: <Image className="h-4 w-4" /> },
            { value: 'text', label: 'Texto', icon: <FileText className="h-4 w-4" /> },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateField('type', type.value)}
              className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors ${
                formData.type === type.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {type.icon}
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Input */}
      {formData.type === 'text' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenido de Texto Enriquecido *
          </label>
          <RichTextEditor
            value={formData.content_text || ''}
            onChange={(value) => updateField('content_text', value)}
            placeholder="Escribe tu contenido aquí... Puedes usar formato enriquecido, enlaces, listas, imágenes y más."
            height={300}
            error={errors.content_text}
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 <strong>Consejos:</strong> Puedes agregar enlaces, imágenes, listas, texto en negrita/cursiva, 
            y botones usando HTML. Ejemplo: &lt;button onclick="window.open('https://ejemplo.com')"&gt;Visitar sitio&lt;/button&gt;
          </div>
          
          {/* Ejemplos de contenido */}
          <div className="mt-4">
            <ContentExamples 
              onInsertExample={(html) => {
                const currentContent = formData.content_text || '';
                updateField('content_text', currentContent + '\n\n' + html);
              }}
            />
          </div>
        </div>
      ) : (
        <div>
          <Input
            label={`URL del ${formData.type === 'video' ? 'Video (YouTube o Google Drive)' : 'Contenido'}`}
            value={formData.content_url || ''}
            onChange={(e) => updateField('content_url', e.target.value)}
            placeholder={
              formData.type === 'video' 
                ? 'https://www.youtube.com/watch?v=... o https://drive.google.com/file/d/...' 
                : 'https://ejemplo.com/recurso'
            }
            required
            error={errors.content_url}
            icon={getFieldIcon('content_url')}
          />
          {formData.type === 'video' && (
            <p className="mt-1 text-xs text-gray-500">
              Se admiten URLs de YouTube y Google Drive. El video se mostrará usando el reproductor integrado.
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      {previewContent && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vista Previa
          </label>
          {renderPreview()}
        </div>
      )}

      {/* Order and Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Orden"
          type="number"
          value={formData.order_index || 0}
          onChange={(e) => updateField('order_index', parseInt(e.target.value) || 0)}
          min="0"
          required
        />
        <Input
          label="Duración (minutos)"
          type="number"
          value={formData.duration_minutes || 0}
          onChange={(e) => updateField('duration_minutes', parseInt(e.target.value) || 0)}
          min="0"
          max="600"
          error={errors.duration_minutes}
          icon={getFieldIcon('duration_minutes')}
          placeholder="0 = No especificada"
        />
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
          {previewContent && (
            <Button type="button" variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Vista Completa
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
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Guardando...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                {content ? 'Actualizar' : 'Crear'} Contenido
              </div>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};