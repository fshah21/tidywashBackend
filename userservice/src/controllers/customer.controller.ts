import { Request, Response } from "express";
import { Address } from "../models/address.model";

export class CustomerController {
    static async getAddressesForCustomer(req: Request, res: Response) {
        try {
            const { customer_id } = req.params;
      
            if (!customer_id) {
              return res.status(400).json({ message: "Customer ID is required" });
            }
      
            const addresses = await Address.findAll({
              where: { customer_id },
              order: [['created_date', 'DESC']],
            });
      
            return res.status(200).json(addresses);
          } catch (error) {
            console.error("Error fetching addresses:", error);
            return res.status(500).json({ message: "Server error", error });
          }
    }

    static async addAddress(req: Request, res: Response) {
        try {
            const {
              customer_id,
              line1,
              line2,
              city,
              state,
              pincode,
              country,
              nick_name,
            } = req.body;
      
            if (!customer_id || !line1 || !city || !state || !pincode || !country || !nick_name) {
              return res.status(400).json({ message: "Missing required fields" });
            }
      
            const address = await Address.create({
              customer_id,
              line1,
              line2,
              city,
              state,
              pincode,
              country,
              nick_name,
            });
      
            return res.status(201).json({
              message: "Address added successfully",
              address,
            });
          } catch (error) {
            console.error("Error adding address:", error);
            return res.status(500).json({ message: "Internal server error", error });
          }
    }
}