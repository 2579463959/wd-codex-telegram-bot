import "../src/env.js";

import { readConfig } from "../src/config.js";

try {
  readConfig();
  console.log("Required Telegram configuration is present.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
