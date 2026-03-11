# Reference Manager Pro v0.3.5 更新说明

## 🎉 新功能

### 新增两种 Citation Key 替换模式

现在共支持 **4 种模式**，满足不同使用场景：

#### 1. replace-and-comment-old（默认，原有）
- ✅ 替换为官方key
- ✅ 注释原key
- 示例：`@article{Nature:s41586-020-2649-2, % oldkey: mykey2020`

#### 2. keep-and-comment-official（原有，已修复bug）
- ❌ 保留原key
- ✅ 注释官方key
- 示例：`@article{mykey2020, % official_key: Nature:s41586-020-2649-2`

#### 3. replace-only（🆕 新增）
- ✅ 替换为官方key
- ❌ 不添加注释
- 示例：`@article{Nature:s41586-020-2649-2,`

#### 4. keep-only（🆕 新增）
- ❌ 保留原key
- ❌ 不添加注释
- 示例：`@article{mykey2020,`

---

## 🐛 Bug 修复

### 修复 keep-and-comment-official 模式不生效的问题

**问题描述**：
- 用户设置了 `keep-and-comment-official` 模式
- 但实际执行时，key 仍然被替换为官方key
- 注释中的 key 也是官方key，而不是原key

**根本原因**：
- 代码逻辑中，key 替换决策依赖于 `keyPolicy` 配置
- `keep-and-comment-official` 模式的逻辑没有正确实现
- 导致无论选择哪个模式，都按照 `keyPolicy` 执行

**修复方案**：
- 重构了 `handleSmartFix` 和 `handleSmartFixAll` 函数
- 让 key replacement 模式独立于 `keyPolicy`
- `keep-*` 模式：总是保留原key，不受 `keyPolicy` 影响
- `replace-*` 模式：根据 `keyPolicy` 决定是否替换

---

## 📦 安装

### 方法1：卸载旧版本后安装新版本

```bash
# 卸载旧版本
code --uninstall-extension reference-manager-pro

# 安装新版本
code --install-extension "c:\universe\software development\me\reference-manager-pro\reference-manager-pro-0.3.5.vsix"
```

### 方法2：通过 VS Code 界面安装

1. 打开 VS Code
2. 按 `Ctrl+Shift+X` 打开扩展视图
3. 点击右上角 "..." → "Install from VSIX..."
4. 选择 `reference-manager-pro-0.3.5.vsix`
5. 重新加载窗口

---

## ⚙️ 配置示例

### 场景1：保留原key，记录官方key

```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "keep-and-comment-official",
    "commentPrefix": "% official_key:"
  }
}
```

### 场景2：仅替换key，不添加注释

```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "replace-only"
  }
}
```

### 场景3：完全不改变key

```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "keep-only"
  }
}
```

---

## 🧪 快速测试

1. **创建测试文件** `test.bib`：
```bibtex
@article{mykey2020,
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-2649-2}
}
```

2. **配置模式**（选择一种）：
   - `keep-and-comment-official` - 保留原key
   - `replace-only` - 仅替换
   - `keep-only` - 完全不改

3. **执行 Smart Fix**：
   - 光标放在条目内
   - 右键 → "Smart Fix"

4. **验证结果**：
   - `keep-and-comment-official`: key 应该是 `mykey2020`，有注释
   - `replace-only`: key 应该是官方key，无注释
   - `keep-only`: key 应该是 `mykey2020`，无注释

---

## 📚 详细文档

完整使用指南请查看：[KEY_REPLACEMENT_GUIDE.md](KEY_REPLACEMENT_GUIDE.md)

包含：
- 四种模式的详细说明和示例
- 适用场景分析
- 配置方法
- 测试步骤
- 常见问题解答
- 快速决策树

---

## 🔄 升级注意事项

### 配置兼容性

✅ **完全向后兼容**

- 如果你使用默认配置，无需任何修改
- 如果你已配置 `replace-and-comment-old`，继续正常工作
- 如果你已配置 `keep-and-comment-official`，现在会正确工作（之前有bug）

### 行为变化

⚠️ **重要变化**

如果你之前设置了 `keep-and-comment-official` 模式：
- **旧版本（有bug）**：实际上还是会替换key
- **新版本（已修复）**：现在会正确保留原key

建议：升级后测试一下，确保行为符合预期。

---

## 📊 版本对比

| 功能 | v0.3.4 | v0.3.5 |
|------|--------|--------|
| replace-and-comment-old | ✅ | ✅ |
| keep-and-comment-official | ⚠️ 有bug | ✅ 已修复 |
| replace-only | ❌ | ✅ 新增 |
| keep-only | ❌ | ✅ 新增 |

---

## 🎯 推荐配置

### 新项目
```json
{ "mode": "replace-only" }
```
简洁，使用官方key

### 已有项目
```json
{ "mode": "keep-and-comment-official" }
```
不破坏现有引用

### 团队协作
```json
{ "mode": "replace-and-comment-old" }
```
统一key，便于追踪

---

## 🐛 已知问题

无

---

## 🙏 反馈

如果遇到问题或有建议，请：
1. 查看输出面板（"Reference Manager Pro"）
2. 检查配置是否正确
3. 查看 [KEY_REPLACEMENT_GUIDE.md](KEY_REPLACEMENT_GUIDE.md)
4. 提交 issue

---

**文件信息**：
- 版本：v0.3.5
- 文件：reference-manager-pro-0.3.5.vsix
- 大小：430.31 KB
- 日期：2026-03-11
