# Trae Auto Kit
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Bin-H-17/trae-auto-kit/badge)](https://securityscorecards.dev/viewer/?uri=github.com/Bin-H-17/trae-auto-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[中文](#简介) | [English](#overview)

---

## 简介

自动代点 Trae 的确认按钮（仍要运行 / 执行 / 继续 / 删除 / 全部接受 / 运行）。

支持 Trae CN、Trae Work、Trae Intl、Trae Work Intl 四个产品线。

## 功能

- 自动点击确认按钮（优先级：仍要运行 → 执行 → 继续 → 删除 → 全部接受 → 运行）
- 可拖动浮窗面板，显示点击计数和状态
- 支持最小化/展开
- 可勾选是否自动点「删除」
- 断线自动重连（监视模式）
- 位置记忆（刷新后恢复上次位置）

## 快速开始

### 1. 准备 Trae 快捷方式

用带调试端口的快捷方式打开 Trae（见 `交接说明.md` §4）。

运行 `setup-shortcuts.ps1` 可一键重建桌面快捷方式：

```powershell
powershell -ExecutionPolicy Bypass -File setup-shortcuts.ps1
```

### 2. 启动自动点击

**单次注入：**

```bash
# Trae Work
node work/inject.mjs

# Trae CN
node cn/inject.mjs
```

**常驻监视（推荐）：**

```bash
# Trae Work
work/常驻监视.bat

# Trae CN
cn/常驻监视.bat

# 全部
启动全部监视.bat
```

右上角出现 **Trae Auto Kit** 面板即生效。

## 会点 / 不点

| 自动点（优先序） | 不点 |
|------------------|------|
| 仍要运行 → 执行 → 继续 → 删除 → 全部接受 → 运行 | 下一个、取消、保留 |

面板可拖动、可收起；「删除」可取消勾选。

## 目录结构

```
trae-auto-kit/
├── shared/
│   ├── agent-click.js      # 共用点击逻辑 + UI 面板
│   ├── cdp.mjs             # CDP 通信工具
│   └── load-script.mjs     # 脚本加载器
├── cn/                      # Trae CN（端口 39241-43）
├── work/                    # Trae Work（端口 39341-43）
├── intl/                    # Trae Intl
├── work-intl/               # Trae Work Intl
├── setup-shortcuts.ps1      # 快捷方式重建脚本
├── 启动全部监视.bat          # 一键启动所有监视
└── paths.example.json       # 路径配置示例
```

## 配置

每个产品目录下的 `config.json`：

```json
{
  "ports": [39340, 39341, 39342, 39343, 39344, 39345, 39346],
  "watchIntervalMs": 5000,
  "pollIntervalMs": 1500,
  "enableDelete": true
}
```

## 工作原理

通过 Chrome DevTools Protocol (CDP) 连接 Trae 的调试端口，注入 JavaScript 脚本到页面中。脚本会：

1. 在页面右上角创建一个浮窗面板
2. 每 1.5 秒扫描一次页面上的按钮
3. 按优先级自动点击匹配的确认按钮
4. 监视模式会每 5 秒检查一次，如果面板丢失会自动重新注入

## 致谢

Inspired by [luw2007/trae-auto-accept](https://github.com/luw2007/trae-auto-accept)（MIT）。见 `vendor-notes/`。

## License

[MIT](LICENSE)

---

## Overview

Auto-click Trae IDE confirmation buttons (Still Run / Execute / Continue / Delete / Accept All / Run).

Supports Trae CN, Trae Work, Trae Intl, and Trae Work Intl.

## Features

- Auto-click confirmation buttons (priority: Still Run → Execute → Continue → Delete → Accept All → Run)
- Draggable floating panel with click counter and status
- Minimize/expand toggle
- Optional auto-delete toggle
- Auto-reconnect on disconnect (watch mode)
- Position memory (persists across refreshes)

## Quick Start

### 1. Prepare Trae Shortcut

Open Trae with a remote debugging port (see `交接说明.md` §4).

Run `setup-shortcuts.ps1` to recreate desktop shortcuts:

```powershell
powershell -ExecutionPolicy Bypass -File setup-shortcuts.ps1
```

### 2. Start Auto-Click

**One-shot inject:**

```bash
node work/inject.mjs   # Trae Work
node cn/inject.mjs     # Trae CN
```

**Persistent watch (recommended):**

```bash
work/常驻监视.bat       # Trae Work
cn/常驻监视.bat         # Trae CN
启动全部监视.bat        # All
```

The **Trae Auto Kit** panel appears in the top-right corner when active.

## Will Click / Won't Click

| Auto-click (priority) | Won't click |
|------------------------|-------------|
| Still Run → Execute → Continue → Delete → Accept All → Run | Next, Cancel, Keep |

Panel is draggable and collapsible; "Delete" can be unchecked.

## How It Works

Injects JavaScript into Trae via Chrome DevTools Protocol (CDP) on the local debugging port. The script:

1. Creates a floating panel in the top-right corner
2. Scans for buttons every 1.5 seconds
3. Clicks matching confirmation buttons by priority
4. Watch mode checks every 5 seconds and re-injects if the panel is lost

## Acknowledgements

Inspired by [luw2007/trae-auto-accept](https://github.com/luw2007/trae-auto-accept) (MIT). See `vendor-notes/`.

## License

[MIT](LICENSE)
