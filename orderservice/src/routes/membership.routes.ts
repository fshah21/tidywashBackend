import { Router } from "express";
import { MembershipController } from "../controllers/membership.controller";

export const membershipRoutes = Router();

membershipRoutes.post("/membership/createMembership", MembershipController.createMembership);