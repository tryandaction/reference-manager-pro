# Reference Manager Pro v0.4.0 测试指南

## 版本信息

- 版本：0.4.0
- 目标：验证新的主入口 + `More Tools` 模型、统一配置和质量反馈

## 测试1：默认右键最简

目标：
- 验证默认右键直接提供主入口动作

步骤：
1. 打开任意 `.bib` 文件
2. 右键点击条目

预期：
- 看到 `Smart Fix`
- 看到 `Check This Entry`
- 看到 `Clean Unused Citations`（在工作区中）
- 看到 `Smart Fix All`
- 看到 `Check This File`
- 看到 `More Tools`
- 不再出现旧式大串高级命令

## 测试2：More Tools 入口

目标：
- 验证剩余低频能力统一进入 `More Tools`

步骤：
1. 命令面板运行 `Reference Manager: More Tools`
2. 检查分组

预期：
- 出现 `我的常用`（如已固定额外动作）
- 出现 `更多修复方式`
- 出现 `更多清理与检查`
- 出现 `历史与恢复`
- 出现 `实验功能`（配置实验工作流时）

## 测试3：contextMenuPins

目标：
- 验证右键固定动作生效

步骤：
1. 设置：
```json
{
  "referenceManager.ui.contextMenuPins": ["history", "officialReport"]
}
```
2. 打开 `.bib` 文件
3. 右键点击

预期：
- 默认主入口仍然存在
- 额外挂出 `History & Restore` 与 `Official Metadata Check`

## 测试4：keyHandling 默认策略

目标：
- 验证 `replace-safe-and-comment-old`

步骤：
1. 打开含 DOI 的条目
2. 运行 `Smart Fix`

预期：
- 若官方 key 安全可替换，则条目 key 替换为官方 key
- 第一行追加旧 key 注释

## 测试5：保留原 key

目标：
- 验证 `preserve-and-comment-official`

步骤：
1. 设置：
```json
{
  "referenceManager.keyHandling.mode": "preserve-and-comment-official",
  "referenceManager.keyHandling.commentPrefix": "% official_key:"
}
```
2. 对含 DOI 条目运行 `Smart Fix`

预期：
- 原 key 保留
- 第一行出现 `% official_key: ...`

## 测试6：保存后校验

目标：
- 验证 `quality.validateOnSave`

步骤：
1. 设置：
```json
{
  "referenceManager.quality.validateOnSave": true
}
```
2. 编辑一个存在明显错误的 `.bib` 条目
3. 保存文件

预期：
- 保存后出现校验提示

## 测试7：内联装饰

目标：
- 验证 `quality.showInlineDecorations`

步骤：
1. 设置：
```json
{
  "referenceManager.quality.showInlineDecorations": true
}
```
2. 打开存在缺失字段或 DOI 格式错误的 `.bib` 文件

预期：
- 编辑器中出现 warning/error 装饰

## 测试8：当前文件处理与更多模式

目标：
- 验证主入口和 `More Tools` 中的文件级动作

步骤：
1. 先直接运行 `Reference Manager: Smart Fix All`
2. 再运行 `Reference Manager: More Tools`
3. 选择 `更多整份文件处理方式`
4. 分别测试本地批量、raw 批量、AI 批量

预期：
- 各模式可执行
- 成功后文件内容正确更新

## 测试9：历史回滚

目标：
- 验证 History & Restore 可回滚

步骤：
1. 运行一次 Smart Fix
2. 运行 `Reference Manager: History & Restore`
3. 选择最近一次记录并恢复

预期：
- 文件恢复到之前状态

## 自动化验证

已覆盖：

- `npm run compile`
- `npm test`
- `npm run test:integration`
