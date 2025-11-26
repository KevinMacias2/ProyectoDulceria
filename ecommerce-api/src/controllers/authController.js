import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const generateToken = (id, displayName, role) => {
  // Se usa 'id' como es convencional en el payload del JWT
  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-it-long-and-random';
  return jwt.sign({ id, displayName, role }, jwtSecret, {
    expiresIn: "1h",
  });
};

const generatePassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const checkUserExist = async (email) => {
  const user = await User.findOne({ email });
  return user;
};

async function register(req, res, next) {
  try {
    console.log('Intento de registro:', { displayName: req.body.displayName, email: req.body.email, phone: req.body.phone });
    const { displayName, email, password, phone, role, avatar } = req.body;

    const userExist = await checkUserExist(email);
    if (userExist) {
      return res.status(400).json({ message: "Usuario ya existe" });
    }

    const hashPassword = await generatePassword(password);

    const newUser = new User({
      displayName,
      email,
      hashPassword,
      role: role || "customer",
      phone: phone || "1234567890", 
      avatar: avatar || "https://placehold.co/100x100.png", 
    });

    await newUser.save();
    
    const token = generateToken(
      newUser._id,
      newUser.displayName,
      newUser.role
    );
    
    res.status(201).json({ 
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.displayName,
        email: newUser.email,
        role: newUser.role,
        profileImage: newUser.avatar,
        phone: newUser.phone
      },
      message: "Registro exitoso"
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    console.log('Intento de inicio de sesión:', { email: req.body.email, password: '***' });
    const { email, password } = req.body;
    const userExist = await checkUserExist(email);

    if (!userExist) {
      return res
        .status(400)
        .json({ message: "Usuario no existe. Registra una nueva cuenta" });
    }

    const isMatch = await bcrypt.compare(password, userExist.hashPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales Incorrectas" });
    }

    const token = generateToken(
      userExist._id,
      userExist.displayName,
      userExist.role
    );
    
    res.status(200).json({ 
      success: true,
      token,
      user: {
        id: userExist._id,
        name: userExist.displayName,
        email: userExist.email,
        role: userExist.role,
        profileImage: userExist.avatar,
        phone: userExist.phone
      },
      message: "Login exitoso"
    });
  } catch (error) {
    next(error);
  }
}

export { register, login };
