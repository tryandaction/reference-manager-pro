# Reference Manager Pro v0.4.0 - 交互清理升级

## 概览

v0.4.0 将扩展从“功能很多但入口碎、设置碎、交互不一致”收敛为“默认主入口清晰、能力完整保留、高手可扩展”的模型。

## 核心变化

### 默认右键主入口重排

- 默认右键直接提供 5 个高频动作：
  - `Smart Fix`
  - `Check This Entry`
  - `Clean Unused Citations`
  - `Smart Fix All`
  - `Check This File`
- 低频模式和高级工具统一进入 `More Tools`
- 支持通过 `referenceManager.ui.contextMenuPins` 额外挂出最多 2 个高价值动作

### 新增 More Tools 命令中心

新增 `Reference Manager: More Tools`，统一承载剩余低频模式和高级能力：

- `我的常用`
- `更多修复方式`
- `更多清理与检查`
- `历史与恢复`
- `实验功能`

### 配置系统收敛

公开配置现在聚焦于：

- `referenceManager.ui.*`
- `referenceManager.keyHandling.*`
- `referenceManager.quality.*`
- `referenceManager.cleanup.*`
- `referenceManager.experimental.workflows`

旧 `customization.*` 设置仍会被读取并迁移。

`referenceManager.ui.preset` 的当前语义：

- `minimal`：默认主入口，不额外挂出高级固定项
- `review`：默认额外挂出 `History & Restore`
- `power`：默认额外挂出 `History & Restore` 与 `Official Metadata Check`

### Citation Key 逻辑统一

旧：

- `officialMetadata.keyPolicy`
- `customization.behaviors.keyReplacement.*`

新：

- `referenceManager.keyHandling.mode`
- `referenceManager.keyHandling.commentPrefix`

默认策略为 `replace-safe-and-comment-old`。

### 真实质量反馈

- `referenceManager.quality.validateOnSave` 现在真实执行
- `referenceManager.quality.showInlineDecorations` 现在真实显示编辑器内联告警
- `Smart Fix` 完成后直接给出下一步动作 CTA

## 部署产物

本版本打包产物：

- `reference-manager-pro-0.4.0.vsix`

安装方式：

1. 打开 VS Code / Kiro
2. `Ctrl+Shift+P`
3. 运行 `Extensions: Install from VSIX...`
4. 选择 `reference-manager-pro-0.4.0.vsix`
