
import React from 'react';
import { Assessment } from '../../types/database';
import { Button } from '../ui/Button';
import { Edit, Trash2, ListChecks } from 'lucide-react';

interface AssessmentListProps {
  assessments: Assessment[];
  onEdit: (assessment: Assessment) => void;
  onDelete: (assessmentId: string) => void;
  onManageQuestions: (assessmentId: string) => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({ assessments, onEdit, onDelete, onManageQuestions }) => {
  if (assessments.length === 0) {
    return <p className="text-sm text-gray-500">No hay evaluaciones para este curso.</p>;
  }

  return (
    <div className="space-y-3">
      {assessments.map(assessment => (
        <div key={assessment.id} className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
          <div>
            <h4 className="font-semibold">{assessment.title}</h4>
            <p className="text-sm text-gray-600">Puntaje para aprobar: {assessment.passing_score}%</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onManageQuestions(assessment.id)}>
              <ListChecks className="h-4 w-4 mr-2" />
              Preguntas
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(assessment)}><Edit className="h-4 w-4" /></Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(assessment.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
};
