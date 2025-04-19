import { Router } from "express";
import { PricingController } from "../controllers/pricing.controller";

export const pricingRoutes = Router();

pricingRoutes.get("/getPricingInfo", PricingController.getPricingInfo);