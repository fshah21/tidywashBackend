
import express from "express";
import { json } from "body-parser";
import cors from "cors";
import { userRoutes } from "./routes/user.routes";
import { Sequelize } from "sequelize-typescript";
import { User } from "./models/user.model";
import { runWith } from "firebase-functions";
import { Employee } from "./models/employee.model";
import { Customer } from "./models/customer.model";
import { Address } from "./models/address.model";
import dns from 'dns';
import { customerRoutes } from "./routes/customer.routes";
import { Admin } from "./models/admin.model";
import { employeeRoutes } from "./routes/employee.routes";
dns.setDefaultResultOrder('ipv4first');

const app = express();
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: "512MB" as "512MB",
};

// // Apply middleware
app.use(json());

// CORS configuration
app.use(cors({ origin: true }));

app.use("/api", userRoutes);
app.use("/api", customerRoutes);
app.use("/api", employeeRoutes);

const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.send("Service is running userservice!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

let sequelize: Sequelize;

// Initialize the database connection
function getSequelizeInstance() {
    if (!sequelize) {
      sequelize = new Sequelize('postgres', 'postgres.uqohgtgpqijblzljdaxl', 'tidywash-prod', {
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        dialect: 'postgres',
        models: [User, Employee, Customer, Address, Admin],
      });

    }
    
    return sequelize;
  }
  // Use the singleton instance
  sequelize = getSequelizeInstance();

  sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established");
    return sequelize.sync({ alter: true }); // sync ONCE at startup
  })
  .then(() => {
    console.log("Tables synced");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

  exports.userservice = runWith(runtimeOpts)
  .region("asia-south1")
  .https.onRequest(async (req, res) => {
    try {
      // Use the singleton instance
      app(req, res); // handle the request
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      res.status(500).send("Failed to connect to the database." + error);
    }
  });