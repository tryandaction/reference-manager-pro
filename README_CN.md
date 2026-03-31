# Reference Manager Pro

面向学术研究者的 BibTeX 可信修复与管理工具。

Reference Manager Pro 运行在 VS Code / Kiro 中，目标不是单纯“把参考文献排漂亮”，而是把 `.bib` 文件整理变成一套更稳定、更清晰、更可回滚的产品流程。

## 产品定位

很多 BibTeX 工具只解决格式问题，但真实场景里，用户遇到的是一整套混乱：

- 条目来源杂，字段不完整
- DOI 有时存在、有时缺失
- cite key 处理容易破坏现有 `.tex` 引用
- 菜单和命令太多，用户不知道先用哪个
- 自动修复后不透明，出错难以回退

Reference Manager Pro 解决的是这一整组问题。

## 产品核心价值

### 1. 可信修复，不只是格式化

优先使用 DOI 官方元数据，尽量减少“格式正确但元数据错误”的情况。  
没有官方元数据时，再回退到本地规则和 AI 增强。

### 2. 默认入口直接好懂

默认入口直接放最常用的 5 个动作：

- `Smart Fix`
- `Check This Entry`
- `Clean Unused Citations`
- `Smart Fix All`
- `Check This File`

其余低频但有价值的能力统一进入：

- `More Tools`

这样普通用户先看到“我要做什么”，而不是先理解 raw / local / AI 这些实现词。

### 3. 过程透明，可回滚

每次自动修改都会保留：

- 变更摘要
- 来源标识
- 历史记录
- 回滚入口

## 主要功能

### Smart Fix

单条参考文献的默认主流程：

- 优先 DOI 官方元数据
- 回退到本地规则
- 在可用时接入 AI
- 输出变更摘要和下一步建议

### Check This Entry

检查当前这一条参考文献的问题：

- 缺失字段
- DOI / 页码 / 年份格式异常
- 当前条目质量评分

### Clean Unused Citations

找出 `.bib` 中存在、但工作区 `.tex` 中没有使用到的条目。  
它的目标不是修格式，而是清垃圾。

### Smart Fix All

整理当前整个 `.bib` 文件。  
适合文献库已经比较乱、你不想一条一条修的时候。

### Check This File

检查当前整个 `.bib` 文件的问题，而不是只检查光标所在这一条。

### More Tools

现在它不再承担高频主入口，而只保留剩余的低频模式和高级工具。

这里可以继续访问：

- 官方 raw 模式
- 本地单条格式化
- AI 单条格式化
- 本地批量格式化
- AI 批量格式化
- 重复条目清理
- 官方元数据报告
- 历史与恢复
- 实验工作流

### History & Restore

用于查看自动修改记录，并在必要时回滚。

## 默认界面与预设

- 默认右键固定提供 5 个高频动作和 `More Tools`
- `referenceManager.ui.preset = minimal`：不额外挂出高级固定项
- `referenceManager.ui.preset = review`：默认额外挂出 `History & Restore`
- `referenceManager.ui.preset = power`：默认额外挂出 `History & Restore` 与 `Official Metadata Check`
- `referenceManager.ui.contextMenuPins`：最多再固定 2 个高级动作

## 推荐使用方式

### 日常最常见流程

1. 打开 `.bib`
2. 运行 `Smart Fix`
3. 需要检查这一条时运行 `Check This Entry`
4. 需要清理无用条目时运行 `Clean Unused Citations`
5. 需要批量处理整份文件时运行 `Smart Fix All`
6. 需要检查整份文件时运行 `Check This File`
7. 其他低频模式再打开 `More Tools`
8. 不满意就用 `History & Restore`

## 推荐配置

普通用户建议从这些设置开始：

- `referenceManager.ui.preset`
- `referenceManager.ui.contextMenuPins`
- `referenceManager.keyHandling.mode`
- `referenceManager.quality.validateOnSave`

## 文档

- [双语入口 README](./README.md)
- [English Version](./README_EN.md)
- [快速开始](./docs/guides/QUICK_START.md)
- [Key 处理指南](./docs/guides/KEY_REPLACEMENT_GUIDE.md)
- [测试指南](./docs/guides/TEST_GUIDE.md)

## 当前版本

当前版本：`v0.4.0`

更新重点：

- 主入口重排为最常用的 5 个动作
- `More Tools` 只保留低频模式和高级工具
- 单条校验与整份文件校验分开
- cite key 策略统一
- 保存后校验与内联提示真实生效
