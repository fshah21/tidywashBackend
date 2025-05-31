import { Router } from "express";
import { UserController } from "../controllers/user.controller";

export const userRoutes = Router();

userRoutes.get("/healthCheck", UserController.healthCheck);
userRoutes.post("/createEmployee", UserController.createEmployee);
userRoutes.post("/createUser", UserController.createUser);
userRoutes.post("/loginAsAdmin", UserController.loginAsAdmin);