# Trae Auto Kit — Work

端口：`39341` / `39342` / `39343`（见 `config.json`）  
主页面为 `solo-lite.html`（`shared/cdp.mjs` 已适配）。

| 操作 | 文件 |
|------|------|
| 检查端口 | `check-ports.bat` |
| 注入一次 | `一键启动.bat` |
| 常驻（推荐） | `常驻监视.bat` |
| 停止 | `停止.bat` |
| 弹层探针 | `node probe-buttons.mjs 39342` |

与 CN **共用** `../shared/agent-click.js`。完整迁机说明见 `../交接说明.md`。
