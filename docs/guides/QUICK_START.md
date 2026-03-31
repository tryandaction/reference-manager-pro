# 快速开始（v0.4.0）

## 默认推荐流程

1. 打开 `.bib` 文件
2. 运行 `Reference Manager: Smart Fix`
3. 需要检查当前条目时运行 `Reference Manager: Check This Entry`
4. 需要清理无用条目时运行 `Reference Manager: Clean Unused Citations`
5. 需要批量处理当前文件时运行 `Reference Manager: Smart Fix All`
6. 需要检查整份文件时运行 `Reference Manager: Check This File`
7. 如需低频高级模式，运行 `Reference Manager: More Tools`
8. 如需回滚，运行 `Reference Manager: History & Restore`

## 何时使用 More Tools

运行 `Reference Manager: More Tools`，当你需要：

- 官方 raw 模式
- 仅本地格式化
- AI 单条格式化
- 本地批量格式化
- AI 批量格式化
- 官方元数据报告
- 重复条目清理
- 历史与恢复
- 实验工作流

## 右键菜单

默认右键直接放：

- `Smart Fix`
- `Check This Entry`
- `Clean Unused Citations`
- `Smart Fix All`
- `Check This File`
- `More Tools`

你可以通过以下设置额外挂出最多 2 个高价值动作：

- `referenceManager.ui.contextMenuPins`

## 关键设置

- `referenceManager.ui.preset`
- `referenceManager.ui.contextMenuPins`
- `referenceManager.ui.showCommandCenterInContextMenu`
- `referenceManager.keyHandling.mode`
- `referenceManager.keyHandling.commentPrefix`
- `referenceManager.quality.validateOnSave`
- `referenceManager.quality.showInlineDecorations`

### `ui.preset` 的当前语义

- `minimal`：保留默认 5 个主动作和 `More Tools`，不额外挂出高级固定项
- `review`：在默认主动作之外，再固定 `History & Restore`
- `power`：在默认主动作之外，再固定 `History & Restore` 与 `Official Metadata Check`

## 日常建议

```text
Smart Fix -> Check This Entry
Smart Fix All -> Check This File
Clean Unused Citations -> 清理无用条目
More Tools -> 低频高级模式
History & Restore -> 回滚
```
