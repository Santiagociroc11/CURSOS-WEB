-- =====================================================
-- PLATAFORMA LMS - ESTRUCTURA COMPLETA DE BASE DE DATOS
-- =====================================================

-- Crear extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users (Usuarios del sistema)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: courses (Catálogo de cursos)
-- =====================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duration_hours INTEGER NOT NULL DEFAULT 0,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: modules (Módulos de cursos)
-- =====================================================
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: content (Contenido de módulos)
-- =====================================================
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('video', 'document', 'presentation', 'link', 'text')),
    content_url TEXT,
    content_text TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: enrollments (Inscripciones de estudiantes)
-- =====================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_accessed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- =====================================================
-- TABLA: progress (Progreso detallado por contenido)
-- =====================================================
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- =====================================================
-- TABLA: assessments (Evaluaciones/Exámenes)
-- =====================================================
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER NOT NULL DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: questions (Preguntas de evaluaciones)
-- =====================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'text', 'essay')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL
);

-- =====================================================
-- TABLA: attempt_results (Resultados de intentos)
-- =====================================================
CREATE TABLE attempt_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- TABLA: certificates (Certificados emitidos)
-- =====================================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_modules_course ON modules(course_id, order_index);
CREATE INDEX idx_content_module ON content(module_id, order_index);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_content ON progress(content_id);
CREATE INDEX idx_assessments_course ON assessments(course_id);
CREATE INDEX idx_questions_assessment ON questions(assessment_id, order_index);
CREATE INDEX idx_attempts_user ON attempt_results(user_id);
CREATE INDEX idx_attempts_assessment ON attempt_results(assessment_id);
CREATE INDEX idx_certificates_user ON certificates(user_id);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTAS PARA ANALYTICS Y REPORTES
-- =====================================================

-- Vista: Estadísticas generales del sistema
CREATE VIEW system_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM courses WHERE is_published = true) as published_courses,
    (SELECT COUNT(*) FROM enrollments) as total_enrollments,
    (SELECT COUNT(*) FROM enrollments WHERE progress_percentage = 100) as completed_enrollments,
    (SELECT ROUND(AVG(progress_percentage), 2) FROM enrollments) as avg_progress;

-- Vista: Progreso por curso
CREATE VIEW course_progress_stats AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    COUNT(e.id) as total_enrollments,
    COUNT(CASE WHEN e.progress_percentage = 100 THEN 1 END) as completed_count,
    ROUND(AVG(e.progress_percentage), 2) as avg_progress,
    ROUND(
        (COUNT(CASE WHEN e.progress_percentage = 100 THEN 1 END)::FLOAT / 
         NULLIF(COUNT(e.id), 0) * 100), 2
    ) as completion_rate
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.is_published = true
GROUP BY c.id, c.title;

-- Vista: Actividad de estudiantes
CREATE VIEW student_activity AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    COUNT(e.id) as enrolled_courses,
    COUNT(CASE WHEN e.progress_percentage = 100 THEN 1 END) as completed_courses,
    ROUND(AVG(e.progress_percentage), 2) as avg_progress,
    MAX(e.last_accessed_at) as last_activity
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email;

-- =====================================================
-- DATOS DE EJEMPLO PARA TESTING
-- =====================================================

-- Insertar usuarios de ejemplo
INSERT INTO users (id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@eduplatform.com', 'Administrador Principal', 'admin'),
('22222222-2222-2222-2222-222222222222', 'maria.garcia@email.com', 'María García', 'student'),
('33333333-3333-3333-3333-333333333333', 'carlos.lopez@email.com', 'Carlos López', 'student'),
('44444444-4444-4444-4444-444444444444', 'ana.martinez@email.com', 'Ana Martínez', 'student'),
('55555555-5555-5555-5555-555555555555', 'luis.rodriguez@email.com', 'Luis Rodríguez', 'student'),
('66666666-6666-6666-6666-666666666666', 'sofia.hernandez@email.com', 'Sofía Hernández', 'student');

-- Insertar cursos de ejemplo
INSERT INTO courses (id, title, description, thumbnail_url, instructor_id, duration_hours, difficulty_level, category, is_published) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'React Fundamentals', 'Aprende los conceptos básicos de React desde cero con ejemplos prácticos y proyectos reales', 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=400', '11111111-1111-1111-1111-111111111111', 20, 'beginner', 'Programación', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Advanced Node.js', 'Desarrollo backend avanzado con Node.js, Express y bases de datos', 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=400', '11111111-1111-1111-1111-111111111111', 35, 'advanced', 'Backend', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'UI/UX Design Masterclass', 'Diseña interfaces modernas y experiencias de usuario excepcionales', 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400', '11111111-1111-1111-1111-111111111111', 30, 'intermediate', 'Diseño', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Database Design & SQL', 'Fundamentos de bases de datos relacionales y consultas SQL avanzadas', 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=400', '11111111-1111-1111-1111-111111111111', 25, 'intermediate', 'Base de Datos', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Python for Data Science', 'Análisis de datos y machine learning con Python, pandas y scikit-learn', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400', '11111111-1111-1111-1111-111111111111', 40, 'advanced', 'Data Science', true);

-- Insertar módulos para React Fundamentals
INSERT INTO modules (id, course_id, title, description, order_index, duration_minutes) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Introducción a React', 'Conceptos básicos, instalación y configuración del entorno de desarrollo', 1, 120),
('11111111-1111-1111-1111-111111111112', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Componentes y JSX', 'Creación de componentes funcionales y sintaxis JSX', 2, 180),
('11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Estado y Props', 'Manejo del estado local y comunicación entre componentes', 3, 150),
('11111111-1111-1111-1111-111111111114', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hooks Avanzados', 'useEffect, useContext, useReducer y hooks personalizados', 4, 200),
('11111111-1111-1111-1111-111111111115', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Proyecto Final', 'Desarrollo de una aplicación completa con React', 5, 350);

-- Insertar módulos para UI/UX Design
INSERT INTO modules (id, course_id, title, description, order_index, duration_minutes) VALUES
('22222222-2222-2222-2222-222222222221', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Fundamentos de Diseño', 'Principios básicos de diseño visual y experiencia de usuario', 1, 150),
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Investigación de Usuario', 'Métodos de investigación y análisis de necesidades del usuario', 2, 180),
('22222222-2222-2222-2222-222222222223', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Prototipado y Wireframes', 'Creación de prototipos y estructuras de interfaz', 3, 200);

-- Insertar contenido para React Fundamentals - Módulo 1
INSERT INTO content (id, module_id, title, type, content_url, order_index, duration_minutes) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '¿Qué es React?', 'video', 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', 1, 15),
('c1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Instalación y Configuración', 'video', 'https://www.youtube.com/watch?v=SqcY0GlETPk', 2, 20),
('c1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Documentación Oficial', 'link', 'https://react.dev/', 3, 10),
('c1111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Ejercicios Prácticos', 'document', 'https://example.com/react-exercises.pdf', 4, 30);

-- Insertar contenido para React Fundamentals - Módulo 2
INSERT INTO content (id, module_id, title, type, content_url, order_index, duration_minutes) VALUES
('c2222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111112', 'Introducción a JSX', 'video', 'https://www.youtube.com/watch?v=7fPXI_MnBOY', 1, 25),
('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Componentes Funcionales', 'video', 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', 2, 30),
('c2222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111112', 'Props y Composición', 'video', 'https://www.youtube.com/watch?v=PHaECbrKgs0', 3, 35);

-- Insertar inscripciones de ejemplo
INSERT INTO enrollments (id, user_id, course_id, enrolled_at, progress_percentage, last_accessed_at) VALUES
('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '30 days', 65, NOW() - INTERVAL '2 days'),
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '20 days', 20, NOW() - INTERVAL '5 days'),
('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '25 days', 100, NOW() - INTERVAL '1 day'),
('e4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '15 days', 45, NOW() - INTERVAL '3 days'),
('e5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '10 days', 80, NOW() - INTERVAL '1 day'),
('e6666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '5 days', 30, NOW());

-- Insertar progreso detallado
INSERT INTO progress (id, user_id, content_id, completed, completed_at, time_spent_minutes) VALUES
('p1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '28 days', 18),
('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111112', true, NOW() - INTERVAL '27 days', 25),
('p3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111113', true, NOW() - INTERVAL '26 days', 12),
('p4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '23 days', 20),
('p5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111112', true, NOW() - INTERVAL '22 days', 22);

-- Insertar evaluaciones de ejemplo
INSERT INTO assessments (id, course_id, title, description, passing_score, max_attempts, time_limit_minutes) VALUES
('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Examen Final - React Fundamentals', 'Evaluación integral de los conceptos aprendidos en el curso', 70, 3, 60),
('a2222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Evaluación de Diseño UX', 'Prueba práctica de principios de experiencia de usuario', 75, 2, 90);

-- Insertar preguntas de ejemplo
INSERT INTO questions (id, assessment_id, question_text, type, options, correct_answer, points, order_index) VALUES
('q1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '¿Qué es JSX en React?', 'multiple_choice', '["Una extensión de JavaScript", "Un lenguaje de programación", "Una base de datos", "Un framework CSS"]', 'Una extensión de JavaScript', 10, 1),
('q2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '¿Los componentes de React pueden tener estado?', 'true_false', '["Verdadero", "Falso"]', 'Verdadero', 5, 2),
('q3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Explica la diferencia entre props y state en React', 'essay', null, 'Props son datos inmutables que se pasan de componente padre a hijo, mientras que state es mutable y pertenece al componente', 15, 3);

-- Insertar resultados de intentos
INSERT INTO attempt_results (id, user_id, assessment_id, score, passed, answers, started_at, completed_at) VALUES
('r1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 85, true, '{"q1111111-1111-1111-1111-111111111111": "Una extensión de JavaScript", "q2222222-2222-2222-2222-222222222222": "Verdadero"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes');

-- Insertar certificados
INSERT INTO certificates (id, user_id, course_id, certificate_url, issued_at) VALUES
('cert1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://certificates.eduplatform.com/cert1111.pdf', NOW() - INTERVAL '1 day');

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
SELECT 'Base de datos LMS creada exitosamente con datos de ejemplo' as status;