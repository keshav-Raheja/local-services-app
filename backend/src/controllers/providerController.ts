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
    const { name, phone, experience, location, serviceId, userId, price } = req.body;

    if (!name || !phone || !serviceId || !userId) {
      return res.status(400).json({
        message: "Name, phone, serviceId and userId are required"
      });
    }

    if (!location || location.lat === undefined || location.lng === undefined) {
      return res.status(400).json({
        message: "Location (lat, lng) is required"
      });
    }

    const existing = await Provider.findOne({ userId });
    if (existing) {
      return res.status(400).json({
        message: "Provider already exists for this user"
      });
    }

    const provider = await Provider.create({
      name,
      phone,
      experience: Number(experience),
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng)
      },
      serviceId,
      userId,
      price: price ? Number(price) : 0
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

// ✅ GET PROVIDER PROFILE BY USER ID
export const getProviderProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const provider = await Provider.findOne({ userId }).populate("serviceId", "name");
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }
    res.status(200).json(provider);
  } catch (error) {
    res.status(500).json({ message: "Error fetching provider profile" });
  }
};

// ✅ UPDATE PROVIDER PROFILE
export const updateProviderProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, phone, experience, bio, avatar, price } = req.body;

    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    if (name) provider.name = name;
    if (phone) provider.phone = phone;
    if (experience !== undefined) provider.experience = Number(experience);
    if (bio !== undefined) provider.bio = bio;
    if (avatar !== undefined) provider.avatar = avatar;
    if (price !== undefined) provider.price = Number(price);

    await provider.save();
    res.status(200).json(provider);
  } catch (error) {
    res.status(500).json({ message: "Error updating provider profile" });
  }
};