import React, { useState } from 'react';
import { Copy, Check, Play, Eye, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

interface EndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  security?: { type: string; description: string }[];
  parameters?: {
    name: string;
    in: 'header' | 'path' | 'query' | 'body';
    required: boolean;
    type: string;
    description: string;
    example?: any;
  }[];
  requestBody?: {
    required: boolean;
    contentType: string;
    schema: any;
    example: any;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      example: any;
    };
  };
}

const API_DOCS: EndpointDoc[] = [
  {
    method: 'POST',
    path: '/api/hotmart/process-purchase',
    summary: 'Procesar compra completa',
    description: 'Endpoint principal que crea un usuario (si no existe) y lo inscribe automáticamente en el curso. Maneja todo el flujo de compra de Hotmart.',
    tags: ['Hotmart', 'Usuarios', 'Inscripciones'],
    security: [
      { type: 'Bearer Token', description: 'Clave secreta de API en header Authorization' }
    ],
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['email', 'full_name', 'course_id'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email del usuario' },
          full_name: { type: 'string', description: 'Nombre completo del usuario' },
          phone: { type: 'string', description: 'Teléfono del usuario (opcional)' },
          course_id: { type: 'string', format: 'uuid', description: 'ID del curso a inscribir' },
          transaction_id: { type: 'string', description: 'ID de transacción de Hotmart (opcional)' },
          purchase_date: { type: 'string', format: 'date-time', description: 'Fecha de compra (opcional)' }
        }
      },
      example: {
        email: 'usuario@ejemplo.com',
        full_name: 'Juan Pérez López',
        phone: '+1234567890',
        course_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        transaction_id: 'HOTMART_TX_123456',
        purchase_date: '2025-01-15T10:30:00Z'
      }
    },
    responses: {
      '201': {
        description: 'Usuario procesado exitosamente',
        example: {
          success: true,
          data: {
            user: {
              id: 'user-uuid-here',
              email: 'usuario@ejemplo.com',
              full_name: 'Juan Pérez López',
              role: 'student'
            },
            enrollment: {
              id: 'enrollment-uuid-here',
              user_id: 'user-uuid-here',
              course_id: 'course-uuid-here',
              enrolled_at: '2025-01-15T10:30:00Z',
              progress_percentage: 0
            },
            is_new_user: true
          },
          message: 'Usuario creado e inscrito exitosamente'
        }
      },
      '400': {
        description: 'Error en los datos enviados',
        example: {
          error: 'Campos requeridos faltantes',
          missing_fields: ['email', 'course_id']
        }
      },
      '401': {
        description: 'No autorizado',
        example: {
          error: 'No autorizado'
        }
      },
      '500': {
        description: 'Error interno del servidor',
        example: {
          error: 'Error interno del servidor',
          message: 'Error específico del sistema'
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/hotmart/create-user',
    summary: 'Crear usuario únicamente',
    description: 'Crea un nuevo usuario en el sistema sin inscribirlo en ningún curso. Útil para procesos de dos pasos.',
    tags: ['Hotmart', 'Usuarios'],
    security: [
      { type: 'Bearer Token', description: 'Clave secreta de API en header Authorization' }
    ],
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['email', 'full_name'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email del usuario' },
          full_name: { type: 'string', description: 'Nombre completo del usuario' },
          phone: { type: 'string', description: 'Teléfono del usuario (opcional)' }
        }
      },
      example: {
        email: 'nuevo@usuario.com',
        full_name: 'María García',
        phone: '+1987654321'
      }
    },
    responses: {
      '201': {
        description: 'Usuario creado exitosamente',
        example: {
          success: true,
          user: {
            id: 'new-user-uuid',
            email: 'nuevo@usuario.com',
            full_name: 'María García',
            role: 'student'
          },
          message: 'Usuario creado exitosamente'
        }
      },
      '400': {
        description: 'Error en los datos',
        example: {
          error: 'Formato de email inválido'
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/hotmart/enroll-user',
    summary: 'Inscribir usuario en curso',
    description: 'Inscribe un usuario existente en un curso específico. El usuario debe existir previamente.',
    tags: ['Hotmart', 'Inscripciones'],
    security: [
      { type: 'Bearer Token', description: 'Clave secreta de API en header Authorization' }
    ],
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['user_id', 'course_id'],
        properties: {
          user_id: { type: 'string', format: 'uuid', description: 'ID del usuario a inscribir' },
          course_id: { type: 'string', format: 'uuid', description: 'ID del curso' }
        }
      },
      example: {
        user_id: 'existing-user-uuid',
        course_id: 'course-uuid-here'
      }
    },
    responses: {
      '201': {
        description: 'Usuario inscrito exitosamente',
        example: {
          success: true,
          enrollment: {
            id: 'enrollment-uuid',
            user_id: 'existing-user-uuid',
            course_id: 'course-uuid-here',
            enrolled_at: '2025-01-15T11:00:00Z',
            progress_percentage: 0
          },
          message: 'Usuario inscrito exitosamente'
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/courses/{course_id}/validate',
    summary: 'Validar curso',
    description: 'Verifica que un curso existe y está publicado antes de inscribir usuarios.',
    tags: ['Cursos', 'Validación'],
    parameters: [
      {
        name: 'course_id',
        in: 'path',
        required: true,
        type: 'string',
        description: 'ID del curso a validar',
        example: 'course-uuid-to-validate'
      }
    ],
    responses: {
      '200': {
        description: 'Curso válido y publicado',
        example: {
          success: true,
          course: {
            id: 'course-uuid-to-validate',
            title: 'Curso de Ejemplo',
            is_published: true
          }
        }
      },
      '404': {
        description: 'Curso no encontrado o no publicado',
        example: {
          error: 'Curso no encontrado o no publicado',
          course_id: 'invalid-course-id'
        }
      }
    }
  }
];

export const SwaggerDocs: React.FC = () => {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'POST': return 'bg-green-100 text-green-800 border-green-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    if (status.startsWith('2')) return 'text-green-600';
    if (status.startsWith('4')) return 'text-yellow-600';
    if (status.startsWith('5')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    if (status.startsWith('2')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status.startsWith('4')) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    if (status.startsWith('5')) return <XCircle className="h-4 w-4 text-red-600" />;
    return <Eye className="h-4 w-4 text-gray-600" />;
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 md:p-6 lg:p-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
        <p className="text-lg text-gray-600 mb-4">
          Documentación completa de la API de integración con Hotmart
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">Base URL:</span>
              <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-blue-800">
                {window.location.origin}
              </code>
            </div>
            <div>
              <span className="font-medium text-blue-700">Autenticación:</span>
              <span className="ml-2 text-blue-800">Bearer Token</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">Content-Type:</span>
              <span className="ml-2 text-blue-800">application/json</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">Versión:</span>
              <span className="ml-2 text-blue-800">1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {API_DOCS.map((endpoint, index) => {
          const endpointId = `${endpoint.method}-${endpoint.path}`;
          const isExpanded = expandedEndpoint === endpointId;

          return (
            <Card key={endpointId} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer border-b-0 pb-4"
                onClick={() => setExpandedEndpoint(isExpanded ? null : endpointId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <span className={`px-3 py-1 rounded-md text-sm font-medium border ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {endpoint.path}
                    </code>
                    <span className="text-gray-900 font-semibold">{endpoint.summary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {endpoint.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">{endpoint.description}</p>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t bg-gray-50 p-6 space-y-6">
                  {/* Security */}
                  {endpoint.security && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Autenticación</h4>
                      <div className="space-y-2">
                        {endpoint.security.map((sec, idx) => (
                          <div key={idx} className="bg-white border rounded-lg p-3">
                            <span className="font-medium text-sm">{sec.type}:</span>
                            <span className="text-sm text-gray-600 ml-2">{sec.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parameters */}
                  {endpoint.parameters && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Parámetros</h4>
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Ubicación</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Tipo</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Requerido</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Descripción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.parameters.map((param, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-mono text-blue-600">{param.name}</td>
                                <td className="px-4 py-2">
                                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">{param.in}</span>
                                </td>
                                <td className="px-4 py-2 font-mono text-sm">{param.type}</td>
                                <td className="px-4 py-2">
                                  {param.required ? (
                                    <span className="text-red-600 text-xs">●</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">○</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-gray-600">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Cuerpo de la Petición</h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium">Content-Type:</span>
                          <code className="bg-white px-2 py-1 rounded border">{endpoint.requestBody.contentType}</code>
                          <span className="font-medium">Requerido:</span>
                          <span className={endpoint.requestBody.required ? 'text-red-600' : 'text-gray-600'}>
                            {endpoint.requestBody.required ? 'Sí' : 'No'}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Ejemplo:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(formatJson(endpoint.requestBody!.example), `request-${endpointId}`)}
                            >
                              {copiedText === `request-${endpointId}` ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-green-400 text-sm">
                              {formatJson(endpoint.requestBody.example)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Responses */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Respuestas</h4>
                    <div className="space-y-4">
                      {Object.entries(endpoint.responses).map(([status, response]) => (
                        <div key={status} className="bg-white border rounded-lg">
                          <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(status)}
                              <span className={`font-mono text-sm font-semibold ${getStatusColor(status)}`}>
                                {status}
                              </span>
                              <span className="text-gray-700">{response.description}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(formatJson(response.example), `response-${endpointId}-${status}`)}
                            >
                              {copiedText === `response-${endpointId}-${status}` ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="p-4">
                            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                              <pre className="text-green-400 text-sm">
                                {formatJson(response.example)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};