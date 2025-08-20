import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Award, User, AlertCircle, Check } from 'lucide-react';

interface CertificateNameConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedName: string) => void;
  currentName: string;
  courseName: string;
  isGenerating?: boolean;
}

export const CertificateNameConfirmation: React.FC<CertificateNameConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  courseName,
  isGenerating = false
}) => {
  const [confirmedName, setConfirmedName] = useState(currentName);
  const [hasChanged, setHasChanged] = useState(false);

  // Debug logging
  console.log('📋 CertificateNameConfirmation render:', { isOpen, currentName, courseName, isGenerating });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setConfirmedName(newName);
    setHasChanged(newName !== currentName);
  };

  const handleConfirm = () => {
    if (confirmedName.trim()) {
      onConfirm(confirmedName.trim());
    }
  };

  const handleCancel = () => {
    setConfirmedName(currentName);
    setHasChanged(false);
    onClose();
  };

  try {
    console.log('📋 CertificateNameConfirmation about to render Modal with isOpen:', isOpen);
    return (
      <Modal isOpen={isOpen} onClose={handleCancel} title="" size="lg">
      <div className="text-center space-y-6">
        {/* Header con icono */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-4 rounded-full">
            <Award className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Generemos tu certificado!
          </h2>
          <p className="text-gray-600">
            Para el curso: <span className="font-medium text-gray-900">{courseName}</span>
          </p>
        </div>

        {/* Advertencia importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Importante: Verifica tu nombre completo</p>
              <p>
                Este nombre aparecerá en tu certificado oficial. Asegúrate de que esté 
                escrito correctamente tal como aparece en tus documentos de identificación.
              </p>
            </div>
          </div>
        </div>

        {/* Campo de nombre */}
        <div className="space-y-3">
          <div className="text-left">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 mr-2" />
              Nombre completo para el certificado
            </label>
            <Input
              value={confirmedName}
              onChange={handleNameChange}
              placeholder="Ej: Juan Carlos Pérez López"
              className="text-center text-lg font-medium"
              disabled={isGenerating}
            />
          </div>

          {/* Indicador de cambios */}
          {hasChanged && (
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Nombre actualizado</span>
            </div>
          )}
        </div>

        {/* Información del certificado */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Certificado para el curso:
            </p>
            <p className="font-medium text-gray-900 mb-3">
              {courseName}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Nombre que aparecerá:</strong>
            </p>
            <p className="text-lg font-bold text-gray-900">
              {confirmedName || 'Tu nombre'}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isGenerating}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!confirmedName.trim() || isGenerating}
            className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
            isLoading={isGenerating}
          >
            {isGenerating ? (
              'Generando certificado...'
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Generar certificado
              </>
            )}
          </Button>
        </div>

        {/* Nota adicional */}
        <p className="text-xs text-gray-500">
          💡 Tip: Puedes cambiar tu nombre en cualquier momento desde tu perfil
        </p>
      </div>
    </Modal>
    );
  } catch (error) {
    console.error('💥 Error rendering CertificateNameConfirmation:', error);
    return <div>Error rendering modal: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
};