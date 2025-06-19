import { Request, Response } from "express";
import { OrderStatus } from "../models/order.model";
import { Order } from "../models/order.model";
import { Cart } from "../models/cart.model";
import { Op } from 'sequelize';
import axios from "axios";
import { OrderConfirmation } from "../models/orderConfirmation.model";
import { TimeSlot } from "../models/order.model";
import { supabase } from "../supabase";

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

        const randomRefId = `TW-${Math.floor(100000 + Math.random() * 900000)}`;
  
        const order = await Order.create({
          cart_id,
          customer_id,
          address_id,
          status: OrderStatus.ACTIVE,
          ref_order_id: randomRefId
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
          },
          order: [['created_date', 'DESC']]  // 🔥 Sort by created_date descending
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
          },
          order: [["created_date", "DESC"]]
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

    static async getEmployeeOrderHistory(req: Request, res: Response) {
      try {
        const { employee_id } = req.params;
        const { type = "all", status } = req.query;
    
        const whereCondition: any = {
          [Op.or]: [
            { pickup_employee_id: employee_id },
            { delivery_employee_id: employee_id }
          ]
        };
    
        // Filter by type
        if (type === "pickup") {
          whereCondition.pickup_employee_id = employee_id;
        } else if (type === "delivery") {
          whereCondition.delivery_employee_id = employee_id;
        }
    
        // Filter by status if provided
        if (status) {
          whereCondition.status = status.toString().toUpperCase();
        }
    
        const orders = await Order.findAll({
          where: whereCondition,
          order: [['modified_date', 'DESC']]
        });
    
        return res.status(200).json({
          message: "Employee order history fetched",
          orders
        });
      } catch (error) {
        console.error("Error fetching employee order history:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    static async generateOrderOTP(req: Request, res: Response) {
      const { order_id } = req.params;
      const { type } = req.body; // Expecting: pickup or delivery

      if (!type || !["pickup", "delivery"].includes(type)) {
        return res.status(400).json({ error: "Invalid or missing confirmation type." });
      }

      try {
        // Check if order exists
        const order = await Order.findByPk(order_id);
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Create or upsert confirmation
        const confirmation = await OrderConfirmation.create({
          order_id,
          type,
          otp,
          file_url: null, // file will be uploaded later
        });

        // ✅ In production, you should send OTP via SMS or push notification
        return res.status(200).json({
          message: "OTP generated successfully",
          confirmation_id: confirmation.id,
        });
      } catch (err) {
        console.error("Error generating OTP:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    
    static async getAvailableOrdersToday(_req: Request, res: Response) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
    
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
    
        const orders = await Order.findAll({
          where: {
            [Op.or]: [
              {
                pickup_date: {
                  [Op.between]: [todayStart, todayEnd],
                },
              },
              {
                delivery_date: {
                  [Op.between]: [todayStart, todayEnd],
                },
              },
            ],
            status: {
              [Op.notIn]: [OrderStatus.PICKUP_STARTED, OrderStatus.DELIVERY_STARTED],
            },
          },
          order: [["created_date", "DESC"]],
        });
    
        // Initialize the response object
        const groupedBySlot: Record<TimeSlot, Order[]> = {
          morning: [],
          noon: [],
          evening: [],
          night: [],
        };
    
        // Group by pickup_slot or delivery_slot
        for (const order of orders) {
          // Use pickup_slot if pickup_date is today, else use delivery_slot
          const isPickupToday =
            order.pickup_date && order.pickup_date >= todayStart && order.pickup_date <= todayEnd;
          const isDeliveryToday =
            order.delivery_date && order.delivery_date >= todayStart && order.delivery_date <= todayEnd;
    
          const slot = isPickupToday ? order.pickup_slot : isDeliveryToday ? order.delivery_slot : null;
    
          if (slot && groupedBySlot[slot]) {
            groupedBySlot[slot].push(order);
          }
        }
    
        res.status(200).json(groupedBySlot);
      } catch (error) {
        console.error("Error fetching today's unstarted orders:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }

    static async startPickup(req: Request, res: Response) {
      const { order_id } = req.params;
      const { employee_id } = req.body;

      try {
        const order = await Order.findByPk(order_id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        await order.update({
          status: OrderStatus.PICKUP_STARTED,
          pickup_employee_id: employee_id,
        });

        return res.status(200).json({ message: "Pickup started", order });
      } catch (error) {
        console.error("Error starting pickup:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    static async startDelivery(req: Request, res: Response) {
      const { order_id } = req.params;
      const { employee_id } = req.body;

      try {
        const order = await Order.findByPk(order_id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        await order.update({
          status: OrderStatus.DELIVERY_STARTED,
          delivery_employee_id: employee_id,
        });

        return res.status(200).json({ message: "Delivery started", order });
      } catch (error) {
        console.error("Error starting delivery:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    static async completePickup(req: Request, res: Response) {
      try {
        const { confirmationId } = req.params;
        const { otp } = req.body;
        const file = req.files?.file; // Assuming you are using `multer` for file handling
        
        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
    
        // 1. Check if confirmationId exists in the OrderConfirmation model
        const orderConfirmation = await OrderConfirmation.findOne({
          where: { confirmationId: confirmationId },
        });
    
        if (!orderConfirmation) {
          return res.status(404).json({ message: "Confirmation ID not found" });
        }
    
        // 2. Verify OTP
        if (orderConfirmation.otp !== otp) {
          return res.status(400).json({ message: "Invalid OTP" });
        }
    
        // 3. Upload file to Supabase
        const { data, error } = await supabase
          .storage
          .from('orderConfirmations') // Specify the bucket name
          .upload(`pickups/${confirmationId}_${file.name}`, file.data);
    
        if (error) {
          return res.status(500).json({ message: "File upload failed", error });
        }
    
        // 4. Store the file URL in the database
        const fileUrl = data?.path
        ? supabase.storage.from('your_bucket').getPublicUrl(data.path).data.publicUrl
        : null;
          
        if (fileUrl) {
          orderConfirmation.file_url = fileUrl;
          await orderConfirmation.save();
        }
    
        // 5. Send success response
        return res.status(200).json({ message: "Pickup completed successfully", fileUrl });
      } catch (error) {
        console.error("Error completing pickup:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    // static async completeDelivery(req: Request, res: Response) {
    // }
}
