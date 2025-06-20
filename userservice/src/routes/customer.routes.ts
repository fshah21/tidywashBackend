import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";

export const customerRoutes = Router();

customerRoutes.get("/getAddressesForCustomer/:customer_id", CustomerController.getAddressesForCustomer);
customerRoutes.post("/addAddress", CustomerController.addAddress);
customerRoutes.post("/getAddressById/:address_id", CustomerController.getAddressById);
customerRoutes.get("/getCustomerById/:customer_id", CustomerController.getCustomerById);