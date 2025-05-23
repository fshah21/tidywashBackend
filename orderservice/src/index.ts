
import express from "express";
import { json } from "body-parser";
import cors from "cors";
import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import { runWith } from "firebase-functions";
import { orderRoutes } from "./routes/order.routes";
import { pricingRoutes } from "./routes/pricing.routes";
import { Pricing } from "./models/pricing.model";
import { CartItem } from "./models/cartItem.model";
import { Cart } from "./models/cart.model";

const app = express();
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: "512MB" as "512MB",
};

// // Apply middleware
app.use(json());
app.use("/api", orderRoutes);
app.use("/api/pricing", pricingRoutes);

// CORS configuration
app.use(cors({ origin: true }));

let sequelize: Sequelize;

// Initialize the database connection
function getSequelizeInstance() {
    if (!sequelize) {
      const sequelizeOptions: SequelizeOptions = {
        database: "postgres",
        username: "postgres",
        password: "tidywash-prod",
        host: "/cloudsql/silent-bolt-456117-r7:asia-south1:tidywash-production-final-standard",
        dialect: "postgres",
        models: [Pricing, CartItem, Cart],
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          socketPath: '/cloudsql/silent-bolt-456117-r7:asia-south1:tidywash-production-final-standard',
        },
      };
  
    sequelize = new Sequelize(sequelizeOptions);

    }
    
    return sequelize;
  }
  // Use the singleton instance
  sequelize = getSequelizeInstance();

  sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established");
    console.log("Environment", process.env.NODE_ENV);
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

  exports.orderservice = runWith(runtimeOpts)
  .region("asia-south1")
  .https.onRequest(async (req, res) => {
    try {
      // Use the singleton instance
      const sequelizeInstance = getSequelizeInstance();
      await sequelizeInstance.sync({ alter: true });
      app(req, res); // handle the request
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      res.status(500).send("Failed to connect to the database." + error);
    }
  });