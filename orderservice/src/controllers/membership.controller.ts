import { Request, Response } from "express";
import { CustomerMembership } from "../models/customerMemberships.model";
import { Membership, MembershipStatus } from "../models/membership.model";
import { Cart } from "../models/cart.model"; 
import { CartItem } from "../models/cartItem.model";
import { Order } from "../models/order.model"; // Assuming you have this model
import { addDays } from "date-fns"; // Use date-fns for clarity
import { Pricing, PricingCategory, GarmentType } from "../models/pricing.model";
import axios from "axios";
import { Op } from "sequelize";

export enum Day {
    SUNDAY = "sunday",
    MONDAY = "monday",
    TUESDAY = "tuesday",
    WEDNESDAY = "wednesday",
    THURSDAY = "thursday",
    FRIDAY = "friday",
    SATURDAY = "saturday",
}

export class MembershipController {
    static async createMembership(req: Request, res: Response) {
        try {
            const {
              customer_id,
              address_id,
              preferred_pickup_day,
              preferred_pickup_slot,
              preferred_delivery_day,
              preferred_delivery_slot,
              type
            } = req.body;

            const plan = await Membership.findOne({
                where: {
                    name: type
                }
            })
            if (!plan) return res.status(400).json({ message: "Invalid plan_id" });
            const plan_id = plan.id;

            let membership = await CustomerMembership.findOne({
                where: {
                    customer_id,
                    plan_id,
                }
            });
    
            if (membership) {
                // ✅ Update existing membership
                await membership.update({
                  address_id,
                  preferred_pickup_day,
                  preferred_pickup_slot,
                  preferred_delivery_day,
                  preferred_delivery_slot,
                  start_date: new Date(), // optional: reset start date
                  status: MembershipStatus.ACTIVE
                });

                const inProgressStatuses = [
                    "pickup_started",
                    "pickup_completed",
                    "delivery_started",
                    "delivery_completed"
                ];

                const existingOrders = await Order.findAll({
                    where: {
                    user_membership_id: membership.id,
                    status: {
                        [Op.notIn]: inProgressStatuses
                    }
                    },
                    order: [['pickup_date', 'ASC']]
                });

                const today = new Date();
                const preferredPickupDayIndex = dayStringToIndex(preferred_pickup_day);
                const firstPickupDate = getNextWeekday(today, preferredPickupDayIndex);

                for (let i = 0; i < existingOrders.length; i++) {
                    const order = existingOrders[i];
                    const newPickupDate = addDays(firstPickupDate, i * plan.interval_days);
                    const newDeliveryDate = getNextWeekday(newPickupDate, dayStringToIndex(preferred_delivery_day));

                    await order.update({
                    pickup_date: newPickupDate,
                    pickup_slot: preferred_pickup_slot,
                    delivery_date: newDeliveryDate,
                    delivery_slot: preferred_delivery_slot,
                    address_id
                    });

                    if (i === 0) {
                    // Set the next order date
                    await membership.update({ next_order_date: newPickupDate });
                    }
                }
              } else {
                // ✅ Create new membership

                const randomRefId = `TWM-${Math.floor(100000 + Math.random() * 900000)}`;

                membership = await CustomerMembership.create({
                  customer_id,
                  plan_id,
                  type,
                  address_id,
                  preferred_pickup_day,
                  preferred_pickup_slot,
                  preferred_delivery_day,
                  preferred_delivery_slot,
                  start_date: new Date(),
                  status: MembershipStatus.ACTIVE,
                  ref_membership_id: randomRefId
                });

                  // 2. Get membership plan      
            const { total_orders, interval_days } = plan;
      
            // 3. Calculate first pickup date
            const today = new Date();
            const preferredPickupDayIndex = dayStringToIndex(preferred_pickup_day); // Sunday = 0
      
            const firstPickupDate = getNextWeekday(today, preferredPickupDayIndex);
      
            // Get pricing IDs for tops and bottoms (wash & iron)
            const washAndIronPrices = await Pricing.findAll({
                where: {
                category: PricingCategory.WASH_AND_IRON,
                garment_type: [GarmentType.TOPS, GarmentType.BOTTOMS],
                },
            });
            
            const topsPricing = washAndIronPrices.find(p => p.garment_type === GarmentType.TOPS);
            const bottomsPricing = washAndIronPrices.find(p => p.garment_type === GarmentType.BOTTOMS);
            
            if (!topsPricing || !bottomsPricing) {
                return res.status(500).json({ message: "Required pricing entries not found" });
            }
            
            const ordersToCreate = [];
            
            for (let i = 0; i < total_orders; i++) {
                const pickupDate = addDays(firstPickupDate, i * interval_days);
                const deliveryDate = getNextWeekday(pickupDate, dayStringToIndex(preferred_delivery_day));
            
                // 1. Create Cart
                const cart = await Cart.create({
                customer_id,
                total_amount: 0,
                });
            
                // 2. Create CartItems with quantity and zero pricing
                await CartItem.bulkCreate([
                {
                    cart_id: cart.id,
                    pricing_id: topsPricing.id,
                    quantity: 5,
                    unit_price: 0,
                    total_price: 0,
                },
                {
                    cart_id: cart.id,
                    pricing_id: bottomsPricing.id,
                    quantity: 5,
                    unit_price: 0,
                    total_price: 0,
                },
                ]);

                const randomRefId = `TW-${Math.floor(100000 + Math.random() * 900000)}`;

                if (i == 0) {
                    await membership.update(
                        { next_order_date: pickupDate },
                        { where: { id: membership.id } }
                    );
                }
            
                // 3. Attach cart to the order (if you have a cart_id or similar column)
                ordersToCreate.push({
                    customer_id,
                    user_membership_id: membership.id,
                    pickup_date: pickupDate,
                    pickup_slot: preferred_pickup_slot,
                    delivery_date: deliveryDate,
                    delivery_slot: preferred_delivery_slot,
                    address_id,
                    cart_id: cart.id, // 🔁 make sure your Order model has this
                    ref_order_id: randomRefId
                });
            }
            
                // Now create all orders
                await Order.bulkCreate(ordersToCreate);

                // 5. Set membership end date
                let endDate = new Date(); // Initialize with current date
                if (type === '1-month') {
                    endDate.setDate(endDate.getDate() + 30);
                } else if (type === '3-month') {
                    endDate.setDate(endDate.getDate() + 90);
                }
                membership.end_date = endDate;
                await membership.save();
            }
            return res.status(201).json({ message: "Membership created and orders scheduled", membership });
          } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error" });
          }
    }

    static async getMembershipDetails(req: Request, res: Response) {
        console.log("IN GET MEMBERSHIP DETAILS");
        const { membership_id } = req.params;
        console.log("MEMBERSHIP ID", membership_id);

        const membership = await CustomerMembership.findByPk(membership_id);
        console.log("MEMBERSHIP", membership);

        const customer = await MembershipController.getCustomerById(membership.customer_id);
        console.log("CUSTOMER", customer);
        const address = await MembershipController.getAddress(membership.address_id);
        console.log("ADDRESS", address);

        return res.status(200).send({
            membership: membership,
            customer: customer,
            address: address
        })
    }

    static async getActiveMembershipsByCustomerId(req: Request, res: Response) {
        try {
            const { customer_id } = req.params;

            if (!customer_id) {
                return res.status(400).json({ error: 'customer_id is required' });
            }

            const memberships = await CustomerMembership.findAll({
                where: {
                    customer_id,
                    status: {
                        [Op.notIn]: ['cancelled', 'expired']
                    }
                }
            });

            return res.status(200).json({ memberships });
        } catch (error) {
            console.error('Error fetching active memberships:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getPastMembershipsByCustomerId(req: Request, res: Response) {
        try {
            const { customer_id } = req.params;

            if (!customer_id) {
                return res.status(400).json({ error: 'customer_id is required' });
            }

            const memberships = await CustomerMembership.findAll({
                where: {
                    customer_id,
                    status: {
                        [Op.in]: ['cancelled', 'expired']
                    }
                }
            });

            return res.status(200).json({ memberships });
        } catch (error) {
            console.error('Error fetching past memberships:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getCustomerById(customerId: String) {
        console.log("IN GET CUSTOMER ID", customerId);
        const customer = await axios.get(`https://asia-south1-tidywash-front.cloudfunctions.net/userservice/api/getCustomerById/${customerId}`);
        return customer.data;
    }

    static async getAddress(addressId: String) {
        console.log("IN GET ADDRESS", addressId);
        const address = await axios.get(`https://asia-south1-tidywash-front.cloudfunctions.net/userservice/api/getAddressById/${addressId}`);
        return address.data;
    }

    static async updateMembershipStatus(req: Request, res: Response) {
        try {
            const { membership_id } = req.params;
            const { status } = req.body;
        
            // Validate required data (optional: add stricter validation as needed)
            if (!status) {
            return res.status(400).json({ message: "Status is blank" });
            }
        
            const membership = await CustomerMembership.findByPk(membership_id);
            if (!membership) {
            return res.status(404).json({ message: "Order not found" });
            }
        
            // Update only provided fields
            if (status) membership.status = status;
        
            await membership.save();

            return res.status(200).json({
                membership: membership
            })
        } catch (error) {
            console.error("Error updating membership status:", error);
            return res.status(500).json({ message: "Internal server error" });
        }   
    }

    static async getAllMemberships(_req: Request, res: Response) {
          try {
            const memberships = await CustomerMembership.findAll({
              where: {
                status: {
                  [Op.notIn]: ["expired", "cancelled"]
                }
              },
              order: [["created_date", "DESC"]]
            });
    
            const customerIds = [...new Set(memberships.map(membership => membership.customer_id))];
    
            const customerResponses = await Promise.all(
              customerIds.map(id =>
                axios.get(`https://asia-south1-tidywash-front.cloudfunctions.net/userservice/api/getCustomerById/${id}`)
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
            const enrichedOrders = memberships.map(order => ({
              ...order.toJSON(),
              customer: customerMap.get(order.customer_id) || null,
            }));
        
            res.status(200).json(enrichedOrders);
          } catch (error) {
            res.status(500).json({ message: "Error fetching orders", error });
          }
        }
}

function dayStringToIndex(day: Day): number {
    const map: Record<Day, number> = {
        [Day.SUNDAY]: 0,
        [Day.MONDAY]: 1,
        [Day.TUESDAY]: 2,
        [Day.WEDNESDAY]: 3,
        [Day.THURSDAY]: 4,
        [Day.FRIDAY]: 5,
        [Day.SATURDAY]: 6,
    };
    return map[day];
}

function getNextWeekday(fromDate: Date, targetDayIndex: number): Date {
    const currentDay = fromDate.getDay();
    const daysUntilTarget = (targetDayIndex + 7 - currentDay) % 7 || 7;
    return addDays(fromDate, daysUntilTarget);
}
