import { Router } from "express";
import { OrderController } from "../controllers/order.controller";

export const orderRoutes = Router();

orderRoutes.get("/healthCheck", OrderController.healthCheck);
orderRoutes.post("/orders", OrderController.createOrder);
orderRoutes.patch("/orders/:order_id/updatePickupDeliverySlots", OrderController.updatePickupDeliverySlots);
orderRoutes.patch("/orders/:order_id/assignToEmployee", OrderController.assignToEmployee);
orderRoutes.patch("/orders/:order_id/updateOrderStatus", OrderController.updateOrderStatus);