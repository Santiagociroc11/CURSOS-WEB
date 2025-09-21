import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertTriangle, Settings, ExternalLink, BookOpen, Code, Eye, EyeOff, FileText, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import supabase from '../../lib/supabase';
import { Course } from '../../types/database';
import { SwaggerDocs } from './SwaggerDocs';
import { QueueMonitor } from './QueueMonitor';

interface CourseWithId extends Course {
  enrollment_count?: number;
}

export const HotmartIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'docs' | 'monitor'>('config');
  const [courses, setCourses] = useState<CourseWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testData, setTestData] = useState({
    email: 'test@ejemplo.com',
    full_name: 'Usuario de Prueba',
    phone: '+123456789',
    course_id: ''
  });

  const API_ENDPOINT = `${window.location.origin}/api/hotmart/process-purchase`;
  const WEBHOOK_SECRET = 'tu-clave-secreta-aqui'; // En producción esto debería venir de .env

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;

      // Obtener conteo de inscripciones para cada curso
      const coursesWithEnrollments = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            enrollment_count: count || 0
          };
        })
      );

      setCourses(coursesWithEnrollments);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const testEndpoint = async () => {
    if (!testData.course_id) {
      alert('Por favor selecciona un curso para la prueba');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WEBHOOK_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Prueba exitosa!\n\nUsuario: ${result.data?.user?.email}\nCurso: ${courses.find(c => c.id === testData.course_id)?.title}\nNuevo usuario: ${result.data?.is_new_user ? 'Sí' : 'No'}`);
      } else {
        alert(`❌ Error en la prueba:\n${result.error}\n${result.message || ''}`);
      }
    } catch (error) {
      alert(`❌ Error de conexión:\n${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando configuración de Hotmart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integración con Hotmart</h1>
        <p className="text-gray-600 mb-6">
          Configura la integración automática para crear usuarios e inscripciones desde las compras de Hotmart
        </p>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'monitor'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Monitor de Cola</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'docs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Documentación API</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'docs' ? (
        <SwaggerDocs />
      ) : activeTab === 'monitor' ? (
        <QueueMonitor />
      ) : (
        <div className="space-y-8">

      {/* Configuration Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Configuración del Webhook</h3>
              <p className="text-sm text-gray-600">URL y credenciales para tu webhook en Hotmart</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Endpoint URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Endpoint (Configurar en Hotmart)
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm">
                  {API_ENDPOINT}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(API_ENDPOINT, 'endpoint')}
                  className="flex-shrink-0"
                >
                  {copiedId === 'endpoint' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Copia esta URL y configúrala en tu panel de Hotmart como URL de webhook
              </p>
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clave Secreta de API
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm">
                  {showApiKey ? WEBHOOK_SECRET : '•'.repeat(WEBHOOK_SECRET.length)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="flex-shrink-0"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(WEBHOOK_SECRET, 'secret')}
                  className="flex-shrink-0"
                >
                  {copiedId === 'secret' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Usa esta clave en el header Authorization: Bearer {showApiKey ? WEBHOOK_SECRET : '••••••••'}
              </p>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Importante - Seguridad</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    En producción, configura la variable de entorno <code className="bg-amber-100 px-1 py-0.5 rounded">VITE_HOTMART_API_SECRET</code> 
                    con una clave segura y no la expongas en el código frontend.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">IDs de Cursos Disponibles</h3>
              <p className="text-sm text-gray-600">Usa estos IDs para mapear productos de Hotmart con cursos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Categoría: {course.category}</span>
                        <span>Inscripciones: {course.enrollment_count}</span>
                        <span>Dificultad: {course.difficulty_level}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Course ID</p>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {course.id}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(course.id, course.id)}
                        className="flex-shrink-0"
                      >
                        {copiedId === course.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay cursos publicados</p>
              <p className="text-gray-400 text-xs mt-1">Publica algunos cursos para ver sus IDs aquí</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Code className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Probar Integración</h3>
              <p className="text-sm text-gray-600">Simula una compra de Hotmart para verificar que todo funciona</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email del usuario</label>
                <input
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={testData.full_name}
                  onChange={(e) => setTestData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={testData.phone}
                  onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                <select
                  value={testData.course_id}
                  onChange={(e) => setTestData(prev => ({ ...prev, course_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un curso</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={testEndpoint}
                disabled={!testData.course_id || !testData.email || !testData.full_name}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                🧪 Probar Integración
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Ejemplo de Payload para tu Backend</h3>
              <p className="text-sm text-gray-600">Formato de datos que debe enviar tu backend a nuestro endpoint</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`// POST ${API_ENDPOINT}
// Headers: Authorization: Bearer ${WEBHOOK_SECRET}

{
  "email": "usuario@ejemplo.com",
  "full_name": "Nombre Completo",
  "phone": "+123456789",           // Opcional
  "course_id": "uuid-del-curso",   // Usar IDs de arriba
  "transaction_id": "hotmart-tx",  // Opcional
  "purchase_date": "2025-01-01T00:00:00Z"  // Opcional
}

// Respuesta exitosa:
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "..." },
    "enrollment": { "id": "...", "course_id": "..." },
    "is_new_user": true
  }
}`}
            </pre>
          </div>
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Flujo recomendado:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Configura el webhook de Hotmart para apuntar a tu backend</li>
              <li>2. Tu backend recibe la compra y mapea product_id → course_id</li>
              <li>3. Tu backend llama a nuestro endpoint con los datos del usuario</li>
              <li>4. Nosotros creamos el usuario e inscripción automáticamente</li>
              <li>5. El usuario recibe email con credenciales de acceso</li>
            </ol>
          </div>
        </CardContent>
      </Card>
        </div>
      )}
    </div>
  );
};