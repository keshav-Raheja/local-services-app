import { Request, Response } from "express";
import Booking from "../models/bookingModel";
import Provider from "../models/providerModel";
import Service from "../models/serviceModel";
import mongoose from "mongoose";
import { evaluateProviderCoverage, isValidCoordinates, type LocationTarget } from "../services/providerEligibility";

type BookingStatus = "pending" | "confirmed" | "completed" | "rejected";
const bookingStatuses: readonly BookingStatus[] = ["pending", "confirmed", "completed", "rejected"];
const isBookingStatus = (value: unknown): value is BookingStatus => typeof value === "string" && bookingStatuses.includes(value as BookingStatus);

export const getProviderBookings = async (req: Request, res: Response) => {
  try {
    const provider = await Provider.findOne({ userId: req.user?.id }).select("_id");
    if (!provider) return res.status(403).json({ message: "Provider profile not found" });

    const bookings = await Booking.find({ providerId: provider._id })
      .populate("userId", "name email")
      .populate("serviceId", "name");

    res.json(bookings);

  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};


// CREATE BOOKING
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { serviceId, providerId, date, serviceAddress } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    if (typeof serviceId !== "string" || !mongoose.Types.ObjectId.isValid(serviceId) || typeof providerId !== "string" || !mongoose.Types.ObjectId.isValid(providerId)) return res.status(400).json({ message: "Invalid service or provider" });
    if (!date || Number.isNaN(new Date(date).getTime())) return res.status(400).json({ message: "A valid service date is required" });
    if (!serviceAddress || typeof serviceAddress !== "object" || typeof serviceAddress.address !== "string" || !serviceAddress.address.trim()) return res.status(400).json({ message: "A service address is required" });
    const rawAddress = serviceAddress as Record<string, unknown>;
    const address = rawAddress.address;
    if (typeof address !== "string" || !address.trim()) return res.status(400).json({ message: "A service address is required" });
    const hasLat = rawAddress.lat !== undefined; const hasLng = rawAddress.lng !== undefined;
    if (hasLat !== hasLng || (hasLat && !isValidCoordinates({ lat: Number(rawAddress.lat), lng: Number(rawAddress.lng) }))) return res.status(400).json({ message: "Invalid service address coordinates" });
    const target: LocationTarget = {
      address: address.trim(), recipientName: typeof rawAddress.recipientName === "string" ? rawAddress.recipientName.trim() : undefined,
      locality: typeof rawAddress.locality === "string" ? rawAddress.locality.trim() : undefined, city: typeof rawAddress.city === "string" ? rawAddress.city.trim() : undefined,
      state: typeof rawAddress.state === "string" ? rawAddress.state.trim() : undefined, pincode: typeof rawAddress.pincode === "string" ? rawAddress.pincode.trim() : undefined,
      lat: hasLat ? Number(rawAddress.lat) : undefined, lng: hasLng ? Number(rawAddress.lng) : undefined,
    };
    if (!await Service.exists({ _id: serviceId })) return res.status(400).json({ message: "Service not found" });
    const provider = await Provider.findOne({ _id: providerId, $or: [{ serviceId }, { offerings: { $elemMatch: { serviceId, active: { $ne: false } } } }] });
    if (!provider) return res.status(400).json({ message: "Provider does not offer this service" });
    const offering = provider.offerings?.find((item) => String(item.serviceId) === serviceId && item.active !== false);
    const coverageRecord = offering?.serviceAreas?.length ? { ...provider.toObject(), serviceAreas: offering.serviceAreas } : provider.toObject();
    const coverage = evaluateProviderCoverage(coverageRecord as unknown as import("../services/providerEligibility").ProviderCoverage, target);
    if (!coverage.eligible) return res.status(400).json({ message: coverage.reason === "outside-radius" ? "This provider does not serve the requested address" : "This provider has not declared coverage for the requested address" });
    const existingBooking = await Booking.findOne({ userId, providerId, status: { $in: ["pending", "confirmed"] } });
    if (existingBooking) return res.status(400).json({ message: "You already have an active booking for this service" });
    const booking = await Booking.create({ userId, serviceId, providerId, date: new Date(date), serviceAddress: target });
    return res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ message: "Error creating booking" });
  }
};
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const bookings = await Booking.find({ userId })
      .populate("serviceId")
      .populate("providerId");

    res.json(bookings);

  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// UPDATE BOOKING STATUS
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const provider = await Provider.findOne({ userId: req.user?.id });
    if (!provider) {
      res.status(403).json({ message: "Provider profile not found" });
      return;
    }

    const booking = await Booking.findOne({ _id: bookingId, providerId: provider._id });
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const transitions: Partial<Record<BookingStatus, readonly BookingStatus[]>> = {
      pending: ["confirmed", "rejected"],
      confirmed: ["completed"],
    };
    if (!isBookingStatus(status) || !transitions[booking.status]?.includes(status)) {
      res.status(400).json({ message: "Invalid booking status transition" });
      return;
    }

    booking.status = status;
    await booking.save();
    res.json(booking);

  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};
