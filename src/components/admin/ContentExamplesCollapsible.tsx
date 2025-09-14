import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronRight, Copy, Check, Eye, Lightbulb, Code, ExternalLink } from 'lucide-react';

interface ContentExamplesCollapsibleProps {
  onInsertExample: (html: string) => void;
}

export const ContentExamplesCollapsible: React.FC<ContentExamplesCollapsibleProps> = ({ onInsertExample }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  const examples = [
    {
      title: "Botón de Enlace",
      icon: <ExternalLink className="h-4 w-4" />,
      description: "Botón que abre un enlace externo",
      html: `<button data-action="open-link" data-url="https://ejemplo.com" class="btn-primary">
  🔗 Visitar Sitio Web
</button>`
    },
    {
      title: "Botón de Descarga",
      icon: <ExternalLink className="h-4 w-4" />,
      description: "Botón para descargar archivos",
      html: `<button data-action="download" data-url="https://ejemplo.com/archivo.pdf" class="btn-success">
  📥 Descargar PDF
</button>`
    },
    {
      title: "Lista de Recursos",
      icon: <Code className="h-4 w-4" />,
      description: "Lista con enlaces a recursos",
      html: `<h3>Recursos Adicionales</h3>
<ul>
  <li><a href="https://ejemplo1.com" target="_blank">📚 Documentación</a></li>
  <li><a href="https://ejemplo2.com" target="_blank">🎥 Video Tutorial</a></li>
  <li><a href="https://ejemplo3.com" target="_blank">💡 Ejemplos</a></li>
</ul>`
    },
    {
      title: "Cita Destacada",
      icon: <Code className="h-4 w-4" />,
      description: "Cita con formato especial",
      html: `<blockquote>
  <p>"El aprendizaje es un tesoro que seguirá a su dueño a todas partes."</p>
  <cite>- Proverbio Chino</cite>
</blockquote>`
    }
  ];

  const quickButtons = [
    {
      title: "Botón Simple",
      html: `<button data-action="open-link" data-url="https://ejemplo.com" class="btn-primary">Mi Botón</button>`
    },
    {
      title: "Enlace Destacado",
      html: `<a href="https://ejemplo.com" target="_blank"><strong>🔗 Enlace Importante</strong></a>`
    },
    {
      title: "Lista Básica",
      html: `<ul>
  <li>Elemento 1</li>
  <li>Elemento 2</li>
  <li>Elemento 3</li>
</ul>`
    }
  ];

  const handleCopy = (html: string, id: string) => {
    navigator.clipboard.writeText(html);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span className="font-medium text-gray-700">Ejemplos y Plantillas</span>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
            {examples.length} disponibles
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Contenido colapsable */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Botones rápidos */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">⚡ Inserción Rápida</h4>
            <div className="flex flex-wrap gap-2">
              {quickButtons.map((btn, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => onInsertExample(btn.html)}
                  className="text-xs"
                >
                  + {btn.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Ejemplos detallados */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Plantillas Completas</h4>
            <div className="grid gap-3">
              {examples.map((example, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center space-x-2">
                      {example.icon}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">{example.title}</h5>
                        <p className="text-xs text-gray-600">{example.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInsertExample(example.html)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Insertar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(example.html, `example-${index}`)}
                        className="text-xs"
                      >
                        {copied === `example-${index}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {selectedExample === index && (
                    <div className="p-3 border-t">
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        <code>{example.html}</code>
                      </pre>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSelectedExample(selectedExample === index ? null : index)}
                    className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {selectedExample === index ? 'Ocultar código' : 'Ver código'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">💡 Consejos para usar botones:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Usa <code>data-action="open-link"</code> para enlaces externos</li>
                  <li>• Usa <code>data-action="download"</code> para descargas</li>
                  <li>• Agrega clases CSS: <code>.btn-primary</code>, <code>.btn-success</code>, etc.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
