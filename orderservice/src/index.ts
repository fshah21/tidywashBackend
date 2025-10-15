
import express from "express";
import { json } from "body-parser";
import cors from "cors";
import { Sequelize } from "sequelize-typescript";
import * as functions from "firebase-functions/v2";
import { orderRoutes } from "./routes/order.routes";
import { cartRoutes } from "./routes/cart.routes";
import { pricingRoutes } from "./routes/pricing.routes";
import { Pricing } from "./models/pricing.model";
import { CartItem } from "./models/cartItem.model";
import { Cart } from "./models/cart.model";
import { Order } from "./models/order.model";
import { OrderConfirmation } from "./models/orderConfirmation.model";
import { Membership } from "./models/membership.model";
import { CustomerMembership } from "./models/customerMemberships.model";
import { membershipRoutes } from "./routes/membership.routes";

const app = express();
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: "512MiB" as const, // Use 'as const' so TypeScript treats it as literal
};

// CORS configuration
app.use(cors({ origin: true }));

// // Apply middleware
app.use(json());
app.use("/api", orderRoutes);
app.use("/api", cartRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api", membershipRoutes);

app.get("/", (_req, res) => {
  res.send("Service is running!");
});

let sequelize: Sequelize;

// Initialize the database connection
function getSequelizeInstance() {
    if (!sequelize) {
      sequelize = new Sequelize('postgres', 'postgres.uqohgtgpqijblzljdaxl', 'tidywash-prod', {
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        dialect: 'postgres',
        models: [Pricing, Cart, CartItem, Order, OrderConfirmation, Membership, CustomerMembership],
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

export const orderservice = functions.https.onRequest(
  {
    ...runtimeOpts,
    region: "asia-south1",
  },
  (req, res) => {
    app(req, res);
  }
);