import { Request, Response } from "express";
import { Cart, CartStatus } from "../models/cart.model";
import { CartItem } from "../models/cartItem.model";
import { Pricing } from "../models/pricing.model";

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

  static async getActiveCartByCustomerId(req: Request, res: Response) {
    try {
      const { customer_id } = req.params;

      const cart = await Cart.findOne({
        where: {
          customer_id: customer_id,
          status: "active"
        },
        order: [['created_date', 'DESC']],
      });
      if (!cart) {
        return res.status(404).json({ message: "No active carts for this customer" });
      }

      const cartItems = await CartItem.findAll({
        where: {
          cart_id: cart.id
        }
      })

      return res.status(200).json({
        message: "Cart found successfully",
        cart: cart,
        cart_items: cartItems
      });
    } catch (error) {
      console.error("Error getting active carts by customer id:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getCartDetails(req: Request, res: Response) {
    const { cart_id } = req.params;
    console.log("GET CART DETAILS", cart_id);
    const cartItems = await CartItem.findAll({
      where: {
        cart_id: cart_id
      },
      include: [
        {
          model: Pricing
        }
      ]
    })
    console.log("CART ITEMS", cartItems);

    return res.status(200).json({
      cart_items: cartItems
    })
  }

  static async getCartById(req: Request, res: Response) {
    const { cart_id } = req.params;
    console.log("GET CART BY ID", cart_id);
    const cart = await Cart.findByPk(cart_id);
    console.log("CART", cart);

    return res.status(200).json({
      cart: cart
    })
  }

  static async emptyCart(req: Request, res: Response) {
    const { cart_id } = req.params;

    try {
      // Find the cart first
      const cart = await Cart.findByPk(cart_id);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      // Delete all items associated with this cart
      await CartItem.destroy({
        where: { cart_id: cart.id },
      });

      // Update the total amount to 0
      cart.total_amount = 0;
      await cart.save();

      return res.status(200).json({
        message: "Cart emptied successfully",
        cart_id: cart.id,
        total_amount: cart.total_amount,
      });
    } catch (error) {
      console.error("Error emptying cart:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
