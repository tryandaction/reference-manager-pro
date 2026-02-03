# Changelog

All notable changes to Reference Manager Pro will be documented in this file.

## [0.3.1] - 2026-02-03

### Added
- 🧹 **MathML/HTML 标签自动清理**：DOI 返回的官方数据中的 XML 标签（如 `<mml:math>`, `<sub>`, `<sup>`）自动转换为 LaTeX 格式
- 🔍 **重复条目检测**：批量修复前自动检测重复的 key 和 DOI，在 Output 面板显示详细信息并提示用户
- 📚 **期刊缩写大幅扩展**：从 40+ 扩展到 **200+ 个期刊**，覆盖 APS、Nature、Optica、IOP、AIP、ACS、Elsevier、Springer、IEEE 等所有主流出版商

### Changed
- 🔑 **默认 Key 策略改为 `officialAlways`**：批量修复时始终使用官方标准 key 格式
- ⏱️ **超时时间增加到 8 秒**：提高官方元数据获取成功率
- 🏷️ **命令名称优化**：`Smart Fix All` 更名为 `Batch Official Fix (Smart Fix All)`

### Fixed
- 🔤 **Key 大小写标准化**：APS 期刊 key 自动标准化（如 `physrevlett` → `PhysRevLett`）
- 📖 **Title 中的数学公式正确转换**：`<mml:mi>Λ</mml:mi>` → `$\Lambda$`

### Technical Details
- `cleanXmlTags()` 函数处理 MathML、HTML 实体、下标/上标等
- `deriveKeyFromDoi()` 支持 12+ 出版商的标准 key 格式（新增 ACS、Science、Wiley、IEEE、arXiv）
- `DEFAULT_JOURNAL_ABBREVIATIONS` 扩展到 200+ 条目，基于 ISO 4 标准

## [0.3.0] - 2026-02-03

### Fixed
- 🔑 **批量官方修复大幅增强**：Citation Key 生成从仅支持 Physical Review 扩展到所有主流期刊（Nature, Optica, IOP, Elsevier, AIP, Springer 等），覆盖率从 ~10% 提升到 ~100%
- 📚 **期刊缩写完善**：从 2 个扩展到 40+ 个主流期刊的标准缩写（Physics, Nature, Science, Optics, Quantum, Materials, Nuclear 等领域）
- 🏷️ **旧 key 注释正确添加**：修复 key 替换后未添加 `% oldkey: xxx` 注释的问题
- 🔤 **标题保护词增强**：新增物理学专有名词（NOON, Hong-Ou-Mandel, Rydberg, CP, PT）自动保护

### Technical Details
- `deriveKeyFromDoi()` 支持 7+ 主流出版商的 DOI 格式解析
- `DEFAULT_JOURNAL_ABBREVIATIONS` 映射表正确应用到所有格式化流程
- 默认配置更新为完整的期刊缩写列表

## [0.2.9] - 2026-02-02

### Added
- 🔑 官方元数据 key 策略：保留/未使用时替换/始终替换（避免破坏已有引用）
- 🧾 key 替换时保留旧 key 注释（避免“找不到”）

### Changed
- 🧾 Smart Fix 在官方元数据不可用时明确提示原因

## [0.2.8] - 2026-02-02

### Added
- 🧰 Smart Fix All（批量）：自动使用 DOI 官方元数据并回退本地修复
- 🔎 校验新增重复 DOI/Key 检测，定位重复条目更可靠

## [0.2.7] - 2026-02-02

### Added
- 🏛️ Smart Fix 支持 DOI 官方元数据拉取并自动修复字段（保留原引用 key）

### Changed
- 🧾 变更摘要与 History 增加官方来源标识与可信度显示

## [0.2.6] - 2026-02-02

### Added
- ✨ Smart Fix 统一入口：自动在本地规则与 AI 之间选择，并在失败时安全降级
- ✅ 参考文献质量校验：可信度评分 + 精简输出（仅 error/warn）
- 🧾 变更历史与一键回滚：记录来源与可信度
- 🔍 Smart Fix 变更摘要：关键字段优先、前后值对比、来源标签

### Changed
- 🧩 命令与菜单收敛：高级功能统一归类，默认入口更简洁
- 🧠 文案统一与输出更专业：提示更少、信息更清晰

## [0.2.1] - 2026-01-18

### Changed
- 🚀 为旧版 VS Code 宿主提供 fetch polyfill，修复 Groq/Anthropic 请求在 Node 16 环境下失败的问题
- 🧹 重写本地格式化：解析后重排字段顺序、标准化作者/页码/DOI 输出，生成更专业的论文格式
- 🤖 AI 格式化结果经本地归一化，更新提示词以强调期刊缩写和字段顺序
- 🛑 去重增加条目上限提示，避免在超大 .bib 文件上卡死
- 📄 未找到 .tex 或无引用时直接提示，避免误删“未使用引用”

## [0.2.2] - 2026-01-28

### Changed
- 🔎 增加扩展宿主冒烟测试脚本（`npm run test:integration`），可自动跑通核心命令链路
- 🧾 关键命令增加 OutputChannel 日志，方便在用户环境快速定位“无响应/失败原因”

## [0.2.3] - 2026-01-28

### Added
- 🧼 一键批量本地格式化：新增命令 `Format All Entries (Local)`，可离线将整个 .bib 文件统一为规范学术格式

### Changed
- 🤖 批量 AI 格式化改为“安全写回”：基于条目索引重建内容，避免 replace 误替换；单条失败自动回退本地格式化，保证整体可用
- 📋 Pro 批量格式化提示支持一键切换到“本地批量格式化（免费）”

## [0.2.4] - 2026-01-28

### Changed
- ✅ 单条格式化真正“一键”：不选中也可执行（光标在条目内部即可）
- ⚡ 增加 onCommand 激活事件，避免语言模式/激活时机导致命令无响应

## [0.2.5] - 2026-01-28

### Added
- ⚙️ 本地格式化可配置：作者规范化开关、标题保护词、期刊缩写映射（Settings: `referenceManager.localFormat.*`）

### Changed
- 🤖 AI 格式化结果二次归一化时使用同一套本地配置，确保整库格式一致

## [0.2.0] - 2026-01-10

### Added
- Added Groq AI 支持与多模型选择
- 支持配置 Anthropic/Groq 提供商
- 文档更新与 Pro/Free 配额说明

## [0.1.0] - 2026-01-10

### Added
- 🤖 AI-powered BibTeX entry formatting using Claude API
- 🔍 Unused citation detection across workspace
- 🔄 Smart duplicate entry detection and removal
- 📝 Local offline formatting (rule-based, no API required)
- 💳 License system with Free and Pro tiers
- ⚡ Batch formatting for Pro users
- ⚙️ Configurable API settings (timeout, retries, model)

### Features by Tier

**Free Tier:**
- 5 AI format operations per day
- 3 unused citation scans per day
- Unlimited local formatting
- Unlimited duplicate detection

**Pro Tier:**
- Unlimited AI formatting
- Unlimited unused citation scans
- Batch format entire .bib files
- Priority support
