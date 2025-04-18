import { Router } from "express";
import { OrderController } from "../controllers/order.controller";

export const orderRoutes = Router();

orderRoutes.get("/healthCheck", OrderController.healthCheck);