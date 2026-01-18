# Reference Manager Pro - 零成本开发路线图

> **本文档专为 AI 辅助开发设计**  
> 将每个任务直接复制给 AI（如 Claude、GPT-4），AI 会按照指示完成开发

---

## 📋 使用说明

### 如何使用本文档
1. **按顺序执行**：从阶段 1 开始，逐个完成任务
2. **复制任务给 AI**：将 `[AI 提示]` 部分完整复制给 AI
3. **验证结果**：按照 `[验证清单]` 检查 AI 的输出
4. **标记完成**：在任务前打勾 ✅

### AI 工具推荐（全部免费）
- **Claude 3.5 Sonnet**（推荐）- 代码质量最好
- **ChatGPT 4o-mini** - 速度快
- **Gemini 2.0 Flash** - 免费额度大
- **Windsurf/Cursor** - 本地 IDE 集成

---

## 🎯 开发目标

**核心原则**：零成本、快速上线、逐步迭代

### 当前状态
- ✅ 核心功能已完成（90%）
- ✅ 测试覆盖完整（105 个测试）
- ⚠️ 缺少商业化基础设施
- ⚠️ 缺少市场材料

### 最终目标
- 发布到 VS Code Marketplace（免费）
- 建立用户基础（1000+ 下载）
- 实现收入（$500+/月）

---

## 阶段 1：发布前准备（零成本）

### 任务 1.1：创建插件图标

**优先级**：🔴 高  
**预计时间**：30 分钟  
**成本**：$0

#### [AI 提示]
```
我需要为 VS Code 插件创建一个图标。插件名称是 "Reference Manager Pro"，是一个 LaTeX 文献管理工具。

要求：
1. 使用 SVG 格式
2. 尺寸：128x128px
3. 设计元素：书籍/引用符号/AI 元素
4. 颜色：专业的学术风格（蓝色或深色系）
5. 简洁现代

请生成 SVG 代码，我可以直接保存为 icon.svg 文件。
同时生成 PNG 版本的转换命令。
```

#### [验证清单]
- [ ] 生成了 `images/icon.svg` 文件
- [ ] 图标在白色和深色背景下都清晰可见
- [ ] 尺寸正确（128x128px）

#### [后续操作]
```bash
# 创建目录
mkdir images

# 将 AI 生成的 SVG 保存为 images/icon.svg
# 使用在线工具转换为 PNG：https://cloudconvert.com/svg-to-png
# 或使用命令（需要 ImageMagick）：
# convert images/icon.svg -resize 128x128 images/icon.png
```

---

### 任务 1.2：添加演示 GIF

**优先级**：🔴 高  
**预计时间**：1 小时  
**成本**：$0

#### [AI 提示]
```
我需要为 VS Code 插件的 README 创建演示内容。

请帮我：
1. 编写一个脚本，列出需要录制的演示场景（3-5 个核心功能）
2. 为每个场景编写详细的操作步骤
3. 生成 README 中展示 GIF 的 Markdown 代码

插件功能：
- AI 格式化 BibTeX 条目
- 本地格式化（无需 API）
- 查找未使用的引用
- 智能去重

目标用户：LaTeX 论文写作者、研究生、学者
```

#### [验证清单]
- [ ] 有详细的录制脚本
- [ ] 每个场景有清晰的步骤说明

#### [工具推荐]（免费）
- **ScreenToGif**（Windows）
- **LICEcap**（Mac/Windows）
- **Peek**（Linux）

#### [录制后操作]
```markdown
# 将 GIF 保存到 images/ 目录
# 在 README.md 中添加：

## 功能演示

### AI 格式化
![AI Format Demo](images/demo-ai-format.gif)

### 查找未使用引用
![Find Unused Demo](images/demo-find-unused.gif)
```

---

### 任务 1.3：完善 package.json

**优先级**：🔴 高  
**预计时间**：15 分钟  
**成本**：$0

#### [AI 提示]
```
请帮我完善 VS Code 插件的 package.json 文件，添加发布到 Marketplace 所需的字段。

当前 package.json 路径：c:\universe\software development\reference-manager-pro\package.json

需要添加/修改：
1. icon 路径
2. galleryBanner 配置（深色主题，专业配色）
3. badges（GitHub stars、下载量等）
4. 完善 keywords（添加更多相关关键词以提高搜索排名）
5. 添加 homepage 和 bugs URL
6. 修正 repository URL 为：https://github.com/tryandaction/reference-manager-pro

请生成完整的 package.json 修改内容。
```

#### [验证清单]
- [ ] `icon` 字段指向正确路径
- [ ] `galleryBanner` 配置完整
- [ ] `repository.url` 正确
- [ ] `keywords` 包含至少 15 个相关词

---

### 任务 1.4：创建欢迎页面

**优先级**：🟡 中  
**预计时间**：1 小时  
**成本**：$0

#### [AI 提示]
```
我需要为 VS Code 插件创建一个首次安装后的欢迎页面。

要求：
1. 使用 VS Code Webview API
2. 页面内容：
   - 欢迎标题
   - 快速入门步骤（3-5 步）
   - 配置 Groq API Key 的引导
   - 功能介绍卡片
   - 常见问题链接
3. 样式：使用 VS Code 主题颜色，响应式设计
4. 只在首次安装时显示（使用 globalState 存储）

请生成：
1. src/webview/welcome.ts - Webview 控制器
2. src/webview/welcome.html - HTML 模板
3. 在 extension.ts 中集成的代码

参考现有代码结构：c:\universe\software development\reference-manager-pro\src\extension.ts
```

#### [验证清单]
- [ ] 首次安装显示欢迎页
- [ ] 页面样式与 VS Code 主题一致
- [ ] 可以关闭并不再显示
- [ ] 有"再次显示"的命令

---

### 任务 1.5：改进错误提示

**优先级**：🟡 中  
**预计时间**：30 分钟  
**成本**：$0

#### [AI 提示]
```
请改进插件的错误提示，使其更友好和可操作。

当前错误处理代码在：
- src/extension.ts
- src/aiFormatter.ts
- src/config.ts

改进要求：
1. 所有错误提示改为中英文双语（中文为主，英文括号补充）
2. 添加可点击的"帮助"按钮，链接到文档
3. 常见错误添加解决方案提示
4. API 错误显示更详细的诊断信息

示例：
错误："API Key 无效"
改进："API Key 无效 (Invalid API Key)。请检查：
1. Key 是否正确复制（不含空格）
2. 是否选择了正确的 AI 提供商
[打开设置] [查看帮助]"

请生成改进后的代码。
```

#### [验证清单]
- [ ] 所有错误提示都是中英文
- [ ] 有可点击的操作按钮
- [ ] 错误信息包含解决建议

---

## 阶段 2：零成本 License 系统

### 任务 2.1：实现简单的 License 验证

**优先级**：🔴 高  
**预计时间**：2 小时  
**成本**：$0

#### [AI 提示]
```
我需要实现一个零成本的 License 验证系统，不依赖后端服务器。

要求：
1. 使用 HMAC-SHA256 签名算法
2. License Key 格式：RMP-[用户ID]-[过期时间戳]-[签名]
3. 密钥硬编码在代码中（混淆处理）
4. 支持离线验证
5. 添加基本的防篡改检查

请修改：
- src/license.ts - 添加真实的验证逻辑
- 生成 License Key 的 Node.js 脚本（scripts/generate-license.js）

安全说明：
- 这是低成本方案，不是完全防破解
- 适合初期使用，后期可升级到在线验证

请生成完整代码。
```

#### [验证清单]
- [ ] License Key 可以正确验证
- [ ] 过期的 Key 会被拒绝
- [ ] 有生成 Key 的脚本
- [ ] 验证逻辑在 license.ts 中

---

### 任务 2.2：创建 License 生成工具

**优先级**：🟡 中  
**预计时间**：30 分钟  
**成本**：$0

#### [AI 提示]
```
基于上一个任务的 License 验证系统，创建一个命令行工具用于生成 License Key。

要求：
1. 脚本路径：scripts/generate-license.js
2. 交互式输入：
   - 用户邮箱
   - 有效期（天数）
   - 备注信息
3. 输出格式化的 License Key
4. 保存记录到 licenses.json（不提交到 Git）

使用方法：
```bash
node scripts/generate-license.js
```

请生成完整的脚本代码，并更新 .gitignore 忽略 licenses.json。
```

#### [验证清单]
- [ ] 脚本可以运行
- [ ] 生成的 Key 可以通过验证
- [ ] licenses.json 在 .gitignore 中

---

## 阶段 3：市场材料准备

### 任务 3.1：优化 README

**优先级**：🔴 高  
**预计时间**：1 小时  
**成本**：$0

#### [AI 提示]
```
请优化 README.md，使其更吸引人，提高 VS Code Marketplace 的转化率。

当前 README：c:\universe\software development\reference-manager-pro\README.md

优化要求：
1. 添加吸引人的标题和副标题
2. 在顶部添加徽章（GitHub stars、下载量、版本等）
3. 添加"为什么选择我们"部分
4. 添加用户评价（可以先用假数据占位）
5. 添加对比表格（与其他工具对比）
6. 优化排版，使用更多视觉元素
7. 添加 FAQ 部分
8. 添加贡献指南链接

参考优秀插件的 README 风格。
请生成完整的新 README.md。
```

#### [验证清单]
- [ ] 有吸引人的开头
- [ ] 有徽章显示
- [ ] 有对比表格
- [ ] 有 FAQ 部分
- [ ] 排版美观

---

### 任务 3.2：创建 CHANGELOG

**优先级**：🟡 中  
**预计时间**：20 分钟  
**成本**：$0

#### [AI 提示]
```
请完善 CHANGELOG.md，添加更详细的版本历史。

当前文件：c:\universe\software development\reference-manager-pro\CHANGELOG.md

要求：
1. 遵循 Keep a Changelog 格式
2. 为 v0.2.0 添加详细的更新内容
3. 规划 v0.3.0 的功能（作为 Unreleased）
4. 添加链接到 GitHub releases
5. 添加升级指南

请生成完整的 CHANGELOG.md。
```

#### [验证清单]
- [ ] 格式符合标准
- [ ] 每个版本有详细说明
- [ ] 有未来版本规划

---

### 任务 3.3：创建贡献指南

**优先级**：🟢 低  
**预计时间**：30 分钟  
**成本**：$0

#### [AI 提示]
```
创建 CONTRIBUTING.md 文件，鼓励开源贡献。

要求：
1. 欢迎语
2. 如何报告 Bug
3. 如何提交功能请求
4. 代码贡献流程
5. 开发环境设置
6. 测试要求
7. 代码规范
8. Pull Request 模板

请生成完整的 CONTRIBUTING.md。
```

#### [验证清单]
- [ ] 文件创建完成
- [ ] 内容清晰易懂
- [ ] 有具体的操作步骤

---

## 阶段 4：发布到 Marketplace

### 任务 4.1：注册 Publisher 账号

**优先级**：🔴 高  
**预计时间**：30 分钟  
**成本**：$0

#### [手动操作步骤]
1. 访问 https://marketplace.visualstudio.com/manage
2. 使用 Microsoft 账号登录（没有则免费注册）
3. 创建 Publisher：
   - Publisher ID：选择一个唯一的 ID（如 `tryandaction`）
   - Display Name：`TryAndAction` 或你的名字
   - 描述：简短介绍
4. 记录 Publisher ID

#### [AI 提示]
```
我已经注册了 VS Code Marketplace Publisher 账号。

Publisher ID: [你的 ID]
Display Name: [你的名字]

请帮我：
1. 更新 package.json 中的 publisher 字段
2. 生成 Personal Access Token (PAT) 的获取步骤文档
3. 创建发布脚本 scripts/publish.sh

请生成相关代码和文档。
```

#### [验证清单]
- [ ] Publisher 账号创建成功
- [ ] package.json 中 publisher 字段正确
- [ ] 有 PAT 获取文档

---

### 任务 4.2：首次发布

**优先级**：🔴 高  
**预计时间**：30 分钟  
**成本**：$0

#### [AI 提示]
```
请帮我准备首次发布到 VS Code Marketplace 的完整流程。

要求：
1. 创建发布前检查清单
2. 生成发布命令脚本
3. 创建发布后验证步骤
4. 准备回滚方案（如果有问题）

当前版本：0.2.0

请生成：
- scripts/pre-publish-check.js - 发布前自动检查
- scripts/publish.sh - 发布脚本
- PUBLISHING.md - 发布流程文档
```

#### [验证清单]
- [ ] 所有检查项通过
- [ ] 插件成功发布
- [ ] 在 Marketplace 可以搜索到
- [ ] 可以正常安装

---

## 阶段 5：用户增长（零成本）

### 任务 5.1：创建社交媒体内容

**优先级**：🟡 中  
**预计时间**：2 小时  
**成本**：$0

#### [AI 提示]
```
我需要在社交媒体推广插件，请帮我准备内容。

目标平台：
1. Reddit (r/LaTeX, r/vscode, r/PhD)
2. Twitter/X
3. 知乎（LaTeX 话题）
4. 小红书（学术工具分享）

请为每个平台生成：
1. 发布文案（3 个版本，A/B 测试）
2. 配图建议
3. 最佳发布时间
4. 互动回复模板

要求：
- 真诚不夸张
- 突出免费和易用
- 包含使用场景
- 有行动号召（CTA）

请生成 MARKETING.md 文档。
```

#### [验证清单]
- [ ] 有各平台的文案
- [ ] 文案符合平台风格
- [ ] 有发布时间建议

---

### 任务 5.2：创建 Landing Page

**优先级**：🟢 低  
**预计时间**：3 小时  
**成本**：$0（使用 GitHub Pages）

#### [AI 提示]
```
使用 GitHub Pages 创建一个免费的产品 Landing Page。

要求：
1. 单页设计，响应式
2. 使用纯 HTML/CSS/JS（无需构建工具）
3. 包含：
   - Hero 区域（标题、副标题、CTA）
   - 功能介绍（3-4 个核心功能）
   - 演示视频/GIF
   - 用户评价
   - FAQ
   - 下载按钮
4. 集成 Google Analytics（免费）
5. SEO 优化

请生成：
- docs/index.html
- docs/style.css
- docs/script.js
- 配置 GitHub Pages 的步骤文档

设计风格：现代、学术、专业
```

#### [验证清单]
- [ ] 页面在 GitHub Pages 上线
- [ ] 移动端显示正常
- [ ] 所有链接有效
- [ ] Google Analytics 工作

---

## 阶段 6：收入实现（低成本）

### 任务 6.1：设置 Gumroad 产品

**优先级**：🔴 高  
**预计时间**：1 小时  
**成本**：$0（Gumroad 免费，仅收取交易费）

#### [手动操作步骤]
1. 注册 Gumroad 账号：https://gumroad.com
2. 创建产品：
   - 名称：Reference Manager Pro - Lifetime License
   - 价格：$9.99
   - 描述：使用 AI 生成的产品描述
   - 封面图：使用插件 icon
3. 设置自动邮件：
   - 购买后发送 License Key
   - 使用 Gumroad 的自定义字段

#### [AI 提示]
```
请帮我准备 Gumroad 产品页面的内容。

需要：
1. 产品标题（吸引人）
2. 产品描述（200-300 字，突出价值）
3. 功能列表（Free vs Pro 对比）
4. FAQ（5-7 个常见问题）
5. 购买后邮件模板（包含 License Key 和使用说明）
6. 退款政策（30 天无理由退款）

请生成 GUMROAD_SETUP.md 文档。
```

#### [验证清单]
- [ ] Gumroad 产品创建完成
- [ ] 产品页面内容完整
- [ ] 自动邮件配置正确
- [ ] 测试购买流程

---

### 任务 6.2：集成 License 发放

**优先级**：🔴 高  
**预计时间**：1 小时  
**成本**：$0

#### [AI 提示]
```
创建一个自动化流程，在 Gumroad 销售后自动生成和发送 License Key。

方案（零成本）：
1. 使用 Gumroad Webhook（免费）
2. 使用 Cloudflare Workers（免费额度）接收 Webhook
3. 调用 License 生成脚本
4. 通过 Gumroad API 更新订单（添加 License）

请生成：
1. cloudflare-worker.js - Worker 代码
2. 部署步骤文档
3. 测试脚本

如果不想用 Cloudflare Workers，也可以：
- 手动生成 License（初期销量少时）
- 使用 Google Apps Script（免费）

请提供两种方案的代码。
```

#### [验证清单]
- [ ] Webhook 可以接收
- [ ] License 自动生成
- [ ] 邮件自动发送
- [ ] 测试购买成功

---

## 阶段 7：持续优化

### 任务 7.1：添加使用统计

**优先级**：🟡 中  
**预计时间**：1 小时  
**成本**：$0

#### [AI 提示]
```
添加匿名使用统计，帮助了解用户行为。

要求：
1. 使用 VS Code 内置的遥测 API
2. 收集数据：
   - 功能使用频率
   - 错误发生率
   - 平均使用时长
3. 完全匿名，符合隐私政策
4. 用户可以选择退出
5. 使用免费的分析服务（如 Mixpanel 免费版）

请修改：
- src/telemetry.ts - 新建遥测模块
- src/extension.ts - 集成遥测
- 添加隐私政策说明

请生成代码。
```

#### [验证清单]
- [ ] 遥测代码添加完成
- [ ] 数据可以在后台查看
- [ ] 有退出选项
- [ ] 符合隐私政策

---

### 任务 7.2：创建反馈系统

**优先级**：🟡 中  
**预计时间**：30 分钟  
**成本**：$0

#### [AI 提示]
```
创建一个简单的用户反馈系统。

要求：
1. 在插件中添加"发送反馈"命令
2. 打开 GitHub Issues 页面（预填模板）
3. 或使用 Google Forms（免费）收集反馈
4. 定期（每 30 天）询问用户评分

请生成：
1. 反馈命令代码
2. GitHub Issue 模板
3. Google Forms 问卷设计
4. 评分请求逻辑

请修改相关代码。
```

#### [验证清单]
- [ ] 反馈命令可用
- [ ] Issue 模板完整
- [ ] 评分请求不烦人

---

## 📊 进度跟踪

### 阶段完成情况
- [ ] 阶段 1：发布前准备（5 个任务）
- [ ] 阶段 2：License 系统（2 个任务）
- [ ] 阶段 3：市场材料（3 个任务）
- [ ] 阶段 4：发布（2 个任务）
- [ ] 阶段 5：用户增长（2 个任务）
- [ ] 阶段 6：收入实现（2 个任务）
- [ ] 阶段 7：持续优化（2 个任务）

### 里程碑
- [ ] **M1**：完成所有发布准备（阶段 1-3）
- [ ] **M2**：成功发布到 Marketplace（阶段 4）
- [ ] **M3**：获得 100 个下载
- [ ] **M4**：获得第一个付费用户
- [ ] **M5**：达到 1000 个下载
- [ ] **M6**：月收入 $100

---

## 💡 零成本工具清单

### 开发工具
- ✅ **VS Code** - 免费 IDE
- ✅ **Git/GitHub** - 免费版本控制
- ✅ **Node.js** - 免费运行环境
- ✅ **TypeScript** - 免费编程语言

### AI 工具
- ✅ **Claude 3.5 Sonnet** - 免费额度
- ✅ **ChatGPT** - 免费版本
- ✅ **Gemini** - 免费额度大
- ✅ **Groq API** - 完全免费

### 设计工具
- ✅ **Figma** - 免费版
- ✅ **Canva** - 免费版
- ✅ **SVG Edit** - 免费在线工具

### 托管服务
- ✅ **GitHub Pages** - 免费静态网站
- ✅ **Cloudflare Workers** - 免费额度
- ✅ **Vercel** - 免费托管

### 分析工具
- ✅ **Google Analytics** - 免费
- ✅ **Mixpanel** - 免费版（1000 用户）
- ✅ **Plausible** - 开源自托管

### 支付平台
- ✅ **Gumroad** - 免费（仅收交易费 10%）
- ✅ **Stripe** - 免费（仅收交易费 2.9%+$0.30）

### 营销工具
- ✅ **Reddit** - 免费发布
- ✅ **Twitter/X** - 免费
- ✅ **知乎** - 免费
- ✅ **小红书** - 免费

---

## 🎯 成功指标

### 第 1 个月
- [ ] 发布到 Marketplace
- [ ] 获得 50+ 下载
- [ ] 获得 1-2 个评价
- [ ] 修复 2-3 个 Bug

### 第 2-3 个月
- [ ] 500+ 下载
- [ ] 5+ 评价（平均 4 星以上）
- [ ] 获得第一个付费用户
- [ ] 月收入 $10-50

### 第 4-6 个月
- [ ] 2000+ 下载
- [ ] 20+ 评价
- [ ] 10+ 付费用户
- [ ] 月收入 $100-200

---

## ⚠️ 注意事项

### 时间管理
- 每天投入 1-2 小时
- 优先完成高优先级任务
- 不要追求完美，快速迭代

### 质量控制
- 每个任务完成后测试
- 保持代码整洁
- 及时修复 Bug

### 用户反馈
- 认真对待每个反馈
- 快速响应问题
- 持续改进产品

### 法律合规
- 遵守 VS Code Marketplace 政策
- 明确隐私政策
- 合理使用开源许可

---

## 📞 获取帮助

### 遇到问题时
1. 先查看本文档的相关部分
2. 搜索 VS Code 官方文档
3. 在 GitHub Issues 提问
4. 在 Stack Overflow 搜索
5. 询问 AI（Claude/ChatGPT）

### 有用的资源
- [VS Code 插件开发文档](https://code.visualstudio.com/api)
- [VS Code Marketplace 发布指南](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Gumroad 帮助中心](https://help.gumroad.com/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)

---

**祝你开发顺利！记住：完成比完美更重要。** 🚀
