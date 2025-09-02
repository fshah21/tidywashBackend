import { Router } from "express";
import { CartController } from "../controllers/cart.controller";

export const cartRoutes = Router();

cartRoutes.post("/carts", CartController.createCart);
cartRoutes.get("/carts/getActiveCartByCustomerId/:customer_id", CartController.getActiveCartByCustomerId);
cartRoutes.get("/carts/getCartDetails/:cart_id", CartController.getCartDetails);
cartRoutes.get("/carts/getCartById/:cart_id", CartController.getCartById);