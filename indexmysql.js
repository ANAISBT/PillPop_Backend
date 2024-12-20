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

// Endpoint para el reporte de fecha única
app.post('/reportefechaunica', async (req, res) => {
    const { fechaUnica, doctorId, pacienteDni } = req.body;

    const sql = `CALL ObtenerDatosReporteFechaUnica(?, ?, ?)`;

    try {
        const [results] = await pool.query(sql, [fechaUnica, doctorId, pacienteDni]);
        // Asumiendo que results devuelve el array descrito:
        const datosReporte = results[0]; // Primer bloque de resultados
        const tratamiento = results[1]; // Segundo bloque de resultados
        const tomasDiarias = results[2]; // Tercer bloque de resultados

        res.json({
            datosReporte,
            tratamiento,
            tomasDiarias
        });
    } catch (err) {
        console.error('Error al ejecutar el procedimiento almacenado:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// Endpoint para el reporte entre fechas
app.post('/reporteentrefechas', async (req, res) => {
    const { fechaInicio, fechaFin, doctorId, pacienteDni } = req.body;

    const sql = `CALL ObtenerDatosReporteEntreFechas(?, ?, ?, ?)`;

    try {
        const [results] = await pool.query(sql, [fechaInicio, fechaFin, doctorId, pacienteDni]);
       // Asumiendo que results devuelve el array descrito:
       const datosReporte = results[0]; // Primer bloque de resultados
       const tratamiento = results[1]; // Segundo bloque de resultados
       const tomasDiarias = results[2]; // Tercer bloque de resultados

       res.json({
           datosReporte,
           tratamiento,
           tomasDiarias
       });
    } catch (err) {
        console.error('Error al ejecutar el procedimiento almacenado:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

  // Endpoint para el reporte de fecha única
app.post('/reportefechaunicaPaciente', async (req, res) => {
    const { fechaUnica, pacienteId } = req.body; // Ahora estamos usando pacienteId en lugar de doctorId

    const sql = `CALL ObtenerDatosReporteFechaUnica_Paciente(?, ?)`;

    try {
        // Llamamos al procedimiento almacenado con los parámetros adecuados
        const [results] = await pool.query(sql, [fechaUnica, pacienteId]);

        if (results.length > 0) {
            // Primer bloque de resultados: Información del paciente y el nombre del mes
            const datosReporte = results[0];

            // Segundo bloque de resultados: Información de las pastillas y frecuencias
            const tratamiento = results[1];

            // Tercer bloque de resultados: Información de la toma diaria de pastillas
            const tomasDiarias = results[2];

            // Respondemos con los datos formateados
            res.json({
                datosReporte,
                tratamiento,
                tomasDiarias
            });
        } else {
            res.status(404).json({ error: 'No se encontraron datos para el reporte.' });
        }
    } catch (err) {
        console.error('Error al ejecutar el procedimiento almacenado:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// Endpoint para el reporte entre fechas
app.post('/reporteentrefechasPaciente', async (req, res) => {
    const { fechaInicio, fechaFin, pacienteId } = req.body; // Ahora usamos pacienteId en lugar de doctorId o pacienteDni

    const sql = `CALL ObtenerDatosReporteEntreFechas_Paciente(?, ?, ?)`;

    try {
        // Llamamos al procedimiento almacenado con los parámetros adecuados
        const [results] = await pool.query(sql, [fechaInicio, fechaFin, pacienteId]);

        if (results.length > 0) {
            // Primer bloque de resultados: Información del paciente y nombres de los meses
            const datosReporte = results[0];
            
            // Combina los nombres del mes de inicio y fin
            const nombreMes = `${datosReporte[0].NombreMesInicio} - ${datosReporte[0].NombreMesFin}`;

            // Segundo bloque de resultados: Información de las pastillas y frecuencias
            const tratamiento = results[1];

            // Tercer bloque de resultados: Información de la toma diaria de pastillas
            const tomasDiarias = results[2];

            // Respondemos con los datos formateados
            res.json({
                datosReporte: { ...datosReporte[0], NombreMes: nombreMes }, // Añade el campo NombreMes
                tratamiento,
                tomasDiarias
            });
        } else {
            res.status(404).json({ error: 'No se encontraron datos para el reporte.' });
        }
    } catch (err) {
        console.error('Error al ejecutar el procedimiento almacenado:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
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
    const { tomaID,p_fecha } = req.body; // Obtener el ID de la toma del cuerpo de la solicitud

    try {
        const query = `CALL CambiarTomaA1(?,?)`; // Llamar al procedimiento almacenado

        // Ejecutar el procedimiento almacenado con el parámetro
        const [result] = await pool.query(query, [tomaID,p_fecha]);

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
            res.status(200).json({
                mensaje: rows[0][0].mensaje // Credenciales incorrectas
            });
        }
    } catch (err) {
        console.error('Error en el login:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

// Ruta para realizar el register de un usuario paciente
app.post('/insertarPaciente', async (req, res) => {
    const { nombreCompleto, sexo_id, edad, dni, correoElectronico, contrasena } = req.body;

    try {
        const query = `CALL InsertarUsuarioPaciente(?, ?, ?, ?, ?, ?, @p_idUsuarioPaciente);`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        await pool.query(query, [nombreCompleto, sexo_id, edad, dni, correoElectronico, contrasena]);

        // Recuperar el id del paciente insertado
        const result = await pool.query('SELECT @p_idUsuarioPaciente AS idUsuarioPaciente');
        const idUsuarioPaciente = result[0][0].idUsuarioPaciente;

        res.json({
            mensaje: 'Paciente insertado exitosamente.',
            idUsuarioPaciente: idUsuarioPaciente
        });
    } catch (err) {
        console.error('Error al insertar el paciente:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

// Ruta para realizar el login de un usuario paciente
app.post('/loginPaciente', async (req, res) => {
    const { p_dni, p_contrasena } = req.body;

    try {

        const query = `CALL LoginUsuarioPaciente(?, ?)`;
        const [result] = await pool.query(query, [p_dni, p_contrasena]);
        console.log('Resultado del procedimiento:', JSON.stringify(result, null, 2));

        // Revisar el mensaje de respuesta del procedimiento
        if (result.length > 0 && result[0][0].mensaje === 'Login exitoso') {
            const { v_id, nombreCompleto, sexo_id, edad, dni, correoElectronico } = result[0][0];
            res.json({
                mensaje: 'Login exitoso',
                id: v_id,
                nombreCompleto,
                sexo_id,
                edad,
                dni,
                correoElectronico
            });
        } else {
            res.status(200).json({ mensaje: 'Credenciales incorrectas' });
        }
    } catch (err) {
        console.error('Error durante el login:', err.message);
        res.status(500).send('Error durante el login.');
    }
});


app.post('/obtenerDatosDoctor', async (req, res) => {
    const { id } = req.body; // Asegúrate de que el ID se envíe en el cuerpo de la solicitud
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

app.post('/obtenerDatosPrescripcion', async (req, res) => {

    const { id } = req.body; // Asumiendo que el id de la prescripción se pasa en el cuerpo de la solicitud

    try {
        const query = `CALL obtenerDatosPrescripcionPorId(?)`;

        // Ejecutar el procedimiento almacenado con el parámetro correspondiente
        const [rows] = await pool.query(query, [id]);

        if (rows.length > 0) {
            const prescripcion = rows[0]; // Datos de la prescripción
            const pastillas = rows[1]; // Pastillas asociadas a la prescripción

            // Combina los datos de la prescripción y las pastillas en un solo objeto para devolver
            res.json({
                prescripcion: prescripcion[0],
                pastillas: pastillas
            });
        } else {
            res.status(404).json({ mensaje: 'Prescripción no encontrada' });
        }
    } catch (err) {
        console.error('Error al obtener datos de la prescripción:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.post('/ObtenerPacientesPorDoctor', async (req, res) => {
    const { doctor_id } = req.body;

    if (!doctor_id) {
        return res.status(400).json({ error: 'El parámetro doctor_id es requerido.' });
    }

    try {
        const [rows] = await pool.query('CALL ObtenerPacientesPorDoctor(?)', [doctor_id]);

        // rows[0] contiene el conjunto de resultados de pacientes
        const pacientes = rows[0]; // Extraemos solo el primer conjunto de resultados

        if (pacientes.length === 0) {
            return res.status(404).json({ message: 'No se encontraron pacientes para el doctor especificado.' });
        }

        // Devuelve el conjunto de resultados de pacientes encapsulado en un objeto
        res.json({ pacientes: pacientes });
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
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
            res.status(200).json({ mensaje: 'No se encontraron tomas para el paciente en la fecha especificada' });
        }
    } catch (err) {
        console.error('Error al obtener tomas:', err.message);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.post('/obtenerTomasXPacienteHoy', async (req, res) => {
    const { pacienteId } = req.body;
    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toISOString().split('T')[0];
    
    try {
        const query = `CALL ObtenerTomasPorPacienteYFecha(?, ?)`;

        // Ejecutar el procedimiento almacenado con los parámetros correspondientes
        const [rows] = await pool.query(query, [pacienteId, fechaFormateada]);

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
            res.status(200).json({
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
