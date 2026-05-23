import mongoose from "mongoose";

const insuranceTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dailyPrice: { type: Number, required: true, min: 0 },
    currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency", required: true },
  },
  { timestamps: true }
);

export const InsuranceType = mongoose.model("InsuranceType", insuranceTypeSchema);
