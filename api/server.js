const express = require("express");
const request = require("request");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const STREAM_URL = process.env.STREAM_URL;

// Habilitar CORS para todas las rutas
app.use(cors({ origin: "*" }));
app.options('*', cors());  // Habilita CORS para las solicitudes OPTIONS
app.use(express.json()); // Agregar esto antes de las rutas

// Función para obtener la base de datos según la versión
function getDatabase(version) {
    const validVersions = ["rvr1960", "ntv", "nvi"];
    if (!validVersions.includes(version)) return null;
    return new sqlite3.Database(`api/data/${version}.sqlite`);
    console.log("Connectado a: ", validVersions)
}

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




// Aqui cargo las rutas de mi database de  mis versiones de la biblia .... 

// Buscar versículos por palabra clave
app.get("/api/:version/search/:keyword", (req, res) => {
    const db = getDatabase(req.params.version);
    if (!db) return res.status(400).json({ error: "Versión no válida" });

    const { keyword } = req.params;

    // Normalizar la palabra clave para ignorar tildes, mayúsculas y minúsculas
    const normalizedKeyword = keyword
        .normalize("NFD") // Normalizar a forma NFD (descomponer tildes)
        .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos (tildes)
        .toLowerCase(); // Convertir a minúsculas

    // Consulta SQL para buscar la palabra clave en los versículos
    const query = `
        SELECT v.id, b.name as book, v.chapter, v.verse, v.text 
        FROM verse v 
        JOIN book b ON v.book_id = b.id 
        WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v.text, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')) 
        LIKE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(?, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'))
    `;

    // Ejecutar la consulta
    db.all(query, [`%${normalizedKeyword}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Obtener metadata
app.get("/api/:version/metadata", (req, res) => {
    const db = getDatabase(req.params.version);
    if (!db) return res.status(400).json({ error: "Versión no válida" });

    db.all("SELECT * FROM metadata", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Listar los libros de la Biblia con número de capítulos
app.get("/api/:version/books", (req, res) => {
    const db = getDatabase(req.params.version);
    if (!db) return res.status(400).json({ error: "Versión no válida" });

    db.all("SELECT b.id, b.name, COUNT(DISTINCT v.chapter) as chapters FROM book b JOIN verse v ON b.id = v.book_id GROUP BY b.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener capítulos de un libro específico
app.get("/api/:version/:book", (req, res) => {
    const db = getDatabase(req.params.version);
    if (!db) return res.status(400).json({ error: "Versión no válida" });

    const { book } = req.params;
    const query = `SELECT v.chapter FROM verse v JOIN book b ON v.book_id = b.id WHERE b.name LIKE ? GROUP BY v.chapter`;
    const params = [`%${book}%`];

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener versículos de un capítulo específico de un libro
app.get("/api/:version/:book/:chapter", (req, res) => {
    const db = getDatabase(req.params.version);
    if (!db) return res.status(400).json({ error: "Versión no válida" });

    const { book, chapter } = req.params;
    const query = `SELECT v.id, b.name as book, v.chapter, v.verse, v.text FROM verse v JOIN book b ON v.book_id = b.id WHERE b.name LIKE ? AND v.chapter = ?`;
    const params = [`%${book}%`, chapter];

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener versículos por libro, capítulo y versículo específico
app.get("/api/:version/:book/:chapter/:verse", (req, res) => {
    const db = getDatabase(req.params.version);
    if (!db) return res.status(400).json({ error: "Versión no válida" });

    const { book, chapter, verse } = req.params;
    const query = `SELECT v.id, b.name as book, v.chapter, v.verse, v.text FROM verse v JOIN book b ON v.book_id = b.id WHERE b.name LIKE ? AND v.chapter = ? AND v.verse = ?`;
    const params = [`%${book}%`, chapter, verse];

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});



// Aqui inicia la parte de las datas de los sermiones y otros datos ...

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

// // Ruta para devolver todos los datos de sermones
// app.get("/api/sermones", (req, res) => {
//   const query = "SELECT * FROM bosquejos";
//   db.all(query, (err, rows) => {
//     if (err) {
//       console.error("Error al obtener los sermones:", err);
//       res.status(500).json({ error: "Error al obtener los sermones" });
//       return;
//     }
//     // Convertir JSON almacenado como texto a objetos
//     const sermons = rows.map(row => ({
//       ...row,
//       hashtags: JSON.parse(row.hashtags),
//       bosquejo: JSON.parse(row.bosquejo)
//     }));
//     res.json(sermons);
//   });
// });
app.get("/api/sermones", (req, res) => {
  // 1. Verificar los nombres de las columnas
  const query = "PRAGMA table_info(bosquejos)";
  db.all(query, (pragmaErr, columns) => {
    if (pragmaErr) {
      console.error("Error al obtener información de la tabla:", pragmaErr);
      res.status(500).json({
        error: "Error al obtener información de la tabla",
        message: pragmaErr.message,
      });
      return;
    }

    // 2. Buscar las columnas 'hashtags' y 'bosquejo'
    const hashtagsColumnExists = columns.some(
      (column) => column.name === "hashtags"
    );
    const bosquejoColumnExists = columns.some(
      (column) => column.name === "bosquejo"
    );

    if (!hashtagsColumnExists || !bosquejoColumnExists) {
      let errorMessage =
        "La tabla 'bosquejos' no tiene las siguientes columnas:";
      if (!hashtagsColumnExists) errorMessage += " hashtags";
      if (!bosquejoColumnExists) errorMessage += " bosquejo";

      console.error(errorMessage);
      res.status(500).json({
        error: "Error en la estructura de la base de datos",
        message: errorMessage,
      });
      return;
    }

    // 3. Consulta principal (ahora con seguridad de que las columnas existen)
    const sermonQuery = "SELECT * FROM bosquejos";
    db.all(sermonQuery, (err, rows) => {
      if (err) {
        console.error("Error al obtener los sermones:", err);
        res
          .status(500)
          .json({
            error: "Error al obtener los sermones",
            message: err.message,
          });
        return;
      }

      // 4. Manejar el caso de que no haya resultados
      if (!rows || rows.length === 0) {
        res.json([]); // Devuelve un array vacío si no hay sermones
        return;
      }

      // 5. Convertir JSON almacenado como texto a objetos, con manejo de errores
      const sermons = rows.map((row) => {
        let hashtags = [];
        let bosquejo = [];
        try {
          hashtags = row.hashtags ? JSON.parse(row.hashtags) : []; //Evitar el error de parsear un null
          bosquejo = row.bosquejo ? JSON.parse(row.bosquejo) : [];
        } catch (parseErr) {
          console.error("Error al parsear JSON:", parseErr);
          // Decide cómo manejar el error: puedes omitir el sermón, registrar el error y continuar, o usar valores por defecto.
          // Aquí, se registran el error y se usan valores por defecto para evitar que la aplicación se bloquee.
        }

        return {
          ...row,
          hashtags: hashtags,
          bosquejo: bosquejo,
        };
      });
      res.json(sermons);
    });
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