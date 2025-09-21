import React, { useState, useEffect } from 'react';

interface QueueStats {
  queueLength: number;
  isProcessing: boolean;
  completedJobs: number;
  failedJobs: number;
  completedJobIds: string[];
  failedJobIds: string[];
}

export const QueueMonitor: React.FC = () => {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hotmart/queue/stats', {
        headers: {
          'Authorization': `Bearer tu-clave-secreta-aqui` // En producción esto debería venir de .env
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Error al cargar estadísticas</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Monitor de Cola Hotmart
        </h3>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Cola Pendiente */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {stats.queueLength}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">En Cola</p>
                <p className="text-xs text-blue-600">Pendientes</p>
              </div>
            </div>
          </div>

          {/* Procesando */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  {stats.isProcessing ? (
                    <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-yellow-600 font-semibold text-sm">0</span>
                  )}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Procesando</p>
                <p className="text-xs text-yellow-600">
                  {stats.isProcessing ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>

          {/* Completados */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">
                    {stats.completedJobs}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Completados</p>
                <p className="text-xs text-green-600">Exitosos</p>
              </div>
            </div>
          </div>

          {/* Fallidos */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">
                    {stats.failedJobs}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-900">Fallidos</p>
                <p className="text-xs text-red-600">Con errores</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado del Sistema */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Estado del Sistema</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <span className="font-medium">Última actualización:</span>{' '}
            {new Date().toLocaleTimeString()}
          </p>
          <p>
            <span className="font-medium">Estado:</span>{' '}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              stats?.isProcessing 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {stats?.isProcessing ? 'Procesando' : 'En espera'}
            </span>
          </p>
          {stats && stats.queueLength > 0 && (
            <p>
              <span className="font-medium">Tiempo estimado:</span>{' '}
              {stats.queueLength * 3} segundos
            </p>
          )}
        </div>
      </div>

      {/* Información Adicional */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          💡 La cola procesa las compras de Hotmart secuencialmente para evitar conflictos.
          Cada compra se procesa automáticamente con reintentos en caso de error.
        </p>
      </div>
    </div>
  );
};
