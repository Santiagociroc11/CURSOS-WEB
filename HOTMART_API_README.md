# API de Integración con Hotmart

Esta documentación describe los endpoints creados para integrar tu sistema de cursos con Hotmart, permitiendo la creación automática de usuarios e inscripciones cuando se realiza una compra.

## Configuración

### Variables de Entorno

Asegúrate de configurar estas variables:

```env
VITE_HOTMART_API_SECRET=tu-clave-secreta-aqui
VITE_APP_URL=https://tu-dominio.com
```

## Endpoints Disponibles

### 1. Procesar Compra Completa (Recomendado)

**POST** `/api/hotmart/process-purchase`

Este endpoint maneja todo el proceso: crea el usuario (si no existe) y lo inscribe en el curso automáticamente.

#### Headers
```
Authorization: Bearer tu-clave-secreta-aqui
Content-Type: application/json
```

#### Body
```json
{
  "email": "usuario@ejemplo.com",
  "full_name": "Nombre Completo",
  "phone": "+123456789",  // Opcional
  "course_id": "uuid-del-curso",
  "transaction_id": "hotmart-transaction-id",
  "purchase_date": "2025-01-01T00:00:00Z"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "usuario@ejemplo.com",
      "full_name": "Nombre Completo",
      "role": "student"
    },
    "enrollment": {
      "id": "enrollment-uuid",
      "user_id": "user-uuid",
      "course_id": "course-uuid",
      "enrolled_at": "2025-01-01T00:00:00Z",
      "progress_percentage": 0
    },
    "is_new_user": true
  },
  "message": "Usuario creado e inscrito exitosamente"
}
```

### 2. Crear Usuario Únicamente

**POST** `/api/hotmart/create-user`

Crea un usuario sin inscribirlo en ningún curso.

#### Headers
```
Authorization: Bearer tu-clave-secreta-aqui
Content-Type: application/json
```

#### Body
```json
{
  "email": "usuario@ejemplo.com",
  "full_name": "Nombre Completo",
  "phone": "+123456789",  // Opcional
  "course_id": "uuid-del-curso",
  "transaction_id": "hotmart-transaction-id",
  "purchase_date": "2025-01-01T00:00:00Z"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "usuario@ejemplo.com",
    "full_name": "Nombre Completo",
    "role": "student"
  },
  "message": "Usuario creado exitosamente"
}
```

### 3. Inscribir Usuario en Curso

**POST** `/api/hotmart/enroll-user`

Inscribe un usuario existente en un curso específico.

#### Headers
```
Authorization: Bearer tu-clave-secreta-aqui
Content-Type: application/json
```

#### Body
```json
{
  "user_id": "uuid-del-usuario",
  "course_id": "uuid-del-curso"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "enrollment": {
    "id": "enrollment-uuid",
    "user_id": "user-uuid",
    "course_id": "course-uuid",
    "enrolled_at": "2025-01-01T00:00:00Z",
    "progress_percentage": 0
  },
  "message": "Usuario inscrito exitosamente"
}
```

### 4. Validar Curso

**GET** `/api/courses/{course_id}/validate`

Valida que un curso existe y está publicado.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "course": {
    "id": "course-uuid",
    "title": "Nombre del Curso",
    "is_published": true
  }
}
```

## Códigos de Error

### 400 - Bad Request
```json
{
  "error": "Campos requeridos faltantes",
  "missing_fields": ["email", "full_name"]
}
```

### 401 - Unauthorized
```json
{
  "error": "No autorizado"
}
```

### 404 - Not Found
```json
{
  "error": "Curso no encontrado o no publicado",
  "course_id": "course-uuid"
}
```

### 405 - Method Not Allowed
```json
{
  "error": "Método no permitido"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor",
  "message": "Descripción del error"
}
```

## Ejemplo de Implementación desde tu Backend

```javascript
// Función para procesar webhook de Hotmart
async function processHotmartWebhook(hotmartData) {
  const apiData = {
    email: hotmartData.subscriber.email,
    full_name: hotmartData.subscriber.name,
    phone: hotmartData.subscriber.phone,
    course_id: hotmartData.product.id, // Mapear tu product ID a course ID
    transaction_id: hotmartData.transaction.id,
    purchase_date: hotmartData.transaction.purchase_date
  };

  const response = await fetch('https://tu-dominio.com/api/hotmart/process-purchase', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer tu-clave-secreta-aqui',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(apiData)
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Usuario procesado:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}
```

## Mapeo de Productos Hotmart a Cursos

Necesitarás crear un mapeo entre los IDs de productos de Hotmart y los IDs de cursos en tu sistema:

```javascript
const PRODUCT_COURSE_MAPPING = {
  'hotmart-product-id-1': 'supabase-course-uuid-1',
  'hotmart-product-id-2': 'supabase-course-uuid-2',
  // ...más mapeos
};

function mapProductToCourse(hotmartProductId) {
  return PRODUCT_COURSE_MAPPING[hotmartProductId];
}
```

## Consideraciones de Seguridad

1. **Clave API**: Mantén la `VITE_HOTMART_API_SECRET` segura y cámbiala regularmente
2. **HTTPS**: Usa siempre HTTPS en producción
3. **Validación**: Los endpoints validan todos los datos de entrada
4. **Rate Limiting**: Considera implementar rate limiting para evitar abuso

## Flujo Recomendado

1. Configura el webhook en Hotmart para apuntar a tu backend
2. Tu backend recibe la notificación de compra
3. Tu backend mapea el product_id de Hotmart al course_id de tu sistema
4. Tu backend llama al endpoint `/api/hotmart/process-purchase`
5. El usuario recibe un email con sus credenciales de acceso

## Notas Adicionales

- Los usuarios se crean con contraseñas temporales aleatorias
- Se envía un email de bienvenida (necesitas implementar el servicio de email)
- Si el usuario ya existe, solo se crea la inscripción
- Todas las operaciones son idempotentes (seguras para repetir)