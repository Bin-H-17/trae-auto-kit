/**
 * Trae Auto Kit Work — one-shot CDP inject
 * Same shared agent-click as CN (proven 仍要运行 path).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeLog, injectPort } from "../shared/cdp.mjs";
import { loadAgentClick } from "../shared/load-script.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const PORTS = config.ports || [39341, 39342, 39343];
const log = makeLog(path.join(__dirname, "logs"));

async function main() {
  const scriptSource = loadAgentClick("Work");
  log(`Work inject | ${(scriptSource.length / 1024).toFixed(1)} KB | ports ${PORTS.join(",")}`);
  let ok = 0;
  for (const port of PORTS) {
    if (await injectPort(port, scriptSource, log)) ok++;
  }
  log(`done ${ok}/${PORTS.length}`);
  if (ok === 0) {
    log("请用带 remote-debugging-port 的 TRAE Work CN 快捷方式打开后再试。");
    process.exit(2);
  }
}

main().catch((e) => {
  log(`fail: ${e.message}`);
  process.exit(1);
});
