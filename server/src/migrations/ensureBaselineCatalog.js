import { Currency } from "../models/Currency.js";
import { InsuranceType } from "../models/InsuranceType.js";

/** Minimal rows so "Add customer" is not blocked when DB is empty (no seed script). */
export async function ensureBaselineCatalog() {
  let currency = await Currency.findOne({ code: "ETB" });
  if (!currency) {
    const count = await Currency.countDocuments();
    if (count === 0) {
      currency = await Currency.create({
        code: "ETB",
        name: "Ethiopian Birr",
        symbol: "Br",
        isDefault: true,
      });
    } else {
      currency = await Currency.findOne({ isDefault: true }) || (await Currency.findOne());
    }
  }

  const typeCount = await InsuranceType.countDocuments();
  if (typeCount === 0 && currency) {
    await InsuranceType.create({
      name: "Car Daily",
      description: "Default daily cover",
      dailyPrice: 120,
      currency: currency._id,
    });
  }
}
