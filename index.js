import express from 'express'; 
import pg from 'pg';
import { config } from 'dotenv';

config()

const app = express()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
})

// Ruta para crear todas las tablas
app.get('/createTables', async (req, res) => {
    try {
        const query = `
            DROP TABLE IF EXISTS usuario_Doctor;
            CREATE TABLE IF NOT EXISTS usuario_Doctor (
                id SERIAL PRIMARY KEY,
                nombreCompleto VARCHAR(255) NOT NULL,
                sexo_id INT NOT NULL,
                especialidad_id INT NOT NULL,
                dni INT NOT NULL UNIQUE,
                correoElectronico VARCHAR(255) NOT NULL,
                contrasena VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS prescripciones;
            CREATE TABLE IF NOT EXISTS prescripciones (
                id SERIAL PRIMARY KEY,
                doctor_id INT NOT NULL,
                paciente_id INT NOT NULL,
                diagnostico VARCHAR(255) NOT NULL,
                fecha TIMESTAMP NOT NULL
            );

            DROP TABLE IF EXISTS pastillas;
            CREATE TABLE IF NOT EXISTS pastillas (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                cantidad INT NOT NULL,
                dosis INT NOT NULL,
                cantidad_sobrante INT NOT NULL,
                frecuencia_id INT NOT NULL,
                fecha_inicio TIMESTAMP NOT NULL,
                observaciones VARCHAR(255),
                prescripcion_id INT NOT NULL
            );

            DROP TABLE IF EXISTS sexo;
            CREATE TABLE IF NOT EXISTS sexo (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS especialidades;
            CREATE TABLE IF NOT EXISTS especialidades (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS frecuencias;
            CREATE TABLE IF NOT EXISTS frecuencias (
                id SERIAL PRIMARY KEY,
                tipo VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS usuario_Paciente;
            CREATE TABLE IF NOT EXISTS usuario_Paciente (
                id SERIAL PRIMARY KEY,
                doctor_id INT,
                nombreCompleto VARCHAR(255) NOT NULL,
                sexo_id INT NOT NULL,
                edad INT,
                dni INT NOT NULL UNIQUE,
                correoElectronico VARCHAR(255) NOT NULL,
                contrasena VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS lista_Tomas;
            CREATE TABLE IF NOT EXISTS lista_Tomas (
                id SERIAL PRIMARY KEY,
                prescripcion_id INT NOT NULL,
                pastilla_id INT NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                fecha_toma TIMESTAMP NOT NULL,
                dosis INT NOT NULL,
                toma BOOLEAN NOT NULL
            );
        `;
        
        // Ejecutar la consulta para crear las tablas
        await pool.query(query);
        res.send('Tablas creadas exitosamente.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al crear las tablas.');
    }
});

app.get('/',(req,res)=> {
    res.send('Hello Word')
})

app.get('/ping', async (req, res) => {
    const result = await pool.query('SELECT NOW()')
    return res.json(result.rows[0])
  });

app.listen(3000)
console.log('Server on port',3000)

