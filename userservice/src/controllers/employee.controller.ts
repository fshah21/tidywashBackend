import { Request, Response } from "express";
import { User } from "../models/user.model";
import { Employee } from "../models/employee.model";

export class EmployeeController {
    static async createEmployee(req: Request, res: Response) {
        try {
          const { phone_number, first_name, last_name } = req.body;
    
          // Validate required fields
          if (!phone_number || !phone_number.number || !phone_number.country_code) {
              return res.status(400).json({ message: "Phone number with country code is required" });
          }
    
          // Check if user with this phone number already exists
          const existingUser = await User.findOne({
              where: {
                  phone_number: {
                      number: phone_number.number,
                      country_code: phone_number.country_code
                  }
              }
          });
    
          if (existingUser) {
              return res.status(400).json({ 
                  message: "User with this phone number already exists",
                  user_id: existingUser.id
              });
          }
    
          try {
              // Create new user
              const newUser = await User.create({
                  phone_number,
                  first_name,
                  last_name,
                  role: "employee"
              });
    
              // Create corresponding employee
              const newEmployee = await Employee.create({
                  user_id: newUser.id
              });
    
              return res.status(201).json({
                  message: "Employee created successfully",
                  user: {
                      id: newUser.id,
                      phone_number: newUser.phone_number,
                      first_name: newUser.first_name,
                      last_name: newUser.last_name,
                      created_by: newUser.created_by,
                      created_date: newUser.created_date,
                      modified_date: newUser.modified_date,
                      employee : {
                        id: newEmployee.id,
                        user_id: newUser.id,
                        created_date: newEmployee.created_date,
                        modified_date: newEmployee.modified_date
                      }
                  },
              });
    
          } catch (error) {
              throw error;
          }
    
      } catch (error) {
          console.error("Error creating employee:", error);
          return res.status(500).json({ 
              message: "Failed to create employee",
              error: error.message 
          });
      }
    }
    
    static async getAllEmployees(_req: Request, res: Response) {
        try {
            const employees = await Employee.findAll({ include: [User] });
            return res.status(200).json(employees);
        } catch (err) {
            return res.status(500).json({ error: "Failed to fetch employees", details: err });
        }
    }

    static async getEmployeeById(req: Request, res: Response) {
        const employeeId = req.params.employee_id;
        console.log("GET EMPLOYEE BY ID", employeeId);
          try {
            const employee = await Employee.findByPk(employeeId, {
              include: [
                {
                  model: User
                },
              ],
            });
  
            console.log("EMPLOYEE", employee);
  
            if (!employee) {
              return res.status(404).json({ message: "Employee not found" });
            }
  
            return res.status(200).json(employee);
          } catch (error) {
            console.error("Error fetching employee:", error);
            return res.status(500).json({ message: "Error fetching employee", error });
          }
      }
}