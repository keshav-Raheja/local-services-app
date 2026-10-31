import mongoose from "mongoose";

const creditLedgerSchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    totalPaise: { type: Number, required: true, min: 1 },
    initialPaidPaise: { type: Number, required: true, min: 0 },
    outstandingPaise: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    note: { type: String, default: "", maxlength: 1000 },
    status: { type: String, enum: ["outstanding", "settled"], required: true, default: "outstanding", index: true },
    repaymentKeys: { type: [String], default: [] },
  },
  { timestamps: true }
);

creditLedgerSchema.index({ providerId: 1, bookingId: 1 }, { unique: true });

export default mongoose.model("CreditLedger", creditLedgerSchema);