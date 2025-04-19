import { Request, Response } from "express";
import { Pricing } from "../models/pricing.model";

export class PricingController {
    static async getPricingInfo(_req: Request, res: Response) {
        try {
        const pricingData = await Pricing.findAll();
    
        const grouped = pricingData.reduce((acc, item) => {
            const categoryTitle = item.category.toUpperCase();
    
            if (!acc[categoryTitle]) {
                acc[categoryTitle] = [];
            }
    
            acc[categoryTitle].push({
                pricing_id: item.id,
                garment_type: item.garment_type,
                unit_price: item.price,
            });
    
            return acc;
        }, {} as Record<string, any[]>);
    
        const result = Object.entries(grouped).map(([title, items]) => ({
            title,
            items,
        }));
    
        return res.json({ categories: result });
        } catch (error) {
            console.error("Error fetching pricing info:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
      }
}
