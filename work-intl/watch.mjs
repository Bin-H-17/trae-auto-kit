/**
 * Trae Auto Kit WorkIntl — watch & reinject
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeLog, watchTick } from "../shared/cdp.mjs";
import { loadAgentClick } from "../shared/load-script.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const PORTS = config.ports || [];
const INTERVAL_MS = config.watchIntervalMs || 5000;
const log = makeLog(path.join(__dirname, "logs"));

async function main() {
  const scriptSource = loadAgentClick("WorkIntl");
  log(`WorkIntl watch | interval ${INTERVAL_MS}ms | ports ${PORTS.join(",")}`);
  await watchTick(PORTS, scriptSource, log);
  setInterval(() => {
    watchTick(PORTS, scriptSource, log).catch((e) => log(`tick: ${e.message}`));
  }, INTERVAL_MS);
}

main().catch((e) => {
  log(`fail: ${e.message}`);
  process.exit(1);
});
