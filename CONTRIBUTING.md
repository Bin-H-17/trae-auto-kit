# Contributing to Trae Auto Kit

感谢你对 Trae Auto Kit 的关注！

## 如何贡献

### 报告问题

- 使用 GitHub Issues 报告 bug
- 请包含：操作系统、Trae 版本、Node.js 版本、错误日志
- 如果是面板问题，请截图说明

### 提交代码

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 代码规范

- JavaScript 使用 ES Module 语法
- 保持代码简洁，添加必要注释
- 修改 `shared/agent-click.js` 时请确保 CN 和 Work 都能正常工作

### 测试

提交前请验证：

1. Trae CN 能正常注入和点击
2. Trae Work 能正常注入和点击
3. 面板拖动正常
4. 最小化/展开正常
5. 断线重连正常

## 开发环境

- Node.js >= 18
- Trae IDE（带调试端口）

## License

贡献的代码将采用 [MIT License](LICENSE)。
