const { Worker } = require('bullmq');
const { redisConnection } = require('./queue');

console.log('[Worker] Iniciando consumidor y esperando trabajos en la cola...');

// Función auxiliar para simular un proceso pesado (ej. generar PDF y enviar email por SMTP)
const simularProcesoPesado = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Definición del Worker independiente
const worker = new Worker(
  'reportes-correo-queue',
  async (job) => {
    console.log(`\n[Worker] Iniciando procesamiento del Job ID: ${job.id} (Intento #${job.attemptsMade + 1})`);
    console.log(`[Worker] Generando reporte "${job.data.tipoReporte}" para el destinatario: ${job.data.email}...`);

    // Simulamos que la tarea pesada tarda 4 segundos
    await simularProcesoPesado(4000);

    // Validación por si se quiere simular un fallo y probar los reintentos automáticos
    if (job.data.forzarError) {
      throw new Error('Fallo simulado en el servidor SMTP al enviar el correo');
    }

    console.log(`[Worker] Comprobante enviado con éxito a ${job.data.email}`);
    
    return {
      procesadoEn: new Date().toISOString(),
      comprobanteId: `CMP-${Math.floor(100000 + Math.random() * 900000)}`,
      estado: 'Enviado'
    };
  },
  { connection: redisConnection }
);

// Eventos del ciclo de vida del Worker para monitoreo en consola
worker.on('completed', (job, returnvalue) => {
  console.log(`[Worker] Job ID ${job.id} completado exitosamente. Resultado:`, returnvalue);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ID ${job.id} falló en el intento #${job.attemptsMade}. Motivo: ${err.message}`);
});