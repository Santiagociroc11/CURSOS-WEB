import { HotmartService, HotmartPurchaseData } from './hotmartService';

// Clave API para validar requests desde tu backend
const API_SECRET_KEY = process.env.VITE_HOTMART_API_SECRET || 'tu-clave-secreta-aqui';

/**
 * Endpoint para crear usuario desde compra de Hotmart
 * POST /api/hotmart/create-user
 */
export async function createUserEndpoint(request: Request): Promise<Response> {
  try {
    // Validar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar método
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }), 
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del body
    const purchaseData: HotmartPurchaseData = await request.json();

    // Validar datos requeridos
    const requiredFields = ['email', 'full_name', 'course_id'];
    const missingFields = requiredFields.filter(field => !purchaseData[field as keyof HotmartPurchaseData]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Campos requeridos faltantes', 
          missing_fields: missingFields 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(purchaseData.email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear usuario
    const user = await HotmartService.createUserFromPurchase(purchaseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        message: 'Usuario creado exitosamente'
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en createUserEndpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Endpoint para inscribir usuario en curso
 * POST /api/hotmart/enroll-user
 */
export async function enrollUserEndpoint(request: Request): Promise<Response> {
  try {
    // Validar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar método
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }), 
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del body
    const { user_id, course_id } = await request.json();

    // Validar datos requeridos
    if (!user_id || !course_id) {
      return new Response(
        JSON.stringify({ 
          error: 'user_id y course_id son requeridos' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inscribir usuario
    const enrollment = await HotmartService.enrollUserInCourse(user_id, course_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enrollment: {
          id: enrollment.id,
          user_id: enrollment.user_id,
          course_id: enrollment.course_id,
          enrolled_at: enrollment.enrolled_at,
          progress_percentage: enrollment.progress_percentage
        },
        message: 'Usuario inscrito exitosamente'
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en enrollUserEndpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Endpoint para procesar compra completa (crear usuario + inscribir)
 * POST /api/hotmart/process-purchase
 */
export async function processPurchaseEndpoint(request: Request): Promise<Response> {
  try {
    // Validar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar método
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }), 
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del body
    const purchaseData: HotmartPurchaseData = await request.json();

    // Validar datos requeridos
    const requiredFields = ['email', 'full_name', 'course_id'];
    const missingFields = requiredFields.filter(field => !purchaseData[field as keyof HotmartPurchaseData]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Campos requeridos faltantes', 
          missing_fields: missingFields 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(purchaseData.email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Procesar compra completa
    const result = await HotmartService.processPurchase(purchaseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            full_name: result.user.full_name,
            role: result.user.role
          },
          enrollment: {
            id: result.enrollment.id,
            user_id: result.enrollment.user_id,
            course_id: result.enrollment.course_id,
            enrolled_at: result.enrollment.enrolled_at,
            progress_percentage: result.enrollment.progress_percentage
          },
          is_new_user: result.isNewUser
        },
        message: `Usuario ${result.isNewUser ? 'creado' : 'encontrado'} e inscrito exitosamente`
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en processPurchaseEndpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Endpoint para validar que un curso existe
 * GET /api/courses/:courseId/validate
 */
export async function validateCourseEndpoint(request: Request, courseId: string): Promise<Response> {
  try {
    const url = new URL(request.url);
    const courseIdFromPath = url.pathname.split('/').slice(-2, -1)[0];
    
    const { supabase } = await import('../lib/supabase');
    
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, is_published')
      .eq('id', courseIdFromPath)
      .eq('is_published', true)
      .single();

    if (error || !course) {
      return new Response(
        JSON.stringify({ 
          error: 'Curso no encontrado o no publicado',
          course_id: courseIdFromPath
        }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        course: {
          id: course.id,
          title: course.title,
          is_published: course.is_published
        }
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en validateCourseEndpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}