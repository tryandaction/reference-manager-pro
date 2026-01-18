# Reference Manager Pro - 开发者文档

## 📋 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [开发环境设置](#开发环境设置)
4. [API 配置](#api-配置)
5. [核心模块说明](#核心模块说明)
6. [构建与发布](#构建与发布)
7. [测试](#测试)
8. [商业化](#商业化)

---

## 项目概述

Reference Manager Pro 是一个 VS Code / Kiro 扩展，用于管理 LaTeX 参考文献。

### 技术栈

- **语言**: TypeScript
- **运行环境**: VS Code Extension Host
- **AI 提供商**: Groq (免费) / Anthropic Claude (付费)
- **测试框架**: Vitest + fast-check (属性测试)
- **打包工具**: vsce

### 目录结构

```
reference-manager-pro/
├── src/
│   ├── extension.ts      # 扩展入口
│   ├── aiFormatter.ts    # AI 格式化 (Groq/Anthropic)
│   ├── localFormatter.ts # 本地格式化
│   ├── bibParser.ts      # BibTeX 解析器
│   ├── citationScanner.ts# 引用扫描器
│   ├── config.ts         # 配置管理
│   ├── license.ts        # 许可证验证
│   └── test/             # 测试文件
├── docs/
│   ├── README_CN.md      # 中文用户文档
│   ├── README_EN.md      # 英文用户文档
│   └── DEVELOPER.md      # 开发者文档 (本文件)
├── .env.local            # 私密配置 (不提交!)
├── package.json          # 扩展配置
└── tsconfig.json         # TypeScript 配置
```

---

## 技术架构

### AI 提供商支持

扩展支持两种 AI 提供商：

| 提供商 | 费用 | 速度 | 推荐场景 |
|--------|------|------|----------|
| **Groq** | 免费 | 极快 | 日常开发、测试 |
| **Anthropic** | 付费 | 中等 | 生产环境、高质量需求 |

### 配置优先级

```
用户 VS Code 设置 > 默认值
```

### 模块依赖关系

```
extension.ts
    ├── aiFormatter.ts ──→ config.ts
    ├── localFormatter.ts
    ├── bibParser.ts
    ├── citationScanner.ts ──→ bibParser.ts
    └── license.ts ──→ config.ts
```

---

## 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/your-username/reference-manager-pro.git
cd reference-manager-pro
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置私密文件

复制 `.env.local` 模板并填入你的 API Key：

```bash
# .env.local 已存在，直接编辑即可
# ⚠️ 此文件不会被提交到 Git
```

### 4. 在 VS Code 中配置

按 `Ctrl+,` 打开设置，搜索 `referenceManager`：

- **AI Provider**: 选择 `groq` (免费) 或 `anthropic`
- **Groq Api Key**: 填入 Groq API Key
- **Anthropic Api Key**: 填入 Anthropic API Key (如果使用)

### 5. 编译运行

```bash
# 编译
npm run compile

# 监听模式 (开发时使用)
npm run watch

# 按 F5 启动调试
```

---

## API 配置

### Groq API (推荐，免费)

1. 访问 https://console.groq.com
2. 注册/登录
3. 创建 API Key
4. 在 VS Code 设置中填入

**支持的模型**:
- `llama-3.3-70b-versatile` - 最强大，推荐
- `llama-3.1-8b-instant` - 更快速
- `mixtral-8x7b-32768` - 平衡性能
- `gemma2-9b-it` - Google 模型

**API 端点**: `https://api.groq.com/openai/v1/chat/completions`

**请求格式** (OpenAI 兼容):
```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 2048,
  "temperature": 0.1
}
```

### Anthropic API (付费)

1. 访问 https://console.anthropic.com
2. 注册/登录
3. 创建 API Key
4. 新账户有 $5 免费额度

**支持的模型**:
- `claude-sonnet-4-20250514` - 默认
- `claude-3-haiku-20240307` - 更便宜

---

## 核心模块说明

### aiFormatter.ts

AI 格式化模块，支持 Groq 和 Anthropic。

```typescript
// 关键类
export class AIFormatter {
  constructor(config: ExtensionConfig)
  formatBibEntry(rawEntry: string): Promise<string>
  formatBibEntries(entries: string[], onProgress?): Promise<string[]>
  checkDuplicate(entry1: string, entry2: string): Promise<DuplicateCheckResult>
}

// 错误类型
export enum AIErrorType {
  INVALID_API_KEY,
  NETWORK_ERROR,
  TIMEOUT,
  API_ERROR,
  PARSE_ERROR,
  RATE_LIMIT,
  UNKNOWN
}
```

### config.ts

配置管理模块。

```typescript
export interface ExtensionConfig {
  aiProvider: 'anthropic' | 'groq';
  apiKey: string;           // Anthropic
  groqApiKey: string;       // Groq
  maxRetries: number;
  timeout: number;
  model: string;            // Anthropic 模型
  groqModel: string;        // Groq 模型
}

export function getConfig(): ExtensionConfig
export function validateApiKey(apiKey: string): boolean
export async function ensureConfigured(): Promise<boolean>
```

### localFormatter.ts

本地格式化模块，不需要 API。

```typescript
export function formatBibEntryLocal(entry: string): string
```

功能：
- 修复字段名拼写错误 (autor → author)
- 标准化字段顺序
- 清理空白字符
- 统一缩进

### bibParser.ts

BibTeX 解析器。

```typescript
export interface BibEntry {
  type: string;
  key: string;
  fields: Map<string, string>;
  raw: string;
}

export function parseBibFile(content: string): BibEntry[]
export function parseSingleEntry(text: string): BibEntry | null
```

### license.ts

许可证验证模块。

```typescript
export interface LicenseInfo {
  isValid: boolean;
  isPro: boolean;
  expiresAt?: Date;
}

export function validateLicense(key: string): LicenseInfo
export function checkUsageLimit(feature: string): boolean
```

---

## 构建与发布

### 本地构建

```bash
# 编译 TypeScript
npm run compile

# 运行测试
npm test

# 打包 VSIX
npm run package
```

### 发布到 Marketplace

```bash
# 需要先配置 VSCE_PAT
npm run publish
```

### 版本更新流程

1. 更新 `package.json` 中的 version
2. 更新 `CHANGELOG.md`
3. 运行测试确保通过
4. 打包并测试 VSIX
5. 发布

---

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

### 测试结构

```
src/test/
├── unit/           # 单元测试
│   ├── aiFormatter.test.ts
│   ├── bibParser.test.ts
│   ├── citationScanner.test.ts
│   ├── config.test.ts
│   ├── license.test.ts
│   └── localFormatter.test.ts
└── property/       # 属性测试 (fast-check)
    ├── generators.ts
    ├── bibParser.property.test.ts
    └── ...
```

---

## 商业化

### 定价模型

| 版本 | 价格 | 功能限制 |
|------|------|----------|
| Free | $0 | AI 格式化 5次/天，查找未使用 3次/天 |
| Pro | $9.99 一次性 | 无限制 |

### License Key 格式

```
RMP-XXXX-XXXX-XXXX-XXXX
```

验证逻辑在 `license.ts` 中实现。

### Gumroad 集成

产品页面: https://gumroad.com/l/reference-manager-pro

---

## 重要提醒

### 🔐 安全

- **永远不要**提交 `.env.local` 文件
- **永远不要**在代码中硬编码 API Key
- 定期轮换 API Key

### 📝 代码规范

- 使用 ESLint 检查代码
- 所有公共函数需要 JSDoc 注释
- 测试覆盖率目标 > 80%

### 🚀 性能

- API 调用使用指数退避重试
- 批量操作显示进度
- 超时控制防止卡死

---

## 联系方式

- 项目仓库: https://github.com/your-username/reference-manager-pro
- 问题反馈: GitHub Issues
- 邮箱: support@example.com

---

*最后更新: 2026-01-10*
