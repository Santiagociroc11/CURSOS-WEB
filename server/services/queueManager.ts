import { HotmartService, HotmartPurchaseData } from './hotmartService.js';

interface QueueJob {
  id: string;
  data: HotmartPurchaseData;
  timestamp: number;
  retries: number;
  maxRetries: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

interface ProcessingResult {
  user: any;
  enrollment: any;
  isNewUser: boolean;
  isNewEnrollment: boolean;
  transactionAlreadyProcessed: boolean;
}

class QueueManager {
  private queue: QueueJob[] = [];
  private isProcessing = false;
  private completedJobs = new Map<string, ProcessingResult>();
  private failedJobs = new Map<string, string>(); // jobId -> error message

  constructor() {
    console.log('QueueManager inicializado');
  }

  /**
   * Agrega una compra a la cola y retorna una promesa
   */
  async enqueue(purchaseData: HotmartPurchaseData): Promise<ProcessingResult> {
    const jobId = `hotmart_${purchaseData.transaction_id}_${Date.now()}`;
    
    console.log(`[QUEUE] Encolando job ${jobId} para transacción ${purchaseData.transaction_id}`);

    return new Promise((resolve, reject) => {
      const job: QueueJob = {
        id: jobId,
        data: purchaseData,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
        resolve,
        reject
      };

      this.queue.push(job);
      
      // Iniciar procesamiento si no está corriendo
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Procesa la cola secuencialmente
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[QUEUE] Iniciando procesamiento de ${this.queue.length} jobs`);

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      await this.processJob(job);
    }

    this.isProcessing = false;
    console.log('[QUEUE] Procesamiento de cola completado');
  }

  /**
   * Procesa un job individual
   */
  private async processJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`[QUEUE] Procesando job ${job.id} (intento ${job.retries + 1}/${job.maxRetries + 1})`);
      
      const result = await HotmartService.processPurchase(job.data);
      
      const processingTime = Date.now() - startTime;
      console.log(`[QUEUE] ✅ Job ${job.id} completado en ${processingTime}ms`);
      
      // Guardar resultado para consultas posteriores
      this.completedJobs.set(job.id, result);
      
      job.resolve(result);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[QUEUE] ❌ Error en job ${job.id} (${processingTime}ms):`, error);
      
      // Incrementar reintentos
      job.retries++;
      
      if (job.retries <= job.maxRetries) {
        console.log(`[QUEUE] 🔄 Reintentando job ${job.id} en 2 segundos...`);
        
        // Reintentar después de un delay
        setTimeout(() => {
          this.queue.unshift(job); // Agregar al inicio de la cola
          this.processQueue();
        }, 2000);
        
      } else {
        // Máximo de reintentos alcanzado
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        this.failedJobs.set(job.id, errorMessage);
        
        console.error(`[QUEUE] 💥 Job ${job.id} falló definitivamente después de ${job.maxRetries + 1} intentos`);
        job.reject(error);
      }
    }
  }

  /**
   * Obtiene estadísticas de la cola
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      completedJobs: this.completedJobs.size,
      failedJobs: this.failedJobs.size,
      completedJobIds: Array.from(this.completedJobs.keys()),
      failedJobIds: Array.from(this.failedJobs.keys())
    };
  }

  /**
   * Obtiene el resultado de un job completado
   */
  getJobResult(jobId: string): ProcessingResult | undefined {
    return this.completedJobs.get(jobId);
  }

  /**
   * Obtiene el error de un job fallido
   */
  getJobError(jobId: string): string | undefined {
    return this.failedJobs.get(jobId);
  }

  /**
   * Limpia jobs antiguos (más de 1 hora)
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Limpiar jobs completados antiguos
    for (const [jobId, result] of this.completedJobs.entries()) {
      // Asumimos que el timestamp está en el jobId
      const timestamp = parseInt(jobId.split('_')[2]);
      if (timestamp < oneHourAgo) {
        this.completedJobs.delete(jobId);
      }
    }
    
    // Limpiar jobs fallidos antiguos
    for (const [jobId, error] of this.failedJobs.entries()) {
      const timestamp = parseInt(jobId.split('_')[2]);
      if (timestamp < oneHourAgo) {
        this.failedJobs.delete(jobId);
      }
    }
    
    console.log('[QUEUE] Limpieza de jobs antiguos completada');
  }
}

// Singleton instance
export const queueManager = new QueueManager();

// Limpiar jobs antiguos cada hora
setInterval(() => {
  queueManager.cleanup();
}, 60 * 60 * 1000);
