import { Request, Response } from "express";
import mongoose from "mongoose";
import Booking from "../models/bookingModel";
import Provider from "../models/providerModel";
import CreditLedger from "../models/creditLedgerModel";
import CreditRepayment from "../models/creditRepaymentModel";

function amount(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function ownedProvider(userId: string | undefined) {
  return userId ? Provider.findOne({ userId }).select("_id") : null;
}

export const listProviderCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = await ownedProvider(req.user?.id);
    if (!provider) { res.status(404).json({ code: "PROVIDER_PROFILE_MISSING", message: "Provider profile not found" }); return; }
    const credits = await CreditLedger.find({ providerId: provider._id })
      .populate("customerId", "name email phone")
      .populate("bookingId", "date status serviceId")
      .sort({ createdAt: -1 })
      .lean();
    const repayments = await CreditRepayment.find({ providerId: provider._id }).sort({ recordedAt: -1 }).lean();
    const now = Date.now();
    const creditView = credits.map((credit) => ({ ...credit, overdue: credit.status === "outstanding" && Boolean(credit.dueDate && new Date(credit.dueDate).getTime() < now) }));
    res.json({ credits: creditView, repayments });
  } catch (error) {
    console.error("Error listing provider credits:", error);
    res.status(500).json({ message: "Unable to load customer credit records" });
  }
};

export const createProviderCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = await ownedProvider(req.user?.id);
    if (!provider) { res.status(404).json({ code: "PROVIDER_PROFILE_MISSING", message: "Provider profile not found" }); return; }
    const { bookingId, totalPaise, initialPaidPaise = 0, dueDate, note } = req.body;
    if (typeof bookingId !== "string" || !mongoose.isValidObjectId(bookingId)) { res.status(400).json({ message: "A valid booking is required" }); return; }
    const total = amount(totalPaise);
    const initial = Number(initialPaidPaise);
    if (total === null || !Number.isInteger(initial) || initial < 0 || initial > total) { res.status(400).json({ message: "Credit amounts must be whole positive paise values" }); return; }
    const booking = await Booking.findOne({ _id: bookingId, providerId: provider._id }).select("userId status");
    if (!booking) { res.status(404).json({ message: "Booking not found for this provider" }); return; }
    if (booking.status !== "completed") { res.status(400).json({ message: "Credit can only be recorded for a completed booking" }); return; }
    if (!booking.userId) { res.status(400).json({ message: "Booking customer is missing" }); return; }
    const due = dueDate === undefined ? undefined : new Date(dueDate);
    if (dueDate !== undefined && (!due || Number.isNaN(due.getTime()))) { res.status(400).json({ message: "Due date is invalid" }); return; }
    try {
      const credit = await CreditLedger.create({
        providerId: provider._id, customerId: booking.userId, bookingId: booking._id,
        totalPaise: total, initialPaidPaise: initial, outstandingPaise: total - initial,
        dueDate: due, note: typeof note === "string" ? note.trim() : "",
        status: total === initial ? "settled" : "outstanding",
      });
      res.status(201).json(credit);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) { res.status(409).json({ code: "CREDIT_EXISTS", message: "Credit has already been recorded for this booking" }); return; }
      throw error;
    }
  } catch (error) {
    console.error("Error creating provider credit:", error);
    res.status(500).json({ message: "Unable to record customer credit" });
  }
};

export const recordProviderRepayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = await ownedProvider(req.user?.id);
    if (!provider) { res.status(404).json({ code: "PROVIDER_PROFILE_MISSING", message: "Provider profile not found" }); return; }
    const { creditId } = req.params;
    const repaymentAmount = amount(req.body.amountPaise);
    const paymentMethod = req.body.paymentMethod;
    const idempotencyKey = req.header("Idempotency-Key")?.trim();
    if (!mongoose.isValidObjectId(creditId) || repaymentAmount === null) { res.status(400).json({ message: "A valid repayment amount is required" }); return; }
    if (!["cash", "bank_transfer", "other"].includes(paymentMethod)) { res.status(400).json({ message: "A valid repayment method is required" }); return; }
    if (!idempotencyKey || idempotencyKey.length > 120) { res.status(400).json({ message: "Idempotency-Key is required" }); return; }
    const existing = await CreditRepayment.findOne({ providerId: provider._id, idempotencyKey });
    if (existing) { res.status(200).json(existing); return; }
    const credit = await CreditLedger.findOneAndUpdate(
      { _id: creditId, providerId: provider._id, outstandingPaise: { $gte: repaymentAmount }, repaymentKeys: { $ne: idempotencyKey } },
      { $inc: { outstandingPaise: -repaymentAmount }, $addToSet: { repaymentKeys: idempotencyKey }, $set: { status: "outstanding" } },
      { new: true },
    );
    if (!credit) { res.status(400).json({ message: "Repayment exceeds the outstanding balance or credit was not found" }); return; }
    if (credit.outstandingPaise === 0) { await CreditLedger.updateOne({ _id: credit._id, providerId: provider._id }, { $set: { status: "settled" } }); }
    try {
      const repayment = await CreditRepayment.create({
        creditId: credit._id, providerId: provider._id, customerId: credit.customerId,
        amountPaise: repaymentAmount, paymentMethod, idempotencyKey,
        note: typeof req.body.note === "string" ? req.body.note.trim() : "",
      });
      res.status(201).json(repayment);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) { res.status(200).json(await CreditRepayment.findOne({ providerId: provider._id, idempotencyKey })); return; }
      throw error;
    }
  } catch (error) {
    console.error("Error recording provider repayment:", error);
    res.status(500).json({ message: "Unable to record repayment" });
  }
};
