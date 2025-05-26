import { Request, Response } from "express";
import { OrderStatus } from "../models/order.model";
import { Order } from "../models/order.model";

export class OrderController {
    static async healthCheck(_req: Request, res: Response) {
        return res.status(200).json({
          message: "health check order service"
        })
    }

    static async createOrder(req: Request, res: Response) {
      try {
        const {
          cart_id,
          customer_id,
          address_id
        } = req.body;
  
        if (!cart_id || !customer_id || !address_id) {
          return res.status(400).json({ message: "Missing required fields." });
        }
  
        const order = await Order.create({
          cart_id,
          customer_id,
          address_id,
          status: OrderStatus.ACTIVE,
        });
  
        return res.status(201).json({ message: "Order created", order });
      } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: "Failed to create order", error });
      }
    }
}
