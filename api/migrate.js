const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite3');

const data = require('./BosquejoPredicacionales.json'); // Cargar tu archivo .json

db.serialize(() => {
    // Crear la tabla si no existe
    db.run(`
        CREATE TABLE IF NOT EXISTS bosquejos (
            id TEXT PRIMARY KEY,
            tema TEXT,
            pasaje TEXT,
            contenido TEXT,
            hashtags TEXT,
            bosquejo TEXT
        )
    `);

    // Insertar los datos
    const stmt = db.prepare(`
        INSERT INTO bosquejos (id, tema, pasaje, contenido, hashtags, bosquejo)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    data.forEach(item => {
        stmt.run(
            item.id,
            item.tema,
            item.pasaje,
            item.contenido,
            JSON.stringify(item.hashtags),  // Convertir array a JSON
            JSON.stringify(item.bosquejo)   // Convertir objeto a JSON
        );
    });

    stmt.finalize();
});

db.close();