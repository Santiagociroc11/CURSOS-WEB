import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronRight, Copy, Check, Eye, Zap, Code2, ExternalLink, Download, MessageSquare, Link } from 'lucide-react';
import { ShortcodeProcessor } from '../../utils/shortcodes';

interface ShortcodeExamplesProps {
  onInsertShortcode: (shortcode: string) => void;
}

export const ShortcodeExamples: React.FC<ShortcodeExamplesProps> = ({ onInsertShortcode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const quickShortcodes = [
    {
      title: "Botón Simple",
      icon: <ExternalLink className="h-4 w-4" />,
      shortcode: '[button link="https://ejemplo.com"]Mi Botón[/button]',
      color: 'blue'
    },
    {
      title: "Descarga",
      icon: <Download className="h-4 w-4" />,
      shortcode: '[download url="archivo.pdf"]Descargar[/download]',
      color: 'green'
    },
    {
      title: "Enlace",
      icon: <Link className="h-4 w-4" />,
      shortcode: '[link url="https://ejemplo.com"]Ver más[/link]',
      color: 'purple'
    }
  ];

  const detailedExamples = [
    {
      title: "Botón de Enlace Externo",
      description: "Abre un sitio web en nueva pestaña",
      icon: <ExternalLink className="h-4 w-4 text-blue-500" />,
      shortcode: '[button link="https://github.com/tu-proyecto" class="btn-primary"]🚀 Ver en GitHub[/button]',
      variations: [
        '[button link="https://ejemplo.com"]Botón Básico[/button]',
        '[button link="https://ejemplo.com" class="btn-secondary"]Botón Secundario[/button]',
        '[button link="https://ejemplo.com" class="btn-outline"]Botón con Borde[/button]'
      ]
    },
    {
      title: "Botón de Descarga",
      description: "Permite descargar archivos",
      icon: <Download className="h-4 w-4 text-green-500" />,
      shortcode: '[download url="https://ejemplo.com/manual.pdf" class="btn-success"]📥 Descargar Manual[/download]',
      variations: [
        '[download url="archivo.pdf"]Descargar PDF[/download]',
        '[download url="presentacion.pptx"]📊 Presentación[/download]',
        '[download url="codigo.zip" class="btn-warning"]💻 Código Fuente[/download]'
      ]
    },
    {
      title: "Mensaje de Alerta",
      description: "Muestra un mensaje emergente",
      icon: <MessageSquare className="h-4 w-4 text-orange-500" />,
      shortcode: '[alert message="¡Felicidades por completar la lección!" class="btn-warning"]🎉 Mostrar Mensaje[/alert]',
      variations: [
        '[alert message="¡Hola estudiante!"]Saludar[/alert]',
        '[alert message="Recuerda practicar"]💡 Recordatorio[/alert]',
        '[alert message="¡Excelente trabajo!" class="btn-success"]👏 Felicitar[/alert]'
      ]
    },
    {
      title: "Enlace Simple",
      description: "Enlace que se abre en nueva pestaña",
      icon: <Link className="h-4 w-4 text-purple-500" />,
      shortcode: '[link url="https://docs.ejemplo.com"]📚 Ver Documentación[/link]',
      variations: [
        '[link url="https://ejemplo.com"]Enlace Simple[/link]',
        '[link url="https://comunidad.ejemplo.com"]👥 Comunidad[/link]',
        '[link url="https://soporte.ejemplo.com" class="text-red-500"]🆘 Soporte[/link]'
      ]
    }
  ];

  const styles = [
    { name: 'Primario', class: 'btn-primary', color: 'bg-blue-500' },
    { name: 'Secundario', class: 'btn-secondary', color: 'bg-gray-500' },
    { name: 'Éxito', class: 'btn-success', color: 'bg-green-500' },
    { name: 'Advertencia', class: 'btn-warning', color: 'bg-yellow-500' },
    { name: 'Peligro', class: 'btn-danger', color: 'bg-red-500' },
    { name: 'Contorno', class: 'btn-outline', color: 'border-2 border-blue-500' }
  ];

  const handleCopy = (shortcode: string, id: string) => {
    navigator.clipboard.writeText(shortcode);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderPreview = (shortcode: string) => {
    const html = ShortcodeProcessor.process(shortcode);
    return (
      <div 
        className="bg-gray-900 p-3 rounded border"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">⚡ Shortcodes Mágicos</h3>
            <p className="text-sm text-gray-600">Crea botones de forma súper fácil</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* Inserción Rápida */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              Inserción Rápida
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {quickShortcodes.map((item, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => onInsertShortcode(item.shortcode)}
                  className="text-left justify-start"
                >
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Estilos Disponibles */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Code2 className="h-4 w-4 mr-2 text-purple-500" />
              Estilos Disponibles
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {styles.map((style, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className={`w-4 h-4 rounded ${style.color}`}></div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">{style.class}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Ejemplos Detallados */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2 text-green-500" />
              Ejemplos Completos
            </h4>
            <div className="space-y-4">
              {detailedExamples.map((example, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-start justify-between p-4 bg-gray-50">
                    <div className="flex items-start space-x-3">
                      {example.icon}
                      <div>
                        <h5 className="font-medium text-gray-900">{example.title}</h5>
                        <p className="text-sm text-gray-600">{example.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInsertShortcode(example.shortcode)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Insertar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(example.shortcode, `example-${index}`)}
                      >
                        {copied === `example-${index}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Shortcode Principal:</h6>
                      <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                        {example.shortcode}
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Vista Previa:</h6>
                      {renderPreview(example.shortcode)}
                    </div>
                    
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Variaciones:</h6>
                      <div className="space-y-1">
                        {example.variations.map((variation, vIndex) => (
                          <div key={vIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <code className="text-xs">{variation}</code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onInsertShortcode(variation)}
                              className="ml-2"
                            >
                              Usar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guía Rápida */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              🎯 Guía Rápida de Shortcodes
            </h4>
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>Sintaxis básica:</strong> <code>[tipo atributo="valor"]Texto[/tipo]</code></p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                <div>
                  <p><strong>Botón:</strong> <code>[button link="url"]Texto[/button]</code></p>
                  <p><strong>Descarga:</strong> <code>[download url="archivo"]Texto[/download]</code></p>
                </div>
                <div>
                  <p><strong>Alerta:</strong> <code>[alert message="texto"]Botón[/alert]</code></p>
                  <p><strong>Enlace:</strong> <code>[link url="url"]Texto[/link]</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
