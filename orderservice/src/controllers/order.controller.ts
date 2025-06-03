import { Request, Response } from "express";
import { OrderStatus } from "../models/order.model";
import { Order } from "../models/order.model";
import { Cart } from "../models/cart.model";
import { Op } from 'sequelize';
import axios from "axios";

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

        await Cart.update(
          { status: "converted" },           // Fields to update
          {
            where: { id: cart_id }      // Condition to find the correct cart
          }
        );
  
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
        if (pickup_slot) order.pickup_slot = pickup_slot.toLowerCase();
        if (delivery_date) order.delivery_date = new Date(delivery_date);
        if (delivery_slot) order.delivery_slot = delivery_slot.toLowerCase();
    
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
        const { pickup_employee_id, delivery_employee_id } = req.body;
    
        // Validate required data (optional: add stricter validation as needed)
        if (!pickup_employee_id && !delivery_employee_id)  {
          return res.status(400).json({ message: "Employee id is blank" });
        }
    
        const order = await Order.findByPk(order_id);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
    
        // Update only provided fields
        if (pickup_employee_id) order.pickup_employee_id = pickup_employee_id;
        if (delivery_employee_id) order.delivery_employee_id = delivery_employee_id;
      
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

    static async updateOrderStatus(req: Request, res: Response) {
      try {
        const { order_id } = req.params;
        const { status } = req.body;
    
        // Validate required data (optional: add stricter validation as needed)
        if (!status) {
          return res.status(400).json({ message: "Employee id is blank" });
        }
    
        const order = await Order.findByPk(order_id);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
    
        // Update only provided fields
        if (status) order.status = status;
      
        await order.save();
    
        return res.status(200).json({
          message: "Order status updated successfully",
          order
        });
      } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    static async getActiveOrdersByCustomerId(req: Request, res: Response) {
      try {
        const { customer_id } = req.params;
    
        const orders = await Order.findAll({
          where: {
            customer_id: customer_id
          }
        });
        if (!orders) {
          return res.status(404).json({ message: "No active orders for this customer" });
        }

        return res.status(200).json({
          message: "Orders found successfully",
          orders: orders
        });
      } catch (error) {
        console.error("Error getting active orders by customer id:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    static async getOrderDetails(req: Request, res: Response) {
      try {
        const { order_id } = req.params;
        console.log("GET ORDER DETAILS", order_id);
    
        const order = await Order.findByPk(order_id);
        if (!order) {
          return res.status(404).json({ message: "No active orders for this customer" });
        }
        console.log("ORDER", order);

        return res.status(200).json({
          message: "Orders found successfully",
          order: order
        });
      } catch (error) {
        console.error("Error getting active orders by customer id:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    static async getAllOrders(_req: Request, res: Response) {
      try {
        const orders = await Order.findAll({
          where: {
            status: {
              [Op.notIn]: ["completed", "active"]
            }
          }
        });

        const customerIds = [...new Set(orders.map(order => order.customer_id))];

        const customerResponses = await Promise.all(
          customerIds.map(id =>
            axios.get(`https://tidywashbackend.onrender.com/api/getCustomerById/${id}`)
              .then(res => ({ id, data: res.data }))
              .catch(err => ({ id, error: err.message }))
          )
        );

        const customerMap = new Map<string, any>();
        for (const res of customerResponses) {
          if ('data' in res) {
            customerMap.set(res.id, res.data);
          }
        }

        // 5. Attach customer + user data to each order
        const enrichedOrders = orders.map(order => ({
          ...order.toJSON(),
          customer: customerMap.get(order.customer_id) || null,
        }));
    
        res.status(200).json(enrichedOrders);
      } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
      }
    }
}
