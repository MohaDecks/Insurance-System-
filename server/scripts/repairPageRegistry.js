/**
 * Re-seed registered_pages + sidebar_sections when empty, sync permissions to Admin roles.
 * Run from server/: node scripts/repairPageRegistry.js
 */
import "dotenv/config";
import { connectDb } from "../src/config/db.js";
import { ensurePageRegistry } from "../src/migrations/ensurePageRegistry.js";
import { Settings, SETTINGS_KEYS } from "../src/models/Settings.js";

connectDb()
  .then(async () => {
    await ensurePageRegistry();
    const pages = await Settings.findOne({ key: SETTINGS_KEYS.REGISTERED_PAGES }).lean();
    const sections = await Settings.findOne({ key: SETTINGS_KEYS.SIDEBAR_SECTIONS }).lean();
    const n = Array.isArray(pages?.value) ? pages.value.length : 0;
    const s = Array.isArray(sections?.value) ? sections.value.length : 0;
    console.log(`registered_pages: ${n} item(s)`);
    console.log(`sidebar_sections: ${s} item(s)`);
    if (!n) console.error("Still empty — check MONGODB_URI / database name.");
    process.exit(n > 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
