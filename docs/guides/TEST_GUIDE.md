# Reference Manager Pro - 定制化系统测试指南

## 测试版本
- 版本：0.3.4
- 构建时间：2026-03-05
- 包大小：414.84 KB

## 新增功能概览

### 1. 功能可见性控制
用户可以自定义哪些功能在右键菜单中显示。

### 2. Key替换模式定制
支持两种citation key替换模式：
- **模式1（默认）**：替换为官方key，注释旧key
- **模式2（新增）**：保留原key，注释官方key

### 3. 工作流系统
支持自定义多步骤操作，一键完成复杂任务。

### 4. 行为定制化
可配置各功能的具体行为（如去重策略、验证时机等）。

---

## 测试步骤

### 测试1：功能可见性控制

**目标**：验证菜单项可以根据配置显示/隐藏

**步骤**：
1. 打开VS Code设置（Ctrl+,）
2. 搜索 `referenceManager.customization.featureVisibility`
3. 将 `smartFix` 设置为 `false`
4. 打开任意 `.bib` 文件
5. 右键点击，检查"Smart Fix"是否消失

**预期结果**：
- Smart Fix 不应出现在右键菜单中
- 其他功能仍然可见

**恢复**：
- 将 `smartFix` 改回 `true`

---

### 测试2：Key替换模式 - 保留原key

**目标**：验证新的key替换模式（保留原key，注释官方key）

**步骤**：
1. 打开VS Code设置
2. 搜索 `referenceManager.customization.behaviors.keyReplacement.mode`
3. 选择 `keep-and-comment-official`
4. 创建测试文件 `test.bib`：
```bibtex
@article{mykey2020,
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-12345-6}
}
```
5. 右键点击条目，选择"Smart Fix"
6. 检查结果

**预期结果**：
```bibtex
@article{mykey2020, % official_key: Nature:s41586-020-12345-6
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-12345-6}
}
```
- Citation key 保持为 `mykey2020`
- 第一行添加注释 `% official_key: Nature:s41586-020-12345-6`

---

### 测试3：Key替换模式 - 替换为官方key（默认）

**目标**：验证默认key替换模式

**步骤**：
1. 打开VS Code设置
2. 将 `keyReplacement.mode` 改回 `replace-and-comment-old`
3. 使用相同的测试文件
4. 右键点击条目，选择"Smart Fix"

**预期结果**：
```bibtex
@article{Nature:s41586-020-12345-6, % oldkey: mykey2020
  author = {Smith, John},
  title = {Test Article},
  journal = {Nature},
  year = {2020},
  doi = {10.1038/s41586-020-12345-6}
}
```
- Citation key 替换为 `Nature:s41586-020-12345-6`
- 第一行添加注释 `% oldkey: mykey2020`

---

### 测试4：自定义注释前缀

**目标**：验证可以自定义注释前缀

**步骤**：
1. 打开VS Code设置
2. 搜索 `referenceManager.customization.behaviors.keyReplacement.commentPrefix`
3. 将值改为 `% original_citation_key:`
4. 使用测试文件执行Smart Fix

**预期结果**：
- 注释前缀变为 `% original_citation_key:` 而不是默认的 `% oldkey:`

---

### 测试5：工作流系统 - 预定义工作流

**目标**：验证预定义的"Optimize All"工作流

**步骤**：
1. 创建测试文件 `workflow-test.bib`：
```bibtex
@article{smith2020,
  author = {Smith, John},
  title = {test article},
  journal = {Nature},
  year = {2020}
}

@article{smith2020,
  author = {Smith, John},
  title = {test article},
  journal = {Nature},
  year = {2020}
}

@article{jones2021,
  author={Jones, Mary},
  title={Another Article},
  journal={Science}
}
```
2. 打开命令面板（Ctrl+Shift+P）
3. 输入 `Reference Manager: Manage Workflows`
4. 选择 "Optimize All"

**预期结果**：
- 进度通知显示三个步骤：格式化、去重、验证
- 重复条目被删除（只保留一个smith2020）
- 所有条目格式化（标题大小写保护、作者格式统一）
- 显示验证结果

---

### 测试6：高级菜单可见性

**目标**：验证高级菜单项可以单独控制

**步骤**：
1. 打开VS Code设置
2. 搜索 `referenceManager.customization.featureVisibility.advanced`
3. 将 `removeDuplicates` 设置为 `false`
4. 打开 `.bib` 文件
5. 右键 → Advanced 子菜单

**预期结果**：
- "Remove Duplicates" 不应出现在Advanced菜单中
- 其他高级功能仍然可见

---

### 测试7：隐藏整个高级菜单

**目标**：验证可以完全隐藏高级菜单

**步骤**：
1. 打开VS Code设置
2. 将 `referenceManager.customization.featureVisibility.advancedMenu` 设置为 `false`
3. 打开 `.bib` 文件
4. 右键点击

**预期结果**：
- "Advanced" 子菜单完全不显示
- 只显示主要功能（Smart Fix、Validate、History）

---

### 测试8：配置迁移

**目标**：验证从旧版本升级时配置正确迁移

**步骤**：
1. 打开VS Code设置JSON（Ctrl+Shift+P → "Preferences: Open User Settings (JSON)"）
2. 删除所有 `referenceManager.customization` 相关配置
3. 重新加载窗口（Ctrl+Shift+P → "Developer: Reload Window"）
4. 打开 `.bib` 文件并右键

**预期结果**：
- 所有功能使用默认配置
- 所有菜单项都可见
- 没有错误提示

---

### 测试9：工作流管理器UI

**目标**：验证工作流管理器界面

**步骤**：
1. 打开命令面板（Ctrl+Shift+P）
2. 输入 `Reference Manager: Manage Workflows`
3. 查看QuickPick界面

**预期结果**：
- 显示 "Optimize All" 工作流
- 显示工作流描述："Format, deduplicate, and validate all entries"
- 显示步骤数："3 steps • Scope: file"
- 底部有 "Open Workflow Settings" 选项

---

### 测试10：自定义工作流

**目标**：验证用户可以创建自定义工作流

**步骤**：
1. 打开VS Code设置JSON
2. 添加自定义工作流：
```json
"referenceManager.customization.workflows": [
    {
        "id": "quick-format",
        "name": "Quick Format",
        "description": "Only format entries locally",
        "steps": [
            {
                "id": "format",
                "operation": "formatLocal",
                "continueOnError": false,
                "label": "Formatting..."
            }
        ],
        "scope": "file",
        "showInMenu": true
    }
]
```
3. 重新加载窗口
4. 打开命令面板 → "Manage Workflows"

**预期结果**：
- "Quick Format" 工作流出现在列表中
- 可以执行该工作流
- 只执行格式化步骤

---

## 性能测试

### 测试11：大文件性能

**目标**：验证菜单更新不影响性能

**步骤**：
1. 创建包含100+条目的大型 `.bib` 文件
2. 多次切换功能可见性配置
3. 观察响应时间

**预期结果**：
- 菜单更新应该是即时的（<100ms）
- 不应有明显延迟

---

## 回归测试

### 测试12：现有功能不受影响

**目标**：确保新功能不破坏现有功能

**步骤**：
1. 测试所有原有命令：
   - Smart Fix
   - Smart Fix All
   - Validate References
   - Remove Duplicates
   - Find Unused Citations
   - Format Entry (Local)
   - Format Entry (AI)
   - Show History

**预期结果**：
- 所有原有功能正常工作
- 没有功能退化

---

## 已知限制

1. **工作流操作简化**：当前工作流中的操作是简化版本，主要用于演示架构
2. **菜单动态性**：VS Code限制，菜单项需要重新加载才能完全更新
3. **工作流UI**：当前使用QuickPick，未来可以考虑WebView界面

---

## 测试检查清单

- [ ] 测试1：功能可见性控制
- [ ] 测试2：Key替换模式 - 保留原key
- [ ] 测试3：Key替换模式 - 替换为官方key
- [ ] 测试4：自定义注释前缀
- [ ] 测试5：预定义工作流
- [ ] 测试6：高级菜单可见性
- [ ] 测试7：隐藏整个高级菜单
- [ ] 测试8：配置迁移
- [ ] 测试9：工作流管理器UI
- [ ] 测试10：自定义工作流
- [ ] 测试11：大文件性能
- [ ] 测试12：回归测试

---

## 报告问题

如果发现任何问题，请记录：
1. 测试步骤
2. 预期结果
3. 实际结果
4. 错误信息（如有）
5. VS Code版本
6. 扩展版本

---

## 下一步

测试通过后：
1. 更新 CHANGELOG.md
2. 更新 README.md 添加新功能说明
3. 创建用户文档（CUSTOMIZATION.md）
4. 准备发布说明
