# EduPlatform - Learning Management System

Una plataforma educativa completa construida con React, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características Principales

### Para Administradores
- **Dashboard Analítico**: Métricas en tiempo real de estudiantes, cursos y progreso
- **Gestión de Cursos**: Crear, editar y organizar cursos con módulos estructurados
- **Gestión de Usuarios**: Administrar estudiantes y permisos de acceso
- **Sistema de Evaluación**: Crear exámenes y evaluar el progreso
- **Generación de Certificados**: Certificados automáticos al completar cursos

### Para Estudiantes
- **Campus Virtual Personal**: Catálogo de cursos asignados
- **Reproductor Integrado**: Soporte para videos, documentos y presentaciones
- **Tracking de Progreso**: Seguimiento automático del avance por módulo
- **Certificaciones**: Obtención de certificados al completar cursos
- **Perfil Personal**: Gestión de información y historial académico

## 🛠 Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI Components**: Componentes personalizados con Lucide React
- **Charts**: Recharts para analytics
- **Video Player**: React Player
- **Routing**: React Router DOM

## 📋 Configuración Inicial

### 1. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > API y copia las keys
4. Crea un archivo `.env` basado en `.env.example`

### 2. Ejecutar la Aplicación

```bash
npm install
npm run dev
```

## 🗄 Estructura de Base de Datos

### Tablas Principales

**users**
- Perfiles de usuario con roles (admin/student)
- Información personal y configuraciones

**courses**
- Información de cursos (título, descripción, instructor)
- Metadatos como duración, dificultad, categoría

**modules**
- Organización jerárquica del contenido
- Orden secuencial y duración estimada

**content**
- Elementos multimedia (videos, documentos, enlaces)
- Soporte para diferentes tipos de contenido

**enrollments**
- Relación estudiante-curso
- Tracking de progreso y fechas importantes

**progress**
- Progreso detallado por contenido
- Tiempo dedicado y estado de finalización

**assessments & questions**
- Sistema de evaluación flexible
- Diferentes tipos de preguntas y puntuación

**attempt_results**
- Resultados de exámenes
- Historial de intentos y calificaciones

## 🔐 Sistema de Autenticación

- **Roles**: Administrador y Estudiante
- **Permisos**: Control granular de acceso
- **Seguridad**: Row Level Security (RLS) en Supabase
- **Sesiones**: Gestión automática de sesiones

## 📱 Diseño Responsive

- **Mobile First**: Optimizado para dispositivos móviles
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Navegación Adaptativa**: Sidebar colapsible en móvil

## 🎨 Sistema de Diseño

### Colores
- **Primario**: Azul (#2563EB)
- **Secundario**: Índigo (#4F46E5)
- **Accent**: Verde (#059669)
- **Estados**: Éxito, Advertencia, Error

### Tipografía
- **Font**: Inter (system font stack)
- **Espaciado**: Sistema de 8px
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

## 📊 Analytics y Reportes

- Métricas de engagement de estudiantes
- Progreso por curso y módulo
- Tasas de finalización
- Tiempo dedicado al estudio
- Gráficos interactivos con Recharts

## 🔒 Seguridad

- Autenticación JWT con Supabase Auth
- Row Level Security en base de datos
- Validación de datos en frontend y backend
- Protección de rutas por rol
- Sanitización de contenido

## 🚀 Escalabilidad

- Arquitectura modular y componentes reutilizables
- Separación clara de responsabilidades
- Base de datos optimizada con índices
- Carga diferida de contenido multimedia
- CDN para assets estáticos

## 📈 Roadmap

### Fase 1 (Actual)
- ✅ Sistema de autenticación
- ✅ Dashboard para administradores
- ✅ Gestión básica de cursos
- ✅ Interfaz de estudiante
- ✅ Reproductor de contenido

### Fase 2
- 🔄 Sistema de evaluación completo
- 🔄 Generación de certificados
- 🔄 Chat y mensajería
- 🔄 Foros de discusión
- 🔄 Notificaciones push

### Fase 3
- ⏳ Integración con sistemas externos
- ⏳ API pública
- ⏳ App móvil nativa
- ⏳ Inteligencia artificial
- ⏳ Gamificación avanzada

## 🤝 Contribución

1. Fork el proyecto
2. Crea una feature branch
3. Commit tus cambios
4. Push a la branch
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver `LICENSE` para más detalles.