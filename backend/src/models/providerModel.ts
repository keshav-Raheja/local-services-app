import mongoose from "mongoose";

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true
  },

  experience: {
    type: Number
  },

  location: {
    type: String
  },

  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  rating: {
    type: Number,
    default: 0   // ✅ FIX HERE
  }

  

}, { timestamps: true });

export default mongoose.model("Provider", providerSchema);