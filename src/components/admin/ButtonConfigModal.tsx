import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  X, 
  ExternalLink, 
  Download, 
  MessageSquare, 
  Link as LinkIcon,
  Eye,
  Palette,
  Type,
  Settings
} from 'lucide-react';

interface ButtonConfig {
  type: 'button' | 'download' | 'alert' | 'link';
  text: string;
  url: string;
  style: string;
  icon?: string;
}

interface ButtonConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (shortcode: string) => void;
  initialConfig?: Partial<ButtonConfig>;
}

export const ButtonConfigModal: React.FC<ButtonConfigModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialConfig = {}
}) => {
  const [config, setConfig] = useState<ButtonConfig>({
    type: 'button',
    text: 'Mi Botón',
    url: 'https://ejemplo.com',
    style: 'btn-primary',
    icon: '',
    ...initialConfig
  });

  const [preview, setPreview] = useState('');

  const buttonTypes = [
    {
      id: 'button',
      label: 'Enlace Externo',
      icon: <ExternalLink className="h-4 w-4" />,
      description: 'Abre un enlace en nueva pestaña',
      urlLabel: 'URL del sitio web',
      urlPlaceholder: 'https://ejemplo.com'
    },
    {
      id: 'download',
      label: 'Descarga',
      icon: <Download className="h-4 w-4" />,
      description: 'Permite descargar un archivo',
      urlLabel: 'URL del archivo',
      urlPlaceholder: 'https://ejemplo.com/archivo.pdf'
    },
    {
      id: 'alert',
      label: 'Mensaje',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Muestra un mensaje emergente',
      urlLabel: 'Mensaje a mostrar',
      urlPlaceholder: '¡Hola! Este es un mensaje'
    },
    {
      id: 'link',
      label: 'Enlace Simple',
      icon: <LinkIcon className="h-4 w-4" />,
      description: 'Enlace de texto simple',
      urlLabel: 'URL destino',
      urlPlaceholder: 'https://ejemplo.com'
    }
  ];

  const buttonStyles = [
    { id: 'btn-primary', label: 'Primario', color: 'bg-blue-500 text-white', description: 'Azul principal' },
    { id: 'btn-secondary', label: 'Secundario', color: 'bg-gray-500 text-white', description: 'Gris secundario' },
    { id: 'btn-success', label: 'Éxito', color: 'bg-green-500 text-white', description: 'Verde de éxito' },
    { id: 'btn-warning', label: 'Advertencia', color: 'bg-yellow-500 text-white', description: 'Amarillo' },
    { id: 'btn-danger', label: 'Peligro', color: 'bg-red-500 text-white', description: 'Rojo de peligro' },
    { id: 'btn-outline', label: 'Contorno', color: 'border-2 border-blue-500 text-blue-500 bg-transparent', description: 'Con borde' }
  ];

  const iconOptions = [
    { value: '', label: 'Sin icono' },
    { value: '🔗', label: '🔗 Enlace' },
    { value: '📥', label: '📥 Descarga' },
    { value: '🚀', label: '🚀 Lanzar' },
    { value: '📚', label: '📚 Documentación' },
    { value: '🎥', label: '🎥 Video' },
    { value: '💡', label: '💡 Idea' },
    { value: '⭐', label: '⭐ Destacado' },
    { value: '🎯', label: '🎯 Objetivo' },
    { value: '🛠️', label: '🛠️ Herramientas' }
  ];

  useEffect(() => {
    updatePreview();
  }, [config]);

  const updatePreview = () => {
    const { type, text, url, style, icon } = config;
    const displayText = icon ? `${icon} ${text}` : text;
    
    let shortcode = '';
    switch (type) {
      case 'button':
        shortcode = `[button link="${url}" class="${style}"]${displayText}[/button]`;
        break;
      case 'download':
        shortcode = `[download url="${url}" class="${style}"]${displayText}[/download]`;
        break;
      case 'alert':
        shortcode = `[alert message="${url}" class="${style}"]${displayText}[/alert]`;
        break;
      case 'link':
        shortcode = `[link url="${url}" class="${style}"]${displayText}[/link]`;
        break;
    }
    setPreview(shortcode);
  };

  const handleInsert = () => {
    onInsert(preview);
    onClose();
  };

  const handleReset = () => {
    setConfig({
      type: 'button',
      text: 'Mi Botón',
      url: 'https://ejemplo.com',
      style: 'btn-primary',
      icon: ''
    });
  };

  const getCurrentType = () => buttonTypes.find(t => t.id === config.type);
  const getCurrentStyle = () => buttonStyles.find(s => s.id === config.style);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Configurar Botón Interactivo</h2>
              <p className="text-sm text-gray-600">Crea botones profesionales fácilmente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tipo de Botón */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Type className="h-4 w-4 mr-2" />
              Tipo de Botón
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {buttonTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setConfig({ ...config, type: type.id as any })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    config.type === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {type.icon}
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Configuración de Contenido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Texto del botón"
                value={config.text}
                onChange={(e) => setConfig({ ...config, text: e.target.value })}
                placeholder="Texto que aparecerá en el botón"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icono (opcional)
              </label>
              <select
                value={config.icon}
                onChange={(e) => setConfig({ ...config, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {iconOptions.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Input
              label={getCurrentType()?.urlLabel || 'URL'}
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder={getCurrentType()?.urlPlaceholder}
            />
          </div>

          {/* Estilos */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Estilo del Botón
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {buttonStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setConfig({ ...config, style: style.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.style === style.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-8 rounded mb-2 flex items-center justify-center text-sm font-medium ${style.color}`}>
                    {config.icon} {config.text}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium">{style.label}</p>
                    <p className="text-xs text-gray-600">{style.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vista Previa */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="bg-gray-900 p-4 rounded-lg mb-3">
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${getCurrentStyle()?.color}`}
                  onClick={() => alert('¡Este es un botón de vista previa!')}
                >
                  {config.icon} {config.text}
                </button>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-xs text-gray-600 mb-1">Shortcode generado:</p>
                <code className="text-sm bg-gray-100 p-2 rounded block font-mono">
                  {preview}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleReset}
          >
            Reiniciar
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!config.text.trim() || !config.url.trim()}
            >
              Insertar Botón
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
