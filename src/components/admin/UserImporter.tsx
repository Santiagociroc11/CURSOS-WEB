import React, { useState } from 'react';
import { Upload, Users, AlertCircle, Check, X, Download, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import supabase from '../../lib/supabase';

interface UserData {
  email: string;
  full_name: string;
  password?: string;
  phone?: string;
  role?: 'student' | 'instructor' | 'admin';
}

interface ParsedUser extends UserData {
  order_index: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  error_message?: string;
}

interface Course {
  id: string;
  title: string;
}

interface UserImporterProps {
  onUsersImported: () => void;
}

export const UserImporter: React.FC<UserImporterProps> = ({ onUsersImported }) => {
  const [csvInput, setCsvInput] = useState('');
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    enrolled: number;
    existing: number;
  }>({ total: 0, success: 0, failed: 0, enrolled: 0, existing: 0 });
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string>('');

  React.useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title');
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Parsear CSV de usuarios
  const parseCSV = () => {
    try {
      const lines = csvInput.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Verificar headers requeridos
      const requiredHeaders = ['email', 'full_name'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        alert(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
        return;
      }

      const users: ParsedUser[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) continue;
        
        const emailValue = values[headers.indexOf('email')] || '';
        const user: ParsedUser = {
          email: emailValue,
          full_name: values[headers.indexOf('full_name')] || '',
          password: values[headers.indexOf('password')] || generateRandomPassword(emailValue),
          phone: values[headers.indexOf('phone')] || '',
          role: (values[headers.indexOf('role')] as any) || 'student',
          order_index: i,
          status: 'pending'
        };

        // Validar email
        if (!isValidEmail(user.email)) {
          user.status = 'error';
          user.error_message = 'Email inválido';
        }

        users.push(user);
      }

      setParsedUsers(users);
      setShowPreview(true);
    } catch (error) {
      alert('Error al parsear CSV. Verifica el formato.');
      console.error('CSV Parse Error:', error);
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const generateRandomPassword = (email: string): string => {
    // Usar el email como contraseña por defecto
    return email;
  };

  // Importar usuarios masivamente
  const importUsers = async () => {
    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;
    let enrolledCount = 0;
    let existingUsersCount = 0;

    try {
      for (let i = 0; i < parsedUsers.length; i++) {
        const user = parsedUsers[i];
        setCurrentlyProcessing(`Procesando ${user.email}...`);
        
        // Actualizar estado del usuario a "processing"
        setParsedUsers(prev => prev.map(u => 
          u.order_index === user.order_index 
            ? { ...u, status: 'processing' } 
            : u
        ));

        try {
          // 1. Verificar si el usuario ya existe
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          let userId: string;

          if (existingUser) {
            // Usuario ya existe, usar su ID
            userId = existingUser.id;
            existingUsersCount++;
            
            // Actualizar estado para mostrar que ya existía
            setParsedUsers(prev => prev.map(u => 
              u.order_index === user.order_index 
                ? { ...u, error_message: 'Usuario ya existía' } 
                : u
            ));
          } else {
            // 2. Crear nuevo usuario
            const { data: userData, error: userError } = await supabase
              .from('users')
              .insert([{
                email: user.email,
                full_name: user.full_name,
                password: user.password, // Contraseña en texto plano
                phone: user.phone || '',
                role: user.role || 'student',
                created_at: new Date().toISOString()
              }])
              .select()
              .single();

            if (userError) throw userError;
            userId = userData.id;
          }

          // 3. Enrollar en curso si está seleccionado
          if (selectedCourse && userId) {
            // Verificar si ya está enrollado
            const { data: existingEnrollment } = await supabase
              .from('enrollments')
              .select('id')
              .eq('user_id', userId)
              .eq('course_id', selectedCourse)
              .single();

            if (!existingEnrollment) {
              const { error: enrollError } = await supabase
                .from('enrollments')
                .insert([{
                  user_id: userId,
                  course_id: selectedCourse,
                  enrolled_at: new Date().toISOString()
                }]);

              if (enrollError) throw enrollError;
              enrolledCount++;
            } else {
              // Ya estaba enrollado
              setParsedUsers(prev => prev.map(u => 
                u.order_index === user.order_index 
                  ? { ...u, error_message: (u.error_message || '') + ' (Ya enrollado)' } 
                  : u
              ));
            }
          }

          // Marcar como exitoso
          setParsedUsers(prev => prev.map(u => 
            u.order_index === user.order_index 
              ? { ...u, status: 'success' } 
              : u
          ));
          
          successCount++;
        } catch (error: any) {
          console.error(`Error importing user ${user.email}:`, error);
          
          // Marcar como error
          setParsedUsers(prev => prev.map(u => 
            u.order_index === user.order_index 
              ? { ...u, status: 'error', error_message: error.message } 
              : u
          ));
          
          failedCount++;
        }

        // Pequeña pausa para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({
        total: parsedUsers.length,
        success: successCount,
        failed: failedCount,
        enrolled: enrolledCount,
        existing: existingUsersCount
      });

      if (successCount > 0) {
        onUsersImported();
      }

    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      setCurrentlyProcessing('');
    }
  };

  const downloadTemplate = () => {
    const template = "email,full_name,password,phone,role\nexample@email.com,Juan Pérez,,+1234567890,student\nuser2@email.com,María García,nuevapass,+0987654321,student\ninstructor@email.com,Carlos López,,+1122334455,instructor";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_usuarios.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Check className="h-4 w-4 text-green-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      case 'processing': return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Vista previa de usuarios ({parsedUsers.length} usuarios)</h3>
          <Button variant="ghost" onClick={() => setShowPreview(false)}>
            <X className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </div>

        {/* Selección de curso */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Curso para enrollment automático (opcional)
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin enrollment automático</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              {selectedCourse && (
                <p className="text-sm text-blue-600">
                  ✓ Los usuarios serán enrollados automáticamente en este curso
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progreso de importación */}
        {isImporting && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                  <span className="font-medium">Importando usuarios...</span>
                </div>
                <p className="text-sm text-gray-600">{currentlyProcessing}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(parsedUsers.filter(u => u.status !== 'pending').length / parsedUsers.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {importResults.total > 0 && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Resultados de la importación</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-gray-600">Procesados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{importResults.existing}</div>
                  <div className="text-sm text-gray-600">Ya Existían</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{importResults.enrolled}</div>
                  <div className="text-sm text-gray-600">Enrollados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-gray-600">Errores</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de usuarios */}
        <Card>
          <CardContent className="p-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {parsedUsers.map((user, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(user.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>

                  <div className="text-sm text-gray-500 capitalize">
                    {user.role || 'student'}
                  </div>

                  {user.error_message && (
                    <div className="text-xs text-red-600 max-w-32 truncate" title={user.error_message}>
                      {user.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botón de importación */}
        {importResults.total === 0 && (
          <Button
            onClick={importUsers}
            disabled={isImporting || parsedUsers.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isImporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Importando {parsedUsers.length} usuarios...
              </div>
            ) : (
              <div className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Importar {parsedUsers.length} usuarios
                {selectedCourse && ' y enrollar en curso'}
              </div>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Importar usuarios masivamente
        </h3>
        <p className="text-gray-600 mb-4">
          Importa hasta 1000 usuarios desde un archivo CSV y enróllalos automáticamente en un curso
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip para usuarios existentes:</strong> Si importas usuarios que ya existen, 
            solo serán enrollados al curso seleccionado (no se crearán duplicados).
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla CSV
            </Button>
          </div>

          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder="Pega aquí tu CSV con formato: email,full_name,password,phone,role"
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm font-mono"
          />
          
          <Button
            onClick={parseCSV}
            disabled={!csvInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Formato CSV esperado:</h4>
        <pre className="text-xs text-blue-800 bg-white p-3 rounded border overflow-x-auto">
{`email,full_name,password,phone,role
usuario1@email.com,Juan Pérez,,+1234567890,student
usuario2@email.com,María García,nuevapass,+0987654321,student
instructor@email.com,Carlos López,,+1122334455,instructor`}
        </pre>
        <div className="mt-3 text-sm text-blue-700">
          <p><strong>Columnas requeridas:</strong> email, full_name</p>
          <p><strong>Columnas opcionales:</strong> password (si está vacío, usa el email como contraseña), phone, role (default: student)</p>
          <p><strong>💡 Tip:</strong> Si dejas la contraseña vacía, el usuario podrá iniciar sesión con su email como contraseña.</p>
        </div>
      </div>
    </div>
  );
};