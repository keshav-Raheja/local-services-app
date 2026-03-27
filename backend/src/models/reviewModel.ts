import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider"
    },

    rating: {
      type: Number,
      required: true
    },

    feedback: {
      type: String
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);