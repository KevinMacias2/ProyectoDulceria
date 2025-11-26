import Cart from "../models/cart.js";

async function getCarts(req, res, next) {
  try {
    const carts = await Cart.find()
      .populate("user")
      .populate("products.product");
    res.json(carts);
  } catch (error) {
    next(error);
  }
}

async function getCartById(req, res, next) {
  try {
    const id = req.params.id;
    const cart = await Cart.findById(id)
      .populate("user")
      .populate("products.product");
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

async function getCartByUser(req, res, next) {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product"
    );
    if (!cart) {
      return res.status(404).json({ message: "No se ha encontrado ningún carrito para este usuario." });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

async function addProductToCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!userId || !productId || quantity < 1) {
      return res
        .status(400)
        .json({ error: "Se requiere el ID del producto y la cantidad válida." });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Si no existe carrito, crear uno nuevo
      cart = new Cart({
        user: userId,
        products: [{ product: productId, quantity }],
      });
    } else {
      // Si existe carrito, verificar si el producto ya está
      const existingProductIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingProductIndex >= 0) {
        // Si el producto ya existe, actualizar cantidad
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        // Si el producto no existe, agregarlo
        cart.products.push({ product: productId, quantity });
      }
    }

    await cart.save();
    await cart.populate("products.product");

    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
}

async function deleteCart(req, res, next) {
  try {
    const { id } = req.params;
    const deletedCart = await Cart.findByIdAndDelete(id);

    if (deletedCart) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
  } catch (error) {
    next(error);
  }
}

async function createCart(req, res, next) {
  try {
    const { products } = req.body;
    const userId = req.user.id; 
    const newCart = await Cart.create({ user: userId, products });
    res.status(201).json(newCart);
  } catch (error) {
    next(error);
  }
}

async function updateCart(req, res, next) {
  try {
    const { id } = req.params;
    const { products } = req.body;
    const updatedCart = await Cart.findByIdAndUpdate(
      id,
      { products },
      { new: true }
    ).populate("products.product");
    res.status(200).json(updatedCart);
  } catch (error) {
    next(error);
  }
}

export {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  updateCart,
  deleteCart,
  addProductToCart,
};
