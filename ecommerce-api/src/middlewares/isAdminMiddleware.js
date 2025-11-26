const isAdmin = (req, res, next) => {
  console.log('Middleware de admin - req.user:', req.user);
  console.log('Middleware de admin - req.url:', req.url);
  console.log('Middleware de admin - req.method:', req.method);
  
  if (!req.user) {
    console.log('No hay usuario en la solicitud');
    return res.status(401).json({ message: "Autenticación requerida" });
  }

  console.log('Rol del usuario:', req.user.role);
  
  if (req.user.role !== "admin") {
    console.log('El usuario no es administrador, rol:', req.user.role);
    return res.status(403).json({ message: "Se requiere acceso de administrador. Rol actual: " + req.user.role });
  }

  console.log('El usuario es administrador, continuando...');
  next();
};

export default isAdmin;
