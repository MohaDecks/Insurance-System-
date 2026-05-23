import { assertEnv } from "./config/env.js";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import { UPLOAD_ROOT } from "./config/uploads.js";
import { ensureVehicleTypesAndMigrateCustomers } from "./migrations/ensureVehicleTypes.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import insuranceTypeRoutes from "./routes/insuranceTypeRoutes.js";
import vehicleTypeRoutes from "./routes/vehicleTypeRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

fs.mkdirSync(path.join(UPLOAD_ROOT, "customers"), { recursive: true });
app.use("/uploads", express.static(UPLOAD_ROOT));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/insurance-types", insuranceTypeRoutes);
app.use("/api/vehicle-types", vehicleTypeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

assertEnv();

const port = Number(process.env.PORT) || 5003;

connectDb()
  .then(async () => {
    await ensureVehicleTypesAndMigrateCustomers();
    app.listen(port, () => console.log(`API http://localhost:${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
