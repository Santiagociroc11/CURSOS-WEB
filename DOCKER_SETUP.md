# Setup con Docker - Proyecto de Cursos Web

Este proyecto ahora incluye un backend completo con endpoints para la integración con Hotmart.

## Configuración Rápida

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo y edita las variables:

```bash
cp env.example .env
```

Edita `.env` con tus valores reales:

```env
# Configuración de Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# Configuración de Hotmart API
VITE_HOTMART_API_SECRET=tu-clave-secreta-para-hotmart-api

# URL de la aplicación
VITE_APP_URL=https://tu-dominio.com

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000
```

### 2. Ejecutar con Docker

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

### 3. Verificar que Funciona

- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Hotmart API Test**: http://localhost:3000/api/hotmart/test

## Endpoints de Hotmart Disponibles

### 1. Procesar Compra Completa
```http
POST /api/hotmart/process-purchase
Authorization: Bearer tu-clave-secreta-aqui
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "full_name": "Nombre Completo",
  "phone": "+123456789",
  "course_id": "uuid-del-curso",
  "transaction_id": "hotmart-transaction-id",
  "purchase_date": "2025-01-01T00:00:00Z"
}
```

### 2. Crear Usuario Únicamente
```http
POST /api/hotmart/create-user
Authorization: Bearer tu-clave-secreta-aqui
Content-Type: application/json
```

### 3. Inscribir Usuario en Curso
```http
POST /api/hotmart/enroll-user
Authorization: Bearer tu-clave-secreta-aqui
Content-Type: application/json

{
  "user_id": "uuid-del-usuario",
  "course_id": "uuid-del-curso"
}
```

### 4. Validar Curso
```http
GET /api/hotmart/courses/{courseId}/validate
```

## Comandos de Desarrollo

```bash
# Desarrollo (sin Docker)
npm run dev              # Frontend en puerto 5173
npm run dev:server       # Backend en puerto 3000

# Construcción
npm run build            # Construye frontend + backend
npm run build:server     # Solo backend

# Producción
npm start                # Ejecuta servidor en producción
```

## Estructura del Proyecto

```
├── src/                 # Frontend React
├── server/             # Backend Node.js/Express
│   ├── server.ts       # Servidor principal
│   ├── routes/         # Rutas de la API
│   ├── services/       # Servicios (Hotmart, etc.)
│   ├── lib/           # Configuración (Supabase)
│   └── types/         # Tipos TypeScript
├── dist/              # Archivos compilados
│   ├── assets/        # Frontend estático
│   └── server/        # Backend compilado
├── Dockerfile         # Configuración Docker
└── docker-compose.yml # Orquestación
```

## Configuración de Nginx Proxy (Producción)

Si usas nginx como proxy reverso en producción:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoreo

- Health check automático cada 30 segundos
- Logs accesibles con `docker-compose logs`
- Reinicio automático en caso de fallo
