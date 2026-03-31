# Reference Manager Pro - 开发者文档

## 📋 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [开发环境设置](#开发环境设置)
4. [官方元数据获取](#官方元数据获取)
5. [核心模块说明](#核心模块说明)
6. [构建与发布](#构建与发布)
7. [测试](#测试)
8. [商业化](#商业化)

---

## 项目概述

Reference Manager Pro 是一款面向 LaTeX / BibTeX 用户的 VS Code / Kiro 扩展。当前产品定位是“可信修复 + 可检查 + 可回滚”：优先使用 DOI 官方元数据，必要时才使用 AI，默认主入口直接暴露 5 个高频动作，其余低频模式统一进入 `More Tools`。

### 技术栈

- **语言**: TypeScript
- **运行环境**: VS Code Extension Host
- **AI 提供商**: Groq / Anthropic
- **测试框架**: Vitest + fast-check
- **打包工具**: vsce

### 目录结构

```
reference-manager-pro/
├── src/
│   ├── extension.ts        # 扩展入口与命令
│   ├── configurationModel.ts # 配置模型与迁移辅助
│   ├── metadataResolver.ts # DOI 官方元数据获取
│   ├── metadataValidator.ts# 质量校验与重复检测
│   ├── changeHistory.ts    # 变更记录与回滚
│   ├── aiFormatter.ts      # AI 格式化 (Groq/Anthropic)
│   ├── localFormatter.ts   # 本地规则格式化
│   ├── bibParser.ts        # BibTeX 解析器
│   ├── citationScanner.ts  # 引用扫描器
│   ├── config.ts           # 配置管理
│   ├── keyHandling.ts      # cite key 替换/保留策略
│   ├── license.ts          # 许可证验证
│   ├── validationDecorations.ts # 编辑器内联告警装饰
│   ├── ui/                 # More Tools 与动作注册表
│   ├── workflow/           # 实验工作流系统
│   └── test/               # 测试文件
├── docs/
│   ├── guides/             # 快速开始、测试、key 处理等指南
│   ├── releases/           # 版本发布说明
│   └── DEVELOPER.md        # 本文件
├── README_CN.md            # 中文产品说明
├── README_EN.md            # 英文产品说明
├── package.json
└── tsconfig.json
```

---

## 技术架构

### 关键流程（Smart Fix）

```
Smart Fix
  ├─ DOI 官方元数据 (metadataResolver)
  ├─ cite key 决策与注释 (keyHandling)
  ├─ 本地规则格式化 (localFormatter)
  ├─ 可选 AI 增强 (aiFormatter)
  ├─ 质量校验 (metadataValidator)
  ├─ 编辑器内联装饰 (validationDecorations)
  └─ 变更记录 (changeHistory)
```

### 模块依赖关系

```
extension.ts
 ├─ metadataResolver.ts ──→ fetchPolyfill.ts
 ├─ metadataValidator.ts ──→ bibParser.ts
 ├─ changeHistory.ts
 ├─ aiFormatter.ts ──→ config.ts
 ├─ localFormatter.ts ──→ bibParser.ts
 ├─ citationScanner.ts ──→ bibParser.ts
 ├─ keyHandling.ts
 ├─ validationDecorations.ts
 ├─ ui/actionRegistry.ts
 ├─ ui/commandCenter.ts
 ├─ workflow/workflowManager.ts
 └─ license.ts ──→ config.ts
```

### 默认交互模型

- 默认右键和命令面板直接暴露：
  - `Smart Fix`
  - `Check This Entry`
  - `Clean Unused Citations`
  - `Smart Fix All`
  - `Check This File`
  - `More Tools`
- `More Tools` 负责低频模式和高级工具：
  - 官方 raw 模式
  - 本地 / AI 单条整理
  - 本地 / AI 批量整理
  - 官方元数据报告
  - 重复条目清理
  - 历史与恢复
  - 实验工作流
- `referenceManager.ui.preset` 只控制额外固定项，不改变这 5 个主动作

---

## 开发环境设置

```bash
npm install
npm run compile
npm test
```

本地调试：按 `F5` 启动扩展宿主。

---

## 官方元数据获取

通过 DOI 官方入口获取 BibTeX：

- 请求地址：`https://doi.org/{doi}`
- Header：`Accept: application/x-bibtex`
- 超时由 `referenceManager.officialMetadata.timeout` 控制
- key 策略由 `referenceManager.keyHandling.mode` 控制
- 注释前缀由 `referenceManager.keyHandling.commentPrefix` 控制
- 输出格式由 `referenceManager.officialMetadata.formatMode` 控制（`normalized` 或 `raw`）

该过程不会消耗 AI 配额。

### Citation Key 生成规则

`deriveKeyFromDoi()` 函数支持主流期刊的 DOI 格式解析：

- **Physical Review (APS)**: `10.1103/physrevlett.120.093201` → `PhysRevLett.120.093201`
- **Nature**: `10.1038/s41586-023-05740-2` → `Nature:s41586-023-05740-2`
- **Optica/OSA**: `10.1364/optica.397235` → `Optica:optica.397235`
- **IOP Publishing**: `10.1088/2058-9565/ab8962` → `IOP:2058-9565/ab8962`
- **Elsevier**: `10.1016/0370-2693(81)90590-6` → `Elsevier:0370-2693(81)90590-6`
- **AIP Publishing**: `10.1063/1.4938164` → `AIP:1.4938164`
- **Springer**: `10.1007/s00340-003-1337-x` → `Springer:s00340-003-1337-x`
- **其他**: 通用格式（用冒号替换斜杠）

### 期刊缩写映射

`localFormatter.ts` 中的 `DEFAULT_JOURNAL_ABBREVIATIONS` 现已覆盖 200+ 个主流期刊 / 会议缩写：

- Physics: Phys. Rev. Lett., Phys. Rev. A/B/D/Appl., Rev. Mod. Phys., PRX Quantum
- Nature: Nature, Nat. Phys., Nat. Photonics, Nat. Commun.
- Science: Science, Sci. Rep.
- Optics: Optica, Opt. Express
- Quantum: Quantum Sci. Technol., New J. Phys.
- Materials: Nano Lett., Appl. Phys. Lett., Appl. Phys. Rev.
- Nuclear: Nucl. Phys. B, Phys. Lett. B, Sov. J. Nucl. Phys.
- Engineering: Rev. Sci. Instrum., Opto-Electron. Rev.

用户可在设置中自定义 `referenceManager.localFormat.journalAbbreviations` 添加更多映射。

---

## 核心模块说明

### metadataResolver.ts

DOI 官方元数据获取。

```ts
resolveOfficialBibtexFromEntry(entryText, timeoutMs)
```

### configurationModel.ts / config.ts

新的公开配置模型集中在：

- `ui.*`
- `keyHandling.*`
- `quality.*`
- `cleanup.*`
- `experimental.workflows`

旧 `customization.*` 与 `officialMetadata.keyPolicy` 会被读取并迁移。

### metadataValidator.ts

质量校验 + 重复检测。

```ts
validateEntries(entries, strictness, { detectDuplicates: true })
```

### changeHistory.ts

记录每次自动修复并支持回滚。

### aiFormatter.ts

AI 增强与重复检测。

### localFormatter.ts

本地规则格式化与字段规范。

### keyHandling.ts

统一处理官方 key 与原 key 的替换、保留、注释策略。

### validationDecorations.ts

根据 `quality.showInlineDecorations` 在编辑器中渲染 error / warn 装饰。

### ui/actionRegistry.ts + ui/commandCenter.ts

定义 `More Tools` 中的动作分组、固定逻辑和二级模式选择。

### workflow/*

实验工作流系统，支持通过 `referenceManager.experimental.workflows` 注册多步骤处理流程。

---

## 构建与发布

```bash
npm run compile
npm test
npm run package
```

---

## 测试

```
npm test
npm run test:integration
```

---

## 商业化

Free / Pro 使用限制由 `license.ts` 控制。

当前默认产品原则：

- 免费版也可使用本地整理、Smart Fix 主流程、检查与历史能力
- Pro 主要扩展 AI 批量整理、去重等高价值高级能力
- 所有自动改动都应带有摘要、来源、历史与回滚入口

---

## 联系方式

- 项目仓库：https://github.com/tryandaction/reference-manager-pro
- 邮箱：2812149844@qq.com

---

*最后更新: 2026-03-31*
