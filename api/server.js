const express = require("express");
const request = require("request");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3002;
const STREAM_URL = process.env.STREAM_URL;
// Habilitar CORS para todas las rutas
app.use(cors({
 origin: "*",
}));

const versePath = path.join(__dirname, "../json/ReferenciasBiblicas.json");
let verseData = [];

const sermonPath = path.join(__dirname, "../json/BosquejoPredicacionales.json");
let sermonData = [];

// Leer el archivo JSON y almacenar los datos en SermonData
fs.readFile(sermonPath, 'utf-8', (err, data) => {
  if (err) {
    console.error("Error al leer el archivo JSON:", err);
    return;
  }

  try {
    sermonData = JSON.parse(data); // Parsear los datos JSON y almacenarlos en sermonData
  } catch (parseError) {
    console.error("Error al parsear el archivo JSON:", parseError);
  }
});

// Leer el archivo JSON y almacenar los datos en verseData
fs.readFile(versePath, 'utf-8', (err, data) => {
  if (err) {
    console.error("Error al leer el archivo JSON:", err);
    return;
  }

  try {
    verseData = JSON.parse(data); // Parsear los datos JSON y almacenarlos en verseData
  } catch (parseError) {
    console.error("Error al parsear el archivo JSON:", parseError);
  }
});
// Ruta para devolver todos los datos de sermonData
app.get("/api/sermones", (req, res) => {
  res.json(sermonData); // Responder con todos los datos de verseData
});

// Ruta para devolver todos los datos de verseData
app.get("/api/verses", (req, res) => {
  res.json(verseData); // Responder con todos los datos de verseData
});

// Ruta para devolver un verso específico por ID
app.get("/api/verses/:id", (req, res) => {
  const verseId = parseInt(req.params.id); // Convertir el parámetro id a un número
  const verse = verseData.find(v => v.id === verseId); // Buscar el verso por ID

  if (verse) {
    res.json(verse); // Devolver el verso si se encuentra
  } else {
    res.status(404).json({ message: "Verso no encontrado" }); // Enviar un mensaje de error si no se encuentra
  }
});


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



// siguiente ruta de la pai de la biblia and more 


// Realizar la solicitud al servidor de audio y transmitir la respuesta


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
