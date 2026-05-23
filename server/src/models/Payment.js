import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency", required: true },
    /** Calendar day this payment covers (UTC start of day stored as Date at 00:00 UTC) */
    forDate: { type: Date, required: true },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reference: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ customer: 1, forDate: 1 }, { unique: true });

export const Payment = mongoose.model("Payment", paymentSchema);
