
import React from 'react';
import { Content } from '../../types/database';
import { Button } from '../ui/Button';
import { Edit, Trash2, Video, FileText, Link as LinkIcon } from 'lucide-react';

interface ContentListProps {
  contents: Content[];
  onEdit: (content: Content) => void;
  onDelete: (contentId: string) => void;
}

const ContentIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'video': return <Video className="h-4 w-4 text-blue-600" />;
    case 'document': return <FileText className="h-4 w-4 text-green-600" />;
    case 'link': return <LinkIcon className="h-4 w-4 text-purple-600" />;
    case 'text': return <FileText className="h-4 w-4 text-gray-600" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

export const ContentList: React.FC<ContentListProps> = ({ contents, onEdit, onDelete }) => {
  if (contents.length === 0) {
    return (
      <div className="text-center py-6 px-4 border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">Este módulo aún no tiene contenido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pl-4 border-l-2 border-gray-200 ml-4">
      {contents.map((content) => (
        <div key={content.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ContentIcon type={content.type} />
            <div>
              <h5 className="font-medium text-gray-800">{content.title}</h5>
              <span className="text-xs text-gray-500 capitalize">{content.type} - {content.duration_minutes} min</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(content)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(content.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
