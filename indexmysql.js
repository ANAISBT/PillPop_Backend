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


// Ruta para hacer un SELECT de la tabla 'frecuencias'
app.get('/getDataFrecuencias', async (req, res) => {
    try {
        const query = 'SELECT * FROM frecuencias';
        const [result] = await pool.query(query);
        res.json(result); // Enviar los datos en formato JSON
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los datos de la tabla frecuencias.');
    }
});

// Ruta para hacer un SELECT de la tabla 'especialidades'
app.get('/getDataEspecialidades', async (req, res) => {
    try {
        const query = 'SELECT * FROM especialidades';
        const [result] = await pool.query(query);
        res.json(result); // Enviar los datos en formato JSON
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los datos de la tabla especialidades.');
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

app.delete('/eliminarPrescripcion', async (req, res) => {
    const { id } = req.query; // Obtener el ID de la prescripción de los parámetros de la URL

    if (!id) {
        return res.status(400).json({ mensaje: 'Falta el ID de la prescripción.' });
    }

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

app.delete('/eliminarPastillaPorPrescripcion', async (req, res) => {
    const { idPrescripcion } = req.query; // Obtener el ID de la prescripción de los parámetros de la URL

    if (!idPrescripcion) {
        return res.status(400).json({ mensaje: 'Falta el ID de la prescripción.' });
    }

    try {
        const query = `CALL eliminar_pastilla_por_prescripcion(?)`; // Llamar al procedimiento almacenado

        // Ejecutar el procedimiento almacenado con el ID de la prescripción
        await pool.query(query, [idPrescripcion]);

        res.json({
            mensaje: 'Pastillas eliminadas exitosamente de la prescripción.',
        });
    } catch (err) {
        console.error('Error al eliminar las pastillas:', err.message);
        // Manejo de errores
        if (err.code === 'ER_SIGNAL_SQLSTATE') {
            res.status(400).json({ mensaje: err.message });
        } else {
            res.status(500).send('Error al procesar la solicitud.');
        }
    }
});

app.delete('/eliminarPastilla', async (req, res) => {
    const { id } = req.query; // Obtener el ID de la pastilla de los parámetros de la URL

    if (!id) {
        return res.status(400).json({ mensaje: 'Falta el ID de la pastilla.' });
    }

    try {
        const query = `CALL eliminar_pastilla_por_id(?)`; // Llamar al procedimiento almacenado

        // Ejecutar el procedimiento almacenado con el ID de la pastilla
        await pool.query(query, [id]);

        res.json({
            mensaje: 'Pastilla eliminada exitosamente.',
        });
    } catch (err) {
        console.error('Error al eliminar la pastilla:', err.message);
        // Manejo de errores
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
    const { nombreCompleto, sexo_id, especialidad_id, dni, correoElectronico, contrasena } = req.body;

    try {
        const query = `CALL InsertarUsuarioDoctor(?, ?, ?, ?, ?, ?, @p_idUsuarioDoctor);`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        await pool.query(query, [nombreCompleto, sexo_id, especialidad_id, dni, correoElectronico, contrasena]);

        // Recuperar el id del doctor insertado
        const result = await pool.query('SELECT @p_idUsuarioDoctor AS idUsuarioDoctor');
        const idUsuarioDoctor = result[0][0].idUsuarioDoctor;

        res.json({
            mensaje: 'Doctor insertado exitosamente.',
            idUsuarioDoctor: idUsuarioDoctor
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

// Ruta para realizar el login de un usuario paciente
app.post('/loginPaciente', async (req, res) => {
    const { p_dni, p_contrasena } = req.body;

    try {
        const query = `CALL LoginUsuarioPaciente(?, ?)`;

        // Ejecutar la consulta con los parámetros
        const [result] = await pool.query(query, [p_dni, p_contrasena]);

        // Revisar el mensaje de respuesta del procedimiento
        if (result.length > 0 && result[0][0].mensaje === 'Login exitoso') {
            const { v_id } = result[0][0];
            res.json({
                mensaje: 'Login exitoso',
                id: v_id
            });
        } else {
            res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }
    } catch (err) {
        console.error('Error durante el login:', err.message);
        res.status(500).send('Error durante el login.');
    }
});


app.get('/obtenerDatosDoctor', async (req, res) => {
    const {id} = req.body;
    try {
        const query = `CALL obtenerDatosDoctorPorId(?)`;

        // Ejecutar el procedimiento almacenado con el parámetro correspondiente
        const [rows] = await pool.query(query, [id]);

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

app.post('/obtenerDatosPacientePorDNI', async (req, res) => {
    const { dni } = req.body; // Cambiado de id a dni
    try {
        const query = `CALL ObtenerDatosPacientePorDni(?)`; // Asegúrate de que el nombre coincida con el procedimiento almacenado

        // Ejecutar el procedimiento almacenado con el parámetro correspondiente
        const [rows] = await pool.query(query, [dni]); // Cambiar id por dni

        if (rows[0].length > 0) {
            // Retornar los datos del paciente
            res.json(rows[0][0]);
        } else {
            res.status(200).json({ mensaje: 'Paciente no encontrado' }); // Cambiar 'Doctor' por 'Paciente'
        }
    } catch (err) {
        console.error('Error al obtener datos del paciente:', err.message); // Cambiar 'doctor' por 'paciente'
        res.status(500).send('Error al procesar la solicitud.');
    }
});



app.get('/obtenerDatosToma', async (req, res) => {

    const {id} = req.body;

    try {
        const query = `CALL obtenerDatosTomaPorId(?)`;

        // Ejecutar el procedimiento almacenado con el parámetro correspondiente
        const [rows] = await pool.query(query, [id]);

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

app.post('/obtenerPrescripcionesXDoctorFecha', async (req, res) => {
    
    const {doctorId,fechaHoy} = req.body;
    
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

app.post('/obtenerTomasXPacienteFecha', async (req, res) => {
    const { pacienteId, fechaHoy } = req.body;

    try {
        const query = `CALL ObtenerTomasPorPacienteYFecha(?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        const [rows] = await pool.query(query, [pacienteId, fechaHoy]);

        if (rows[0].length > 0) {
            // Retornar las tomas encontradas en el formato deseado
            res.json({ medicamentos: rows[0] });
        } else {
            res.status(404).json({ mensaje: 'No se encontraron tomas para el paciente en la fecha especificada' });
        }
    } catch (err) {
        console.error('Error al obtener tomas:', err.message);
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
