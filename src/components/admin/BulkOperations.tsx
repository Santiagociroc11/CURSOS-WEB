import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  Check, 
  X, 
  Trash2, 
  Copy, 
  Move, 
  Edit, 
  Upload,
  Download,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface BulkItem {
  id: string;
  title: string;
  type?: string;
  [key: string]: any;
}

interface BulkOperationsProps {
  selectedItems: BulkItem[];
  onClearSelection: () => void;
  onBulkDelete: (itemIds: string[]) => Promise<void>;
  onBulkDuplicate?: (itemIds: string[]) => Promise<void>;
  onBulkMove?: (itemIds: string[], targetId: string) => Promise<void>;
  onBulkEdit?: (itemIds: string[], changes: Record<string, any>) => Promise<void>;
  moveTargets?: { id: string; title: string; }[];
  editableFields?: { key: string; label: string; type: 'text' | 'select'; options?: string[]; }[];
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  onClearSelection,
  onBulkDelete,
  onBulkDuplicate,
  onBulkMove,
  onBulkEdit,
  moveTargets = [],
  editableFields = []
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [editChanges, setEditChanges] = useState<Record<string, any>>({});

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsProcessing(true);
      await onBulkDelete(selectedItems.map(item => item.id));
      onClearSelection();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDuplicate = async () => {
    if (selectedItems.length === 0 || !onBulkDuplicate) return;
    
    try {
      setIsProcessing(true);
      await onBulkDuplicate(selectedItems.map(item => item.id));
      onClearSelection();
    } catch (error) {
      console.error('Error in bulk duplicate:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMove = async () => {
    if (selectedItems.length === 0 || !selectedTarget || !onBulkMove) return;
    
    try {
      setIsProcessing(true);
      await onBulkMove(selectedItems.map(item => item.id), selectedTarget);
      onClearSelection();
      setIsMoveModalOpen(false);
      setSelectedTarget('');
    } catch (error) {
      console.error('Error in bulk move:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEdit = async () => {
    if (selectedItems.length === 0 || !onBulkEdit || Object.keys(editChanges).length === 0) return;
    
    try {
      setIsProcessing(true);
      await onBulkEdit(selectedItems.map(item => item.id), editChanges);
      onClearSelection();
      setIsEditModalOpen(false);
      setEditChanges({});
    } catch (error) {
      console.error('Error in bulk edit:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportSelection = () => {
    const data = selectedItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      // Add more fields as needed
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selection-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (selectedItems.length === 0) return null;

  return (
    <>
      {/* Bulk Operations Bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
              {selectedItems.length} seleccionados
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Delete */}
            <Button 
              size="sm" 
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>

            {/* Duplicate */}
            {onBulkDuplicate && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBulkDuplicate}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                Duplicar
              </Button>
            )}

            {/* Move */}
            {onBulkMove && moveTargets.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsMoveModalOpen(true)}
                disabled={isProcessing}
              >
                <Move className="h-4 w-4 mr-1" />
                Mover
              </Button>
            )}

            {/* Edit */}
            {onBulkEdit && editableFields.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                disabled={isProcessing}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}

            {/* Export */}
            <Button 
              size="sm" 
              variant="outline"
              onClick={exportSelection}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900">
                ¿Estás seguro de que deseas eliminar {selectedItems.length} elemento{selectedItems.length > 1 ? 's' : ''}?
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          
          <div className="max-h-32 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700 mb-2">Elementos a eliminar:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {selectedItems.map(item => (
                <li key={item.id} className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title="Mover Elementos"
      >
        <div className="space-y-4">
          <p className="text-gray-900">
            Selecciona el destino para mover {selectedItems.length} elemento{selectedItems.length > 1 ? 's' : ''}:
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destino
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
            >
              <option value="">Seleccionar destino...</option>
              {moveTargets.map(target => (
                <option key={target.id} value={target.id}>
                  {target.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsMoveModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkMove}
              disabled={isProcessing || !selectedTarget}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Moviendo...
                </>
              ) : (
                <>
                  <Move className="h-4 w-4 mr-2" />
                  Mover
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar en Lote"
      >
        <div className="space-y-4">
          <p className="text-gray-900">
            Editar {selectedItems.length} elemento{selectedItems.length > 1 ? 's' : ''}:
          </p>

          {editableFields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editChanges[field.key] || ''}
                  onChange={(e) => setEditChanges(prev => ({ ...prev, [field.key]: e.target.value }))}
                >
                  <option value="">No cambiar</option>
                  {field.options?.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editChanges[field.key] || ''}
                  onChange={(e) => setEditChanges(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder="Dejar vacío para no cambiar"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkEdit}
              disabled={isProcessing || Object.keys(editChanges).length === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Aplicar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};