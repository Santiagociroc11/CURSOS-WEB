
import React, { useState, useEffect } from 'react';
import { Module } from '../../types/database';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ModuleFormProps {
  module: Module | null;
  onSave: (formData: Partial<Module>) => void;
  onCancel: () => void;
}

export const ModuleForm: React.FC<ModuleFormProps> = ({ module, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: 0,
  });

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description || '',
        order_index: module.order_index,
      });
    } else {
      setFormData({ title: '', description: '', order_index: 0 });
    }
  }, [module]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título del Módulo"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Ej: Introducción a React"
        required
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
          placeholder="Descripción del contenido del módulo..."
        />
      </div>
      <Input
        label="Orden"
        type="number"
        value={formData.order_index}
        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
        required
      />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar Módulo
        </Button>
      </div>
    </form>
  );
};
