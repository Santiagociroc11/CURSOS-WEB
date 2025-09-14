import React from 'react';

export const TestButtonComponent: React.FC = () => {
  const testContent = `
    <h2>🧪 Prueba de Contenido Enriquecido</h2>
    <p>Este es un ejemplo de contenido con botones interactivos:</p>
    
    <div style="margin: 1rem 0;">
      <button onclick="window.open('https://google.com', '_blank')" class="btn-primary">
        🔗 Botón Primario - Google
      </button>
      <button onclick="alert('¡Hola desde el botón!')" class="btn-success">
        ✅ Botón de Éxito - Alert
      </button>
    </div>
    
    <p>También puedes agregar enlaces normales:</p>
    <ul>
      <li><a href="https://github.com" target="_blank">📚 GitHub</a></li>
      <li><a href="https://stackoverflow.com" target="_blank">💡 Stack Overflow</a></li>
    </ul>
    
    <blockquote>
      <p>"Este es un ejemplo de cita con formato especial."</p>
    </blockquote>
  `;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Vista Previa del Contenido:</h3>
      <div 
        dangerouslySetInnerHTML={{ __html: testContent }}
        style={{
          background: '#1f2937',
          color: '#d1d5db',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #374151'
        }}
      />
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Código HTML:</h4>
        <pre className="bg-gray-800 text-gray-300 p-3 rounded text-sm overflow-x-auto">
          <code>{testContent}</code>
        </pre>
      </div>
    </div>
  );
};
