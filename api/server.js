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

// Update api Bosquejos
const dbPromise = new sqlite3.Database('./data.sqlite3', (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos SQLite");
  }
});
app.post('/add-bosquejo', async (req, res) => {
  const { tema, pasaje, contenido, hashtags, bosquejo } = req.body;

  if (!tema || !pasaje || !contenido || !hashtags || !bosquejo) {
      return res.status(400).json({ success: false, message: "Todos los campos son requeridos" });
  }

  try {
      const db = await dbPromise;
      await db.run(
          'INSERT INTO bosquejos (tema, pasaje, contenido, hashtags, bosquejo) VALUES (?, ?, ?, ?, ?)',
          [tema, pasaje, contenido, JSON.stringify(hashtags), JSON.stringify(bosquejo)]
      );

      res.json({ success: true, message: "Bosquejo agregado correctamente" });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});