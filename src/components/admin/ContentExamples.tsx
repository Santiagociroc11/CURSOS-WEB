import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Copy, Check, Eye } from 'lucide-react';

interface ContentExamplesProps {
  onInsertExample: (html: string) => void;
}

export const ContentExamples: React.FC<ContentExamplesProps> = ({ onInsertExample }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const examples = [
    {
      title: "Botón de Enlace Externo",
      description: "Un botón que abre un enlace en nueva pestaña",
      html: `<button onclick="window.open('https://ejemplo.com', '_blank')" class="btn-primary">
  🔗 Visitar Sitio Web
</button>`,
      preview: (
        <button 
          onClick={() => window.open('https://ejemplo.com', '_blank')}
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-block',
            margin: '0.5rem 0.5rem 0.5rem 0'
          }}
        >
          🔗 Visitar Sitio Web
        </button>
      )
    },
    {
      title: "Botón de Descarga",
      description: "Un botón que inicia la descarga de un archivo",
      html: `<button onclick="window.open('https://ejemplo.com/archivo.pdf', '_blank')" class="btn-success">
  📥 Descargar PDF
</button>`,
      preview: (
        <button 
          onClick={() => window.open('https://ejemplo.com/archivo.pdf', '_blank')}
          className="btn-success"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-block',
            margin: '0.5rem 0.5rem 0.5rem 0'
          }}
        >
          📥 Descargar PDF
        </button>
      )
    },
    {
      title: "Lista con Enlaces",
      description: "Una lista ordenada con enlaces a recursos",
      html: `<h3>Recursos Adicionales</h3>
<ul>
  <li><a href="https://ejemplo1.com" target="_blank">📚 Documentación Oficial</a></li>
  <li><a href="https://ejemplo2.com" target="_blank">🎥 Video Tutorial</a></li>
  <li><a href="https://ejemplo3.com" target="_blank">💡 Ejemplos Prácticos</a></li>
</ul>`,
      preview: (
        <div>
          <h3 style={{ color: '#f9fafb', marginBottom: '1rem' }}>Recursos Adicionales</h3>
          <ul style={{ color: '#d1d5db', paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="https://ejemplo1.com" target="_blank" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                📚 Documentación Oficial
              </a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="https://ejemplo2.com" target="_blank" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                🎥 Video Tutorial
              </a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="https://ejemplo3.com" target="_blank" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                💡 Ejemplos Prácticos
              </a>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Cita Inspiradora",
      description: "Una cita con formato especial",
      html: `<blockquote>
  <p>"El aprendizaje es un tesoro que seguirá a su dueño a todas partes."</p>
  <cite>- Proverbio Chino</cite>
</blockquote>`,
      preview: (
        <blockquote style={{
          borderLeft: '4px solid #3b82f6',
          paddingLeft: '1rem',
          padding: '0.5rem 0 0.5rem 1rem',
          marginBottom: '1rem',
          fontStyle: 'italic',
          backgroundColor: 'rgba(31, 41, 55, 0.5)',
          borderRadius: '0 0.5rem 0.5rem 0'
        }}>
          <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>
            "El aprendizaje es un tesoro que seguirá a su dueño a todas partes."
          </p>
          <cite style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            - Proverbio Chino
          </cite>
        </blockquote>
      )
    },
    {
      title: "Botones de Acción Múltiple",
      description: "Varios botones con diferentes acciones",
      html: `<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0;">
  <button onclick="window.open('https://ejemplo.com/curso', '_blank')" class="btn-primary">
    🎓 Ver Curso Completo
  </button>
  <button onclick="window.open('https://ejemplo.com/comunidad', '_blank')" class="btn-secondary">
    👥 Unirse a Comunidad
  </button>
  <button onclick="alert('¡Gracias por tu interés!')" class="btn-outline">
    💬 Contactar Soporte
  </button>
</div>`,
      preview: (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1rem 0' }}>
          <button 
            onClick={() => window.open('https://ejemplo.com/curso', '_blank')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🎓 Ver Curso Completo
          </button>
          <button 
            onClick={() => window.open('https://ejemplo.com/comunidad', '_blank')}
            style={{
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            👥 Unirse a Comunidad
          </button>
          <button 
            onClick={() => alert('¡Gracias por tu interés!')}
            style={{
              background: 'transparent',
              border: '2px solid #3b82f6',
              color: '#3b82f6',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            💬 Contactar Soporte
          </button>
        </div>
      )
    }
  ];

  const handleCopy = (html: string, index: number) => {
    navigator.clipboard.writeText(html);
    setCopied(index.toString());
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          💡 Ejemplos de Contenido Enriquecido
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Haz clic en "Insertar" para agregar estos ejemplos a tu contenido, o "Copiar" para usar el código manualmente.
        </p>
      </div>

      {examples.map((example, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">{example.title}</h4>
              <p className="text-sm text-gray-600">{example.description}</p>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onInsertExample(example.html)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Insertar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(example.html, index)}
              >
                {copied === index.toString() ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copied === index.toString() ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Vista Previa:</h5>
              <div className="bg-gray-900 p-4 rounded-lg border">
                {example.preview}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Código HTML:</h5>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto border">
                <code>{example.html}</code>
              </pre>
            </div>
          </div>
        </div>
      ))}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🎨 Clases CSS Disponibles:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><code>.btn-primary</code> - Botón azul principal</p>
          <p><code>.btn-secondary</code> - Botón gris secundario</p>
          <p><code>.btn-success</code> - Botón verde de éxito</p>
          <p><code>.btn-warning</code> - Botón amarillo de advertencia</p>
          <p><code>.btn-danger</code> - Botón rojo de peligro</p>
          <p><code>.btn-outline</code> - Botón con borde</p>
        </div>
      </div>
    </div>
  );
};
