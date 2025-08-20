/**
 * Script de prueba para verificar el manejo de webhooks duplicados
 * Ejecutar: node test_duplicate_scenarios.js
 */

const API_URL = 'http://localhost:3000/api/hotmart/process-purchase';
const API_SECRET = 'tu-clave-secreta-aqui';

const testData = {
  email: 'test-duplicados@ejemplo.com',
  full_name: 'Usuario Prueba Duplicados',
  phone: '+123456789',
  course_id: 'course-uuid-para-pruebas', // Cambiar por un course_id real
  transaction_id: 'test-tx-12345',
  purchase_date: '2025-01-01T00:00:00Z'
};

async function callAPI(data, testName) {
  console.log(`\n🧪 ${testName}`);
  console.log('📤 Enviando:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    console.log(`📨 Respuesta [${response.status}]:`, JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de webhooks duplicados...\n');
  
  // Test 1: Primera compra (usuario nuevo)
  await callAPI(testData, 'Test 1: Primera compra');
  
  // Test 2: Webhook duplicado CON transaction_id (debería detectar duplicado)
  await callAPI(testData, 'Test 2: Webhook duplicado CON transaction_id');
  
  // Test 3: Webhook SIN transaction_id para el mismo usuario/curso
  const dataWithoutTx = { ...testData };
  delete dataWithoutTx.transaction_id;
  await callAPI(dataWithoutTx, 'Test 3: Webhook SIN transaction_id');
  
  // Test 4: Otro webhook SIN transaction_id (condición de carrera simulada)
  await callAPI(dataWithoutTx, 'Test 4: Otro webhook SIN transaction_id');
  
  // Test 5: Usuario existente en curso nuevo
  const newCourseData = {
    ...testData,
    course_id: 'otro-course-uuid',
    transaction_id: 'test-tx-67890'
  };
  await callAPI(newCourseData, 'Test 5: Usuario existente, curso nuevo');
  
  console.log('\n✅ Pruebas completadas');
}

// Verificar si fetch está disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Este script requiere Node.js 18+ o instalar node-fetch');
  console.log('Para instalar: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
