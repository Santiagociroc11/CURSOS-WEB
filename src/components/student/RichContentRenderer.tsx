import React, { useEffect, useRef } from 'react';
import { ShortcodeProcessor } from '../../utils/shortcodes';

interface RichContentRendererProps {
  htmlContent: string;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ htmlContent }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Buscar todos los botones en el contenido renderizado
      const buttons = contentRef.current.querySelectorAll('button[data-action]');
      
      buttons.forEach((button) => {
        const action = button.getAttribute('data-action');
        const url = button.getAttribute('data-url');
        
        // Remover event listeners anteriores
        button.replaceWith(button.cloneNode(true));
        const newButton = contentRef.current?.querySelector(`button[data-action="${action}"][data-url="${url}"]`);
        
        if (newButton && url) {
          newButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            switch (action) {
              case 'open-link':
                window.open(url, '_blank', 'noopener,noreferrer');
                break;
              case 'download':
                const link = document.createElement('a');
                link.href = url;
                link.download = '';
                link.target = '_blank';
                link.click();
                break;
              case 'alert':
                alert(url); // En este caso, url sería el mensaje
                break;
              default:
                console.log('Acción no reconocida:', action);
            }
          });
        }
      });

      // También manejar enlaces normales para que se abran en nueva pestaña
      const links = contentRef.current.querySelectorAll('a[href]');
      links.forEach((link) => {
        if (!link.getAttribute('target')) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }
  }, [htmlContent]);

  // Procesar shortcodes y HTML
  const processedHtml = (() => {
    // Primero procesar shortcodes
    let content = ShortcodeProcessor.process(htmlContent);
    
    // Luego procesar HTML legacy (onclick handlers)
    content = content
      .replace(/onclick="window\.open\('([^']+)'[^"]*"/g, 'data-action="open-link" data-url="$1"')
      .replace(/onclick="alert\('([^']+)'\)"/g, 'data-action="alert" data-url="$1"')
      .replace(/onclick="([^"]*download[^"]*)"/g, 'data-action="download" data-url="$1"');
    
    return content;
  })();

  return (
    <div className="rich-content-container">
      <div 
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
        className="rich-content-text"
      />
    </div>
  );
};
