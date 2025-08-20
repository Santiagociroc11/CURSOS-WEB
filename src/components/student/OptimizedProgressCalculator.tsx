import supabase from '../../lib/supabase';

interface ProgressData {
  enrollments: any[];
  allModules: any[];
  allContent: any[];
  allProgress: any[];
  allAssessments: any[];
  allAttempts: any[];
}

/**
 * Consulta optimizada que obtiene todos los datos necesarios 
 * para calcular el progreso de un usuario en UNA SOLA CONSULTA por tabla
 */
export const getOptimizedProgressData = async (userId: string): Promise<ProgressData> => {
  try {
    // 1. Obtener todas las inscripciones del usuario
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, course:courses(title, id, thumbnail_url)')
      .eq('user_id', userId);

    const courseIds = enrollments?.map(e => e.course_id) || [];
    
    if (courseIds.length === 0) {
      return {
        enrollments: [],
        allModules: [],
        allContent: [],
        allProgress: [],
        allAssessments: [],
        allAttempts: []
      };
    }

    // 2. Obtener TODOS los módulos de TODOS los cursos de una vez
    const { data: allModules } = await supabase
      .from('modules')
      .select('id, course_id')
      .in('course_id', courseIds);

    const moduleIds = allModules?.map(m => m.id) || [];

    // 3. Obtener TODO el contenido de TODOS los módulos de una vez
    const { data: allContent } = moduleIds.length > 0
      ? await supabase
          .from('content')
          .select('id, module_id')
          .in('module_id', moduleIds)
      : { data: [] };

    const contentIds = allContent?.map(c => c.id) || [];

    // 4. Obtener TODO el progreso del usuario de una vez
    const { data: allProgress } = contentIds.length > 0
      ? await supabase
          .from('progress')
          .select('content_id, completed')
          .eq('user_id', userId)
          .eq('completed', true)
          .in('content_id', contentIds)
      : { data: [] };

    // 5. Obtener TODAS las evaluaciones de una vez
    const { data: allAssessments } = await supabase
      .from('assessments')
      .select('id, course_id')
      .in('course_id', courseIds);

    const assessmentIds = allAssessments?.map(a => a.id) || [];

    // 6. Obtener TODOS los intentos aprobados de una vez
    const { data: allAttempts } = assessmentIds.length > 0
      ? await supabase
          .from('attempt_results')
          .select('assessment_id, passed')
          .eq('user_id', userId)
          .eq('passed', true)
          .in('assessment_id', assessmentIds)
      : { data: [] };

    return {
      enrollments: enrollments || [],
      allModules: allModules || [],
      allContent: allContent || [],
      allProgress: allProgress || [],
      allAssessments: allAssessments || [],
      allAttempts: allAttempts || []
    };

  } catch (error) {
    console.error('Error getting optimized progress data:', error);
    throw error;
  }
};

/**
 * Calcula el progreso de todos los cursos usando los datos optimizados
 */
export const calculateProgressFromData = (data: ProgressData) => {
  const { enrollments, allModules, allContent, allProgress, allAssessments, allAttempts } = data;
  
  return enrollments.map(enrollment => {
    const courseId = enrollment.course_id;
    
    // Filtrar datos por curso
    const courseModules = allModules.filter(m => m.course_id === courseId);
    const moduleIds = courseModules.map(m => m.id);
    const courseContent = allContent.filter(c => moduleIds.includes(c.module_id));
    const contentIds = courseContent.map(c => c.id);
    const userProgress = allProgress.filter(p => contentIds.includes(p.content_id));
    const courseAssessments = allAssessments.filter(a => a.course_id === courseId);
    const assessmentIds = courseAssessments.map(a => a.id);
    const userAttempts = allAttempts.filter(a => assessmentIds.includes(a.assessment_id));

    // Calcular estadísticas
    const totalContent = courseContent.length;
    const contentCompleted = userProgress.length;
    const contentPercentage = totalContent > 0 ? Math.round((contentCompleted / totalContent) * 100) : 0;
    
    const totalAssessments = courseAssessments.length;
    const assessmentsCompleted = userAttempts.length;
    const assessmentPercentage = totalAssessments > 0 ? Math.round((assessmentsCompleted / totalAssessments) * 100) : 0;
    
    // Progreso general (70% contenido + 30% evaluaciones)
    const overallPercentage = totalContent > 0 || totalAssessments > 0
      ? Math.round((contentPercentage * 0.7) + (assessmentPercentage * 0.3))
      : 0;

    return {
      ...enrollment,
      realProgress: {
        contentCompleted,
        totalContent,
        contentPercentage,
        assessmentsCompleted,
        totalAssessments,
        assessmentPercentage,
        overallPercentage
      }
    };
  });
};

/**
 * Actualiza el progreso en la base de datos de manera optimizada
 */
export const updateProgressInDB = async (enrollmentsWithProgress: any[]) => {
  const updates = enrollmentsWithProgress
    .filter(enrollment => {
      const currentStored = enrollment.progress_percentage || 0;
      const newProgress = enrollment.realProgress.overallPercentage;
      return Math.abs(currentStored - newProgress) > 1;
    })
    .map(enrollment => ({
      id: enrollment.id,
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      progress_percentage: enrollment.realProgress.overallPercentage,
      last_accessed_at: new Date().toISOString()
    }));

  if (updates.length > 0) {
    // Actualización masiva en una sola consulta
    const { error } = await supabase
      .from('enrollments')
      .upsert(updates);
    
    if (error) throw error;
  }
  
  return updates.length;
};