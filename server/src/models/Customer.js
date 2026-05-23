import mongoose from "mongoose";

export const PAYMENT_STATUSES = ["PAID", "UNPAID"];

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    /** National Id | License | Dhalasho io sugnan | Passport */
    idType: { type: String, default: "", trim: true },
    /** Customer national / ID number (CNI) */
    cni: { type: String, default: "", trim: true },
    /** Reference relationship: Walalo, Adeer, … */
    refRelation: { type: String, default: "", trim: true },
    refName: { type: String, default: "", trim: true },
    refPhone: { type: String, default: "", trim: true },
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: "VehicleType", required: true },
    insuranceType: { type: mongoose.Schema.Types.ObjectId, ref: "InsuranceType", required: true },
    currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency", required: true },
    /** Cached daily status for the last evaluated calendar day (server TZ) */
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "UNPAID" },
    lastStatusDate: { type: Date },
    notes: { type: String, default: "" },
    /** Scanned ID: passport / license / dhalasho (images or PDF), max enforced in controller */
    idDocuments: [
      {
        fileId: { type: String, required: true },
        originalName: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

customerSchema.index({ phoneNumber: 1 });
customerSchema.index({ cni: 1 });
customerSchema.index({ fullName: "text", phoneNumber: "text" });

export const Customer = mongoose.model("Customer", customerSchema);
