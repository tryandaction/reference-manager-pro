# Citation Key 处理指南（v0.4.0）

## 新配置入口

Citation key 的策略现在统一由以下两个设置控制：

- `referenceManager.keyHandling.mode`
- `referenceManager.keyHandling.commentPrefix`

旧的：

- `referenceManager.officialMetadata.keyPolicy`
- `referenceManager.customization.behaviors.keyReplacement.*`

会被读取并迁移，但不再是主设置入口。

## 可选模式

### 1. `replace-safe-and-comment-old`（默认）

- 仅在安全时替换为官方 key
- 保留旧 key 注释

示例：

```bibtex
@article{Nature:s41586-020-12345-6, % oldkey: mykey2020
```

### 2. `replace-safe`

- 仅在安全时替换为官方 key
- 不添加注释

### 3. `replace-always-and-comment-old`

- 始终优先使用官方 key
- 保留旧 key 注释

### 4. `replace-always`

- 始终优先使用官方 key
- 不添加注释

### 5. `preserve-and-comment-official`

- 始终保留原 key
- 注释官方 key

示例：

```bibtex
@article{mykey2020, % official_key: Nature:s41586-020-12345-6
```

### 6. `preserve`

- 始终保留原 key
- 不添加注释

## commentPrefix

当模式需要添加注释时，前缀由以下设置控制：

```json
{
  "referenceManager.keyHandling.commentPrefix": "% oldkey:"
}
```

如果你使用 `preserve-and-comment-official`，建议改成：

```json
{
  "referenceManager.keyHandling.commentPrefix": "% official_key:"
}
```

## 建议选择

- 普通用户：`replace-safe-and-comment-old`
- 强一致官方 key：`replace-always-and-comment-old`
- 完全不动原 key：`preserve`
- 保留原 key 但记录官方 key：`preserve-and-comment-official`
