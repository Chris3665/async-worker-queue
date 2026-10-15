const { Queue } = require('bullmq');

// Configuración de conexión a la instancia local/Docker de Redis
// BullMQ requiere que maxRetriesPerRequest sea null para el Worker
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
};

// Instancia de la cola llamada 'reportes-correo-queue'
const reportQueue = new Queue('reportes-correo-queue', {
  connection: redisConnection
});

module.exports = {
  reportQueue,
  redisConnection
};