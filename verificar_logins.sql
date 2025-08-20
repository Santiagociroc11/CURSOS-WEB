-- ===== CONSULTAS PARA VERIFICAR EL TRACKING DE LOGIN =====

-- 1. Ver todos los usuarios con información de login
SELECT 
  email,
  full_name,
  role,
  login_count,
  last_login_at,
  created_at as registro,
  CASE 
    WHEN last_login_at IS NULL THEN 'Nunca se ha logueado'
    WHEN last_login_at > (CURRENT_TIMESTAMP - INTERVAL '1 day') THEN 'Activo hoy'
    WHEN last_login_at > (CURRENT_TIMESTAMP - INTERVAL '7 days') THEN 'Activo esta semana'
    WHEN last_login_at > (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 'Activo este mes'
    ELSE 'Inactivo hace más de 30 días'
  END as estado_actividad
FROM users 
ORDER BY last_login_at DESC NULLS LAST;

-- 2. Usuarios más activos (por cantidad de logins)
SELECT 
  email,
  full_name,
  login_count,
  last_login_at
FROM users 
WHERE login_count > 0
ORDER BY login_count DESC
LIMIT 10;

-- 3. Usuarios que nunca han hecho login
SELECT 
  email, 
  full_name, 
  created_at as registrado_el,
  CURRENT_TIMESTAMP - created_at as tiempo_sin_actividad
FROM users 
WHERE last_login_at IS NULL 
ORDER BY created_at DESC;

-- 4. Actividad de login reciente (últimos 7 días)
SELECT 
  email,
  full_name,
  last_login_at,
  login_count
FROM users 
WHERE last_login_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
ORDER BY last_login_at DESC;

-- 5. Resumen estadístico
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN last_login_at IS NOT NULL THEN 1 END) as usuarios_con_login,
  COUNT(CASE WHEN last_login_at IS NULL THEN 1 END) as usuarios_sin_login,
  COUNT(CASE WHEN last_login_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 1 END) as activos_ultimo_mes,
  ROUND(AVG(login_count), 2) as promedio_logins_por_usuario
FROM users;
