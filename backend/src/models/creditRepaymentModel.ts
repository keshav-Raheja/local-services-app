import mongoose from "mongoose";

const repaymentSchema = new mongoose.Schema(
  {
    creditId: { type: mongoose.Schema.Types.ObjectId, ref: "CreditLedger", required: true, index: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amountPaise: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ["cash", "bank_transfer", "other"], required: true },
    note: { type: String, default: "", maxlength: 1000 },
    idempotencyKey: { type: String, required: true },
    recordedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

repaymentSchema.index({ providerId: 1, idempotencyKey: 1 }, { unique: true });

export default mongoose.model("CreditRepayment", repaymentSchema);