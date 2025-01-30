// const express = require("express");
// const request = require("request");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");
// const fs = require("fs");
// dotenv.config();

// const app = express();

// const PORT = process.env.PORT || 3002;
// const STREAM_URL = process.env.STREAM_URL;
// // Habilitar CORS para todas las rutas
// app.use(cors({
//  origin: "*",
// }));

// const versePath = path.join(__dirname, "../json/ReferenciasBiblicas.json");
// let verseData = [];

// const sermonPath = path.join(__dirname, "../json/BosquejoPredicacionales.json");
// let sermonData = [];

// // Leer el archivo JSON y almacenar los datos en SermonData
// fs.readFile(sermonPath, 'utf-8', (err, data) => {
//   if (err) {
//     console.error("Error al leer el archivo JSON:", err);
//     return;
//   }

//   try {
//     sermonData = JSON.parse(data); // Parsear los datos JSON y almacenarlos en sermonData
//   } catch (parseError) {
//     console.error("Error al parsear el archivo JSON:", parseError);
//   }
// });

// // Leer el archivo JSON y almacenar los datos en verseData
// fs.readFile(versePath, 'utf-8', (err, data) => {
//   if (err) {
//     console.error("Error al leer el archivo JSON:", err);
//     return;
//   }

//   try {
//     verseData = JSON.parse(data); // Parsear los datos JSON y almacenarlos en verseData
//   } catch (parseError) {
//     console.error("Error al parsear el archivo JSON:", parseError);
//   }
// });
// // Ruta para devolver todos los datos de sermonData
// app.get("/api/sermones", (req, res) => {
//   res.json(sermonData); // Responder con todos los datos de verseData
// });

// // Ruta para devolver todos los datos de verseData
// app.get("/api/verses", (req, res) => {
//   res.json(verseData); // Responder con todos los datos de verseData
// });

// // Ruta para devolver un verso específico por ID
// app.get("/api/verses/:id", (req, res) => {
//   const verseId = parseInt(req.params.id); // Convertir el parámetro id a un número
//   const verse = verseData.find(v => v.id === verseId); // Buscar el verso por ID

//   if (verse) {
//     res.json(verse); // Devolver el verso si se encuentra
//   } else {
//     res.status(404).json({ message: "Verso no encontrado" }); // Enviar un mensaje de error si no se encuentra
//   }
// });


// // Ruta para retransmitir el stream
// app.get('/stream', (req, res) => {
//   res.setHeader('Content-Type', 'audio/mpeg'); // Asegura el tipo de contenido
//   request({
//     url: STREAM_URL,
//     rejectUnauthorized: false,
//   }).pipe(res).on('error', (err) => {
//     console.error('Error al acceder al stream:', err);
//     res.sendStatus(500);
//   });
// });



// // siguiente ruta de la pai de la biblia and more 


// // Realizar la solicitud al servidor de audio y transmitir la respuesta


// // Iniciar el servidor
// app.listen(PORT, () => {
//   console.log(`Proxy server running on http://localhost:${PORT}`);
// });



const express = require("express");
const request = require("request");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const STREAM_URL = process.env.STREAM_URL;

// Habilitar CORS para todas las rutas
app.use(cors({ origin: "*" }));
app.options('*', cors());  // Habilita CORS para las solicitudes OPTIONS


// Conectar a la base de datos SQLite
const dbPath = path.join(__dirname, "data.sqlite3");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos SQLite");
  }
});
// Conectar a la base de datos SQLite Verses
const dbVerses = path.join(__dirname, "Verses.sqlite3");
const dbVerse = new sqlite3.Database(dbVerses, (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos SQLite");
  }
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});


// Ruta para devolver todos los datos de sermones
app.get("/api/sermones", (req, res) => {
  const query = "SELECT * FROM bosquejos";
  db.all(query, (err, rows) => {
    if (err) {
      console.error("Error al obtener los sermones:", err);
      res.status(500).json({ error: "Error al obtener los sermones" });
      return;
    }
    // Convertir JSON almacenado como texto a objetos
    const sermons = rows.map(row => ({
      ...row,
      hashtags: JSON.parse(row.hashtags),
      bosquejo: JSON.parse(row.bosquejo)
    }));
    res.json(sermons);
  });
});

// Ruta para devolver un sermón específico por ID
app.get("/api/sermones/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM bosquejos WHERE id = ?";
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("Error al obtener el sermón:", err);
      res.status(500).json({ error: "Error al obtener el sermón" });
      return;
    }
    if (row) {
      // Convertir JSON almacenado como texto a objetos
      row.hashtags = JSON.parse(row.hashtags);
      row.bosquejo = JSON.parse(row.bosquejo);
      res.json(row);
    } else {
      res.status(404).json({ message: "Sermón no encontrado" });
    }
  });
});

// Ruta para devolver todos los versos (si tienes una tabla para versos)
app.get("/api/verses", (req, res) => {
  const query = "SELECT * FROM versos"; // Cambia "versos" por el nombre de tu tabla
  dbVerse.all(query, (err, rows) => {
    if (err) {
      console.error("Error al obtener los versos:", err);
      res.status(500).json({ error: "Error al obtener los versos" });
      return;
    }
    res.json(rows);
  });
});

// Ruta para devolver un verso específico por ID
app.get("/api/verses/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM versos WHERE id = ?"; // Cambia "versos" por el nombre de tu tabla
  dbVerse.get(query, [id], (err, row) => {
    if (err) {
      console.error("Error al obtener el verso:", err);
      res.status(500).json({ error: "Error al obtener el verso" });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: "Verso no encontrado" });
    }
  });
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

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});