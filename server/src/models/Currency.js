import mongoose from "mongoose";

const currencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    symbol: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

currencySchema.pre("save", async function ensureSingleDefault(next) {
  if (this.isDefault) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { $set: { isDefault: false } });
  }
  next();
});

export const Currency = mongoose.model("Currency", currencySchema);
