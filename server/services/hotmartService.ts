import supabase from '../lib/supabase.js';
import { User, Enrollment } from '../types/database.js';

// Interfaz para los datos que llegaran desde Hotmart
export interface HotmartPurchaseData {
  email: string;
  full_name: string;
  phone?: string;
  course_id: string;
  transaction_id: string;
  purchase_date: string;
}

// Servicio para manejar la creación automática de usuarios y inscripciones
export class HotmartService {
  
  /**
   * Crea un usuario automáticamente cuando se recibe una compra de Hotmart
   */
  static async createUserFromPurchase(purchaseData: HotmartPurchaseData): Promise<User> {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', purchaseData.email)
        .single();

      if (existingUser) {
        return existingUser;
      }

      // Crear nuevo usuario
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: purchaseData.email,
          full_name: purchaseData.full_name,
          phone: purchaseData.phone,
          role: 'student',
          password: purchaseData.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creando usuario: ${error.message}`);
      }

      // Enviar email con credenciales (implementar según tu sistema de emails)
      await this.sendWelcomeEmail(newUser);

      return newUser;
    } catch (error) {
      console.error('Error en createUserFromPurchase:', error);
      throw error;
    }
  }

  /**
   * Inscribe automáticamente al usuario en el curso comprado
   */
  static async enrollUserInCourse(userId: string, courseId: string): Promise<Enrollment> {
    return this.enrollUserInCourseWithTransaction(userId, courseId);
  }

  /**
   * Inscribe automáticamente al usuario en el curso comprado con transaction_id
   */
  static async enrollUserInCourseWithTransaction(userId: string, courseId: string, transactionId?: string): Promise<Enrollment> {
    try {
      // Verificar si ya está inscrito
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (existingEnrollment) {
        return existingEnrollment;
      }

      // Crear inscripción
      const { data: enrollment, error } = await supabase
        .from('enrollments')
        .insert([{
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0,
          last_accessed_at: null,
          transaction_id: transactionId || null
        }])
        .select(`
          *,
          course:courses(*),
          user:users(*)
        `)
        .single();

      if (error) {
        // Si es error de restricción única (condición de carrera), 
        // buscar y devolver la inscripción existente
        if (error.code === '23505' || error.message.includes('unique_user_course_enrollment')) {
          console.log(`Condición de carrera detectada para usuario ${userId} en curso ${courseId}. Buscando inscripción existente...`);
          
          const { data: existingEnrollment, error: fetchError } = await supabase
            .from('enrollments')
            .select(`
              *,
              course:courses(*),
              user:users(*)
            `)
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();

          if (fetchError || !existingEnrollment) {
            throw new Error(`Error fatal: No se pudo crear ni encontrar inscripción para usuario ${userId} en curso ${courseId}`);
          }

          return existingEnrollment;
        }
        
        // Para otros errores, lanzar excepción
        throw new Error(`Error inscribiendo usuario: ${error.message}`);
      }

      return enrollment;
    } catch (error) {
      console.error('Error en enrollUserInCourse:', error);
      throw error;
    }
  }

  /**
   * Procesa completamente una compra de Hotmart
   */
  static async processPurchase(purchaseData: HotmartPurchaseData): Promise<{
    user: User;
    enrollment: Enrollment;
    isNewUser: boolean;
    isNewEnrollment: boolean;
    transactionAlreadyProcessed: boolean;
  }> {
    try {
      // 1. Verificar si esta transacción ya fue procesada
      const { data: existingTransaction } = await supabase
        .from('enrollments')
        .select('*, user:users(*)')
        .eq('transaction_id', purchaseData.transaction_id)
        .single();

      if (existingTransaction) {
        console.log(`Transacción ${purchaseData.transaction_id} ya fue procesada anteriormente`);
        return {
          user: existingTransaction.user!,
          enrollment: existingTransaction,
          isNewUser: false,
          isNewEnrollment: false,
          transactionAlreadyProcessed: true
        };
      }

      // 2. Verificar si el usuario ya existía
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', purchaseData.email)
        .single();

      const isNewUser = !existingUser;

      // 3. Crear o obtener usuario
      const user = await this.createUserFromPurchase(purchaseData);

      // 4. Verificar si ya está inscrito en este curso
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', purchaseData.course_id)
        .single();

      let enrollment: Enrollment;
      let isNewEnrollment = true;

      if (existingEnrollment) {
        // Ya está inscrito, actualizar con transaction_id
        const { data: updatedEnrollment, error } = await supabase
          .from('enrollments')
          .update({ 
            transaction_id: purchaseData.transaction_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEnrollment.id)
          .select()
          .single();

        if (error) throw new Error(`Error actualizando inscripción: ${error.message}`);
        
        enrollment = updatedEnrollment;
        isNewEnrollment = false;
        console.log(`Usuario ${user.email} ya estaba inscrito en curso ${purchaseData.course_id}`);
      } else {
        // Crear nueva inscripción con transaction_id
        enrollment = await this.enrollUserInCourseWithTransaction(user.id, purchaseData.course_id, purchaseData.transaction_id);
        isNewEnrollment = true;
      }

      return {
        user,
        enrollment,
        isNewUser,
        isNewEnrollment,
        transactionAlreadyProcessed: false
      };
    } catch (error) {
      console.error('Error procesando compra de Hotmart:', error);
      throw error;
    }
  }

  /**
   * Genera una contraseña temporal segura
   */
  private static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Envía email de bienvenida con credenciales
   * NOTA: Implementar según tu sistema de emails preferido
   */
  private static async sendWelcomeEmail(user: User): Promise<void> {
    try {
      // TODO: Implementar envío de email
      // Puedes usar servicios como SendGrid, Mailgun, etc.
      console.log(`Email de bienvenida enviado a: ${user.email}`);
      
      // Ejemplo de estructura del email:
      const emailContent = {
        to: user.email,
        subject: 'Bienvenido a tu curso - Acceso creado',
        html: `
          <h1>¡Bienvenido ${user.full_name}!</h1>
          <p>Tu acceso al curso ha sido creado exitosamente.</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Contraseña temporal:</strong> [IMPLEMENTAR ENVÍO SEGURO]</p>
          <p>Por favor, cambia tu contraseña después del primer acceso.</p>
          <a href="${process.env.VITE_APP_URL}/login">Acceder al curso</a>
        `
      };
      
      // Aquí implementarías el envío real del email
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      // No lanzar error aquí para no bloquear el proceso principal
    }
  }
}
