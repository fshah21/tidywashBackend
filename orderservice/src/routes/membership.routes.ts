import { Router } from "express";
import { MembershipController } from "../controllers/membership.controller";

export const membershipRoutes = Router();

membershipRoutes.post("/membership/createMembership", MembershipController.createMembership);
membershipRoutes.get("/membership/getMembershipDetails/:membership_id", MembershipController.getMembershipDetails);
membershipRoutes.get("/membership/getActiveMembershipsByCustomerId/:customer_id", MembershipController.getActiveMembershipsByCustomerId);