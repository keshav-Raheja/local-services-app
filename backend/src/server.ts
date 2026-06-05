import reviewRoutes from "./routes/reviewRoutes";
import providerRoutes from "./routes/providerRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import authRoutes from "./routes/authRoutes";
import supportRoutes from "./routes/supportRoutes";
import Service from "./models/serviceModel";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/support", supportRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "ServiceHub API is running ✅", version: "2.0.0" });
});

// Global Error Handler for JSON responses
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err.message || err);
  const status = err.message === "Not allowed by CORS" ? 403 : (err.status || 500);
  res.status(status).json({
    message: err.message || "An unexpected server error occurred",
  });
});

const PORT = process.env.PORT || 5000;

async function seedServices() {
  try {
    const defaultServices = [
      { name: "Electrician", price: 500, description: "Wiring, repairs & installations" },
      { name: "Home Tutor", price: 300, description: "Math, Science and language coaching" },
      { name: "Laptop Repair", price: 700, description: "Hardware diagnostics and software fixes" },
      { name: "Plumber", price: 400, description: "Pipes, leak fixes & fixtures" },
      { name: "Shuttering (Sattering)", price: 1200, description: "Concrete framework and construction support" },
      { name: "Painter", price: 600, description: "Interior and exterior wall painting" },
      { name: "Cleaner", price: 350, description: "Deep cleaning and housekeeping services" },
      { name: "AC Repair", price: 800, description: "Servicing, gas refilling, and installations" },
      { name: "Locksmith", price: 450, description: "Lock repair, key cutting & emergency unlocking" },
    ];

    for (const svc of defaultServices) {
      const exists = await Service.findOne({ name: svc.name });
      if (!exists) {
        await Service.create(svc);
        console.log(`🌱 Seeded service: ${svc.name}`);
      }
    }
  } catch (err) {
    console.error("❌ Error seeding services:", err);
  }
}

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await seedServices();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("❌ DB connection error:", err));