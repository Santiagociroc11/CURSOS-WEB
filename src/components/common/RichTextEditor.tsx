import React, { useMemo, useRef, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import { ButtonConfigModal } from '../admin/ButtonConfigModal';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  error?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe tu contenido aquí...",
  height = 200,
  error,
  disabled = false
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ 'align': [] }],
        ['interactive-button'], // Botón personalizado
        ['clean']
      ],
      handlers: {
        'interactive-button': () => {
          setIsButtonModalOpen(true);
        }
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'code-block'
  ];

  // Registrar el botón personalizado en la toolbar
  useEffect(() => {
    const Quill = require('quill');
    
    // Agregar el botón personalizado a la toolbar
    const Icons = Quill.import('ui/icons');
    Icons['interactive-button'] = `
      <svg viewBox="0 0 24 24" width="18" height="18">
        <rect x="2" y="8" width="20" height="8" rx="2" ry="2" fill="currentColor" opacity="0.8"/>
        <rect x="4" y="10" width="16" height="4" rx="1" ry="1" fill="white"/>
        <circle cx="18" cy="12" r="1" fill="currentColor"/>
      </svg>
    `;
    
    // Agregar estilos para el botón
    const style = document.createElement('style');
    style.textContent = `
      .ql-toolbar .ql-interactive-button {
        position: relative;
      }
      .ql-toolbar .ql-interactive-button:hover::after {
        content: 'Botón Interactivo';
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleInsertButton = (shortcode: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      
      // Insertar el shortcode en la posición actual
      quill.insertText(index, '\n' + shortcode + '\n');
      quill.setSelection(index + shortcode.length + 2);
    }
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{ 
          height: `${height}px`,
          marginBottom: '42px' // Space for toolbar
        }}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Modal para configurar botones */}
      <ButtonConfigModal
        isOpen={isButtonModalOpen}
        onClose={() => setIsButtonModalOpen(false)}
        onInsert={handleInsertButton}
      />
      
      <style jsx global>{`
        .rich-text-editor .ql-editor {
          min-height: ${height - 60}px;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .rich-text-editor .ql-toolbar {
          border: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
        }
        
        .rich-text-editor .ql-container {
          border: 1px solid #d1d5db;
          border-radius: 0 0 6px 6px;
        }
        
        .rich-text-editor .ql-toolbar .ql-formats {
          margin-right: 15px;
        }
        
        .rich-text-editor .ql-toolbar button {
          width: 28px;
          height: 28px;
        }
        
        .rich-text-editor .ql-toolbar button:hover {
          color: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active {
          color: #3b82f6;
          background-color: #dbeafe;
        }
        
        /* Dark mode styles for student view */
        .dark .rich-text-editor .ql-toolbar {
          border-color: #374151;
          background-color: #1f2937;
        }
        
        .dark .rich-text-editor .ql-container {
          border-color: #374151;
          background-color: #1f2937;
        }
        
        .dark .rich-text-editor .ql-editor {
          color: #f9fafb;
        }
        
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        
        .dark .rich-text-editor .ql-toolbar button {
          color: #d1d5db;
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover {
          color: #60a5fa;
        }
        
        .dark .rich-text-editor .ql-toolbar button.ql-active {
          color: #60a5fa;
          background-color: #1e40af;
        }
      `}</style>
    </div>
  );
};
