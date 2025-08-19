
import React from 'react';
import { Module, Content } from '../../types/database';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Edit, Trash2, ChevronDown, Plus } from 'lucide-react';
import { ContentList } from './ContentList';

interface ModuleListProps {
  modules: Module[];
  activeModuleId: string | null;
  onModuleClick: (moduleId: string) => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (moduleId: string) => void;
  // Content props
  contents: Content[];
  onAddContent: (moduleId: string) => void;
  onEditContent: (content: Content) => void;
  onDeleteContent: (contentId: string) => void;
}

export const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  activeModuleId,
  onModuleClick,
  onEditModule,
  onDeleteModule,
  contents,
  onAddContent,
  onEditContent,
  onDeleteContent,
}) => {
  if (modules.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900">No hay módulos en este curso</h3>
        <p className="text-sm text-gray-500 mt-1">Empieza por añadir el primer módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const isActive = activeModuleId === module.id;
        return (
          <Card key={module.id} className={`transition-all duration-300 ${isActive ? 'shadow-lg border-blue-500' : ''}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => onModuleClick(module.id)}>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{module.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEditModule(module); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDeleteModule(module.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isActive && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-semibold text-md">Contenido del Módulo</h5>
                    <Button variant="outline" size="sm" onClick={() => onAddContent(module.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Contenido
                    </Button>
                  </div>
                  <ContentList 
                    contents={contents}
                    onEdit={onEditContent}
                    onDelete={onDeleteContent}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
