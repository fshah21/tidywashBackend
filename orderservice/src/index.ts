
import express from "express";
import { json } from "body-parser";
import cors from "cors";
import { Sequelize } from "sequelize-typescript";
import { runWith } from "firebase-functions";
import { orderRoutes } from "./routes/order.routes";
import { cartRoutes } from "./routes/cart.routes";
import { pricingRoutes } from "./routes/pricing.routes";
import { Pricing } from "./models/pricing.model";
import { CartItem } from "./models/cartItem.model";
import { Cart } from "./models/cart.model";
import { Order } from "./models/order.model";
import { OrderConfirmation } from "./models/orderConfirmation.model";

const app = express();
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: "512MB" as "512MB",
};

// CORS configuration
app.use(cors({ origin: true }));

// // Apply middleware
app.use(json());
app.use("/api", orderRoutes);
app.use("/api", cartRoutes);
app.use("/api/pricing", pricingRoutes);


const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.send("Service is running!");
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
        models: [Pricing, Cart, CartItem, Order, OrderConfirmation],
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

  exports.orderservice = runWith(runtimeOpts)
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