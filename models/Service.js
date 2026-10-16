import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    durationMins: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

const Service = mongoose.models.Service || mongoose.model("Service", serviceSchema);

export default Service;
