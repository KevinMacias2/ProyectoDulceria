import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import ShippingAddress from "../models/shippingAddress.js";
import PaymentMethod from "../models/paymentMethod.js";
import emailService from "../services/emailService.js";

// Función para generar boucher/comprobante
function generateBoucher(order) {
  const orderDate = new Date(order.createdAt || order.created_at || Date.now());
  

  const day = orderDate.getDate();
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const month = monthNames[orderDate.getMonth()];
  const year = orderDate.getFullYear();
  const hours = String(orderDate.getHours()).padStart(2, '0');
  const minutes = String(orderDate.getMinutes()).padStart(2, '0');
  
  const formattedDate = `${day} de ${month} de ${year}, ${hours}:${minutes}`;

  // Formatear información de pago
  let paymentInfo = '';
  if (order.paymentMethod) {
    if (order.paymentMethod.type === 'credit_card' && order.paymentMethod.cardNumber) {
      const cardNumber = order.paymentMethod.cardNumber.replace(/\s/g, '');
      const last4 = cardNumber.slice(-4);
      paymentInfo = `Tarjeta de crédito/débito terminada en ${last4}`;
      if (order.paymentMethod.cardHolderName) {
        paymentInfo += ` - ${order.paymentMethod.cardHolderName}`;
      }
    } else if (order.paymentMethod.type === 'paypal' && order.paymentMethod.paypalEmail) {
      paymentInfo = `PayPal: ${order.paymentMethod.paypalEmail}`;
    } else if (order.paymentMethod.type === 'credit_card') {
      paymentInfo = 'Tarjeta de crédito/débito';
    } else if (order.paymentMethod.type === 'paypal') {
      paymentInfo = 'PayPal';
    } else {
      paymentInfo = order.paymentMethod.type || 'No especificado';
    }
  }

  // Obtener datos del cliente desde shippingAddress (viene del formulario)
  const customerName = order.shippingAddress?.name || order.user?.displayName || 'Cliente';
  const customerEmail = order.shippingAddress?.email || order.user?.email || '';
  
  const boucher = {
    orderNumber: order._id.toString(),
    orderDate: formattedDate,
    customer: {
      name: customerName,
      email: customerEmail
    },
    items: order.products.map((item) => ({
      productName: item.productId?.name || 'Producto',
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.price * item.quantity
    })),
    shipping: {
      address: order.shippingAddress?.address || '',
      city: order.shippingAddress?.city || '',
      state: order.shippingAddress?.state || '',
      postalCode: order.shippingAddress?.postalCode || '',
      country: order.shippingAddress?.country || '',
      phone: order.shippingAddress?.phone || ''
    },
    payment: {
      method: paymentInfo,
      paymentStatus: order.paymentStatus || 'pending'
    },
    totals: {
      subtotal: order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      shipping: order.shippingCost || 0,
      total: order.totalPrice || 0
    },
    status: order.status || 'pending'
  };

  return boucher;
}

async function createOrder(req, res, next) {
  try {
    console.log('=== CREANDO ORDEN ===');
    const user = req.user.id;
    console.log('ID de Usuario:', user);
    const { shippingAddress, paymentMethod } = req.body;
    console.log('Dirección de envío recibida:', JSON.stringify(shippingAddress));
    console.log('Método de pago recibido:', JSON.stringify({ ...paymentMethod, cardNumber: paymentMethod?.cardNumber ? '***' + paymentMethod.cardNumber.slice(-4) : undefined }));

    if (!shippingAddress || !paymentMethod) {
      console.error('Falta dirección de envío o método de pago');
      return res
        .status(400)
        .json({ error: "Se requiere dirección de envío y método de pago" });
    }

    // Crear o encontrar la dirección de envío
    let shippingAddressId;
    try {
      if (shippingAddress._id) {
        shippingAddressId = shippingAddress._id;
        console.log('Usando dirección de envío existente:', shippingAddressId);
      } else {
        console.log('Creando nueva dirección de envío');
        const newShippingAddress = await ShippingAddress.create({
          user,
          ...shippingAddress
        });
        shippingAddressId = newShippingAddress._id;
      }
    } catch (shippingError) {
      console.error('Error al crear dirección de envío:', shippingError);
      return res.status(400).json({ error: `Error al crear dirección de envío: ${shippingError.message}` });
    }

    let paymentMethodId;
    try {
      if (paymentMethod._id) {
        paymentMethodId = paymentMethod._id;
        console.log('Usando método de pago existente:', paymentMethodId);
      } else {
        console.log('Creando nuevo método de pago');
        const newPaymentMethod = await PaymentMethod.create({
          user,
          ...paymentMethod
        });
        paymentMethodId = newPaymentMethod._id;
        console.log('Método de pago creado:', paymentMethodId);
      }
    } catch (paymentError) {
      console.error('Error al crear método de pago:', paymentError);
      return res.status(400).json({ error: `Error al crear método de pago: ${paymentError.message}` });
    }

    console.log('Buscando carrito para el usuario:', user);
    const cart = await Cart.findOne({ user: user }).populate(
      "products.product"
    );

    if (!cart) {
      console.error('Carrito no encontrado para el usuario:', user);
      return res
        .status(400)
        .json({
          message: "Carrito no encontrado. Por favor, agrega productos a tu carrito primero.",
        });
    }

    if (!cart.products || cart.products.length === 0) {
      console.error('El carrito está vacío');
      return res
        .status(400)
        .json({
          message: "El carrito está vacío. Agrega productos antes de crear una orden.",
        });
    }

    console.log('Carrito encontrado con', cart.products.length, 'productos');

    const subtotal = cart.products.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const shippingCost = 5;
    const totalPrice = subtotal + shippingCost;

    const newOrder = await Order.create({
      user,
      products: cart.products.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      shippingAddress: shippingAddressId,
      paymentMethod: paymentMethodId,
      shippingCost,
      totalPrice,
      status: "pending",
      paymentStatus: "pending",
    });

    await Cart.findByIdAndDelete(cart._id);

    await newOrder.populate([
      { path: "user", select: "displayName email" },
      { path: "products.productId", select: "name price imagesUrl" },
      { path: "shippingAddress", select: "name address city state postalCode country phone email" },
      { path: "paymentMethod", select: "type cardNumber cardHolderName expiryDate paypalEmail" },
    ]);

    // Generar boucher/comprobante
    const boucher = generateBoucher(newOrder);

    const customerEmail = newOrder.shippingAddress?.email || newOrder.user?.email;
    
    if (customerEmail) {
      try {
        await emailService.sendOrderConfirmation(newOrder, customerEmail);
      } catch (emailError) {
        console.error('Error enviando email de confirmación al cliente:', emailError.message);
      }
    }

    try {
      const adminEmail = process.env.EMAIL_USER;
      if (adminEmail) {
        await emailService.sendOrderNotificationToAdmin(
          newOrder, 
          customerEmail || newOrder.user?.email || 'N/A',
          newOrder.shippingAddress?.name || newOrder.user?.displayName || 'Cliente'
        );
      }
    } catch (adminEmailError) {
      console.error('Error enviando notificación al admin:', adminEmailError.message);
    }

    console.log('Orden creada exitosamente:', newOrder._id);
    console.log('Boucher generado:', !!boucher);

    res.status(201).json({
      ...newOrder.toObject(),
      boucher: boucher
    });
  } catch (error) {
    console.error('Error en createOrder:', error);
    console.error('Stack del error:', error.stack);
    console.error('Detalles del error:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    next(error);
  }
}

async function getOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .populate("user", "displayName email")
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const id = req.params.id;
    const order = await Order.findById(id)
      .populate("user", "displayName email")
      .populate("products.productId");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (
      req.user.role !== "admin" &&
      order.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Acceso prohibido" });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
}

async function getOrdersByUser(req, res, next) {
  try {
    // Si hay un userId en los parámetros (ruta admin), usar ese; si no, usar el del usuario autenticado
    const userId = req.params.userId || req.user.id;
    const orders = await Order.find({ user: userId })
      .populate("products.productId", "name price imagesUrl")
      .populate("user", "displayName email")
      .populate("shippingAddress")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedOrder) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (order.status === "delivered" || order.status === "shipped") {
      return res
        .status(400)
        .json({
          message: "No se puede cancelar una orden que ha sido enviada o entregada.",
        });
    }

    order.status = "cancelled";
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    }

    await order.save();
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "El estado es requerido" });
    }

    // Obtener la orden actual para guardar el status anterior
    const currentOrder = await Order.findById(id)
      .populate("user", "displayName email")
      .populate("shippingAddress");

    if (!currentOrder) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    const oldStatus = currentOrder.status;

    // Actualizar el status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("user", "displayName email")
      .populate("shippingAddress")
      .populate("products.productId", "name price imagesUrl")
      .populate("paymentMethod");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    // Enviar email de notificación si el status cambió
    if (oldStatus !== status) {
      const customerEmail = updatedOrder.shippingAddress?.email || updatedOrder.user?.email;
      if (customerEmail) {
        try {
          await emailService.sendOrderStatusUpdate(updatedOrder, customerEmail, status, oldStatus);
          console.log('✅ Email de notificación de status enviado exitosamente a:', customerEmail);
        } catch (emailError) {
          console.error('❌ Error enviando email de notificación de status:', emailError.message);
          // No fallar la actualización si falla el email
        }
      } else {
        console.warn('⚠️ No se encontró email para enviar notificación de cambio de status.');
      }
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      return res.status(400).json({ message: "El estado del pago es requerido" });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    if (order.status !== "cancelled") {
      return res
        .status(400)
        .json({ message: "Solo las órdenes canceladas pueden ser eliminadas" });
    }
    await Order.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export {
  getOrders,
  getOrderById,
  getOrdersByUser,
  createOrder,
  updateOrder,
  cancelOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
};
