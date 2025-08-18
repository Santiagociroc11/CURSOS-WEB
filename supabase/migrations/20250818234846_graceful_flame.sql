-- =====================================================
-- EDUCATIONAL LMS PLATFORM - DATABASE SETUP
-- Complete database structure with sample data
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duration_hours INTEGER DEFAULT 0,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MODULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
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
-- ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_accessed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- =====================================================
-- PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- =====================================================
-- ASSESSMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'text', 'essay')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ATTEMPT RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attempt_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CERTIFICATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    certificate_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_module ON content(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_content ON progress(content_id);
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON questions(assessment_id, order_index);
CREATE INDEX IF NOT EXISTS idx_attempt_results_user ON attempt_results(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_results_assessment ON attempt_results(assessment_id);

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA - USERS
-- =====================================================
INSERT INTO users (id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@eduplatform.com', 'Administrador Principal', 'admin'),
('22222222-2222-2222-2222-222222222222', 'estudiante@eduplatform.com', 'María García López', 'student'),
('33333333-3333-3333-3333-333333333333', 'carlos.martinez@email.com', 'Carlos Martínez Silva', 'student'),
('44444444-4444-4444-4444-444444444444', 'ana.rodriguez@email.com', 'Ana Rodríguez Pérez', 'student'),
('55555555-5555-5555-5555-555555555555', 'luis.fernandez@email.com', 'Luis Fernández Torres', 'student'),
('66666666-6666-6666-6666-666666666666', 'sofia.morales@email.com', 'Sofía Morales Ruiz', 'student');

-- =====================================================
-- SAMPLE DATA - COURSES
-- =====================================================
INSERT INTO courses (id, title, description, thumbnail_url, instructor_id, duration_hours, difficulty_level, category, is_published) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'React Fundamentals', 'Aprende los conceptos básicos de React desde cero con ejemplos prácticos y proyectos reales. Domina componentes, estado, props y hooks.', 'https://images.pexels.com/photos/4050287/pexels-photo-4050287.jpeg?auto=compress&cs=tinysrgb&w=800', '11111111-1111-1111-1111-111111111111', 25, 'beginner', 'Programación', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Advanced Node.js', 'Desarrollo backend avanzado con Node.js, Express, bases de datos y arquitecturas escalables para aplicaciones empresariales.', 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=800', '11111111-1111-1111-1111-111111111111', 35, 'advanced', 'Backend', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'UI/UX Design Masterclass', 'Diseña interfaces modernas y experiencias de usuario excepcionales usando principios de diseño y herramientas profesionales.', 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800', '11111111-1111-1111-1111-111111111111', 30, 'intermediate', 'Diseño', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Database Design & SQL', 'Aprende a diseñar bases de datos relacionales eficientes y domina SQL para consultas complejas y optimización.', 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800', '11111111-1111-1111-1111-111111111111', 20, 'intermediate', 'Base de Datos', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Python for Data Science', 'Análisis de datos con Python, pandas, numpy y visualización con matplotlib. Incluye machine learning básico.', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', '11111111-1111-1111-1111-111111111111', 40, 'intermediate', 'Data Science', true);

-- =====================================================
-- SAMPLE DATA - MODULES
-- =====================================================
INSERT INTO modules (id, course_id, title, description, order_index, duration_minutes) VALUES
-- React Fundamentals Modules
('m1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Introducción a React', 'Conceptos básicos, instalación y configuración del entorno de desarrollo', 1, 120),
('m2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Componentes y JSX', 'Creación de componentes, sintaxis JSX y renderizado', 2, 180),
('m3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Estado y Props', 'Manejo del estado, comunicación entre componentes', 3, 150),
('m4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hooks y Efectos', 'useState, useEffect y hooks personalizados', 4, 200),
('m5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Proyecto Final', 'Desarrollo de una aplicación completa', 5, 350),

-- Node.js Modules
('m6666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fundamentos de Node.js', 'Event loop, módulos y sistema de archivos', 1, 180),
('m7777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Express.js Avanzado', 'Middleware, routing y arquitectura MVC', 2, 240),
('m8888888-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bases de Datos', 'MongoDB, PostgreSQL y ORMs', 3, 300),
('m9999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Autenticación y Seguridad', 'JWT, OAuth y mejores prácticas', 4, 220),

-- UI/UX Design Modules
('ma111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Principios de Diseño', 'Teoría del color, tipografía y composición', 1, 200),
('mb222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Investigación UX', 'User research, personas y journey maps', 2, 180),
('mc333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Prototipado', 'Wireframes, mockups y prototipos interactivos', 3, 250);

-- =====================================================
-- SAMPLE DATA - CONTENT
-- =====================================================
INSERT INTO content (id, module_id, title, type, content_url, order_index, duration_minutes) VALUES
-- React Introduction Module Content
('c1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', '¿Qué es React?', 'video', 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', 1, 15),
('c2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'Instalación y Setup', 'video', 'https://www.youtube.com/watch?v=SqcY0GlETPk', 2, 20),
('c3333333-3333-3333-3333-333333333333', 'm1111111-1111-1111-1111-111111111111', 'Primer Proyecto', 'video', 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', 3, 25),
('c4444444-4444-4444-4444-444444444444', 'm1111111-1111-1111-1111-111111111111', 'Documentación Oficial', 'link', 'https://react.dev/', 4, 10),

-- Components and JSX Module Content
('c5555555-5555-5555-5555-555555555555', 'm2222222-2222-2222-2222-222222222222', 'Componentes Funcionales', 'video', 'https://www.youtube.com/watch?v=Rh3tobg7hEo', 1, 30),
('c6666666-6666-6666-6666-666666666666', 'm2222222-2222-2222-2222-222222222222', 'JSX en Profundidad', 'video', 'https://www.youtube.com/watch?v=7fPXI_MnBOY', 2, 25),
('c7777777-7777-7777-7777-777777777777', 'm2222222-2222-2222-2222-222222222222', 'Props y Children', 'video', 'https://www.youtube.com/watch?v=PHaECbrKgs0', 3, 35),

-- State and Props Module Content
('c8888888-8888-8888-8888-888888888888', 'm3333333-3333-3333-3333-333333333333', 'useState Hook', 'video', 'https://www.youtube.com/watch?v=O6P86uwfdR0', 1, 40),
('c9999999-9999-9999-9999-999999999999', 'm3333333-3333-3333-3333-333333333333', 'Lifting State Up', 'video', 'https://www.youtube.com/watch?v=8yo44xN7-nQ', 2, 35),

-- Node.js Content
('ca111111-1111-1111-1111-111111111111', 'm6666666-6666-6666-6666-666666666666', 'Introducción a Node.js', 'video', 'https://www.youtube.com/watch?v=TlB_eWDSMt4', 1, 30),
('cb222222-2222-2222-2222-222222222222', 'm6666666-6666-6666-6666-666666666666', 'Módulos y NPM', 'video', 'https://www.youtube.com/watch?v=xHLd36QoS4k', 2, 25),

-- UI/UX Content
('cc333333-3333-3333-3333-333333333333', 'ma111111-1111-1111-1111-111111111111', 'Fundamentos del Diseño', 'video', 'https://www.youtube.com/watch?v=YiLUYf4HDh4', 1, 45),
('cd444444-4444-4444-4444-444444444444', 'ma111111-1111-1111-1111-111111111111', 'Teoría del Color', 'video', 'https://www.youtube.com/watch?v=_2LLXnUdUIc', 2, 35);

-- =====================================================
-- SAMPLE DATA - ENROLLMENTS
-- =====================================================
INSERT INTO enrollments (id, user_id, course_id, enrolled_at, progress_percentage, last_accessed_at) VALUES
('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '30 days', 65, NOW() - INTERVAL '1 day'),
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '15 days', 20, NOW() - INTERVAL '3 days'),
('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '20 days', 45, NOW() - INTERVAL '2 days'),
('e4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '10 days', 15, NOW() - INTERVAL '1 day'),
('e5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '25 days', 80, NOW() - INTERVAL '1 day'),
('e6666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '5 days', 10, NOW()),
('e7777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '40 days', 100, NOW() - INTERVAL '5 days');

-- =====================================================
-- SAMPLE DATA - PROGRESS
-- =====================================================
INSERT INTO progress (id, user_id, content_id, completed, completed_at, time_spent_minutes) VALUES
-- María García progress in React course
('p1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '25 days', 18),
('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '24 days', 22),
('p3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', true, NOW() - INTERVAL '23 days', 28),
('p4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555555', true, NOW() - INTERVAL '20 days', 35),
('p5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'c6666666-6666-6666-6666-666666666666', true, NOW() - INTERVAL '18 days', 30),
('p6666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'c8888888-8888-8888-8888-888888888888', false, NULL, 15),

-- Carlos Martínez progress
('p7777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '18 days', 16),
('p8888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '17 days', 25),
('p9999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'c5555555-5555-5555-5555-555555555555', false, NULL, 12);

-- =====================================================
-- SAMPLE DATA - ASSESSMENTS
-- =====================================================
INSERT INTO assessments (id, course_id, title, description, passing_score, max_attempts, time_limit_minutes, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Examen Final React', 'Evaluación completa de conceptos de React', 70, 3, 60, true),
('a2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Evaluación Node.js', 'Prueba de conocimientos backend', 75, 2, 90, true),
('a3333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Quiz de Diseño UX', 'Evaluación de principios de diseño', 65, 3, 45, true);

-- =====================================================
-- SAMPLE DATA - QUESTIONS
-- =====================================================
INSERT INTO questions (id, assessment_id, question_text, type, options, correct_answer, points, order_index) VALUES
('q1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '¿Qué es JSX en React?', 'multiple_choice', '["Una extensión de sintaxis para JavaScript", "Un framework separado", "Una base de datos", "Un servidor web"]', 'Una extensión de sintaxis para JavaScript', 2, 1),
('q2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '¿Los componentes de React pueden tener estado?', 'true_false', '["Verdadero", "Falso"]', 'Verdadero', 1, 2),
('q3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Explica qué son los hooks en React', 'essay', '[]', 'Los hooks son funciones que permiten usar estado y otras características de React en componentes funcionales', 3, 3),
('q4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', '¿Qué es Node.js?', 'multiple_choice', '["Un runtime de JavaScript", "Un framework frontend", "Una base de datos", "Un editor de código"]', 'Un runtime de JavaScript', 2, 1),
('q5555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', '¿Qué significa UX?', 'text', '[]', 'User Experience', 1, 1);

-- =====================================================
-- SAMPLE DATA - ATTEMPT RESULTS
-- =====================================================
INSERT INTO attempt_results (id, user_id, assessment_id, score, passed, answers, started_at, completed_at) VALUES
('ar111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 85, true, '{"q1111111-1111-1111-1111-111111111111": "Una extensión de sintaxis para JavaScript", "q2222222-2222-2222-2222-222222222222": "Verdadero"}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '45 minutes'),
('ar222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 65, false, '{"q1111111-1111-1111-1111-111111111111": "Un framework separado", "q2222222-2222-2222-2222-222222222222": "Verdadero"}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes');

-- =====================================================
-- SAMPLE DATA - CERTIFICATES
-- =====================================================
INSERT INTO certificates (id, user_id, course_id, certificate_url, issued_at) VALUES
('cert1111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://certificates.eduplatform.com/react-fundamentals-sofia-morales.pdf', NOW() - INTERVAL '5 days');

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================
CREATE OR REPLACE VIEW course_analytics AS
SELECT 
    c.id,
    c.title,
    c.category,
    COUNT(DISTINCT e.user_id) as total_students,
    COUNT(DISTINCT CASE WHEN e.progress_percentage = 100 THEN e.user_id END) as completed_students,
    ROUND(AVG(e.progress_percentage), 2) as avg_progress,
    COUNT(DISTINCT cert.id) as certificates_issued
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN certificates cert ON c.id = cert.course_id
WHERE c.is_published = true
GROUP BY c.id, c.title, c.category;

CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT e.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN e.progress_percentage = 100 THEN e.course_id END) as completed_courses,
    ROUND(AVG(e.progress_percentage), 2) as avg_progress,
    COUNT(DISTINCT cert.id) as certificates_earned,
    SUM(CASE WHEN p.completed THEN p.time_spent_minutes ELSE 0 END) as total_study_minutes
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN certificates cert ON u.id = cert.user_id
LEFT JOIN progress p ON u.id = p.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Database setup completed successfully! 🎉' as status,
       'Users: ' || (SELECT COUNT(*) FROM users) || ' created' as users_created,
       'Courses: ' || (SELECT COUNT(*) FROM courses) || ' created' as courses_created,
       'Modules: ' || (SELECT COUNT(*) FROM modules) || ' created' as modules_created,
       'Content: ' || (SELECT COUNT(*) FROM content) || ' created' as content_created,
       'Enrollments: ' || (SELECT COUNT(*) FROM enrollments) || ' created' as enrollments_created;