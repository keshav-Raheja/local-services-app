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