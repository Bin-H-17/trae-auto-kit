/**
 * Shared CDP helpers for Trae CN / Work inject + watch.
 */
import fs from "node:fs";
import path from "node:path";

export function makeLog(logDir) {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  return (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(
      path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`),
      line + "\n",
      "utf8"
    );
  };
}

export function cdpSend(ws, id, method, params = {}, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), timeoutMs);
    const onMsg = (ev) => {
      let data;
      try {
        data = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
      } catch {
        return;
      }
      if (data.id !== id) return;
      clearTimeout(timer);
      ws.removeEventListener("message", onMsg);
      if (data.error) reject(new Error(JSON.stringify(data.error)));
      else resolve(data.result);
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

export async function listTargets(port, timeoutMs = 2000) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function withWs(wsUrl, fn, openTimeoutMs = 5000) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("ws error")));
    setTimeout(() => reject(new Error("ws open timeout")), openTimeoutMs);
  });
  try {
    return await fn(ws);
  } finally {
    try {
      ws.close();
    } catch {}
  }
}

export function pickWorkbenchTargets(targets) {
  const pages = targets.filter((t) => t.webSocketDebuggerUrl);
  pages.sort((a, b) => {
    const score = (t) => {
      const u = `${t.url || ""} ${t.title || ""}`.toLowerCase();
      // CN: workbench.html；Work/SOLO: solo-lite.html / solo
      if (u.includes("workbench") || u.includes("solo-lite") || u.includes("/solo/")) return 0;
      if (u.includes("webview")) return 1;
      if (t.type === "page") return 2;
      return 3;
    };
    return score(a) - score(b);
  });
  return pages;
}

const CLEANUP_JS = `
(() => {
  try {
    const panel = document.getElementById('trae-auto-kit-panel');
    if (panel) panel.remove();
    try { if (window.__traeAutoKit && window.__traeAutoKit.stop) window.__traeAutoKit.stop(); } catch {}
    try { delete window.__traeAutoKit; } catch {}
    const legacy = document.getElementById('trae-panel');
    if (legacy) legacy.remove();
    try { delete window.traeAutoAccept; } catch {}
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
})()
`;

const BOOT_JS = `
(() => {
  try {
    if (window.__traeAutoKit && typeof window.__traeAutoKit.start === 'function') {
      window.__traeAutoKit.start();
      return {
        ok: true,
        hasApi: true,
        hasPanel: !!document.getElementById('trae-auto-kit-panel'),
        running: !!window.__traeAutoKit.isRunning && window.__traeAutoKit.isRunning()
      };
    }
    return { ok: false, hasApi: false };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
})()
`;

const CHECK_JS = `
(() => {
  const hasApi = !!(window.__traeAutoKit && typeof window.__traeAutoKit.start === 'function');
  const hasPanel = !!document.getElementById('trae-auto-kit-panel');
  const running = !!(hasApi && window.__traeAutoKit.isRunning && window.__traeAutoKit.isRunning());
  return { hasApi, hasPanel, running };
})()
`;

export async function injectScriptOnTarget(wsUrl, scriptSource, log, port, title) {
  return withWs(wsUrl, async (ws) => {
    let id = 1;
    await cdpSend(ws, id++, "Runtime.enable");
    await cdpSend(ws, id++, "Runtime.evaluate", { expression: CLEANUP_JS, returnByValue: true });
    await cdpSend(ws, id++, "Runtime.evaluate", {
      expression: scriptSource,
      returnByValue: false,
    });
    await new Promise((r) => setTimeout(r, 300));
    const boot = await cdpSend(ws, id++, "Runtime.evaluate", {
      expression: BOOT_JS,
      returnByValue: true,
    });
    const v = boot?.result?.value;
    log(`PORT ${port} [${title || "?"}] inject => ${JSON.stringify(v)}`);
    return !!(v && v.ok && v.hasApi);
  });
}

export async function checkTarget(wsUrl) {
  return withWs(
    wsUrl,
    async (ws) => {
      let id = 1;
      await cdpSend(ws, id++, "Runtime.enable", {}, 8000);
      const r = await cdpSend(
        ws,
        id++,
        "Runtime.evaluate",
        { expression: CHECK_JS, returnByValue: true },
        8000
      );
      return r?.result?.value || { hasApi: false, hasPanel: false };
    },
    4000
  );
}

export async function injectPort(port, scriptSource, log) {
  let targets;
  try {
    targets = await listTargets(port);
  } catch {
    log(`PORT ${port} 未就绪`);
    return false;
  }
  const pages = pickWorkbenchTargets(targets);
  for (const t of pages) {
    try {
      const ok = await injectScriptOnTarget(
        t.webSocketDebuggerUrl,
        scriptSource,
        log,
        port,
        t.title || t.url
      );
      if (ok) return true;
    } catch (e) {
      log(`PORT ${port} target fail: ${e.message}`);
    }
  }
  return false;
}

export async function watchTick(ports, scriptSource, log) {
  for (const port of ports) {
    let targets;
    try {
      targets = await listTargets(port, 1500);
    } catch {
      continue;
    }
    const pages = pickWorkbenchTargets(targets);
    for (const t of pages) {
      const u = `${t.url || ""} ${t.title || ""}`.toLowerCase();
      const isMain =
        u.includes("workbench") ||
        u.includes("solo-lite") ||
        u.includes("/solo/") ||
        t.type === "page";
      if (!isMain) continue;
      try {
        const st = await checkTarget(t.webSocketDebuggerUrl);
        if (st.hasApi && st.hasPanel && st.running) break;
        log(`PORT ${port} 面板/运行丢失，重注…`);
        await injectScriptOnTarget(
          t.webSocketDebuggerUrl,
          scriptSource,
          log,
          port,
          t.title || t.url
        );
        break;
      } catch {
        // ignore
      }
    }
  }
}
