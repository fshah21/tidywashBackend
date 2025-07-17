import { Request, Response } from "express";
import { CustomerMembership } from "../models/customerMemberships.model";
import { Membership } from "../models/membership.model";
import { Cart } from "../models/cart.model"; 
import { CartItem } from "../models/cartItem.model";
import { Order } from "../models/order.model"; // Assuming you have this model
import { addDays } from "date-fns"; // Use date-fns for clarity
import { Pricing, PricingCategory, GarmentType } from "../models/pricing.model";

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
                    type: type
                }
            })
            if (!plan) return res.status(400).json({ message: "Invalid plan_id" });
            const plan_id = plan.id;
      
            // 1. Create membership record
            const membership = await CustomerMembership.create({
              customer_id,
              plan_id,
              type,
              address_id,
              preferred_pickup_day,
              preferred_pickup_slot,
              preferred_delivery_day,
              preferred_delivery_slot,
              start_date: new Date(), // today
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
            const endDate = addDays(firstPickupDate, (total_orders - 1) * interval_days);
            membership.end_date = endDate;
            await membership.save();
      
            return res.status(201).json({ message: "Membership created and orders scheduled", membership });
          } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Internal server error" });
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
