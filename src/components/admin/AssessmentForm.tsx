
import React, { useState, useEffect } from 'react';
import { Assessment } from '../../types/database';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AssessmentFormProps {
  assessment: Assessment | null;
  onSave: (formData: Partial<Assessment>) => void;
  onCancel: () => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ assessment, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Assessment>>({
    title: '',
    description: '',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: 60,
  });

  useEffect(() => {
    if (assessment) {
      setFormData(assessment);
    } else {
      setFormData({ title: '', description: '', passing_score: 70, max_attempts: 3, time_limit_minutes: 60 });
    }
  }, [assessment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
      <Input label="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      <Input label="Puntaje para Aprobar (%)" type="number" value={formData.passing_score} onChange={e => setFormData({...formData, passing_score: parseInt(e.target.value)})} />
      <Input label="Intentos Máximos" type="number" value={formData.max_attempts} onChange={e => setFormData({...formData, max_attempts: parseInt(e.target.value)})} />
      <Input label="Límite de Tiempo (minutos)" type="number" value={formData.time_limit_minutes} onChange={e => setFormData({...formData, time_limit_minutes: parseInt(e.target.value)})} />
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
};
