import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
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
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'align': [] }],
      ['clean']
    ],
    clipboard: {
      // Toggle to add line breaks when pasting HTML
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

  return (
    <div className="rich-text-editor">
      <ReactQuill
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
