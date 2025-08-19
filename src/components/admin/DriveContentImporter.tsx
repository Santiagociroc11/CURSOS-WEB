import React, { useState } from 'react';
import { Upload, FileText, Video, Download, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import supabase from '../../lib/supabase';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

interface DriveFolder {
  files: DriveFile[];
}

interface ParsedContent {
  title: string;
  type: 'video' | 'document' | 'text';
  content_url: string;
  order_index: number;
  duration_minutes: number;
  originalFile: DriveFile;
}

interface DriveContentImporterProps {
  moduleId: string;
  onContentAdded: () => void;
}

export const DriveContentImporter: React.FC<DriveContentImporterProps> = ({ 
  moduleId, 
  onContentAdded 
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedContent, setParsedContent] = useState<ParsedContent[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importResults, setImportResults] = useState<{success: number, failed: number}>({success: 0, failed: 0});

  // Función para detectar el tipo de contenido basado en el nombre y mimeType
  const detectContentType = (file: DriveFile): 'video' | 'document' | 'text' => {
    const { name, mimeType } = file;
    
    // Videos
    if (mimeType.startsWith('video/') || name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i)) {
      return 'video';
    }
    
    // PDFs y documentos
    if (mimeType.includes('pdf') || mimeType.includes('document') || 
        name.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/i)) {
      return 'document';
    }
    
    // Por defecto texto/enlace
    return 'text';
  };

  // Función para limpiar y extraer el título del nombre del archivo
  const extractTitle = (fileName: string): string => {
    // Remover extensión
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Limpiar prefijos comunes como "CLASE 1 -", "BONO -", etc.
    const cleaned = nameWithoutExt
      .replace(/^(CLASE\s+\d+\s*-\s*)/i, '')
      .replace(/^(BONO\s*-\s*)/i, '')
      .replace(/^(VIDEO\s+\d+\s*-\s*)/i, '')
      .replace(/^(LECCION\s+\d+\s*-\s*)/i, '')
      .trim();
    
    return cleaned || nameWithoutExt;
  };

  // Función para extraer el número de orden del nombre del archivo
  const extractOrder = (fileName: string): number => {
    const match = fileName.match(/CLASE\s+(\d+)/i) || fileName.match(/VIDEO\s+(\d+)/i) || fileName.match(/LECCION\s+(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  // Función para convertir URL de Drive a formato embedible
  const convertDriveUrl = (webViewLink: string): string => {
    const fileIdMatch = webViewLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return webViewLink;
  };

  // Parsear el JSON de Google Drive
  const parseJsonContent = () => {
    try {
      const data = JSON.parse(jsonInput) as DriveFolder[];
      const allFiles: DriveFile[] = [];
      
      // Extraer todos los archivos de todas las carpetas
      data.forEach(folder => {
        if (folder.files) {
          allFiles.push(...folder.files);
        }
      });

      // Convertir archivos a contenido
      const content: ParsedContent[] = allFiles.map(file => ({
        title: extractTitle(file.name),
        type: detectContentType(file),
        content_url: convertDriveUrl(file.webViewLink),
        order_index: extractOrder(file.name),
        duration_minutes: 0, // Por defecto, se puede editar después
        originalFile: file
      }));

      // Ordenar por order_index
      content.sort((a, b) => a.order_index - b.order_index);

      setParsedContent(content);
      setShowPreview(true);
    } catch (error) {
      alert('Error al parsear el JSON. Verifica que el formato sea correcto.');
      console.error('JSON Parse Error:', error);
    }
  };

  // Actualizar un elemento del contenido parseado
  const updateParsedContent = (index: number, field: keyof ParsedContent, value: any) => {
    const updated = [...parsedContent];
    updated[index] = { ...updated[index], [field]: value };
    setParsedContent(updated);
  };

  // Importar contenido a la base de datos
  const importContent = async () => {
    setIsImporting(true);
    let success = 0;
    let failed = 0;

    try {
      for (const content of parsedContent) {
        try {
          const { error } = await supabase
            .from('content')
            .insert([{
              module_id: moduleId,
              title: content.title,
              type: content.type,
              content_url: content.content_url,
              order_index: content.order_index,
              duration_minutes: content.duration_minutes
            }]);

          if (error) throw error;
          success++;
        } catch (error) {
          console.error(`Error importing ${content.title}:`, error);
          failed++;
        }
      }

      setImportResults({ success, failed });
      
      if (success > 0) {
        onContentAdded(); // Refrescar la lista de contenido
        setTimeout(() => {
          setShowPreview(false);
          setParsedContent([]);
          setJsonInput('');
        }, 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Vista previa del contenido ({parsedContent.length} elementos)</h3>
          <Button
            variant="ghost"
            onClick={() => setShowPreview(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
          {parsedContent.map((content, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {getContentIcon(content.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <Input
                  value={content.title}
                  onChange={(e) => updateParsedContent(index, 'title', e.target.value)}
                  className="font-medium"
                  placeholder="Título del contenido"
                />
              </div>

              <select
                value={content.type}
                onChange={(e) => updateParsedContent(index, 'type', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="video">Video</option>
                <option value="document">Documento</option>
                <option value="text">Texto/Enlace</option>
              </select>

              <Input
                type="number"
                value={content.order_index}
                onChange={(e) => updateParsedContent(index, 'order_index', parseInt(e.target.value) || 0)}
                className="w-20"
                placeholder="Orden"
              />

              <Input
                type="number"
                value={content.duration_minutes}
                onChange={(e) => updateParsedContent(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                className="w-20"
                placeholder="Min"
              />
            </div>
          ))}
        </div>

        {importResults.success > 0 || importResults.failed > 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <Check className="h-5 w-5" />
              <span>{importResults.success} elementos importados exitosamente</span>
            </div>
            {importResults.failed > 0 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{importResults.failed} elementos fallaron</span>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={importContent}
            disabled={isImporting || parsedContent.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isImporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Importando...
              </div>
            ) : (
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Importar {parsedContent.length} elementos
              </div>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Importar contenido desde Google Drive
        </h3>
        <p className="text-gray-600 mb-4">
          Pega el JSON obtenido de la API de Google Drive para importar múltiples archivos automáticamente
        </p>
        
        <div className="space-y-4">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Pega aquí tu JSON de Google Drive...'
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm font-mono"
          />
          
          <Button
            onClick={parseJsonContent}
            disabled={!jsonInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Procesar JSON
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Ejemplo de JSON esperado:</h4>
        <pre className="text-xs text-blue-800 bg-white p-2 rounded border overflow-x-auto">
{`[{
  "files": [
    {
      "id": "1AoSsLRs4u3L-SXsdGWaJz8Iw_PJ-oPBG",
      "name": "CLASE 1 - Introducción.mp4",
      "mimeType": "video/mp4",
      "webViewLink": "https://drive.google.com/file/d/1AoSsLRs4u3L-SXsdGWaJz8Iw_PJ-oPBG/view?usp=drivesdk"
    }
  ]
}]`}
        </pre>
      </div>
    </div>
  );
};