import { Router } from "express";
import { OrderController } from "../controllers/order.controller";

export const orderRoutes = Router();

orderRoutes.get("/healthCheck", OrderController.healthCheck);
orderRoutes.post("/orders", OrderController.createOrder);
orderRoutes.patch("/orders/:order_id/updatePickupDeliverySlots", OrderController.updatePickupDeliverySlots);
orderRoutes.patch("/orders/:order_id/assignToEmployee", OrderController.assignToEmployee);
orderRoutes.patch("/orders/:order_id/updateOrderStatus", OrderController.updateOrderStatus);
orderRoutes.get("/orders/getActiveOrdersByCustomerId/:customer_id", OrderController.getActiveOrdersByCustomerId);
orderRoutes.get("/orders/getOrderDetails/:order_id", OrderController.getOrderDetails);
orderRoutes.get("/orders/getAllOrders", OrderController.getAllOrders);
orderRoutes.get("/orders/getEmployeeOrderHistory/:employee_id", OrderController.getEmployeeOrderHistory);
orderRoutes.post("/orders/generateOTP/:order_id", OrderController.generateOrderOTP);
orderRoutes.get("/orders/getAvailableOrdersToday", OrderController.getAvailableOrdersToday);
orderRoutes.get("/orders/getAvailableOrdersByDate", OrderController.getAvailableOrdersByDate);
orderRoutes.put("/orders/startPickup/:order_id", OrderController.startPickup);
orderRoutes.put("/orders/startDelivery/:order_id", OrderController.startDelivery);
orderRoutes.post("/orders/completePickup/:confirmation_id", OrderController.completePickup);
orderRoutes.post("/orders/cancelOrder", OrderController.cancelOrder);