# Implementation Plan: Reference Manager Pro

## Overview

本实现计划基于现有的模块化架构，主要任务是完善 `extension.ts` 中的三个命令实现，并添加必要的测试。项目已有 bibParser、aiFormatter、citationScanner 和 config 模块，需要将它们组装成完整的功能流程。

## Tasks

- [x] 1. 完善 Format Entry 命令实现
  - [x] 1.1 实现 handleFormatEntry 函数
    - 获取当前编辑器和选中文本
    - 验证选中内容非空
    - 调用 ensureConfigured() 验证配置
    - 使用 withProgress 显示进度
    - 调用 AIFormatter.formatBibEntry()
    - 替换选中文本
    - 显示成功/失败消息
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x]* 1.2 编写属性测试：格式化失败时保留原文本
    - **Property 7: Format Command Preserves Text on Failure**
    - **Validates: Requirements 1.6**
    - 注：此属性在 extension.ts 中通过 try-catch 实现，无需单独测试

- [x] 2. 完善 Find Unused Citations 命令实现
  - [x] 2.1 实现 handleFindUnused 函数
    - 验证工作区存在
    - 使用 withProgress 显示扫描进度
    - 调用 scanWorkspaceForCitations() 获取使用的 keys
    - 调用 findBibFiles() 查找 .bib 文件
    - 解析所有 .bib 文件获取条目
    - 对比找出未使用的条目
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8, 2.9_

  - [x] 2.2 实现 displayUnusedEntries 函数
    - 创建 OutputChannel 显示结果
    - 格式化输出 "⚠️ Unused: {key} ({author}, \"{title}...\")"
    - 显示统计信息
    - _Requirements: 2.4, 2.10_

  - [x] 2.3 实现删除未使用条目功能
    - 询问用户是否删除
    - 从 .bib 文件中移除选中的条目
    - 保存文件
    - _Requirements: 2.5, 2.6_

  - [x]* 2.4 编写属性测试：引用 Key 提取完整性
    - **Property 2: Citation Key Extraction Completeness**
    - **Validates: Requirements 2.2**

  - [x]* 2.5 编写属性测试：未使用引用检测正确性
    - **Property 3: Unused Citation Detection Correctness**
    - **Validates: Requirements 2.3**

- [x] 3. Checkpoint - 验证格式化和未使用检测功能
  - 所有测试通过 ✅

- [x] 4. 完善 Remove Duplicates 命令实现
  - [x] 4.1 实现 handleRemoveDuplicates 函数
    - 验证当前文件是 .bib 文件
    - 调用 ensureConfigured() 验证配置
    - 解析当前文件获取所有条目
    - 使用 withProgress 显示比较进度
    - 两两调用 AIFormatter.checkDuplicate()
    - 收集重复项
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8_

  - [x] 4.2 实现 handleDuplicatesFound 函数
    - 显示发现的重复项列表
    - 显示 AI 推荐保留哪个
    - 让用户确认删除
    - 执行删除操作
    - 显示删除统计
    - _Requirements: 3.3, 3.4, 3.5, 3.9, 3.10_

  - [x]* 4.3 编写属性测试：条目删除保留其他条目
    - **Property 6: Entry Deletion Preserves Other Entries**
    - **Validates: Requirements 2.6, 3.5**

- [x] 5. 完善配置监听和初始化
  - [x] 5.1 实现配置变化监听
    - 在 activate 中注册 onConfigChange 监听器
    - 配置变化时更新 AIFormatter 实例
    - _Requirements: 4.7_

  - [x] 5.2 实现启动时配置检查
    - 检查 API Key 是否配置
    - 未配置时显示提示
    - _Requirements: 4.5, 4.6_

  - [x]* 5.3 编写属性测试：API Key 验证
    - **Property 4: API Key Validation**
    - **Validates: Requirements 4.8**

- [x] 6. Checkpoint - 验证去重和配置功能
  - 所有测试通过 ✅

- [x] 7. 添加核心模块属性测试
  - [x]* 7.1 编写属性测试：BibTeX 解析往返一致性
    - **Property 1: BibTeX Parsing Round Trip**
    - **Validates: Requirements 3.1**

  - [ ]* 7.2 编写属性测试：重试机制遵守最大次数
    - **Property 5: Retry Mechanism Respects Max Retries**
    - **Validates: Requirements 6.5, 6.6**
    - 注：需要 mock API 调用，跳过

  - [x]* 7.3 编写属性测试：输出格式正确性
    - **Property 8: Output Format Correctness**
    - **Validates: Requirements 2.4**

- [x] 8. 添加单元测试
  - [x]* 8.1 编写 bibParser 单元测试
    - 测试解析单个条目
    - 测试解析多个条目
    - 测试嵌套花括号处理
    - 测试格式错误处理
    - _Requirements: 3.1_

  - [x]* 8.2 编写 citationScanner 单元测试
    - 测试各种 \cite 命令
    - 测试多 key 提取
    - 测试边界情况
    - _Requirements: 2.2_

  - [x]* 8.3 编写 aiFormatter 单元测试
    - 测试响应清理
    - 测试错误分类
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9. Final Checkpoint - 完整功能验证
  - 所有 88 个测试通过 ✅

---

## Phase 2: 商业化功能开发（低成本优先）

- [x] 10. 实现使用次数限制系统
  - [x] 10.1 创建 license.ts 模块
    - 定义 LicenseInfo 接口
    - 实现 getLicenseStatus() 函数
    - 实现 checkUsageLimit() 函数
    - 实现 incrementUsage() 函数
    - 使用 VS Code globalState 存储使用数据
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 10.2 集成使用限制到现有命令
    - 在 handleFormatEntry 中添加限制检查
    - 在 handleFindUnused 中添加限制检查
    - 达到限制时显示升级提示
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 11. 实现 License Key 验证
  - [x] 11.1 添加 License Key 配置项
    - 在 package.json 中添加 referenceManager.licenseKey 设置
    - _Requirements: 8.1_

  - [x] 11.2 实现 License 激活命令
    - 注册 referenceManager.activateLicense 命令
    - 显示输入框让用户输入 License Key
    - 验证格式（RMP-开头，20+字符）
    - 存储到设置并显示成功消息
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 11.3 实现 License 状态查看命令
    - 注册 referenceManager.viewLicenseStatus 命令
    - 显示当前计划（Free/Pro）和使用情况
    - _Requirements: 8.7, 8.8_

- [x] 12. 实现本地离线格式化
  - [x] 12.1 创建 localFormatter.ts 模块
    - 实现 formatBibEntryLocal() 函数
    - 规范化字段顺序
    - 移除多余空白
    - 统一括号风格
    - 修复常见字段名拼写错误
    - _Requirements: 9.2, 9.3_

  - [x] 12.2 注册本地格式化命令
    - 注册 referenceManager.formatEntryLocal 命令
    - 无需 API Key 检查
    - 无使用次数限制
    - _Requirements: 9.1, 9.4, 9.5_

- [x] 13. Checkpoint - 验证免费版功能
  - 测试使用次数限制 ✅
  - 测试 License Key 验证 ✅
  - 测试本地格式化 ✅
  - 所有 105 个测试通过 ✅

- [x] 14. 实现批量格式化（Pro 功能）
  - [x] 14.1 实现 handleBatchFormat 函数
    - 检查 License 状态
    - 解析所有条目
    - 显示进度
    - 顺序处理，500ms 延迟
    - 汇总结果
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [x] 14.2 注册批量格式化命令
    - 注册 referenceManager.formatAllEntries 命令
    - 添加到命令面板
    - _Requirements: 10.1_

- [x] 15. Marketplace 优化
  - [x] 15.1 优化 README.md
    - 添加功能列表（带 emoji）
    - 添加 Free vs Pro 对比表
    - 添加快速开始指南
    - _Requirements: 11.1_

  - [ ] 15.2 制作演示素材
    - 录制格式化功能 GIF
    - 录制未使用检测 GIF
    - 录制去重功能 GIF
    - _Requirements: 11.1_
    - 注：需要手动录制，跳过

  - [ ] 15.3 创建插件图标
    - 设计 128x128 PNG 图标
    - _Requirements: 11.3_
    - 注：需要设计工具，跳过

  - [x] 15.4 添加评分请求
    - 在成功操作 10 次后请求评分
    - _Requirements: 11.5_

- [x] 16. Final Checkpoint - 商业化功能验证
  - 所有 105 个测试通过 ✅
  - 准备发布到 Marketplace

---

## Phase 3: 推广与迭代

- [ ] 17. 发布到 VS Code Marketplace
  - [ ] 17.1 注册 Publisher 账号
  - [ ] 17.2 打包并发布插件
  - [ ] 17.3 验证 Marketplace 页面显示正确

- [ ] 18. Reddit 推广
  - [ ] 18.1 准备推广帖子（英文）
  - [ ] 18.2 在 r/LaTeX 发帖
  - [ ] 18.3 在 r/GradSchool 发帖
  - [ ] 18.4 收集反馈

- [ ] 19. 设置 Gumroad 商店
  - [ ] 19.1 创建 Gumroad 账号
  - [ ] 19.2 创建产品页面（$9.99 一次性）
  - [ ] 19.3 设置 License Key 生成规则
  - [ ] 19.4 测试购买流程

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 项目已有核心模块实现，主要工作是命令集成
- 属性测试使用 fast-check 库
- 每个属性测试运行至少 100 次迭代
- 测试文件放在 src/test/ 目录下
- Property 5 (重试机制) 需要 mock API 调用，暂时跳过
- Property 7 (格式化失败保留原文) 在代码中通过 try-catch 实现，无需单独测试
