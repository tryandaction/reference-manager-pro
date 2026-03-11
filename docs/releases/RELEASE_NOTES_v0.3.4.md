# Reference Manager Pro v0.3.4 - 定制化系统发布

## 🎉 重大更新：完全可定制的用户体验

Reference Manager Pro 现在支持完整的定制化系统，让您可以根据自己的工作流程和习惯配置扩展！

---

## ✨ 新功能

### 1. 📋 功能可见性控制
**自定义右键菜单，只显示您需要的功能**

- 隐藏不常用的功能
- 简化界面，减少混乱
- 完全控制高级菜单的显示

**配置示例**：
```json
{
  "referenceManager.customization.featureVisibility": {
    "smartFix": true,
    "validate": true,
    "history": false,
    "advancedMenu": false
  }
}
```

---

### 2. 🔑 灵活的Citation Key管理
**两种Key替换模式，满足不同需求**

#### 模式1：替换为官方Key（默认）
```bibtex
@article{Nature:s41586-020-12345-6, % oldkey: mykey2020
```
- 使用官方派生的key
- 保留原key作为注释

#### 模式2：保留原Key（新增）⭐
```bibtex
@article{mykey2020, % official_key: Nature:s41586-020-12345-6
```
- 保持您自己的citation key
- 添加官方key作为参考注释

**配置**：
```json
{
  "referenceManager.customization.behaviors.keyReplacement": {
    "mode": "keep-and-comment-official",
    "commentPrefix": "% official_key:"
  }
}
```

---

### 3. 🔄 工作流系统
**创建自定义多步骤操作，一键完成复杂任务**

#### 预定义工作流：
- **Optimize All**: 格式化 → 去重 → 验证

#### 自定义工作流示例：
```json
{
  "referenceManager.customization.workflows": [
    {
      "id": "prepare-submission",
      "name": "准备提交",
      "description": "论文提交前的完整检查",
      "steps": [
        {"operation": "smartFix", "label": "获取官方元数据..."},
        {"operation": "removeDuplicates", "label": "删除重复..."},
        {"operation": "validate", "label": "严格验证..."}
      ],
      "scope": "file",
      "showInMenu": true
    }
  ]
}
```

**使用方法**：
- 命令面板 → `Reference Manager: Manage Workflows`
- 选择工作流并执行
- 查看详细的进度和结果

---

### 4. ⚙️ 行为定制化
**配置每个功能的具体行为**

- **Smart Fix**: 操作顺序、自动验证
- **去重**: 保留策略（首个/最后/最完整/询问）
- **验证**: 保存时自动验证、内联装饰

---

## 🚀 使用场景

### 学生用户
```json
{
  "featureVisibility": {
    "smartFix": true,
    "validate": true,
    "advancedMenu": false  // 隐藏高级功能
  }
}
```

### 研究人员
```json
{
  "behaviors": {
    "keyReplacement": {
      "mode": "keep-and-comment-official"  // 保留自己的key
    }
  }
}
```

### 期刊编辑
```json
{
  "workflows": [
    {
      "name": "准备发表",
      "steps": ["smartFix", "removeDuplicates", "validate"]
    }
  ]
}
```

---

## 📦 安装

### 方法1：从VSIX安装
1. 下载 `reference-manager-pro-0.3.4.vsix`
2. VS Code → 扩展 → "..." → "Install from VSIX..."
3. 选择下载的文件
4. 重新加载窗口

### 方法2：从市场安装（即将推出）
- VS Code扩展市场搜索 "Reference Manager Pro"

---

## 🔧 配置指南

### 快速开始

1. **打开设置**：`Ctrl+,` 或 `Cmd+,`
2. **搜索**：`referenceManager.customization`
3. **配置**：根据需要调整设置

### 推荐配置

#### 最小化界面
```json
{
  "referenceManager.customization.featureVisibility": {
    "smartFix": true,
    "validate": true,
    "history": false,
    "advancedMenu": false
  }
}
```

#### 保留原Key + 快速工作流
```json
{
  "referenceManager.customization": {
    "behaviors": {
      "keyReplacement": {
        "mode": "keep-and-comment-official"
      }
    },
    "workflows": [
      {
        "id": "quick-fix",
        "name": "快速修复",
        "steps": [{"operation": "formatLocal"}],
        "scope": "file",
        "showInMenu": true
      }
    ]
  }
}
```

---

## 📚 文档

- **测试指南**: [TEST_GUIDE.md](TEST_GUIDE.md)
- **实施总结**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **完整文档**: 即将推出 CUSTOMIZATION.md

---

## 🐛 已知问题

- 工作流操作当前为简化版本（主要用于演示架构）
- 菜单更新可能需要重新加载窗口才能完全生效

---

## 🔄 向后兼容

✅ **完全向后兼容**
- 现有配置自动迁移
- 默认行为保持不变
- 无需任何操作即可升级

---

## 📊 技术细节

- **新增代码**: ~1,200行
- **新增文件**: 6个
- **包大小**: 414.84 KB
- **编译状态**: ✅ 成功

---

## 🙏 反馈

如有问题或建议，请：
- 提交Issue: [GitHub Issues](https://github.com/tryandaction/reference-manager-pro/issues)
- 邮件联系: [您的邮箱]

---

## 🎯 下一步计划

### v0.3.5
- 优化工作流操作实现
- 添加更多预定义工作流
- 创建详细的用户文档

### v0.4.0
- 工作流可视化编辑器
- 工作流模板市场
- 导入/导出配置

---

**享受您的定制化体验！** 🎉

---

*Reference Manager Pro - 让BibTeX管理更简单、更高效、更个性化*
