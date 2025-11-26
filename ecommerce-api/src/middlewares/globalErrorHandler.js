import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalErrorHandlers = () => {
  const logFilePath = path.join(__dirname, "../../logs/error.log");

  // Crear directorio si no existe
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Capturar errores no manejados
  process.on("uncaughtException", (error) => {
    const dateTime = new Date();
    const logMessage = `${dateTime.toISOString()} | UNCAUGHT EXCEPTION | ${
      error.message
    } | ${error.stack}\n`;

    try {
      fs.appendFileSync(logFilePath, logMessage);
      console.log("Excepción no capturada registrada, el servidor continúa...");
    } catch (writeError) {
      console.error("Error al escribir en el archivo de log:", writeError.message);
      console.error("Error original:", error.message);
    }
  });

  // Capturar promesas rechazadas no manejadas
  process.on("unhandledRejection", (reason, promise) => {
    const dateTime = new Date();
    const logMessage = `${dateTime.toISOString()} | UNHANDLED REJECTION | ${reason} | ${promise}\n`;

    try {
      fs.appendFileSync(logFilePath, logMessage);
      console.log("Rechazo no manejado registrado, el servidor continúa...");
    } catch (writeError) {
      console.error("Error al escribir en el archivo de log:", writeError.message);
      console.error("Rechazo original:", reason);
    }
  });
};

export default globalErrorHandlers;
