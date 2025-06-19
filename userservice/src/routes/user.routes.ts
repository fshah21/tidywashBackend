import { Router } from "express";
import { UserController } from "../controllers/user.controller";

export const userRoutes = Router();

userRoutes.get("/healthCheck", UserController.healthCheck);
userRoutes.post("/createUser", UserController.createUser);
userRoutes.post("/login", UserController.login);
userRoutes.post("/loginAsAdmin", UserController.loginAsAdmin);