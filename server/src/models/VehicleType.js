import mongoose from "mongoose";

const vehicleTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

vehicleTypeSchema.index({ sortOrder: 1, name: 1 });

export const VehicleType = mongoose.model("VehicleType", vehicleTypeSchema);
