import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(serverRoot, ".env") });

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing or empty ${name} in server/.env (see server/.env.example)`);
    process.exit(1);
  }
  return value;
}

/** Call once at startup so login never hits jsonwebtoken with an empty secret. */
export function assertEnv() {
  required("MONGODB_URI");
  required("JWT_SECRET");
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server");
  }
  return secret;
}
