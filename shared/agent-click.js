/**
 * Trae Auto Kit — shared page inject (CN + Work)
 * Same proven CN logic for both products.
 *
 * Priority: 仍要运行 → 确认执行(执行) → 继续 → 删除 → 全部接受 → 运行
 * Blacklist: 下一个 / 取消 / 保留
 *
 * Inject preamble may set: window.__TRAE_AUTO_KIT_PRODUCT__ = "CN" | "Work"
 * Selectors adapted from luw2007/trae-auto-accept (MIT). Local: 仍要运行 + risk modal guard.
 */
(function () {
  "use strict";

  const PRODUCT =
    typeof window.__TRAE_AUTO_KIT_PRODUCT__ === "string" && window.__TRAE_AUTO_KIT_PRODUCT__
      ? window.__TRAE_AUTO_KIT_PRODUCT__
      : "CN";
  const PANEL_ID = "trae-auto-kit-panel";
  const POLL_MS = 1500;
  const BLACKLIST = ["下一个", "取消", "保留"];
  // 弹层主按钮文案；「确认执行」是标题，「执行」才是按钮
  const RISK_CONFIRM_TEXTS = [
    "仍要运行",
    "确认运行",
    "继续运行",
    "Still run",
    "Run anyway",
  ];
  const RISK_MODAL_MARKERS = ["运行风险命令", "风险命令", "高风险", "dangerous command", "Risk"];
  const EXECUTE_CONTEXT = ["确认执行", "基于文档继续执行", "是否要基于文档", "文档已经生成"];

  const POS_KEY = `trae-auto-kit-pos:${PRODUCT}`;
  const MIN_KEY = `trae-auto-kit-min:${PRODUCT}`;

  let isRunning = false;
  let interval = null;
  let clickCount = 0;
  let enableDelete = true;
  let logs = [];
  let isMinimized = false;
  let dragState = null;

  function btnText(el) {
    return ((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim();
  }

  function isVisible(el) {
    try {
      if (!el || !el.getBoundingClientRect) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const st = window.getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden" || st.opacity === "0") return false;
      return true;
    } catch {
      return false;
    }
  }

  function isInteractive(el) {
    try {
      if (!isVisible(el)) return false;
      if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
      if (el.getAttribute("data-state") === "loading") return false;
      return true;
    } catch {
      return false;
    }
  }

  function isBlacklisted(text) {
    return BLACKLIST.some((b) => text === b || text.includes(b));
  }

  function nearQuiz(el) {
    try {
      const root = el.closest("div, section, article, form") || el.parentElement;
      if (!root) return false;
      const t = (root.innerText || "").slice(0, 800);
      return t.includes("下一个") && (t.includes("提问") || t.includes("问卷") || t.includes("单选"));
    } catch {
      return false;
    }
  }

  function nearConfirmExecute(el) {
    try {
      let node = el;
      for (let i = 0; i < 10 && node; i++) {
        const t = ((node.innerText || node.textContent) || "").replace(/\s+/g, " ").trim().slice(0, 600);
        if (EXECUTE_CONTEXT.some((k) => t.includes(k))) return true;
        node = node.parentElement;
      }
      return false;
    } catch {
      return false;
    }
  }

  function findExecuteButton() {
    const nodes = Array.from(
      document.querySelectorAll(
        'button, [role="button"], .icd-btn, .monaco-button, a[class*="btn"], div[class*="btn"]'
      )
    );
    let fallback = null;
    for (const button of nodes) {
      const t = btnText(button);
      if (t !== "执行" && t !== "Execute") continue;
      if (isBlacklisted(t) || nearQuiz(button)) continue;
      if (!isInteractive(button)) continue;
      if (nearConfirmExecute(button)) return button;
      if (!fallback) fallback = button;
    }
    // 无「确认执行」上下文时，仍点可见的精确「执行」（常见于该弹层 DOM 较浅）
    return fallback;
  }

  function riskModalOpen() {
    return !!Array.from(document.querySelectorAll("div, span, h2, h3, p")).find((el) => {
      try {
        const t = btnText(el);
        if (!RISK_MODAL_MARKERS.some((m) => t === m || t.startsWith(m))) return false;
        return isVisible(el);
      } catch {
        return false;
      }
    });
  }

  function findByExactText(text) {
    const nodes = Array.from(
      document.querySelectorAll(
        'button, [role="button"], .icd-btn, .monaco-button, a[class*="btn"], div[class*="btn"]'
      )
    );
    for (const button of nodes) {
      const t = btnText(button);
      if (t !== text) continue;
      if (isBlacklisted(t) || nearQuiz(button)) continue;
      if (!isInteractive(button)) continue;
      return button;
    }
    return null;
  }

  function findBySelector(selector, validate) {
    try {
      const button = document.querySelector(selector);
      if (!button || !isVisible(button)) return null;
      if (validate && !validate(button)) return null;
      const t = btnText(button);
      if (isBlacklisted(t) || nearQuiz(button)) return null;
      return button;
    } catch {
      return null;
    }
  }

  // CN 成功选择器优先；文案兜底（Work solo-lite 也可能复用同类 class）
  const BUTTON_CONFIGS = [
    {
      name: "仍要运行",
      find: () => {
        for (const text of RISK_CONFIRM_TEXTS) {
          const b = findByExactText(text);
          if (b) return b;
        }
        return null;
      },
    },
    {
      name: "执行",
      find: () => findExecuteButton(),
    },
    {
      name: "继续",
      find: () =>
        findBySelector("div.agent-error-wrap div.icube-alert-action", (b) => btnText(b) === "继续") ||
        findByExactText("继续") ||
        findByExactText("Continue"),
    },
    {
      name: "删除",
      find: () => {
        if (!enableDelete) return null;
        return (
          findBySelector("button.icd-delete-files-command-card-v2-actions-delete", (b) => {
            const span = b.querySelector("span.icd-btn-content");
            return (span ? span.textContent.trim() : btnText(b)) === "删除";
          }) ||
          findByExactText("删除") ||
          findByExactText("Delete")
        );
      },
    },
    {
      name: "全部接受",
      find: () => {
        const selectors = [
          "div.chat-todolist-bar button.icd-btn-primary",
          'button[class*="todoListBar-module__todo-list-bar_accept-btn"]',
          'div[class*="todo-list-bar"] button.icd-btn-primary',
        ];
        for (const sel of selectors) {
          const b = findBySelector(sel, (btn) => {
            const span = btn.querySelector("span.icd-btn-content");
            if (span && span.textContent.trim() === "全部接受") return true;
            const tip =
              (btn.getAttribute("aria-label") || "") + " " + (btn.getAttribute("data-icubetooltip") || "");
            if (tip.includes("全部接受")) return true;
            return btnText(btn) === "全部接受";
          });
          if (b) return b;
        }
        return findByExactText("全部接受") || findByExactText("Accept all");
      },
    },
    {
      name: "运行",
      find: () => {
        if (riskModalOpen()) return null;
        return (
          findBySelector(
            "div.icd-run-command-card-v2-actions button.icd-run-command-card-v2-actions-btn-run",
            (b) => btnText(b) === "运行"
          ) ||
          findByExactText("运行") ||
          findByExactText("Run")
        );
      },
    },
  ];

  function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logs.push(line);
    if (logs.length > 40) logs.shift();
    const el = document.getElementById("trae-auto-kit-log");
    if (el) el.textContent = logs.slice(-8).join("\n");
    try {
      console.log(`[trae-auto-kit:${PRODUCT}]`, msg);
    } catch {}
  }

  function clickButton(button, name) {
    try {
      const rect = button.getBoundingClientRect();
      try {
        button.focus({ preventScroll: true });
      } catch {}
      try {
        button.click();
      } catch {}
      button.dispatchEvent(
        new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        })
      );
      clickCount++;
      log(`clicked "${name}" (#${clickCount})`);
      updatePanel();
      return true;
    } catch (e) {
      log(`click fail ${name}: ${e.message}`);
      return false;
    }
  }

  function tick() {
    try {
      for (const cfg of BUTTON_CONFIGS) {
        const button = cfg.find();
        if (button) {
          clickButton(button, cfg.name);
          return;
        }
      }
    } catch (e) {
      log(`tick error: ${e.message}`);
    }
  }

  function updatePanel() {
    const status = document.getElementById("trae-auto-kit-status");
    if (status) {
      status.textContent = isRunning ? `Auto ${clickCount}/∞` : "Stopped";
      status.style.color = isRunning ? "#2ecc71" : "#e74c3c";
    }
    const dot = document.getElementById("trae-auto-kit-dot");
    if (dot) dot.style.background = isRunning ? "#2ecc71" : "#95a5a6";
  }

  function clampPos(left, top, width, height) {
    const maxL = Math.max(0, window.innerWidth - width);
    const maxT = Math.max(0, window.innerHeight - height);
    return {
      left: Math.min(Math.max(0, left), maxL),
      top: Math.min(Math.max(0, top), maxT),
    };
  }

  function savePos(panel) {
    try {
      const r = panel.getBoundingClientRect();
      localStorage.setItem(POS_KEY, JSON.stringify({ left: r.left, top: r.top }));
    } catch {}
  }

  function applySavedPos(panel) {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return;
      const pos = JSON.parse(raw);
      if (typeof pos.left !== "number" || typeof pos.top !== "number") return;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      const w = panel.offsetWidth || 250;
      const h = panel.offsetHeight || 40;
      const c = clampPos(pos.left, pos.top, w, h);
      panel.style.left = `${c.left}px`;
      panel.style.top = `${c.top}px`;
    } catch {}
  }

  function setMinimized(panel, min) {
    isMinimized = !!min;
    const body = document.getElementById("trae-auto-kit-body");
    const btn = document.getElementById("trae-auto-kit-min");
    if (body) body.style.display = isMinimized ? "none" : "block";
    if (btn) {
      btn.textContent = isMinimized ? "+" : "－";
      btn.title = isMinimized ? "展开" : "收起";
    }
    panel.style.width = isMinimized ? "auto" : "250px";
    panel.style.minWidth = isMinimized ? "140px" : "";
    try {
      localStorage.setItem(MIN_KEY, isMinimized ? "1" : "0");
    } catch {}
  }

  function enableDrag(panel, handle) {
    handle.style.cursor = "move";
    handle.title = "拖动移动面板";

    const onMove = (ev) => {
      if (!dragState) return;
      const left = ev.clientX - dragState.ox;
      const top = ev.clientY - dragState.oy;
      const c = clampPos(left, top, panel.offsetWidth, panel.offsetHeight);
      panel.style.left = `${c.left}px`;
      panel.style.top = `${c.top}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    };

    const onUp = () => {
      if (!dragState) return;
      dragState = null;
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseup", onUp, true);
      savePos(panel);
    };

    handle.addEventListener("mousedown", (ev) => {
      if (ev.button !== 0) return;
      // 只有点击 min 按钮本身时不触发拖动，其他 handle 区域均可拖动
      if (ev.target.id === "trae-auto-kit-min") return;
      const r = panel.getBoundingClientRect();
      dragState = { ox: ev.clientX - r.left, oy: ev.clientY - r.top };
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.left = `${r.left}px`;
      panel.style.top = `${r.top}px`;
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onUp, true);
      ev.preventDefault();
    });
  }

  function ensurePanel() {
    if (document.getElementById(PANEL_ID)) return;
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    const bg = PRODUCT === "Work" ? "rgba(18,28,36,.94)" : "rgba(20,22,28,.92)";
    panel.innerHTML = `
      <div id="trae-auto-kit-handle" style="display:flex;align-items:center;gap:8px;margin-bottom:0;user-select:none;padding:4px 6px;border-radius:6px;cursor:move;">
        <span style="font-size:14px;opacity:.6;flex-shrink:0;pointer-events:none;">⠿</span>
        <span id="trae-auto-kit-dot" style="width:10px;height:10px;border-radius:50%;background:#95a5a6;flex-shrink:0;pointer-events:none;"></span>
        <strong style="font-size:12px;pointer-events:none;">Trae Auto Kit ${PRODUCT}</strong>
        <span id="trae-auto-kit-status" style="margin-left:auto;font-size:11px;pointer-events:none;">Stopped</span>
        <button id="trae-auto-kit-min" type="button" title="收起" style="margin-left:4px;padding:2px 8px;cursor:pointer;line-height:18px;border:none;border-radius:4px;background:#34495e;color:#ecf0f1;font-size:14px;">－</button>
      </div>
      <div id="trae-auto-kit-body" style="margin-top:6px;">
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <button id="trae-auto-kit-toggle" type="button" style="flex:1;padding:4px 8px;cursor:pointer;">Start</button>
          <label style="display:flex;align-items:center;gap:4px;font-size:11px;white-space:nowrap;">
            <input id="trae-auto-kit-delete" type="checkbox" checked />删除
          </label>
        </div>
        <pre id="trae-auto-kit-log" style="margin:0;max-height:90px;overflow:auto;font-size:10px;opacity:.85;white-space:pre-wrap;"></pre>
      </div>
    `;
    Object.assign(panel.style, {
      position: "fixed",
      top: "12px",
      right: "12px",
      zIndex: "2147483646",
      width: "250px",
      padding: "10px",
      borderRadius: "8px",
      background: bg,
      color: "#ecf0f1",
      fontFamily: "Segoe UI, sans-serif",
      boxShadow: "0 8px 24px rgba(0,0,0,.35)",
      backdropFilter: "blur(6px)",
    });
    document.documentElement.appendChild(panel);
    applySavedPos(panel);
    enableDrag(panel, document.getElementById("trae-auto-kit-handle"));

    document.getElementById("trae-auto-kit-toggle").onclick = () => {
      isRunning ? stop() : start();
    };
    document.getElementById("trae-auto-kit-delete").onchange = (e) => {
      enableDelete = !!e.target.checked;
      log(`delete auto = ${enableDelete}`);
    };
    document.getElementById("trae-auto-kit-min").onclick = (e) => {
      e.stopPropagation();
      setMinimized(panel, !isMinimized);
    };

    try {
      if (localStorage.getItem(MIN_KEY) === "1") setMinimized(panel, true);
    } catch {}
  }

  function start() {
    if (isRunning) return;
    ensurePanel();
    isRunning = true;
    interval = setInterval(tick, POLL_MS);
    tick();
    updatePanel();
    const btn = document.getElementById("trae-auto-kit-toggle");
    if (btn) btn.textContent = "Stop";
    log("started");
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (interval) clearInterval(interval);
    interval = null;
    updatePanel();
    const btn = document.getElementById("trae-auto-kit-toggle");
    if (btn) btn.textContent = "Start";
    log("stopped");
  }

  function destroy() {
    stop();
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
    try {
      delete window.__traeAutoKit;
    } catch {}
  }

  window.__traeAutoKit = {
    start,
    stop,
    toggle: () => (isRunning ? stop() : start()),
    destroy,
    isRunning: () => isRunning,
    getClickCount: () => clickCount,
    getProduct: () => PRODUCT,
    setEnableDelete: (v) => {
      enableDelete = !!v;
      const box = document.getElementById("trae-auto-kit-delete");
      if (box) box.checked = enableDelete;
    },
  };

  ensurePanel();
  start();
})();
