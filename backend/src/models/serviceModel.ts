import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    price: { type: Number, required: true },

    description: String,

    image: String
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);