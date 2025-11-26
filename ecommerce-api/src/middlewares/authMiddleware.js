import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log('Header de autenticación:', authHeader);
  
  const token = authHeader?.split(" ")[1];
  console.log('Token extraído:', token);

  if (!token) {
    console.log('No se proporcionó token');
    return res.status(401).json({ message: "No se proporcionó token" });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-it-long-and-random';
  
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.log('Verificación de token falló:', err.message);
      return res.status(403).json({ message: "Token inválido" });
    }
    console.log('Token decodificado exitosamente:', decoded);
    req.user = decoded;
    next();
  });
};

export default authMiddleware;
