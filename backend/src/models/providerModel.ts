import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    experience: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    totalBookings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Provider", providerSchema);