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
app.post('/addDoctor', async (req, res) => {
    const { p_nombreCompleto, p_sexo_id, p_especialidad_id, p_dni, p_correoElectronico, p_contrasena } = req.body;

    try {
        const query = `
            INSERT INTO usuario_Doctor (
                nombreCompleto, 
                sexo_id, 
                especialidad_id, 
                dni, 
                correoElectronico, 
                contrasena
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Ejecutar la consulta con los parámetros
        await pool.query(query, [
            p_nombreCompleto, 
            p_sexo_id, 
            p_especialidad_id, 
            p_dni, 
            p_correoElectronico, 
            p_contrasena
        ]);

        res.send('Doctor insertado exitosamente.');
    } catch (err) {
        console.error('Error al insertar el doctor:', err.message);
        res.status(500).send('Error al insertar el doctor.');  
    }
});

// Ruta para obtener los datos de un doctor por su id
app.get('/getDoctor/:doctorID', async (req, res) => {
    const { doctorID } = req.params;

    try {
        const query = `
            SELECT 
                id, 
                nombreCompleto, 
                sexo_id, 
                especialidad_id, 
                dni, 
                correoElectronico
            FROM 
                usuario_Doctor
            WHERE 
                id = ?
        `;

        const [result] = await pool.query(query, [doctorID]);

        if (result.length > 0) {
            res.json(result[0]); // Enviar los datos del doctor si se encuentra
        } else {
            res.status(404).send('Doctor no encontrado.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener el doctor.');
    }
});

// Ruta para el login de doctor
app.post('/loginDoctor', async (req, res) => {
    const { p_dni, p_contrasena } = req.body;

    try {
        const query = `CALL LoginUsuarioDoctor(?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros
        const [result] = await pool.query(query, [p_dni, p_contrasena]);

        // Verificar si el resultado contiene un mensaje de éxito o error
        if (result && result[0].length > 0) {
            const loginResult = result[0][0]; // Obtener la primera fila de resultados
            if (loginResult.mensaje === 'Login exitoso') {
                res.json({
                    mensaje: loginResult.mensaje,
                    id: loginResult.v_id // El ID del doctor devuelto
                });
            } else {
                res.json({
                    mensaje: loginResult.mensaje // Mensaje de credenciales incorrectas
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

// Ruta para editar los datos del doctor
app.put('/editarDoctor/:id', async (req, res) => {
    const { id } = req.params;
    const { p_nombreCompleto, p_sexo_id, p_especialidad_id, p_dni, p_correoElectronico } = req.body;

    try {
        const query = `CALL EditarDoctor(?, ?, ?, ?, ?, ?)`;
        await pool.query(query, [id, p_nombreCompleto, p_sexo_id, p_especialidad_id, p_dni, p_correoElectronico]);

        res.json({
            mensaje: 'Datos del doctor actualizados exitosamente.'
        });
    } catch (err) {
        console.error('Error al actualizar los datos del doctor:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});


// Ruta para editar la contraseña de un doctor
app.put('/editarContrasenaDoctor/:id', async (req, res) => {
    const { id } = req.params; // Obtiene el id del doctor desde los parámetros de la URL
    const { p_contrasena } = req.body; // Obtiene la nueva contraseña del cuerpo de la solicitud

    try {
        const query = `CALL EditarContrasenaDoctor(?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros
        await pool.query(query, [id, p_contrasena]);

        res.send('Contraseña actualizada exitosamente.');
    } catch (err) {
        console.error('Error al editar la contraseña:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

// Ruta para obtener los datos del paciente por ID
app.get('/paciente/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = `CALL ObtenerDatosPacientePorId(?)`;
        const [result] = await pool.query(query, [id]);

        if (result.length > 0) {
            res.json(result[0]); // Devuelve los datos del paciente
        } else {
            res.status(404).json({
                mensaje: 'Paciente no encontrado.'
            });
        }
    } catch (err) {
        console.error('Error al obtener los datos del paciente:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

// Ruta para editar los datos del paciente
app.put('/editarpaciente/:id', async (req, res) => {
    const { id } = req.params;
    const { nombreCompleto, sexo_id, edad, dni, correoElectronico } = req.body;

    try {
        const query = `CALL EditarDatosPaciente(?, ?, ?, ?, ?, ?)`;
        await pool.query(query, [id, nombreCompleto, sexo_id, edad, dni, correoElectronico]);

        res.json({
            mensaje: 'Datos del paciente actualizados con éxito.'
        });
    } catch (err) {
        console.error('Error al editar los datos del paciente:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

// Ruta para editar la contraseña del paciente
app.put('/editarContrasenaPaciente/:id', async (req, res) => {
    const { id } = req.params;
    const { contrasena } = req.body;

    try {
        const query = `CALL EditarContrasenaPaciente(?, ?)`;
        await pool.query(query, [id, contrasena]);

        res.json({
            mensaje: 'Contraseña del paciente actualizada con éxito.'
        });
    } catch (err) {
        console.error('Error al editar la contraseña del paciente:', err.message);
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
