// server.js
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importar la conexión a la base de datos
require('dotenv').config(); // Para usar las variables de entorno

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON

// Rutas
app.get('/', (req, res) => {
  res.send('API funcionando');
});

// Obtener todos los usuarios
app.get('/users', (req, res) => {
  const sql = 'SELECT * FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener los usuarios' });
      return;
    }
    res.json(results);
  });
});

// Crear un nuevo usuario
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
  db.query(sql, [name, email], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error al crear el usuario' });
      return;
    }
    res.json({ id: result.insertId, name, email });
  });
});

// Configurar el puerto del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
