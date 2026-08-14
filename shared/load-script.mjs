/**
 * Load shared agent-click.js with product label preamble.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHARED_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(SHARED_DIR, "agent-click.js");

export function loadAgentClick(product) {
  const body = fs.readFileSync(SCRIPT_PATH, "utf8");
  const map = {
    CN: "CN",
    Work: "Work",
    Intl: "Intl",
    WorkIntl: "WorkIntl",
  };
  const label = map[product] || String(product || "CN");
  return `window.__TRAE_AUTO_KIT_PRODUCT__=${JSON.stringify(label)};\n` + body;
}

export function agentClickPath() {
  return SCRIPT_PATH;
}
