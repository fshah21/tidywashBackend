import { Request, Response } from "express";
import { OrderStatus } from "../models/order.model";
import { Order } from "../models/order.model";
import { Cart } from "../models/cart.model";
import { Op } from 'sequelize';
import axios from "axios";
import { OrderConfirmation } from "../models/orderConfirmation.model";
import { TimeSlot } from "../models/order.model";
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountJSON = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
    'base64'
  ).toString('utf-8');

  const serviceAccount = JSON.parse(serviceAccountJSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

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

        const customer = await OrderController.getCustomerById(order.customer_id);
        const address = await OrderController.getAddress(order.address_id);

        const confirmations = await OrderConfirmation.findAll({
          where:{
            order_id: order.id
          }
        })

        return res.status(200).json({
          message: "Orders found successfully",
          order: order,
          confirmations: confirmations,
          customer: customer,
          address: address
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

        const customer = await OrderController.getCustomerById(order.customer_id);

        const fcmToken = customer?.user?.device_tokens?.[0]; // Adjust key name based on your response
        console.log("FCM TOKEN", fcmToken);
        const notificationTitle = type === "pickup" ? "Pickup OTP" : "Delivery OTP";
        const notificationBody = `Your ${type} OTP for order : #${order.ref_order_id} is ${otp}.`;

        if (fcmToken) {
          try {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: notificationTitle,
                body: notificationBody,
              },
              data: {
                orderId: order.id.toString(),
                type,
              },
            });
            console.log(`✅ Notification sent to ${fcmToken}`);
          } catch (error) {
            console.error(`❌ Failed to send notification:`, error?.message || error);
            // Optional: handle specific error codes if needed
            if (
              error.code === "messaging/registration-token-not-registered" ||
              error.code === "messaging/invalid-argument"
            ) {
              console.warn("⚠️ Invalid FCM token, consider removing it:", fcmToken);
              // Optionally: mark this token as invalid in your DB
            }
          }
        } else {
          console.warn(`⚠️ No FCM token found for customer ID ${order.customer_id}`);
        }

        return res.status(200).json({
          message: "OTP generated successfully",
          confirmation_id: confirmation.id,
        });
      } catch (err) {
        console.error("Error generating OTP:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    
    static async getAvailableOrdersToday(req: Request, res: Response) {
      try {
        const { employee_id } = req.query;
    
        if (!employee_id) {
          return res.status(400).json({ message: "Missing employee_id" });
        }
    
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
    
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
    
        const orders = await Order.findAll({
          where: {
            [Op.and]: [
              {
                [Op.or]: [
                  {
                    [Op.and]: [
                      { pickup_date: { [Op.between]: [todayStart, todayEnd] } },
                      { status: { [Op.notIn]: ["pickup_started", "delivery_started"] } },
                    ],
                  },
                  {
                    [Op.and]: [
                      { delivery_date: { [Op.between]: [todayStart, todayEnd] } },
                      { status: { [Op.notIn]: ["pickup_started", "delivery_started"] } },
                    ],
                  },
                  {
                    [Op.and]: [
                      { status: "pickup_started" },
                      { pickup_employee_id: employee_id },
                    ],
                  },
                  {
                    [Op.and]: [
                      { status: "delivery_started" },
                      { delivery_employee_id: employee_id },
                    ],
                  },
                ],
              },
              {
                status: { [Op.not]: "delivery_completed" },
              },
            ],
          },
          order: [["created_date", "DESC"]],
        });

        const enhancedOrders = await Promise.all(
          orders.map(async (order) => {
            const [customer, address] = await Promise.all([
              OrderController.getCustomerById(order.customer_id),
              OrderController.getAddress(order.address_id),
            ]);
        
            return {
              ...order.toJSON(), // Make sure Sequelize model is converted to plain object
              customer,
              address,
            };
          })
        );
    
        // Group by pickup or delivery slot
        const groupedBySlot: Record<TimeSlot, Order[]> = {
          morning: [],
          noon: [],
          evening: [],
          night: [],
        };
    
        for (const order of enhancedOrders) {
          const isPickupToday =
            order.pickup_date &&
            order.pickup_date >= todayStart &&
            order.pickup_date <= todayEnd;
    
          const isDeliveryToday =
            order.delivery_date &&
            order.delivery_date >= todayStart &&
            order.delivery_date <= todayEnd;
    
          const slot = isPickupToday
            ? order.pickup_slot
            : isDeliveryToday
            ? order.delivery_slot
            : null;
    
          if (slot && groupedBySlot[slot]) {
            groupedBySlot[slot].push(order);
          }
        }
    
        res.status(200).json(groupedBySlot);
      } catch (error) {
        console.error("Error fetching today's available orders:", error);
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
        const { confirmation_id } = req.params;
        const { otp, file_url, type } = req.body;
        
        if (!file_url || !otp || !type) {
          return res.status(400).json({ message: "Missing file, OTP or type" });
        }
    
        // 1. Check if confirmationId exists in the OrderConfirmation model
        const orderConfirmation = await OrderConfirmation.findOne({
          where: { id: confirmation_id },
        });
    
        if (!orderConfirmation) {
          return res.status(404).json({ message: "Confirmation ID not found" });
        }
    
        // 2. Verify OTP
        if (orderConfirmation.otp !== otp) {
          return res.status(400).json({ message: "Invalid OTP" });
        }
  
        orderConfirmation.file_url = file_url;
        await orderConfirmation.save();
    
        const order = await Order.findOne({ where: { id: orderConfirmation.order_id } });

        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        if (type === "pickup") {
          order.status = OrderStatus.PICKUP_COMPLETED;
        } else if (type === "delivery") {
          order.status = OrderStatus.DELIVERY_COMPLETED;
        } else {
          return res.status(400).json({ message: "Invalid type" });
        }

        await order.save();
        return res.status(200).json({ message: "Pickup completed successfully", file_url });
      } catch (error) {
        console.error("Error completing pickup:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    static async getCustomerById(customerId: String) {
      console.log("IN GET CUSTOMER ID", customerId);
      const customer = await axios.get(`https://tidywashbackend.onrender.com/api/getCustomerById/${customerId}`);
      return customer.data;
    }

    static async getAddress(addressId: String) {
      console.log("IN GET ADDRESS", addressId);
      const address = await axios.get(`https://tidywashbackend.onrender.com/api/getAddressById/${addressId}`);
      return address.data;
    }

    // static async completeDelivery(req: Request, res: Response) {
    // }
}
