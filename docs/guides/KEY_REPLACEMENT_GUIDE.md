# Citation Key 替换模式完整指南

## 📋 四种模式说明

### 1️⃣ replace-and-comment-old（默认模式）
**行为**：替换为官方key，注释原key

**示例**：
```bibtex
原始：
@article{mykey2020,
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}

结果：
@article{Nature:s41586-020-2649-2, % oldkey: mykey2020
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}
```

**适用场景**：
- 希望使用标准化的官方key
- 需要追踪原始key以便更新.tex文件
- 团队协作中需要统一引用格式

---

### 2️⃣ keep-and-comment-official（新增）
**行为**：保留原key，注释官方key

**示例**：
```bibtex
原始：
@article{mykey2020,
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}

结果：
@article{mykey2020, % official_key: Nature:s41586-020-2649-2
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}
```

**适用场景**：
- 已经在.tex文件中大量使用自定义key
- 不想修改现有引用
- 只想记录官方key作为参考

---

### 3️⃣ replace-only（新增）
**行为**：仅替换为官方key，不添加任何注释

**示例**：
```bibtex
原始：
@article{mykey2020,
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}

结果：
@article{Nature:s41586-020-2649-2,
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}
```

**适用场景**：
- 追求最简洁的.bib文件
- 不需要保留历史key信息
- 新项目从头开始使用官方key

---

### 4️⃣ keep-only（新增）
**行为**：仅保留原key，不添加任何注释

**示例**：
```bibtex
原始：
@article{mykey2020,
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}

结果：
@article{mykey2020,
  title = {Test Article},
  doi = {10.1038/s41586-020-2649-2}
}
```

**适用场景**：
- 完全不想改变key
- 只想获取和格式化元数据
- 保持现有引用系统不变

---

## ⚙️ 配置方法

### 方法1：通过 VS Code 设置界面

1. 按 `Ctrl+,` 打开设置
2. 搜索：`keyReplacement`
3. 找到 `Reference Manager > Customization > Behaviors > Key Replacement > Mode`
4. 从下拉菜单选择模式

### 方法2：通过 settings.json

按 `Ctrl+Shift+P`，输入 "Preferences: Open User Settings (JSON)"，添加：

```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "keep-and-comment-official",
    "commentPrefix": "% official_key:"
  }
}
```

**可选的 mode 值**：
- `"replace-and-comment-old"` - 默认
- `"keep-and-comment-official"` - 保留原key
- `"replace-only"` - 仅替换
- `"keep-only"` - 仅保留

---

## 🧪 测试步骤

### 测试1：验证 keep-and-comment-official 模式

1. **配置**：
```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "keep-and-comment-official",
    "commentPrefix": "% official_key:"
  }
}
```

2. **创建测试文件** `test.bib`：
```bibtex
@article{mykey2020,
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-2649-2}
}
```

3. **执行操作**：
   - 打开 `test.bib`
   - 光标放在条目内
   - 右键 → "Smart Fix"

4. **预期结果**：
```bibtex
@article{mykey2020, % official_key: Nature:s41586-020-2649-2
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-2649-2}
}
```

✅ **验证点**：
- key 仍然是 `mykey2020`
- 第一行末尾有注释 `% official_key: Nature:s41586-020-2649-2`

---

### 测试2：验证 replace-only 模式

1. **配置**：
```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "replace-only"
  }
}
```

2. **使用相同测试文件**

3. **执行 Smart Fix**

4. **预期结果**：
```bibtex
@article{Nature:s41586-020-2649-2,
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-2649-2}
}
```

✅ **验证点**：
- key 已改为 `Nature:s41586-020-2649-2`
- 第一行末尾**没有**任何注释

---

### 测试3：验证 keep-only 模式

1. **配置**：
```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "keep-only"
  }
}
```

2. **使用相同测试文件**

3. **执行 Smart Fix**

4. **预期结果**：
```bibtex
@article{mykey2020,
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-2649-2}
}
```

✅ **验证点**：
- key 仍然是 `mykey2020`
- 第一行末尾**没有**任何注释
- 元数据已更新（如果官方数据更完整）

---

## 🔄 模式对比表

| 模式 | key变化 | 添加注释 | 注释内容 | 适用场景 |
|------|---------|----------|----------|----------|
| replace-and-comment-old | ✅ 改为官方 | ✅ 是 | 原key | 标准化+追踪 |
| keep-and-comment-official | ❌ 保持原样 | ✅ 是 | 官方key | 保留原key+参考 |
| replace-only | ✅ 改为官方 | ❌ 否 | - | 简洁+标准化 |
| keep-only | ❌ 保持原样 | ❌ 否 | - | 完全不改key |

---

## 💡 使用建议

### 场景1：新项目
**推荐**：`replace-only`
- 从头开始使用官方key
- 保持.bib文件简洁

### 场景2：已有大量引用的项目
**推荐**：`keep-and-comment-official`
- 不破坏现有引用
- 记录官方key便于未来迁移

### 场景3：团队协作项目
**推荐**：`replace-and-comment-old`
- 统一使用官方key
- 保留原key便于团队成员更新

### 场景4：只想更新元数据
**推荐**：`keep-only`
- 完全不改变key
- 只获取最新的元数据

---

## 🔧 高级配置

### 自定义注释前缀

```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "keep-and-comment-official",
    "commentPrefix": "% DOI_key:"  // 自定义前缀
  }
}
```

结果：
```bibtex
@article{mykey2020, % DOI_key: Nature:s41586-020-2649-2
```

### 与 keyPolicy 的关系

**重要**：`keyPolicy` 只在 `replace-*` 模式下生效！

```json
{
  "referenceManager.officialMetadata.keyPolicy": "officialWhenUnused",
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "replace-and-comment-old"
  }
}
```

- `keep-*` 模式：总是保留原key，忽略 keyPolicy
- `replace-*` 模式：根据 keyPolicy 决定是否替换

---

## 📝 常见问题

### Q1: 为什么我设置了 keep-and-comment-official，但 key 还是被替换了？
**A**: 请检查：
1. 是否重新加载了窗口（`Ctrl+Shift+P` → "Developer: Reload Window"）
2. 配置是否正确保存在 settings.json 中
3. 是否有工作区设置覆盖了用户设置

### Q2: 可以批量应用到所有条目吗？
**A**: 可以！使用 "Smart Fix All" 命令：
- 打开 .bib 文件
- 右键 → "Smart Fix All"
- 或命令面板 → "Reference Manager: Smart Fix All"

### Q3: 注释会影响 LaTeX 编译吗？
**A**: 不会！`%` 是 BibTeX 的注释符号，编译器会忽略它。

### Q4: 可以混合使用不同模式吗？
**A**: 不建议。配置是全局的，建议在项目开始时选定一种模式并保持一致。

---

## 🎯 快速决策树

```
需要改变 key 吗？
├─ 是 → 需要保留原 key 信息吗？
│   ├─ 是 → replace-and-comment-old
│   └─ 否 → replace-only
└─ 否 → 需要记录官方 key 吗？
    ├─ 是 → keep-and-comment-official
    └─ 否 → keep-only
```

---

## 📦 版本信息

- **新增版本**：v0.3.5
- **新增模式**：`replace-only`, `keep-only`
- **修复**：`keep-and-comment-official` 模式的实现bug

---

## 🆘 获取帮助

如果遇到问题：
1. 查看 VS Code 输出面板（"Reference Manager Pro"）
2. 检查配置是否正确
3. 尝试重新加载窗口
4. 提交 issue 到 GitHub
