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

    static async updatePickupDeliverySlots(req: Request, res: Response) {
      try {
        const { order_id } = req.params;
        const {
          pickup_date,
          pickup_slot,
          delivery_date,
          delivery_slot
        } = req.body;
    
        // Validate required data (optional: add stricter validation as needed)
        if (!pickup_date && !pickup_slot && !delivery_date && !delivery_slot) {
          return res.status(400).json({ message: "At least one field must be provided to update." });
        }
    
        const order = await Order.findByPk(order_id);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
    
        // Update only provided fields
        if (pickup_date) order.pickup_date = new Date(pickup_date);
        if (pickup_slot) order.pickup_slot = pickup_slot;
        if (delivery_date) order.delivery_date = new Date(delivery_date);
        if (delivery_slot) order.delivery_slot = delivery_slot;
    
        await order.save();
    
        return res.status(200).json({
          message: "Pickup and delivery slots updated successfully",
          order
        });
      } catch (error) {
        console.error("Error updating pickup/delivery slots:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
    
    static async assignToEmployee(req: Request, res: Response) {
      try {
        const { order_id } = req.params;
        const { employee_id } = req.body;
    
        // Validate required data (optional: add stricter validation as needed)
        if (!employee_id) {
          return res.status(400).json({ message: "Employee id is blank" });
        }
    
        const order = await Order.findByPk(order_id);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
    
        // Update only provided fields
        if (employee_id) order.employee_id = employee_id;
      
        await order.save();
    
        return res.status(200).json({
          message: "Order assigned to employee successfully",
          order
        });
      } catch (error) {
        console.error("Error updating pickup/delivery slots:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
}
