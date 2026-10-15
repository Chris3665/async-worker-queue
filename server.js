const express = require('express');
const { reportQueue } = require('./queue');

const app = express();
app.use(express.json());

const PORT = 3001; // Use 3001 para que no choque con el 3000 del contenedor anterior de la tarea pasada

// Endpoint Productor: Delega la tarea pesada a la cola y responde de inmediato
app.post('/api/generar-reporte', async (req, res) => {
  try {
    const { email, tipoReporte } = req.body;

    if (!email || !tipoReporte) {
      return res.status(400).json({
        error: 'Los campos email y tipoReporte son obligatorios'
      });
    }

    // Encolar el trabajo con configuración de reintentos automáticos (Backoff exponencial)
    const job = await reportQueue.add(
      'enviar-comprobante-pdf',
      {
        email,
        tipoReporte,
        fechaSolicitud: new Date().toISOString()
      },
      {
        attempts: 3, // Si falla, reintenta hasta 3 veces automáticamente
        backoff: {
          type: 'exponential',
          delay: 2000 // Espera 2s, luego 4s, luego 8s entre reintentos
        }
      }
    );

    console.log(`[Productor API] Trabajo encolado exitosamente con Job ID: ${job.id}`);

    // Respuesta inmediata 202 Accepted sin bloquear al cliente
    return res.status(202).json({
      mensaje: 'Solicitud aceptada. El reporte se está generando y enviando en segundo plano.',
      estado: 'En cola',
      jobId: job.id,
      datos: { email, tipoReporte }
    });
  } catch (error) {
    console.error('Error al encolar el trabajo:', error.message);
    return res.status(500).json({ error: 'Error interno al encolar la tarea' });
  }
});

app.listen(PORT, () => {
  console.log(`[Productor API] Servidor HTTP escuchando en http://localhost:${PORT}`);
});