import { Request, Response } from "express";
import { Cart, CartStatus } from "../models/cart.model";
import { CartItem } from "../models/cartItem.model";

interface CartItemInput {
  quantity: number;
  unit_price: number;
  garment_type?: string;
  category?: string;
}

interface ItemsMap {
  [pricingId: string]: CartItemInput;
}

export class CartController {
  static async createCart(req: Request, res: Response) {
  try {
    console.log("CREATE CART", req.body);
    const { customer_id, items } = req.body;

    if (!customer_id || !items || typeof items !== "object") {
      console.log("SOME VALIDATION FAILED");
      return res.status(400).json({ error: "Missing customer_id or items" });
    }

    // 1. Create a new Cart
    const cart = await Cart.create({
      customer_id,
      total_amount: 0,
      status: CartStatus.ACTIVE,
    });

    let totalAmount = 0;

    const itemsTyped = items as ItemsMap;

    // 2. For each pricing_id create CartItem
    for (const [pricing_id, item] of Object.entries(itemsTyped)) {
      const quantity = Number(item.quantity);
      const unit_price = Number(item.unit_price);

      if (!quantity || !unit_price) {
        return res.status(400).json({ error: `Invalid quantity or unit_price for item ${pricing_id}` });
      }

      const total_price = quantity * unit_price;
      totalAmount += total_price;

      await CartItem.create({
        cart_id: cart.id,
        pricing_id,
        quantity,
        unit_price,
        total_price,
      });
    }
    console.log("CART ITMES CREATED");

    // 3. Update cart total_amount
    cart.total_amount = totalAmount;
    await cart.save();

    console.log("CART IS UPDATED");

    // 4. Respond success with cart data
    return res.status(201).json({
      message: "Cart created successfully",
      cart_id: cart.id,
      total_amount: totalAmount,
      status: cart.status,
    });
  } catch (error) {
    console.error("Error creating cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
}
