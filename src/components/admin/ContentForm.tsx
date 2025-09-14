
import React, { useState, useEffect } from 'react';
import { Content } from '../../types/database';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RichTextEditor } from '../common/RichTextEditor';

interface ContentFormProps {
  content: Content | null;
  onSave: (formData: Partial<Content>) => void;
  onCancel: () => void;
}

export const ContentForm: React.FC<ContentFormProps> = ({ content, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    type: 'video',
    content_url: '',
    content_text: '',
    order_index: 0,
    duration_minutes: 0,
  });

  useEffect(() => {
    if (content) {
      setFormData(content);
    } else {
      setFormData({
        title: '',
        type: 'video',
        content_url: '',
        content_text: '',
        order_index: 0,
        duration_minutes: 0,
      });
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título del Contenido"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Ej: ¿Qué es un componente?"
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contenido</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as Content['type'] })}
        >
          <option value="video">Video</option>
          <option value="document">Documento</option>
          <option value="presentation">Presentación</option>
          <option value="link">Enlace</option>
          <option value="text">Texto</option>
        </select>
      </div>

      {formData.type === 'text' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contenido de Texto Enriquecido</label>
          <RichTextEditor
            value={formData.content_text || ''}
            onChange={(value) => setFormData({ ...formData, content_text: value, content_url: '' })}
            placeholder="Escribe tu contenido aquí... Puedes usar formato enriquecido, enlaces, listas y más."
            height={250}
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 Usa la barra de herramientas para formatear texto. Para botones interactivos, 
            haz clic en "Agregar Botón Interactivo" debajo del editor.
          </div>
        </div>
      ) : (
        <Input
          label="URL del Contenido"
          value={formData.content_url || ''}
          onChange={(e) => setFormData({ ...formData, content_url: e.target.value, content_text: '' })}
          placeholder="https://ejemplo.com/recurso"
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Orden"
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
          required
        />
        <Input
          label="Duración (minutos)"
          type="number"
          value={formData.duration_minutes}
          onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar Contenido
        </Button>
      </div>
    </form>
  );
};
