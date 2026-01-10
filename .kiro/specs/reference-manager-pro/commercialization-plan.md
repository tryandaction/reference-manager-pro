# Reference Manager Pro 商业化规划

## 项目现状分析

### ✅ 已完成的核心功能
1. **智能格式化** - AI 驱动的 BibTeX 条目格式化
2. **未使用引用检测** - 扫描 .tex 文件找出未使用的引用
3. **智能去重** - AI 识别重复条目（如 arXiv vs 正式发表版）
4. **配置管理** - API Key、超时、重试等设置

### 📊 技术栈
- VS Code Extension API
- TypeScript
- Anthropic Claude API
- fast-check (属性测试)
- 88 个测试全部通过

---

## 第一部分：功能优化与付费分层

### 免费版功能 (Free Tier)
| 功能 | 限制 |
|------|------|
| BibTeX 格式化 | 每天 5 次 |
| 未使用引用检测 | 每天 3 次 |
| 智能去重 | ❌ 不可用 |
| 本地格式化（无AI） | ✅ 无限制 |

### 付费版功能 (Pro - $4.99/月 或 $39.99/年)
| 功能 | 限制 |
|------|------|
| AI 格式化 | 无限制 |
| 未使用引用检测 | 无限制 |
| 智能去重 | ✅ 完整功能 |
| 批量格式化 | ✅ 一键格式化整个 .bib 文件 |
| 自定义格式模板 | ✅ 保存常用格式 |
| 优先支持 | ✅ 24小时内响应 |

### 新增功能建议（提升付费价值）

#### 1. 批量格式化 (Batch Format) - 高价值
```
用户痛点：一个个选中条目太慢
解决方案：一键格式化整个 .bib 文件
实现难度：⭐⭐ (中等)
```

#### 2. DOI 自动补全 - 高价值
```
用户痛点：手动查找 DOI 很麻烦
解决方案：根据标题/作者自动查找并补全 DOI
实现难度：⭐⭐⭐ (需要集成 CrossRef API)
```

#### 3. 引用格式导出 - 中等价值
```
用户痛点：不同期刊要求不同格式
解决方案：一键转换为 APA/MLA/Chicago 等格式
实现难度：⭐⭐ (中等)
```

#### 4. 本地离线模式 - 差异化
```
用户痛点：没网络时无法使用
解决方案：基于规则的本地格式化（无AI）
实现难度：⭐ (简单)
```

---

## 第二部分：付费系统实现方案

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Gumroad** | 简单、支持中国收款 | 手续费较高(8.5%+30¢) | ⭐⭐⭐⭐ |
| **LemonSqueezy** | 专为软件设计、处理税务 | 需要验证身份 | ⭐⭐⭐⭐⭐ |
| **Paddle** | 专业、处理全球税务 | 门槛较高 | ⭐⭐⭐ |
| **自建 Stripe** | 手续费低(2.9%) | 需要自己处理税务 | ⭐⭐ |

### 推荐方案：LemonSqueezy + License Key

```
流程：
1. 用户在 LemonSqueezy 购买 → 获得 License Key
2. 在 VS Code 插件中输入 License Key
3. 插件验证 License Key → 解锁 Pro 功能
```

### 技术实现要点

```typescript
// 新增 license.ts 模块
interface LicenseInfo {
    key: string;
    email: string;
    plan: 'free' | 'pro';
    expiresAt: Date | null;
    usageToday: {
        format: number;
        findUnused: number;
    };
}

// 使用限制检查
async function checkUsageLimit(feature: string): Promise<boolean> {
    const license = await getLicenseInfo();
    if (license.plan === 'pro') return true;
    
    const limits = { format: 5, findUnused: 3 };
    return license.usageToday[feature] < limits[feature];
}
```

---

## 第三部分：冷启动与推广策略

### 目标用户画像
- 物理/工程/计算机科学研究生
- 使用 LaTeX 写论文
- 有一定技术背景
- 愿意为效率工具付费

### 推广渠道与策略

#### 1. Reddit (最重要)
| 子版块 | 策略 | 预期效果 |
|--------|------|----------|
| r/LaTeX | 分享"我如何用AI整理乱糟糟的bib文件"教程 | 高 |
| r/GradSchool | "论文写作效率工具分享" | 中 |
| r/PhD | 同上 | 中 |
| r/Physics | 针对物理学生的痛点 | 高 |

**钩子内容示例：**
```
标题：I built a VS Code extension that uses AI to clean up messy BibTeX files

正文：
As a physics grad student, I was tired of:
- Inconsistent author formats (some "First Last", some "Last, First")
- Duplicate entries (arXiv preprint + published version)
- Unused citations cluttering my .bib file

So I built Reference Manager Pro...

[截图展示效果]

Free to try, feedback welcome!
```

#### 2. 知乎/小红书 (中文市场)
- 知乎：回答"LaTeX 有哪些好用的工具"类问题
- 小红书：发布"科研人必备VS Code插件"

#### 3. VS Code Marketplace
- 优化关键词：latex, bibtex, bibliography, reference, citation, ai
- 添加 GIF 演示
- 收集好评

#### 4. 学术社区
- Overleaf 论坛
- TeX Stack Exchange
- 各大学 LaTeX 用户群

### 推广时间线

```
第1周：准备推广素材
- 录制 GIF 演示
- 写好 Reddit 帖子
- 准备中英文介绍

第2周：软启动
- 发布到 VS Code Marketplace
- 在 r/LaTeX 发帖
- 收集反馈

第3-4周：迭代优化
- 根据反馈修复 bug
- 添加用户请求的功能
- 在更多渠道推广
```

---

## 第四部分：开发时间表

### 寒假期间 (现在 - 开学前)

| 周次 | 任务 | 产出 |
|------|------|------|
| 第1周 | 实现使用限制系统 | license.ts 模块 |
| 第1周 | 集成 LemonSqueezy | 付费流程打通 |
| 第2周 | 实现批量格式化功能 | 新命令 |
| 第2周 | 添加本地离线格式化 | 免费功能增强 |
| 第3周 | 优化 Marketplace 页面 | README、截图、GIF |
| 第3周 | Reddit 软启动 | 第一批用户 |
| 第4周 | 收集反馈、修复 bug | 稳定版本 |

### 大三下学期 (2-6月)

| 月份 | 任务 |
|------|------|
| 2月 | 持续推广、收集反馈 |
| 3月 | 添加 DOI 自动补全功能 |
| 4月 | 添加引用格式导出功能 |
| 5月 | 优化、准备 1.0 正式版 |
| 6月 | 发布 1.0、总结数据 |

---

## 第五部分：留学申请包装

### SOP 故事线

```
问题识别 → 技术方案 → 产品开发 → 用户验证 → 商业化

"During my junior year, I noticed a common pain point among researchers: 
managing messy BibTeX files. I developed Reference Manager Pro, a VS Code 
extension that uses AI to automate bibliography formatting. The project 
taught me to identify real problems, design technical solutions, and 
validate them with users. This experience reinforced my interest in 
applying computational methods to solve practical problems in physics 
research."
```

### 可量化的成果（目标）
- VS Code Marketplace 下载量：1000+
- 付费用户：50+
- GitHub Stars：100+
- 用户好评：4.5+ 星

### 与物理/工程申请的结合点
1. **问题解决能力** - 识别科研工作流中的痛点
2. **技术应用能力** - 将 AI 应用于实际问题
3. **产品思维** - 从用户需求出发设计功能
4. **自驱力** - 在课业之外主动创造价值

---

## 下一步行动

### 立即开始 (本周)
1. [ ] 创建 LemonSqueezy 账户
2. [ ] 设计 License Key 验证系统
3. [ ] 实现使用次数限制

### 短期目标 (2周内)
1. [ ] 完成付费系统集成
2. [ ] 实现批量格式化功能
3. [ ] 发布到 VS Code Marketplace

### 中期目标 (1个月内)
1. [ ] Reddit 推广获得 100+ 下载
2. [ ] 获得第一个付费用户
3. [ ] 收集用户反馈并迭代
