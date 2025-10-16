
import express from "express";
import { json } from "body-parser";
import cors from "cors";
import { userRoutes } from "./routes/user.routes";
import { Sequelize } from "sequelize-typescript";
import { User } from "./models/user.model";
import * as functions from "firebase-functions/v2";
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
  memory: "512MiB" as const, // Use 'as const' so TypeScript treats it as literal
};

// // Apply middleware
app.use(json());

// CORS configuration
app.use(cors({ origin: true }));

app.use("/api", userRoutes);
app.use("/api", customerRoutes);
app.use("/api", employeeRoutes);

app.get("/", (_req, res) => {
  res.send("Service is running userservice!");
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

export const userservice = functions.https.onRequest(
  {
    ...runtimeOpts,
    region: "asia-south1",
  },
  (req, res) => {
    app(req, res);
  }
);