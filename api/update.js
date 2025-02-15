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

    // Preparar la sentencia para insertar
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO bosquejos (id, tema, pasaje, contenido, hashtags, bosquejo)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    let count = 0; // Contador de registros procesados

    // Insertar o actualizar los datos
    data.forEach(item => {
        // Verificar si el ID ya existe
        db.get('SELECT id FROM bosquejos WHERE id = ?', [item.id], (err, row) => {
            if (!row) {
                // Si no existe, insertar el nuevo registro
                stmt.run(
                    item.id,
                    item.tema,
                    item.pasaje,
                    item.contenido,
                    JSON.stringify(item.hashtags),  // Convertir array a JSON
                    JSON.stringify(item.bosquejo)   // Convertir objeto a JSON
                );
                count++;
            }
            // Si existe, no se hace nada
        });
    });

    // Finalizar la declaración cuando todos los registros hayan sido procesados
    db.get("SELECT COUNT(*) AS count FROM bosquejos", (err, row) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Total de registros en la base de datos: ${row.count}`);
        }
        stmt.finalize();
    });
});

db.close();
