import { Router } from "express";
import { CartController } from "../controllers/cart.controller";

export const cartRoutes = Router();

cartRoutes.post("/carts", CartController.createCart);