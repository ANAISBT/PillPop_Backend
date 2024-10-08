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

// Ruta para insertar datos en las tablas
app.get('/insertDataInicial', async (req, res) => {
    try {
        const query = `
            -- Insertar datos en la tabla 'sexo'
            INSERT INTO sexo (nombre) VALUES
            ('Masculino'),
            ('Femenino'),
            ('Otro');

            -- Insertar datos en la tabla 'especialidades'
            INSERT INTO especialidades (nombre) VALUES
            ('Cardiología'),
            ('Neurología'),
            ('Pediatría'),
            ('Dermatología');

            -- Insertar datos en la tabla 'frecuencias'
            INSERT INTO frecuencias (tipo) VALUES
            ('Cada 4 horas'),
            ('Cada 8 horas'),
            ('Cada 12 horas'),
            ('Cada 24 horas'),
            ('Cada 48 horas');
        `;

        // Ejecutar la consulta de inserción
        await pool.query(query);
        res.send('Datos insertados exitosamente en las tablas.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al insertar los datos.');
    }
});

// Ruta para hacer un SELECT de la tabla 'sexo'
app.get('/getDataSexo', async (req, res) => {
    try {
        const query = 'SELECT * FROM sexo';
        const result = await pool.query(query);
        res.json(result.rows); // Enviar los datos en formato JSON
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los datos de la tabla sexo.');
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

