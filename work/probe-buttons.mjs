/**
 * Probe visible buttons on Trae Work via CDP — helps refresh selectors.
 * Usage: node probe-buttons.mjs [port]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeLog, listTargets, pickWorkbenchTargets, withWs, cdpSend } from "../shared/cdp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const port = Number(process.argv[2] || config.ports[0]);
const log = makeLog(path.join(__dirname, "logs"));

const PROBE_JS = `
(() => {
  const interesting = ['运行','仍要运行','继续','删除','全部接受','执行','确认执行','取消','下一个','保留','Run','Continue','Delete','Execute'];
  const nodes = Array.from(document.querySelectorAll('button, [role="button"], .icd-btn, .monaco-button, a[class*="btn"]'));
  const rows = [];
  for (const el of nodes) {
    const text = ((el.innerText || el.textContent) || '').replace(/\\s+/g, ' ').trim();
    if (!text || text.length > 40) continue;
    if (!interesting.some((k) => text === k || text.includes(k))) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    rows.push({
      text,
      tag: el.tagName,
      id: el.id || '',
      cls: (el.className && String(el.className).slice(0, 160)) || '',
      role: el.getAttribute('role') || ''
    });
  }
  return { href: location.href.slice(0, 160), count: rows.length, rows };
})()
`;

async function main() {
  let targets;
  try {
    targets = await listTargets(port);
  } catch {
    log(`PORT ${port} 未就绪 — 请先用带调试端口的 Work 快捷方式打开`);
    process.exit(2);
  }
  const pages = pickWorkbenchTargets(targets);
  const out = [];
  for (const t of pages.slice(0, 5)) {
    try {
      const data = await withWs(t.webSocketDebuggerUrl, async (ws) => {
        let id = 1;
        await cdpSend(ws, id++, "Runtime.enable");
        const r = await cdpSend(ws, id++, "Runtime.evaluate", {
          expression: PROBE_JS,
          returnByValue: true,
        });
        return r?.result?.value;
      });
      out.push({ title: t.title, url: t.url, data });
      log(`target [${t.title}] => ${JSON.stringify(data)}`);
    } catch (e) {
      log(`target fail: ${e.message}`);
    }
  }
  const reportPath = path.join(__dirname, "logs", `probe-${port}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(out, null, 2), "utf8");
  log(`wrote ${reportPath}`);
}

main().catch((e) => {
  log(`fail: ${e.message}`);
  process.exit(1);
});
