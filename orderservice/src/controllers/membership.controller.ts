import { Request, Response } from "express";
import { CustomerMembership } from "../models/customerMemberships.model";
import { Membership } from "../models/membership.model";
import { Order } from "../models/order.model"; // Assuming you have this model
import { addDays } from "date-fns"; // Use date-fns for clarity

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
              plan_id,
              type
            } = req.body;
      
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
            const plan = await Membership.findByPk(plan_id);
            if (!plan) return res.status(400).json({ message: "Invalid plan_id" });
      
            const { total_orders, interval_days } = plan;
      
            // 3. Calculate first pickup date
            const today = new Date();
            const preferredPickupDayIndex = dayStringToIndex(preferred_pickup_day); // Sunday = 0
      
            const firstPickupDate = getNextWeekday(today, preferredPickupDayIndex);
      
            // 4. Create all orders
            const ordersToCreate = [];
            for (let i = 0; i < total_orders; i++) {
              const pickupDate = addDays(firstPickupDate, i * interval_days);
              const deliveryDate = getNextWeekday(pickupDate, dayStringToIndex(preferred_delivery_day));
      
              ordersToCreate.push({
                customer_id,
                membership_id: membership.id,
                pickup_date: pickupDate,
                pickup_slot: preferred_pickup_slot,
                delivery_date: deliveryDate,
                delivery_slot: preferred_delivery_slot,
                address_id,
              });
            }
      
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
