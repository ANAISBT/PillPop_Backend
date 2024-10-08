import express from 'express'; 
import pg from 'pg';
import { config } from 'dotenv';

config()

const app = express()

// Definir un puerto para nuestro servidor
const port = 3000 || process.env.PORT;

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
})

app.get('/',(req,res)=> {
    res.send('Hello Word')
})

app.get('/ping', async (req, res) => {
    const result = await pool.query('SELECT NOW()')
    return res.json(result.rows[0])
  });

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
