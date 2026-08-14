/**
 * Trae Auto Kit CN — one-shot CDP inject
 * Uses shared CN-proven agent-click.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeLog, injectPort } from "../shared/cdp.mjs";
import { loadAgentClick } from "../shared/load-script.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const PORTS = config.ports || [39241, 39242, 39243];
const log = makeLog(path.join(__dirname, "logs"));

async function main() {
  const scriptSource = loadAgentClick("CN");
  log(`CN inject | ${(scriptSource.length / 1024).toFixed(1)} KB | ports ${PORTS.join(",")}`);
  let ok = 0;
  for (const port of PORTS) {
    if (await injectPort(port, scriptSource, log)) ok++;
  }
  log(`done ${ok}/${PORTS.length}`);
  if (ok === 0) {
    log("请用带 remote-debugging-port 的 Trae CN 快捷方式打开后再试。");
    process.exit(2);
  }
}

main().catch((e) => {
  log(`fail: ${e.message}`);
  process.exit(1);
});
