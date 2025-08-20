-- Agregar campos de login a la tabla users existente
ALTER TABLE public.users 
ADD COLUMN last_login_at timestamp with time zone,
ADD COLUMN login_count integer DEFAULT 0;

-- Crear índice para consultas rápidas por último login
CREATE INDEX idx_users_last_login_at ON public.users(last_login_at);
