-- Migración para agregar transaction_id a enrollments
-- Ejecutar en Supabase SQL Editor

-- Agregar la columna transaction_id a enrollments
ALTER TABLE enrollments 
ADD COLUMN transaction_id text;

-- Agregar la columna updated_at si no existe
ALTER TABLE enrollments 
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Crear un índice para mejorar las búsquedas por transaction_id
CREATE INDEX IF NOT EXISTS idx_enrollments_transaction_id 
ON enrollments(transaction_id);

-- Crear restricción única para prevenir inscripciones duplicadas
-- Esto previene condiciones de carrera cuando llegan webhooks simultáneos
ALTER TABLE enrollments 
ADD CONSTRAINT unique_user_course_enrollment 
UNIQUE (user_id, course_id);

-- Agregar un trigger para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para la documentación
COMMENT ON COLUMN enrollments.transaction_id IS 'ID de transacción de Hotmart para evitar duplicados';
COMMENT ON COLUMN enrollments.updated_at IS 'Timestamp de última actualización';
