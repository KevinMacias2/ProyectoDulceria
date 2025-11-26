import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errorHandler = (err, req, res, next) => {
  const logFilePath = path.join(__dirname, "../../logs/error.log");
  const dateTime = new Date();
  const logMessage = `${dateTime.toISOString()} | ${req.method} ${req.url} | ${
    err.message
  } | ${err.stack}\n`;

  console.error('Error ocurrido:', err);
  console.error('Detalles de la solicitud:', { method: req.method, url: req.url, body: req.body });

  // Crear directorio si no existe
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFile(logFilePath, logMessage, (fsErr) => {
    if (fsErr) {
      console.error("Error al escribir en el archivo de log:", fsErr);
    }
  });

  // No enviar respuesta si ya se envió
  if (!res.headersSent) {
    // Determinar el código de estado apropiado
    let statusCode = 500;
    let errorMessage = err.message || "Error interno del servidor";
    
    // Errores de validación de Mongoose
    if (err.name === 'ValidationError') {
      statusCode = 400;
      const validationErrors = Object.values(err.errors || {}).map((e) => e.message).join(', ');
      errorMessage = `Error de validación: ${validationErrors}`;
    }
    // Errores de duplicados de MongoDB
    else if (err.code === 11000) {
      statusCode = 400;
      errorMessage = `Entrada duplicada: ${Object.keys(err.keyPattern || {}).join(', ')} ya existe`;
    }
    // Errores de cast (IDs inválidos)
    else if (err.name === 'CastError') {
      statusCode = 400;
      errorMessage = `${err.path || 'ID'} inválido`;
    }
    
    res.status(statusCode).json({
      status: "error",
      message: errorMessage,
      error: errorMessage
    });
  }
};

export default errorHandler;
