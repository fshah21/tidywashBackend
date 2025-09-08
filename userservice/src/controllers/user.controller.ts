import { Request, Response } from "express";
import { User } from "../models/user.model";
import { Employee } from "../models/employee.model";
import { Customer } from "../models/customer.model";
import { Admin } from "../models/admin.model";

export class UserController {
  static async healthCheck(_req: Request, res: Response) {
    return res.status(200).json({
      message: "health check"
    })
  }
  
  static async createUser(req: Request, res: Response) {
    try {
      console.log("CREATE USER METHOD");
      const { phone_number, name } = req.body;
      console.log("PHONE NUMBER", req.body);

      // Validate required fields
      if (!phone_number || !phone_number.number || !phone_number.country_code) {
        console.log("VALIDATION ISSUE");
        return res.status(400).json({ message: "Phone number with country code is required" });
      }

      if (!phone_number.country_code.startsWith('+')) {
        phone_number.country_code = `+${phone_number.country_code}`;
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

      console.log("EXISTING USER", existingUser);

      if (existingUser) {
        console.log("THIS IS AN EXISTING USER");
        const userID = existingUser.id;
        const role = existingUser.role;

        // 🔹 Update the name if changed
        if (existingUser.first_name !== name) {
          existingUser.first_name = name;
          await existingUser.save();
        }

        if (role == "customer") {
            const existingCustomer = await Customer.findOne({
                where: {
                    user_id : userID
                }
            });
            console.log("CUSTOMER", existingCustomer);

            return res.status(200).json({ 
                message: "User with this phone number already exists",
                user: {
                    id: existingUser.id,
                    phone_number: existingUser.phone_number,
                    first_name: existingUser.first_name,
                    last_name: existingUser.last_name,
                    created_by: existingUser.created_by,
                    created_date: existingUser.created_date,
                    modified_date: existingUser.modified_date,
                    role: existingUser.role,
                    customer : {
                        id: existingCustomer.id,
                        user_id: existingCustomer.user_id,
                        created_date: existingCustomer.created_date,
                        modified_date: existingCustomer.modified_date
                    }
                }
              });
        } else if (role == "employee") {
            const existingEmployee = await Employee.findOne({
                where: {
                    user_id : userID
                }
            });

            return res.status(200).json({ 
                message: "User with this phone number already exists",
                user: {
                    id: existingUser.id,
                    phone_number: existingUser.phone_number,
                    first_name: existingUser.first_name,
                    last_name: existingUser.last_name,
                    created_by: existingUser.created_by,
                    created_date: existingUser.created_date,
                    modified_date: existingUser.modified_date,
                    role: existingUser.role,
                    employee : {
                        id: existingEmployee.id,
                        user_id: existingEmployee.user_id,
                        created_date: existingEmployee.created_date,
                        modified_date: existingEmployee.modified_date
                    }
                }
              });
        } else  {
            return res.status(200).json({ 
                message: "User with this phone number already exists",
                user: {
                    id: existingUser.id,
                    phone_number: existingUser.phone_number,
                    first_name: existingUser.first_name,
                    last_name: existingUser.last_name,
                    created_by: existingUser.created_by,
                    created_date: existingUser.created_date,
                    modified_date: existingUser.modified_date,
                    role: existingUser.role
                }
              });

        }
      }

      try {
          // Create new user
          const newUser = await User.create({
              first_name: name,
              phone_number,
              role: "customer"
          });

          // Create corresponding employee
          const newCustomer = await Customer.create({
              user_id: newUser.id
          });

          return res.status(201).json({
              message: "User created successfully",
              user: {
                  id: newUser.id,
                  phone_number: newUser.phone_number,
                  first_name: newUser.first_name,
                  last_name: newUser.last_name,
                  created_by: newUser.created_by,
                  created_date: newUser.created_date,
                  modified_date: newUser.modified_date,
                  role: newUser.role,
                  customer : {
                    id: newCustomer.id,
                    user_id: newUser.id,
                    created_date: newCustomer.created_date,
                    modified_date: newCustomer.modified_date
                  }
              },
          });

      } catch (error) {
          throw error;
      }

  } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ 
          message: "Failed to create user",
          error: error.message 
      });
  }
  }

  static async login(req: Request, res: Response) {
    try {
        const { phone_number, device_token } = req.body;
    
        if (!phone_number?.number || !phone_number?.country_code || !device_token) {
          return res.status(400).json({ message: "Missing phone number or device token" });
        }
    
        const formattedPhone = {
          number: phone_number.number,
          country_code: phone_number.country_code.startsWith("+")
            ? phone_number.country_code
            : `+${phone_number.country_code}`,
        };
    
        // ✅ Find user by phone number
        const user = await User.findOne({
          where: {
            phone_number: formattedPhone,
          },
        });
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        // ✅ Add device token if not already saved
        const tokens = user.device_tokens || [];
        if (!tokens.includes(device_token)) {
          tokens.push(device_token);
          user.device_tokens = tokens;
          await user.save();
        }
    
        // ✅ Fetch role-specific data
        let customer = null;
        let employee = null;
    
        if (user.role === "customer") {
          customer = await Customer.findOne({ where: { user_id: user.id } });
        } else if (user.role === "employee") {
          employee = await Employee.findOne({ where: { user_id: user.id } });
        }
    
        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            phone_number: user.phone_number,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            device_tokens: user.device_tokens,
            customer,
            employee,
          },
        });
      } catch (error) {
        console.error("Login failed", error);
        return res.status(500).json({ message: "Login failed", error: error.message });
      }
  }

  static async loginAsAdmin(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }
  
      const admin = await Admin.findOne({ where: { email } });
  
      if (!admin) {
        return res.status(400).json({ message: "Invalid credentials." });
      }
  
      // Exclude password from response
      const { password: _, ...adminData } = admin.get({ plain: true });
  
      return res.status(200).json({ admin: adminData });
  }

  static async getUserDetails(req: Request, res: Response) {
  try {
    const { user_id } = req.params;

    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
}

static async updateName(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { name } = req.body;

    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.first_name = name;
    await user.save(); // ✅ ensure DB is updated

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
}
}