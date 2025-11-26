import express from "express";
import {
  getOrders,
  getOrderById,
  getOrdersByUser,
  createOrder,
  updateOrder,
  cancelOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

// (Admin) Obtener todas las órdenes
router.get("/orders", authMiddleware, isAdmin, getOrders);

// (Cliente) Obtener MIS órdenes. Esta es la ruta específica que faltaba.
router.get("/orders/my-orders", authMiddleware, getOrdersByUser);

// (Admin) Obtener órdenes de un usuario específico por su ID.
// La dejamos por si la necesitas para el panel de admin.
router.get("/orders/user/:userId", authMiddleware, isAdmin, getOrdersByUser);

// Obtener una orden específica por ID (debe ir al final de las GET)
router.get("/orders/:id", authMiddleware, getOrderById);

router.post("/orders", authMiddleware, createOrder);
router.patch("/orders/:id/cancel", authMiddleware, cancelOrder); // Puede ser admin o el propio usuario
router.patch("/orders/:id/status", authMiddleware, isAdmin, updateOrderStatus);
router.patch(
  "/orders/:id/payment-status",
  authMiddleware,
  isAdmin,
  updatePaymentStatus
);
router.put("/orders/:id", authMiddleware, isAdmin, updateOrder);
router.delete("/orders/:id", authMiddleware, isAdmin, deleteOrder);

export default router;
