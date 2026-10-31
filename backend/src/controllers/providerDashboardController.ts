import { Request, Response } from "express";
import Provider from "../models/providerModel";
import Booking from "../models/bookingModel";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function hasDateValue(value: unknown): boolean {
  return value !== undefined;
}

function defaultPeriod(): { start: Date; end: Date } {
  const today = new Date();
  const day = today.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysSinceMonday));
  return { start, end: new Date(start.getTime() + 7 * DAY_MS) };
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const getProviderDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ code: "AUTHENTICATION_REQUIRED", message: "Authentication required" });
      return;
    }

    if ((hasDateValue(req.query.start) && !parseDateOnly(req.query.start)) || (hasDateValue(req.query.end) && !parseDateOnly(req.query.end))) {
      res.status(400).json({ code: "INVALID_DATE_RANGE", message: "Dates must use YYYY-MM-DD format" });
      return;
    }

    // The token contains the User _id; Provider _id is a separate document id.
    const provider = await Provider.findOne({ userId }).populate("serviceId", "name");
    if (!provider) {
      res.status(404).json({ code: "PROVIDER_PROFILE_MISSING", message: "Provider profile not found" });
      return;
    }

    const defaults = defaultPeriod();
    const requestedStart = parseDateOnly(req.query.start);
    const requestedEnd = parseDateOnly(req.query.end);
    const start = requestedStart || defaults.start;
    const end = requestedEnd || defaults.end;

    if (requestedStart && requestedEnd && requestedEnd <= requestedStart) {
      res.status(400).json({ message: "End date must be after start date" });
      return;
    }

    if (end.getTime() - start.getTime() > 366 * DAY_MS) {
      res.status(400).json({ message: "Date range cannot exceed one year" });
      return;
    }

    const [periodBookings, allBookings] = await Promise.all([
      Booking.find({ providerId: provider._id, date: { $gte: start, $lt: end } })
        .populate("userId", "name email phone")
        .populate("serviceId", "name")
        .sort({ date: 1 })
        .lean(),
      Booking.find({ providerId: provider._id })
        .populate("userId", "name email phone")
        .populate("serviceId", "name")
        .sort({ date: 1 })
        .lean(),
    ]);

    const completedBookings = periodBookings.filter((booking) => booking.status === "completed");
    const pendingRequests = allBookings.filter((booking) => booking.status === "pending").length;
    const pipeline = {
      pending: periodBookings.filter((booking) => booking.status === "pending").length,
      confirmed: periodBookings.filter((booking) => booking.status === "confirmed").length,
      inProgress: 0,
      completed: completedBookings.length,
      rejected: periodBookings.filter((booking) => booking.status === "rejected").length,
    };

    const customerCounts = new Map<string, number>();
    for (const booking of completedBookings) {
      const customerId = String(booking.userId && typeof booking.userId === "object" ? booking.userId._id : booking.userId);
      customerCounts.set(customerId, (customerCounts.get(customerId) || 0) + 1);
    }
    const uniqueCustomers = customerCounts.size;
    const repeatCustomers = Array.from(customerCounts.values()).filter((count) => count > 1).length;

    const points: Array<{ date: string; net: number | null }> = [];
    for (let cursor = start.getTime(); cursor < end.getTime(); cursor += DAY_MS) {
      points.push({ date: toDateKey(new Date(cursor)), net: null });
    }

    const upcoming = allBookings
      .filter((booking) => {
        const bookingDate = new Date(booking.date).getTime();
        return bookingDate >= Date.now() && (booking.status === "pending" || booking.status === "confirmed");
      })
      .slice(0, 8);

    const growth = [];
    if (!provider.isProfileComplete) {
      growth.push({ key: "profile", title: "Complete your provider profile", detail: "Add the missing business details customers need.", href: "/provider-dashboard?section=profile" });
    }
    if (!provider.avatar) {
      growth.push({ key: "photos", title: "Add a profile photo", detail: "Help customers recognize your business.", href: "/provider-dashboard?section=profile" });
    }
    if (!provider.serviceAreas || provider.serviceAreas.length === 0) {
      growth.push({ key: "coverage", title: "Define your service areas", detail: "Add localities or pincodes you serve.", href: "/provider-dashboard?section=profile" });
    }
    if (pendingRequests > 0) {
      growth.push({ key: "requests", title: "Review pending requests", detail: pendingRequests + " customer request(s) need attention.", href: "/provider-dashboard?section=bookings" });
    }

    res.json({
      period: { start: toDateKey(start), end: toDateKey(end) },
      provider,
      metrics: {
        completedJobs: completedBookings.length,
        pendingRequests,
        averageRating: provider.rating || 0,
        reviewCount: provider.reviewCount || 0,
        earnings: { available: false, gross: null, fees: null, refunds: null, net: null },
        comparisons: { earnings: null, completedJobs: null },
      },
      chart: {
        available: false,
        reason: "Payment and transaction records are not configured for this application.",
        points,
      },
      pipeline,
      schedule: upcoming,
      insights: {
        repeatCustomerRate: uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0,
        uniqueCustomers,
        responseTimeHours: null,
        conversionRate: null,
      },
      growth,
      recentBookings: periodBookings.slice(0, 20),
    });
  } catch (error) {
    console.error("Provider dashboard error:", error);
    res.status(500).json({ message: "Unable to load provider dashboard" });
  }
};