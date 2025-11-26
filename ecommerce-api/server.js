import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./src/routes/index.js";
import dbConnection from "./src/config/database.js";
import logger from "./src/middlewares/logger.js";
import setupGlobalErrorHandlers from "./src/middlewares/globalErrorHandler.js";
import errorHandler from "./src/middlewares/errorhandler.js";

dotenv.config();
setupGlobalErrorHandlers();

const app = express();
dbConnection();

// Middleware para procesar JSON - ¡CRUCIAL QUE ESTÉ AQUÍ!
// Aumentar el límite de tamaño para manejar imágenes base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración de CORS más específica
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(logger);

app.get("/", (req, res) => {
  res.send("WELCOME!");
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
