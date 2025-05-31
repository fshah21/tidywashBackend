import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";

export const employeeRoutes = Router();

employeeRoutes.post("/createEmployee", EmployeeController.createEmployee);
employeeRoutes.get("/getAllEmployees", EmployeeController.getAllEmployees);