import express from 'express';
import { HotmartService, HotmartPurchaseData } from '../services/hotmartService.js';
import supabase from '../lib/supabase.js';

const router = express.Router();

// Clave API para validar requests desde tu backend
const API_SECRET_KEY = process.env.VITE_HOTMART_API_SECRET || 'tu-clave-secreta-aqui';

// Middleware para validar autenticación
const validateAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  next();
};

// Middleware para validar datos requeridos de Hotmart
const validatePurchaseData = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const purchaseData: HotmartPurchaseData = req.body;
  
  // Validar datos requeridos
  const requiredFields = ['email', 'full_name', 'course_id'];
  const missingFields = requiredFields.filter(field => !purchaseData[field as keyof HotmartPurchaseData]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Campos requeridos faltantes', 
      missing_fields: missingFields 
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(purchaseData.email)) {
    return res.status(400).json({ error: 'Formato de email inválido' });
  }

  next();
};

/**
 * POST /api/hotmart/process-purchase
 * Procesar compra completa (crear usuario + inscribir)
 */
router.post('/process-purchase', validateAuth, validatePurchaseData, async (req: express.Request, res: express.Response) => {
  try {
    const purchaseData: HotmartPurchaseData = req.body;
    
    // Procesar compra completa
    const result = await HotmartService.processPurchase(purchaseData);

    const statusCode = result.transactionAlreadyProcessed ? 200 : 201;
    const message = result.transactionAlreadyProcessed 
      ? 'Transacción ya procesada anteriormente'
      : result.isNewUser && result.isNewEnrollment 
        ? 'Usuario creado e inscrito exitosamente'
        : !result.isNewUser && result.isNewEnrollment
          ? 'Usuario existente inscrito exitosamente'
          : 'Usuario existente ya estaba inscrito - transacción registrada';

    res.status(statusCode).json({ 
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
          progress_percentage: result.enrollment.progress_percentage,
          transaction_id: result.enrollment.transaction_id
        },
        is_new_user: result.isNewUser,
        is_new_enrollment: result.isNewEnrollment,
        transaction_already_processed: result.transactionAlreadyProcessed
      },
      message
    });

  } catch (error) {
    console.error('Error en process-purchase:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/hotmart/create-user
 * Crear usuario desde compra de Hotmart
 */
router.post('/create-user', validateAuth, validatePurchaseData, async (req: express.Request, res: express.Response) => {
  try {
    const purchaseData: HotmartPurchaseData = req.body;
    
    // Crear usuario
    const user = await HotmartService.createUserFromPurchase(purchaseData);

    res.status(201).json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      message: 'Usuario creado exitosamente'
    });

  } catch (error) {
    console.error('Error en create-user:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/hotmart/enroll-user
 * Inscribir usuario en curso
 */
router.post('/enroll-user', validateAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { user_id, course_id } = req.body;

    // Validar datos requeridos
    if (!user_id || !course_id) {
      return res.status(400).json({ 
        error: 'user_id y course_id son requeridos' 
      });
    }

    // Inscribir usuario
    const enrollment = await HotmartService.enrollUserInCourse(user_id, course_id);

    res.status(201).json({ 
      success: true, 
      enrollment: {
        id: enrollment.id,
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        enrolled_at: enrollment.enrolled_at,
        progress_percentage: enrollment.progress_percentage
      },
      message: 'Usuario inscrito exitosamente'
    });

  } catch (error) {
    console.error('Error en enroll-user:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/courses/:courseId/validate
 * Validar que un curso existe y está publicado
 */
router.get('/courses/:courseId/validate', async (req: express.Request, res: express.Response) => {
  try {
    const { courseId } = req.params;
    
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, is_published')
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (error || !course) {
      return res.status(404).json({ 
        error: 'Curso no encontrado o no publicado',
        course_id: courseId
      });
    }

    res.json({ 
      success: true,
      course: {
        id: course.id,
        title: course.title,
        is_published: course.is_published
      }
    });

  } catch (error) {
    console.error('Error en validate course:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/hotmart/reset-password
 * Resetear contraseña de usuario (la asigna igual al email)
 */
router.post('/reset-password', async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;

    // Validar que el email esté presente
    if (!email) {
      return res.status(400).json({ 
        error: 'Email es requerido' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Verificar si el usuario existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No existe un usuario registrado con ese email'
      });
    }

    // Resetear contraseña al email del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: email,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Error actualizando contraseña: ${updateError.message}`);
    }

    res.json({ 
      success: true, 
      message: 'Contraseña restablecida exitosamente',
      data: {
        email: user.email,
        full_name: user.full_name,
        message: 'Tu contraseña ahora es tu email'
      }
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/hotmart/test
 * Endpoint de prueba para verificar que la API funciona
 */
router.get('/test', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Hotmart API funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/hotmart/process-purchase',
      'POST /api/hotmart/create-user', 
      'POST /api/hotmart/enroll-user',
      'POST /api/hotmart/reset-password',
      'GET /api/hotmart/courses/:courseId/validate'
    ]
  });
});

export default router;
