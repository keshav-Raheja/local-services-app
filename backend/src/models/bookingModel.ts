import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },


    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider"
    },

    
    serviceAddress: {
      address: { type: String, required: true, trim: true },
      recipientName: { type: String, default: "", trim: true },
      locality: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      pincode: { type: String, default: "", trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },

    date: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);