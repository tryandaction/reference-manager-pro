# Reference Manager Pro - 用户指南

🎓 AI 驱动的 LaTeX 参考文献管理工具

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

Reference Manager Pro 是一款专为学术研究人员、学生和论文作者设计的 VS Code / Kiro 扩展。它利用 AI 技术简化 BibTeX 参考文献的管理工作，让您专注于研究本身。

### 适用人群

- 📚 撰写学术论文的研究人员
- 🎓 正在写毕业论文的学生
- 📝 需要管理大量参考文献的作者
- 🔬 使用 LaTeX 排版的科研工作者

### 核心价值

- **节省时间**：自动格式化杂乱的 BibTeX 条目
- **保持整洁**：检测并清理未使用的引用
- **避免重复**：智能识别重复条目（如 arXiv 预印本和正式发表版）
- **离线可用**：本地格式化功能无需网络

---

## 功能特性

### 🤖 AI 智能格式化

使用 Claude AI 规范化 BibTeX 条目：
- 统一作者姓名格式（Last, First and Last, First）
- 标准化期刊缩写（如 Physical Review Letters → Phys. Rev. Lett.）
- 自动补全 DOI（如果可推断）
- 规范页码格式（123--456）
- 清理多余空格和换行

### 📝 本地格式化（免费无限制）

不需要 API Key 的离线格式化功能：
- 修复常见字段名拼写错误（如 autor → author）
- 按标准顺序排列字段
- 清理多余空白字符
- 统一缩进格式

### 🔍 未使用引用检测

扫描整个 LaTeX 项目，找出 .bib 文件中未被引用的条目：
- 支持多种引用命令（\cite, \citep, \citet 等）
- 支持 natbib 和 biblatex
- 一键删除未使用条目
- 显示详细统计信息

### 🔄 智能重复检测

使用 AI 识别重复条目：
- 检测 arXiv 预印本和正式发表版本
- 识别格式不同但内容相同的条目
- AI 推荐保留哪个版本
- 提供判断理由

### 📦 批量格式化（Pro 功能）

一次性格式化整个 .bib 文件中的所有条目：
- 显示实时进度
- 支持取消操作
- 失败条目保留原文
- 显示处理统计

---

## 安装指南

### 方式一：从 VSIX 文件安装

1. 下载 `reference-manager-pro-x.x.x.vsix` 文件
2. 打开 VS Code 或 Kiro
3. 按 `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）
4. 输入 "Install from VSIX"
5. 选择下载的 .vsix 文件
6. 重新加载窗口

### 方式二：从 Marketplace 安装（即将上线）

1. 打开 VS Code 扩展面板（`Ctrl+Shift+X`）
2. 搜索 "Reference Manager Pro"
3. 点击安装

### 系统要求

- VS Code 1.85.0 或更高版本
- 或 Kiro IDE
- （可选）Anthropic API Key（用于 AI 功能）

---

## 快速开始

### 无需 API Key 的功能

即使没有 Anthropic API Key，您也可以使用以下功能：

1. **本地格式化**
   - 打开 .bib 文件
   - 选中要格式化的条目
   - 按 `Ctrl+Shift+P`
   - 输入 "Reference Manager: Format BibTeX Entry (Local)"
   - 完成！

2. **移除重复条目**（基础功能）
   - 打开 .bib 文件
   - 运行 "Reference Manager: Remove Duplicate Entries"

### 配置 API Key（启用 AI 功能）

1. 访问 [console.anthropic.com](https://console.anthropic.com)
2. 注册账号并获取 API Key
3. 在 VS Code 中按 `Ctrl+,` 打开设置
4. 搜索 "Reference Manager"
5. 在 `Api Key` 字段输入您的 API Key

### 基本使用流程

```
1. 打开您的 LaTeX 项目
2. 打开 .bib 文件
3. 选中需要格式化的条目
4. Ctrl+Shift+P → "Format BibTeX Entry"
5. 查看格式化结果
```

---

## 详细功能说明

### 命令列表

| 命令 | 说明 | 需要 API Key |
|------|------|-------------|
| Format BibTeX Entry | AI 智能格式化选中条目 | ✅ |
| Format BibTeX Entry (Local) | 本地规则格式化 | ❌ |
| Find Unused Citations | 查找未使用的引用 | ✅ |
| Remove Duplicate Entries | 检测并移除重复条目 | ✅ |
| Format All Entries (Pro) | 批量格式化所有条目 | ✅ |
| Activate License | 激活 Pro 许可证 | ❌ |
| View License Status | 查看许可证状态 | ❌ |

### AI 格式化示例

**格式化前：**
```bibtex
@article{einstein,
author={A. Einstein},
title={On the Electrodynamics of Moving Bodies},
journal={Annalen der Physik},
year=1905,
volume={17},
pages={891-921}
}
```

**格式化后：**
```bibtex
@article{einstein,
  author = {Einstein, Albert},
  title = {On the Electrodynamics of Moving Bodies},
  journal = {Ann. Phys.},
  year = {1905},
  volume = {17},
  pages = {891--921},
  doi = {10.1002/andp.19053221004}
}
```

### 本地格式化示例

**格式化前：**
```bibtex
@article{key,
autor={John Smith},
  tilte={Some Paper},
year={2024},
journal={Nature}
}
```

**格式化后：**
```bibtex
@article{key,
  author = {John Smith},
  title = {Some Paper},
  journal = {Nature},
  year = {2024},
}
```

### 支持的引用命令

本扩展支持以下 LaTeX 引用命令：

- 标准：`\cite`
- natbib：`\citep`, `\citet`, `\citeauthor`, `\citeyear`, `\citealt`, `\citealp`
- biblatex：`\parencite`, `\textcite`, `\autocite`, `\footcite`, `\fullcite`
- 其他：`\nocite`, `\Cite`, `\Citep`, `\Citet`

---

## 配置选项

在 VS Code 设置中搜索 "Reference Manager" 可以找到以下配置：

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| `referenceManager.apiKey` | Anthropic API Key | 空 |
| `referenceManager.licenseKey` | Pro 许可证密钥 | 空 |
| `referenceManager.maxRetries` | API 请求最大重试次数 | 3 |
| `referenceManager.timeout` | API 请求超时时间（毫秒） | 30000 |
| `referenceManager.model` | 使用的 Claude 模型 | claude-sonnet-4-20250514 |

---

## 免费版 vs Pro 版

| 功能 | 免费版 | Pro 版 |
|------|--------|--------|
| AI 格式化 | 每天 5 次 | ✅ 无限制 |
| 查找未使用引用 | 每天 3 次 | ✅ 无限制 |
| 移除重复条目 | ✅ | ✅ |
| 本地格式化 | ✅ 无限制 | ✅ 无限制 |
| 批量格式化 | ❌ | ✅ |

### 升级到 Pro 版

1. 访问 [Gumroad 购买页面](https://gumroad.com/l/reference-manager-pro)
2. 完成购买获取 License Key
3. 在 VS Code 中运行 "Reference Manager: Activate License"
4. 输入您的 License Key
5. 享受无限制使用！

---

## 常见问题

### Q: 没有 Anthropic API Key 能用吗？

**A:** 可以！本地格式化功能完全免费且无需 API Key。它可以：
- 修复字段名拼写错误
- 标准化字段顺序
- 清理格式

AI 功能（智能格式化、未使用引用检测、重复检测）需要 API Key。

### Q: API Key 收费吗？

**A:** Anthropic 提供免费额度，对于个人使用通常足够。访问 [console.anthropic.com](https://console.anthropic.com) 了解详情。

### Q: 免费版每天的使用次数什么时候重置？

**A:** 每天 UTC 0:00（北京时间 8:00）自动重置。

### Q: Pro 版 License Key 格式是什么？

**A:** License Key 以 "RMP-" 开头，至少 20 个字符。例如：`RMP-XXXX-XXXX-XXXX-XXXX`

### Q: 支持哪些 BibTeX 条目类型？

**A:** 支持所有标准类型：
- @article
- @book
- @inproceedings
- @conference
- @phdthesis
- @mastersthesis
- @techreport
- @misc
- 等等

### Q: 可以在 Kiro 中使用吗？

**A:** 可以！本扩展完全兼容 Kiro IDE。

---

## 故障排除

### 问题：API 调用失败

**可能原因和解决方案：**

1. **API Key 无效**
   - 检查设置中的 API Key 是否正确
   - 确认 Key 没有过期

2. **网络问题**
   - 检查网络连接
   - 如果使用代理，确保配置正确

3. **请求超时**
   - 在设置中增加 `timeout` 值
   - 检查网络稳定性

4. **速率限制**
   - 等待几分钟后重试
   - 考虑升级 API 配额

### 问题：格式化结果不理想

**解决方案：**
- 确保选中了完整的 BibTeX 条目
- 检查原始条目是否有严重的格式错误
- 尝试使用本地格式化先清理基本格式

### 问题：未检测到 .tex 文件中的引用

**可能原因：**
- .tex 文件不在工作区内
- 使用了不支持的引用命令
- 文件编码问题

### 问题：扩展未激活

**解决方案：**
1. 确保打开了 .bib 或 .tex 文件
2. 检查扩展是否已启用
3. 重新加载 VS Code 窗口

---

## 技术支持

- 📧 邮箱：support@example.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/your-username/reference-manager-pro/issues)
- 📖 更新日志：查看 CHANGELOG.md

---

## 许可证

MIT License - 详见 LICENSE 文件

---

*Reference Manager Pro - 让参考文献管理变得简单* 🎓
