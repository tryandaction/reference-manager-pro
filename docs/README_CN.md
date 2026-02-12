# Reference Manager Pro - 用户指南

🎓 专业的 LaTeX 参考文献管理工具（Smart Fix + 官方元数据 + 可回滚）

---

## 目录

1. [产品简介](#产品简介)
2. [功能特性](#功能特性)
3. [安装指南](#安装指南)
4. [快速开始](#快速开始)
5. [详细功能说明](#详细功能说明)
6. [配置选项](#配置选项)
7. [免费版 vs Pro 版](#免费版-vs-pro-版)
8. [常见问题](#常见问题)
9. [故障排除](#故障排除)

---

## 产品简介

Reference Manager Pro 是面向学术研究人员、学生和论文作者的 VS Code / Kiro 扩展。它将“格式化”升级为“可信修复”：优先使用 DOI 官方元数据，必要时才启用 AI，且所有变更都有可信度与可回滚记录。

### 核心价值

- **官方对齐**：有 DOI 就拉取官方 BibTeX，避免“格式正确但内容不准”
- **低打扰**：Smart Fix 一键完成，复杂选项隐藏在高级设置
- **可信透明**：变更摘要 + 可信度评分 + 来源标签
- **可回滚**：任何自动修复都可一键撤回

---

## 功能特性

### ✨ Smart Fix（推荐）

一键修复单条 BibTeX：
- **优先**使用 DOI 官方元数据
- 没有 DOI 时回退到本地规则
- 可选 AI 增强（有 API Key 时自动启用）
- 输出变更摘要 + 可信度 + 来源标签
 - 需要保留官方原始排版时使用 `Advanced: Smart Fix (Official Raw)`

### 🧰 Smart Fix All（批量）

批量修复整份 .bib：
- 逐条拉取官方元数据（有 DOI）
- 自动回退本地修复
- 汇总官方/本地/失败统计
 - 需要保留官方原始排版时使用 `Advanced: Batch Official Fix (Raw)`

### ✅ 质量校验（Validate）

专业校验并打分：
- 缺失必填字段
- 年份/页码/DOI 格式异常
- **重复 DOI / 重复 Key**
- 输出简洁（只展示 error / warn）

### 🧾 变更历史（History）

完整变更记录：
- 显示来源（官方/AI/本地）
- 可信度评分
- 一键回滚

### 🔍 高级工具

- 未使用引用检测
- AI 重复条目检测与清理
- 批量格式化（Pro）
- 官方元数据可用性报告

---

## 安装指南

### 方式一：从 VSIX 文件安装

1. 下载 `reference-manager-pro-x.x.x.vsix`
2. 打开 VS Code / Kiro
3. `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）
4. 输入 "Install from VSIX"
5. 选择 .vsix 文件
6. 重新加载窗口

### 方式二：从 Marketplace 安装（即将上线）

1. 打开扩展面板（`Ctrl+Shift+X`）
2. 搜索 "Reference Manager Pro"
3. 点击安装

---

## 快速开始

### 无需 API Key（推荐）

1. 打开 .bib 文件  
2. 运行 `Reference Manager: Smart Fix`  
3. 如需批量：运行 `Advanced: Smart Fix All (Official)`  
4. 运行 `Validate References` 检查质量  

### 启用 AI 增强（可选）

推荐 Groq（免费、速度快）：

1. 访问 [console.groq.com](https://console.groq.com)
2. 获取 API Key
3. VS Code 设置中搜索 "Reference Manager"
4. `AI Provider` 选 `groq`
5. 填入 `Groq Api Key`

---

## 详细功能说明

### 命令列表（简化）

| 命令 | 说明 |
|------|------|
| Smart Fix | 单条一键修复 |
| Advanced: Smart Fix (Official Raw) | 官方原始格式（不做本地规范化） |
| Advanced: Smart Fix All (Official) | 批量官方修复 |
| Advanced: Batch Official Fix (Raw) | 批量官方原始格式 |
| Advanced: Official Metadata Report | 官方元数据可用性报告 |
| Validate References | 质量校验与评分 |
| History | 变更历史与回滚 |
| Advanced: Find Unused Citations | 未使用引用检测 |
| Advanced: Remove Duplicate Entries | AI 重复检测 |
| Advanced: Format Entry (Local/AI) | 传统格式化 |
| Advanced: Format All Entries (Pro) | 批量格式化 |

### 推荐流程

```
.bib → Smart Fix → Validate → (如有需要) History 回滚
```

---

## 配置选项

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| `referenceManager.aiProvider` | AI 提供商 | groq |
| `referenceManager.groqApiKey` | Groq API Key | 空 |
| `referenceManager.apiKey` | Anthropic API Key | 空 |
| `referenceManager.officialMetadata.enabled` | 启用 DOI 官方元数据 | true |
| `referenceManager.officialMetadata.timeout` | 官方元数据超时(ms) | 8000 |
| `referenceManager.officialMetadata.keyPolicy` | 引用 key 策略 | officialWhenUnused |
| `referenceManager.officialMetadata.formatMode` | 官方格式模式（normalized/raw） | normalized |
| `referenceManager.validation.strictness` | 校验严格度 | normal |

高级格式化设置（可选）：
`referenceManager.localFormat.*`

---

## 免费版 vs Pro 版

| 功能 | 免费版 | Pro 版 |
|------|--------|--------|
| Smart Fix（含官方元数据） | ✅ | ✅ |
| AI 增强次数 | 5/天 | ✅ 无限制 |
| Validate / History | ✅ | ✅ |
| 未使用引用检测 | 3/天 | ✅ 无限制 |
| 批量格式化 | ❌ | ✅ |

---

## 常见问题

### Q: 为什么 Smart Fix 没有“变正确”？

**A:** 没有 DOI 或官方元数据获取失败时，只能做本地规范化。建议先补 DOI，再 Smart Fix。

### Q: 官方 key 会不会替换我的引用 key？

**A:** 默认策略是“仅当 .tex 中未使用时才替换”（`officialWhenUnused`）。你可以在设置中改为始终保留或始终替换。
如果替换，会在条目第一行追加注释保留旧 key，避免“找不到”。

### Q: 为什么提示重复 DOI/Key？

**A:** 说明同一篇文献出现了多个条目。建议用 `Remove Duplicate Entries` 清理。

---

## 故障排除

### 官方元数据获取失败

可能原因：
- DOI 不存在或格式错误
- 网络超时
- 目标站点限制访问

解决方案：
- 检查 DOI 格式
- 增大 `officialMetadata.timeout`
- 临时关闭官方元数据拉取，仅做本地修复

---

## 技术支持

- 📧 邮箱：2812149844@qq.com
- 🐛 GitHub Issues：https://github.com/tryandaction/reference-manager-pro/issues

---

*Reference Manager Pro - 让参考文献管理更可信* 🎓
