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

Reference Manager Pro 是一款面向 LaTeX 用户的 VS Code / Kiro 扩展。核心定位为“可信修复”：优先使用 DOI 官方元数据，必要时才使用 AI，所有变更可回滚。

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
│   ├── metadataResolver.ts # DOI 官方元数据获取
│   ├── metadataValidator.ts# 质量校验与重复检测
│   ├── changeHistory.ts    # 变更记录与回滚
│   ├── aiFormatter.ts      # AI 格式化 (Groq/Anthropic)
│   ├── localFormatter.ts   # 本地规则格式化
│   ├── bibParser.ts        # BibTeX 解析器
│   ├── citationScanner.ts  # 引用扫描器
│   ├── config.ts           # 配置管理
│   ├── license.ts          # 许可证验证
│   └── test/               # 测试文件
├── docs/
│   ├── README_CN.md        # 中文用户文档
│   ├── README_EN.md        # 英文用户文档
│   └── DEVELOPER.md        # 本文件
├── package.json
└── tsconfig.json
```

---

## 技术架构

### 关键流程（Smart Fix）

```
Smart Fix
  ├─ DOI 官方元数据 (metadataResolver)
  ├─ 本地规则格式化 (localFormatter)
  ├─ 可选 AI 增强 (aiFormatter)
  ├─ 质量校验 (metadataValidator)
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
 └─ license.ts ──→ config.ts
```

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
- key 策略由 `referenceManager.officialMetadata.keyPolicy` 控制（默认仅在未使用时替换）
- 输出格式由 `referenceManager.officialMetadata.formatMode` 控制（`normalized` 或 `raw`）

该过程不会消耗 AI 配额。

### Citation Key 生成规则

`deriveKeyFromDoi()` 函数支持主流期刊的 DOI 格式解析：

- **Physical Review (APS)**: `10.1103/physrevlett.120.093201` → `PhysRevLett.120.093201`
- **Nature**: `10.1038/s41586-023-05740-2` → `Nature:s41586-023-05740-2`
- **Optica/OSA**: `10.1364/optica.397235` → `OSA:optica.397235`
- **IOP Publishing**: `10.1088/2058-9565/ab8962` → `IOP:2058-9565/ab8962`
- **Elsevier**: `10.1016/0370-2693(81)90590-6` → `Elsevier:0370-2693(81)90590-6`
- **AIP Publishing**: `10.1063/1.4938164` → `AIP:1.4938164`
- **Springer**: `10.1007/s00340-003-1337-x` → `Springer:s00340-003-1337-x`
- **其他**: 通用格式（用冒号替换斜杠）

### 期刊缩写映射

`localFormatter.ts` 中的 `DEFAULT_JOURNAL_ABBREVIATIONS` 包含 40+ 个主流期刊的标准缩写：

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

---

## 联系方式

- 项目仓库：https://github.com/tryandaction/reference-manager-pro
- 邮箱：2812149844@qq.com

---

*最后更新: 2026-02-03*
