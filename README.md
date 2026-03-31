# Reference Manager Pro

[中文说明](./README_CN.md) | [English](./README_EN.md)

## 中文

Reference Manager Pro 是一个面向学术研究者、学生和论文作者的 VS Code / Kiro BibTeX 管理扩展。

它不是单纯“排版参考文献”，而是把参考文献处理升级成一套更可信、更省心的工作流：

- 优先使用 DOI 官方元数据，尽量避免“格式对了但内容不准”
- 默认入口直接提供最常用的 5 个动作
- 剩余低频模式和高级工具统一收敛到 `More Tools`
- 所有自动修改都带有摘要、来源、历史记录与回滚能力

### 适合谁

- 用 LaTeX / BibTeX 写论文、报告、毕业设计的人
- 参考文献来源杂、格式乱、经常需要清理 `.bib` 文件的人
- 既想要“一键修复”，又不希望失去可控性和可回滚性的人

### 核心流程

1. 打开 `.bib` 文件
2. 运行 `Reference Manager: Smart Fix`
3. 需要检查这一条时运行 `Reference Manager: Check This Entry`
4. 需要清理无用条目时运行 `Reference Manager: Clean Unused Citations`
5. 需要批量处理整份文件时运行 `Reference Manager: Smart Fix All`
6. 需要检查整份文件时运行 `Reference Manager: Check This File`
7. 其余低频模式再运行 `Reference Manager: More Tools`
8. 如有需要，用 `History & Restore` 回滚

### 主要能力

- `Smart Fix`：单条参考文献的一键可信修复
- `Check This Entry`：检查当前这一条条目的问题
- `Clean Unused Citations`：清理工作区中未使用的参考文献
- `Smart Fix All`：处理当前整个 `.bib` 文件
- `Check This File`：检查当前整个 `.bib` 文件的问题
- `More Tools`：只保留低频模式和高级工具
- `History & Restore`：自动修改记录与回滚
- `keyHandling.*`：统一控制 cite key 替换/保留策略
- `quality.*`：保存后校验、内联告警装饰

### 默认界面与预设

- 默认右键固定提供 5 个高频动作和 `More Tools`
- `referenceManager.ui.preset = minimal`：不额外挂出高级固定项
- `referenceManager.ui.preset = review`：默认额外挂出 `History & Restore`
- `referenceManager.ui.preset = power`：默认额外挂出 `History & Restore` 与 `Official Metadata Check`
- `referenceManager.ui.contextMenuPins`：最多再固定 2 个高级动作

### 文档入口

- [中文完整说明](./README_CN.md)
- [English Full Guide](./README_EN.md)
- [快速开始](./docs/guides/QUICK_START.md)
- [Key 处理指南](./docs/guides/KEY_REPLACEMENT_GUIDE.md)

## English

Reference Manager Pro is a BibTeX productivity extension for VS Code / Kiro, built for researchers, students, and academic writers.

It is designed to do more than format entries:

- prefer official DOI metadata whenever possible
- expose the 5 most common tasks directly in the default surface
- keep lower-frequency modes and advanced tools in `More Tools`
- make every automated change transparent, reviewable, and reversible

### Who It Is For

- people writing papers, theses, and reports with LaTeX / BibTeX
- users with messy `.bib` files from mixed sources
- users who want one-click cleanup without losing control

### Core Workflow

1. Open a `.bib` file
2. Run `Reference Manager: Smart Fix`
3. Run `Reference Manager: Check This Entry` when you want to inspect one entry
4. Run `Reference Manager: Clean Unused Citations` when you want to clean unused entries
5. Run `Reference Manager: Smart Fix All` when you want to process the whole file
6. Run `Reference Manager: Check This File` when you want to inspect the whole file
7. Use `Reference Manager: More Tools` for the remaining advanced modes
8. Use `History & Restore` if you need rollback

### Key Capabilities

- `Smart Fix`: trustworthy one-click cleanup for the current entry
- `Check This Entry`: check issues in the current entry only
- `Clean Unused Citations`: clean bibliography entries not used in workspace `.tex` files
- `Smart Fix All`: process the current `.bib` file
- `Check This File`: inspect issues across the whole current `.bib` file
- `More Tools`: reserved for lower-frequency advanced modes and tools
- `History & Restore`: change tracking and rollback
- `keyHandling.*`: unified cite-key replacement/preservation policy
- `quality.*`: validate-on-save and inline diagnostics

### Documentation

- [Chinese Guide](./README_CN.md)
- [English Guide](./README_EN.md)
- [Quick Start](./docs/guides/QUICK_START.md)
- [Key Handling Guide](./docs/guides/KEY_REPLACEMENT_GUIDE.md)
