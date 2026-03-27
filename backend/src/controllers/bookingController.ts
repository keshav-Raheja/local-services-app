import { Request, Response } from "express";
import Booking from "../models/bookingModel";

export const getProviderBookings = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    const bookings = await Booking.find({ providerId })
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
    const { userId, serviceId, providerId, date } = req.body;

    // 🔴 CHECK EXISTING BOOKING
    const existingBooking = await Booking.findOne({
      userId,
      providerId,
      status: { $in: ["pending", "confirmed"] }
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You already have an active booking for this service"
      });
    }

    // ✅ CREATE NEW BOOKING
    const booking = await Booking.create({
      userId,
      serviceId,
      providerId,
      date
    });

    res.status(201).json(booking);

  } catch (error) {
    res.status(500).json({ message: "Error creating booking" });
  }
};

// GET USER BOOKINGS
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

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

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    res.json(booking);

  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};
