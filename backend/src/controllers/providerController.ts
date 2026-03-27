import { Request, Response } from "express";
import Provider from "../models/providerModel";
import Booking from "../models/bookingModel";

// ✅ GET PROVIDERS BY SERVICE
export const getProviders = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const providers = await Provider.find({ serviceId });

    res.status(200).json(providers);

  } catch (error) {
    res.status(500).json({ message: "Error fetching providers" });
  }
};

// ✅ CREATE PROVIDER
export const createProvider = async (req: Request, res: Response) => {
  try {
    const { name, phone, experience, location, serviceId, userId } = req.body;

    // ✅ validation
    if (!name || !phone || !serviceId || !userId) {
      return res.status(400).json({
        message: "Name, phone, serviceId and userId are required"
      });
    }

    // ✅ prevent duplicate provider for same user
    const existing = await Provider.findOne({ userId });
    if (existing) {
      return res.status(400).json({
        message: "Provider already exists for this user"
      });
    }

    const provider = await Provider.create({
      name,
      phone,
      experience: Number(experience), // ✅ FIX (important)
      location,
      serviceId,
      userId
    });

    res.status(201).json(provider);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating provider" });
  }
};

// ✅ GET BOOKINGS FOR PROVIDER (🔥 IMPORTANT FOR DASHBOARD)
export const getProviderBookings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // find provider linked to this user
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return res.json([]);
    }

    const bookings = await Booking.find({ providerId: provider._id })
      .populate("userId", "name email")
      .populate("serviceId", "name");

    res.status(200).json(bookings);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching provider bookings" });
  }
};