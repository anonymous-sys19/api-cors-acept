import express from "express";
import request from "request";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3002;
const STREAM_URL = process.env.STREAM_URL;
// Habilitar CORS para todas las rutas
app.use(cors({
  origin: 'http://localhost:3001', // Cambia esto al puerto donde tu frontend está corriendo
}));




// Ruta para retransmitir el stream



// Ruta para retransmitir el stream
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'audio/mpeg'); // Asegura el tipo de contenido
  request({
    url: STREAM_URL,
    rejectUnauthorized: false,
  }).pipe(res).on('error', (err) => {
    console.error('Error al acceder al stream:', err);
    res.sendStatus(500);
  });
});

// Realizar la solicitud al servidor de audio y transmitir la respuesta


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
