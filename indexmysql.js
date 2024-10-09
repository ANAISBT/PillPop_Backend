import express from 'express'; 
import mysql from 'mysql2/promise'; // Importar mysql2 con soporte para promesas
import { config } from 'dotenv';

config();

const app = express();
app.use(express.json());

// Crear un pool de conexiones MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST, // Reemplaza con tu host de MySQL
    user: process.env.DB_USER, // Reemplaza con tu usuario de MySQL
    password: process.env.DB_PASSWORD, // Reemplaza con tu contraseña de MySQL
    database: process.env.DB_DATABASE, // Reemplaza con tu nombre de base de datos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ruta para crear todas las tablas
app.get('/createTables', async (req, res) => {
    try {
        const query = `
            DROP TABLE IF EXISTS usuario_Doctor;
            CREATE TABLE IF NOT EXISTS usuario_Doctor (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombreCompleto VARCHAR(255) NOT NULL,
                sexo_id INT NOT NULL,
                especialidad_id INT NOT NULL,
                dni INT NOT NULL UNIQUE,
                correoElectronico VARCHAR(255) NOT NULL,
                contrasena VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS prescripciones;
            CREATE TABLE IF NOT EXISTS prescripciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                paciente_id INT NOT NULL,
                diagnostico VARCHAR(255) NOT NULL,
                fecha TIMESTAMP NOT NULL
            );

            DROP TABLE IF EXISTS pastillas;
            CREATE TABLE IF NOT EXISTS pastillas (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS especialidades;
            CREATE TABLE IF NOT EXISTS especialidades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS frecuencias;
            CREATE TABLE IF NOT EXISTS frecuencias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(255) NOT NULL
            );

            DROP TABLE IF EXISTS usuario_Paciente;
            CREATE TABLE IF NOT EXISTS usuario_Paciente (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
                id INT AUTO_INCREMENT PRIMARY KEY,
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
            INSERT INTO sexo (nombre) VALUES
            ('Masculino'),
            ('Femenino'),
            ('Otro');

            INSERT INTO especialidades (nombre) VALUES
            ('Cardiología'),
            ('Neurología'),
            ('Pediatría'),
            ('Dermatología');

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
        const [result] = await pool.query(query);
        res.json(result); // Enviar los datos en formato JSON
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los datos de la tabla sexo.');
    }
});





// Ruta para insertar un nuevo doctor en la tabla usuario_Doctor
app.post('/addPaciente', async (req, res) => {
    const { p_nombreCompleto, p_sexo_id, p_edad, p_dni, p_correoElectronico, p_contrasena } = req.body;

    try {
        const query = `CALL agregarPaciente(?, ?,?, ?,?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros
        const [result] = await pool.query(query, [p_nombreCompleto, p_sexo_id, p_edad, p_dni, p_correoElectronico, p_contrasena]);

        // Verificar si el resultado contiene un mensaje de éxito o error
        if (result && result[0].length > 0) {
            const registroPaciente = result[0][0]; // Obtener la primera fila de resultados
            if (registroPaciente !== null) {
                res.json({
                    mensaje: "Registro exitoso",//registroPaciente.mensaje,
                    id: registroPaciente.p_paciente_id // El ID del doctor devuelto
                });
            } else {
                res.json({
                    mensaje: registroPaciente.mensaje // Mensaje de credenciales incorrectas
                });
            }
        } else {
            res.status(500).send('Error al procesar la solicitud.');
        }
    } catch (err) {
        console.error('Error al iniciar sesión:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.post('/addPrescripcion', async (req, res) => {
    const {
        p_dni,
        p_doctor_id,
        p_diagnostico,
        p_fecha
    } = req.body;

    try {
        const query = `CALL agregarPrescripcion(?, ?, ?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros
        const [result] = await pool.query(query, [p_dni, p_doctor_id, p_diagnostico, p_fecha]);

        // Log del resultado para verificar la respuesta
        console.log(result);

        // Verificar si se ha devuelto el ID de la prescripción
        if (result && result[0].length > 0) {
            const prescripcionResult = result[0][0]; // Obtener la primera fila de resultados
            res.json({
                mensaje: 'Prescripción agregada exitosamente',
                id: prescripcionResult.p_prescripcion_id // El ID de la prescripción devuelto
            });
        } else {
            res.status(500).json({ mensaje: 'Error al procesar la solicitud, resultado vacío.' });
        }
    } catch (err) {
        console.error('Error al agregar prescripción:', err.message);
        res.status(500).json({ mensaje: 'Error al procesar la solicitud.', error: err.message });
    }
});

app.post('/cambiarTomaA1', async (req, res) => {
    const { tomaID } = req.body; // Obtener el ID de la toma del cuerpo de la solicitud

    try {
        const query = `CALL CambiarTomaA1(?)`; // Llamar al procedimiento almacenado

        // Ejecutar el procedimiento almacenado con el parámetro
        const [result] = await pool.query(query, [tomaID]);

        res.json({
            mensaje: 'Toma actualizada a 1 exitosamente.',
            id: tomaID
        });
    } catch (err) {
        console.error('Error al cambiar la toma:', err.message);
        res.status(500).json({ mensaje: 'Error al procesar la solicitud.', error: err.message });
    }
});

app.post('/editarPrescripcion', async (req, res) => {
    const { p_dni, p_prescripcion_id, p_diagnostico, p_fecha } = req.body; // Obtener los datos del cuerpo de la solicitud

    try {
        const query = `CALL editarPrescripcion(?, ?, ?, ?)`; // Llamar al procedimiento almacenado

        // Ejecutar el procedimiento almacenado con los parámetros
        const [result] = await pool.query(query, [p_dni, p_prescripcion_id, p_diagnostico, p_fecha]);

        // Verificar si se ha obtenido un resultado
        if (result && result[0].length > 0) {
            const prescripcionResult = result[0][0]; // Obtener la primera fila de resultados
            res.json({
                mensaje: 'Prescripción actualizada exitosamente.',
                id: prescripcionResult.p_prescripcion_id // Retornar el ID de la prescripción
            });
        } else {
            res.status(500).send('Error al procesar la solicitud.');
        }
    } catch (err) {
        console.error('Error al editar la prescripción:', err.message);
        // Si el error es un mensaje personalizado del procedimiento, usar el mensaje correspondiente
        if (err.code === 'ER_SIGNAL_SQLSTATE') {
            res.status(400).json({ mensaje: err.message });
        } else {
            res.status(500).send('Error al procesar la solicitud.');
        }
    }
});

app.delete('/eliminarPrescripcion/:id', async (req, res) => {
    const { id } = req.params; // Obtener el ID de la prescripción de los parámetros de la ruta

    try {
        const query = `CALL eliminarPrescripcion(?)`; // Llamar al procedimiento almacenado

        // Ejecutar el procedimiento almacenado con el ID de la prescripción
        await pool.query(query, [id]);

        res.json({
            mensaje: 'Prescripción eliminada exitosamente.',
        });
    } catch (err) {
        console.error('Error al eliminar la prescripción:', err.message);
        // Si el error es un mensaje personalizado del procedimiento, usar el mensaje correspondiente
        if (err.code === 'ER_SIGNAL_SQLSTATE') {
            res.status(400).json({ mensaje: err.message });
        } else {
            res.status(500).send('Error al procesar la solicitud.');
        }
    }
});

app.post('/insertarPastillas', async (req, res) => {
    const {nombre,cantidad,dosis,cantidad_sobrante,frecuencia_id,fecha_inicio,
        observaciones,prescripcion_id} = req.body;
    try {
        const query = `CALL InsertarPastillas(?, ?, ?, ?, ?, ?, ?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        await pool.query(query, [nombre, cantidad, dosis, cantidad_sobrante, frecuencia_id, fecha_inicio, observaciones, prescripcion_id]);

        res.json({
            mensaje: 'Pastillas insertadas exitosamente.',
        });
    } catch (err) {
        console.error('Error al insertar las pastillas:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.post('/insertarDoctor', async (req, res) => {
    const {nombreCompleto,sexo_id,especialidad_id,dni,correoElectronico,contrasena} = req.body;

    try {
        const query = `CALL InsertarUsuarioDoctor(?, ?, ?, ?, ?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        await pool.query(query, [nombreCompleto, sexo_id, especialidad_id, dni, correoElectronico, contrasena]);

        res.json({
            mensaje: 'Doctor insertado exitosamente.',
        });
    } catch (err) {
        console.error('Error al insertar el doctor:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.post('/loginDoctor', async (req, res) => {
    const { dni, contrasena } = req.body;

    try {
        const query = `CALL LoginUsuarioDoctor(?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        const [rows] = await pool.query(query, [dni, contrasena]);

        if (rows[0][0].mensaje === 'Login exitoso') {
            res.json({
                mensaje: rows[0][0].mensaje,
                id: rows[0][0].id // Devuelve el ID del doctor
            });
        } else {
            res.status(401).json({
                mensaje: rows[0][0].mensaje // Credenciales incorrectas
            });
        }
    } catch (err) {
        console.error('Error en el login:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.get('/obtenerDatosDoctor/:id', async (req, res) => {
    const doctorID = req.params.id;

    try {
        const query = `CALL obtenerDatosDoctorPorId(?)`;

        // Ejecutar el procedimiento almacenado con el parámetro correspondiente
        const [rows] = await pool.query(query, [doctorID]);

        if (rows[0].length > 0) {
            // Retornar los datos del doctor
            res.json(rows[0][0]);
        } else {
            res.status(404).json({ mensaje: 'Doctor no encontrado' });
        }
    } catch (err) {
        console.error('Error al obtener datos del doctor:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.get('/obtenerDatosToma/:id', async (req, res) => {
    const tomaID = req.params.id;

    try {
        const query = `CALL obtenerDatosTomaPorId(?)`;

        // Ejecutar el procedimiento almacenado con el parámetro correspondiente
        const [rows] = await pool.query(query, [tomaID]);

        if (rows[0].length > 0) {
            // Retornar los datos de la toma
            res.json(rows[0][0]);
        } else {
            res.status(404).json({ mensaje: 'Toma no encontrada' });
        }
    } catch (err) {
        console.error('Error al obtener datos de la toma:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.get('/obtenerPrescripcionesXDoctorFecha/:doctorId/:fechaHoy', async (req, res) => {
    const doctorId = parseInt(req.params.doctorId);
    const fechaHoy = req.params.fechaHoy; // Asegúrate de que la fecha esté en formato YYYY-MM-DD

    try {
        const query = `CALL ObtenerPrescripcionesPorDoctorYFecha(?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        const [rows] = await pool.query(query, [doctorId, fechaHoy]);

        if (rows[0].length > 0) {
            // Retornar las prescripciones encontradas
            res.json(rows[0]);
        } else {
            res.status(404).json({ mensaje: 'No se encontraron prescripciones para el doctor en la fecha especificada' });
        }
    } catch (err) {
        console.error('Error al obtener prescripciones:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.get('/obtenerTomasXPacienteFecha/:pacienteId/:fechaHoy', async (req, res) => {
    const pacienteId = parseInt(req.params.pacienteId);
    const fechaHoy = req.params.fechaHoy; // Asegúrate de que la fecha esté en formato YYYY-MM-DD

    try {
        const query = `CALL ObtenerTomasPorPacienteYFecha(?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        const [rows] = await pool.query(query, [pacienteId, fechaHoy]);

        if (rows[0].length > 0) {
            // Retornar las tomas encontradas
            res.json(rows[0]);
        } else {
            res.status(404).json({ mensaje: 'No se encontraron tomas para el paciente en la fecha especificada' });
        }
    } catch (err) {
        console.error('Error al obtener tomas:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});






app.get('/', (req, res) => {
    res.send('API Pillpop');
});

app.get('/ping', async (req, res) => {
    const [result] = await pool.query('SELECT NOW()');
    return res.json(result[0]);
});

app.listen(3000);
console.log('Server on port', 3000);
