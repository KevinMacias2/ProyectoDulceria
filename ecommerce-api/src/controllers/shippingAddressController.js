import ShippingAddress from "../models/shippingAddress.js";

// Crear una nueva dirección de envío
const createShippingAddress = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      addressType,
    } = req.body;
    const user = req.user.id; 

    if (isDefault) {
      await ShippingAddress.updateMany({ user }, { isDefault: false });
    }

    const newAddress = new ShippingAddress({
      user,
      name,
      address,
      city,
      state,
      postalCode,
      country: country || "México",
      phone,
      isDefault: isDefault || false,
      addressType: addressType || "home",
    });

    await newAddress.save();

    res.status(201).json({
      message: "Dirección de envío creada exitosamente",
      address: newAddress,
    });
  } catch (error) {
    next(error);
  }
};

const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id; 

    const addresses = await ShippingAddress.find({ user: userId }).sort({
      isDefault: -1,
      _id: -1,
    });

    res.status(200).json({
      message: "Direcciones obtenidas exitosamente",
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

// Obtener una dirección específica
const getAddressById = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id; 

    const address = await ShippingAddress.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    res.status(200).json({
      message: "Dirección obtenida exitosamente",
      address,
    });
  } catch (error) {
    next(error);
  }
};

// Obtener la dirección por defecto del usuario
const getDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id; 

    const defaultAddress = await ShippingAddress.findOne({
      user: userId,
      isDefault: true,
    });

    if (!defaultAddress) {
      return res.status(404).json({ message: "No se encontró dirección por defecto" });
    }

    res.status(200).json({
      message: "Dirección por defecto obtenida exitosamente",
      address: defaultAddress,
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una dirección
const updateShippingAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const {
      name,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      addressType,
    } = req.body;
    const userId = req.user.id;

    const shippingAddress = await ShippingAddress.findOne({
      _id: addressId,
      user: userId,
    });

    if (!shippingAddress) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    if (isDefault && !shippingAddress.isDefault) {
      await ShippingAddress.updateMany(
        { user: userId, _id: { $ne: addressId } },
        { isDefault: false }
      );
    }

    shippingAddress.name = name;
    shippingAddress.address = address;
    shippingAddress.city = city;
    shippingAddress.state = state;
    shippingAddress.postalCode = postalCode;
    shippingAddress.country = country || shippingAddress.country;
    shippingAddress.phone = phone;
    shippingAddress.isDefault =
      isDefault !== undefined ? isDefault : shippingAddress.isDefault;
    shippingAddress.addressType = addressType || shippingAddress.addressType;

    await shippingAddress.save();

    res.status(200).json({
      message: "Dirección actualizada exitosamente",
      address: shippingAddress,
    });
  } catch (error) {
    next(error);
  }
};

// Marcar dirección como default
const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id; 

    const address = await ShippingAddress.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    await ShippingAddress.updateMany({ user: userId }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    res.status(200).json({
      message: "Dirección por defecto actualizada exitosamente",
      address,
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una dirección
const deleteShippingAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id; 

    const address = await ShippingAddress.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    await ShippingAddress.findByIdAndDelete(addressId);

    res.status(200).json({
      message: "Dirección eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

export {
  createShippingAddress,
  getUserAddresses,
  getAddressById,
  getDefaultAddress,
  updateShippingAddress,
  setDefaultAddress,
  deleteShippingAddress,
};
