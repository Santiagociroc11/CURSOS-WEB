export const translateRole = (role: string): string => {
  const translations: Record<string, string> = {
    'student': 'Estudiante',
    'admin': 'Administrador',
    'instructor': 'Instructor'
  };
  
  return translations[role] || role;
};

export const translateDifficulty = (difficulty: string): string => {
  const translations: Record<string, string> = {
    'beginner': 'Principiante',
    'intermediate': 'Intermedio',
    'advanced': 'Avanzado'
  };
  
  return translations[difficulty] || difficulty;
};

export const translateContentType = (type: string): string => {
  const translations: Record<string, string> = {
    'video': 'Video',
    'document': 'Documento',
    'presentation': 'Presentación',
    'link': 'Enlace',
    'text': 'Texto',
    'audio': 'Audio',
    'quiz': 'Evaluación',
    'reading': 'Lectura'
  };
  
  return translations[type] || type;
};