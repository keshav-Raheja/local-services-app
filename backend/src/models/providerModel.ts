import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    experience: { type: Number, default: 0 },
    price: { type: Number, default: 0 },

    // Primary business / base location
    address: { type: String, default: "" },
    locality: { type: String, default: "" },
    city: { type: String, default: "", index: true },
    state: { type: String, default: "" },
    pincode: { type: String, default: "", index: true },

    // Coordinates (optional if address is provided manually)
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Service coverage areas (e.g. list of localities, sub-regions or pincodes served)
    serviceAreas: { type: [String], default: [] },
    // Radius in kilometers around location where provider is willing to travel
    serviceRadiusKm: { type: Number },

    // Additional professions/services offered by this provider. The legacy serviceId/price fields remain the primary offering for existing records.
    offerings: [{
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
      price: { type: Number, required: true, min: 0 },
      active: { type: Boolean, default: true },
      serviceAreas: { type: [String], default: [] },
    }],

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    totalBookings: { type: Number, default: 0 },
    isProfileComplete: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Provider", providerSchema);
