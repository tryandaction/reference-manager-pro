# Design Document: Reference Manager Pro

## Overview

Reference Manager Pro 是一个 VS Code 插件，为 LaTeX 科研人员提供智能参考文献管理功能。该插件基于现有的模块化架构，通过完善 `extension.ts` 中的命令实现来提供三个核心功能：智能格式化、未使用引用检测和智能去重。

### 现有架构

项目已有以下核心模块：
- `bibParser.ts` - BibTeX 解析器，提供 `parseBibFile()`, `serializeBibEntry()` 等函数
- `aiFormatter.ts` - AI API 封装，提供 `formatBibEntry()`, `checkDuplicate()` 方法
- `citationScanner.ts` - 引用扫描器，提供 `extractCitationKeys()`, `scanWorkspaceForCitations()` 等函数
- `config.ts` - 配置管理，提供 `getConfig()`, `ensureConfigured()` 等函数

### 待实现

主要需要完善 `extension.ts` 中的三个命令实现，将现有模块组装成完整的功能流程。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code Extension                       │
├─────────────────────────────────────────────────────────────┤
│                      extension.ts                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ formatEntry │  │ findUnused  │  │ removeDuplicates    │  │
│  │   Command   │  │   Command   │  │     Command         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
├─────────┼────────────────┼────────────────────┼─────────────┤
│         │                │                    │              │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────────▼─────────┐   │
│  │ aiFormatter │  │ citation    │  │   bibParser       │   │
│  │    .ts      │  │ Scanner.ts  │  │      .ts          │   │
│  └──────┬──────┘  └─────────────┘  └───────────────────┘   │
│         │                                                   │
│  ┌──────▼──────┐                                           │
│  │  config.ts  │                                           │
│  └─────────────┘                                           │
├─────────────────────────────────────────────────────────────┤
│                    Anthropic Claude API                      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Extension Entry Point (extension.ts)

负责注册命令和协调各模块。

```typescript
// 命令注册接口
interface CommandRegistration {
    commandId: string;
    handler: () => Promise<void>;
}

// 三个主要命令
const commands: CommandRegistration[] = [
    { commandId: 'referenceManager.formatEntry', handler: handleFormatEntry },
    { commandId: 'referenceManager.findUnusedCitations', handler: handleFindUnused },
    { commandId: 'referenceManager.removeDuplicates', handler: handleRemoveDuplicates }
];
```

### 2. Format Entry Command Flow

```
用户选中文本 → 触发命令 → 验证配置 → 显示进度 → 调用AI → 替换文本 → 显示结果
```

```typescript
async function handleFormatEntry(): Promise<void> {
    // 1. 获取当前编辑器和选中文本
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    
    // 2. 验证选中内容
    if (!text.trim()) {
        vscode.window.showWarningMessage('请先选中要格式化的BibTeX条目');
        return;
    }
    
    // 3. 验证配置
    if (!await ensureConfigured()) return;
    
    // 4. 显示进度并调用AI
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Formatting BibTeX entry...",
        cancellable: false
    }, async () => {
        const formatted = await formatter.formatBibEntry(text);
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, formatted);
        });
    });
    
    // 5. 显示成功消息
    vscode.window.showInformationMessage('✅ Entry formatted!');
}
```

### 3. Find Unused Citations Command Flow

```
触发命令 → 扫描.tex文件 → 提取引用keys → 解析.bib文件 → 对比 → 显示结果 → 可选删除
```

```typescript
async function handleFindUnused(): Promise<void> {
    // 1. 验证工作区
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showWarningMessage('请先打开一个工作区');
        return;
    }
    
    // 2. 显示进度并扫描
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Scanning for unused citations...",
        cancellable: false
    }, async (progress) => {
        // 2.1 扫描.tex文件获取使用的keys
        const usedKeys = await scanWorkspaceForCitations(progress);
        
        // 2.2 查找.bib文件
        const bibFiles = await findBibFiles();
        if (bibFiles.length === 0) {
            vscode.window.showWarningMessage('未找到.bib文件');
            return;
        }
        
        // 2.3 解析.bib文件获取所有条目
        const allEntries: BibEntry[] = [];
        for (const bibFile of bibFiles) {
            const doc = await vscode.workspace.openTextDocument(bibFile);
            const result = parseBibFile(doc.getText());
            allEntries.push(...result.entries);
        }
        
        // 2.4 找出未使用的条目
        const unusedEntries = allEntries.filter(
            entry => !usedKeys.has(entry.key)
        );
        
        // 2.5 显示结果
        displayUnusedEntries(unusedEntries);
    });
}
```

### 4. Remove Duplicates Command Flow

```
触发命令 → 解析.bib文件 → 两两比较(AI) → 显示重复项 → 用户确认 → 删除
```

```typescript
async function handleRemoveDuplicates(): Promise<void> {
    // 1. 获取当前.bib文件
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.bib')) {
        vscode.window.showWarningMessage('请先打开一个.bib文件');
        return;
    }
    
    // 2. 验证配置
    if (!await ensureConfigured()) return;
    
    // 3. 解析条目
    const content = editor.document.getText();
    const result = parseBibFile(content);
    const entries = result.entries;
    
    // 4. 两两比较
    const duplicates: DuplicatePair[] = [];
    const totalPairs = (entries.length * (entries.length - 1)) / 2;
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Checking for duplicates...",
        cancellable: true
    }, async (progress, token) => {
        let checked = 0;
        for (let i = 0; i < entries.length && !token.isCancellationRequested; i++) {
            for (let j = i + 1; j < entries.length && !token.isCancellationRequested; j++) {
                try {
                    const result = await formatter.checkDuplicate(
                        entries[i].rawText,
                        entries[j].rawText
                    );
                    if (result.isDuplicate) {
                        duplicates.push({
                            entry1: entries[i],
                            entry2: entries[j],
                            keepEntry: result.keepEntry,
                            reason: result.reason
                        });
                    }
                } catch (error) {
                    // 跳过失败的比较，继续处理其他
                    console.warn(`比较失败: ${entries[i].key} vs ${entries[j].key}`);
                }
                checked++;
                progress.report({
                    message: `Checking ${checked}/${totalPairs}...`,
                    increment: 100 / totalPairs
                });
            }
        }
    });
    
    // 5. 显示结果并处理
    if (duplicates.length === 0) {
        vscode.window.showInformationMessage('✅ No duplicates found!');
    } else {
        await handleDuplicatesFound(duplicates, editor);
    }
}
```

## Data Models

### DuplicatePair Interface

```typescript
interface DuplicatePair {
    entry1: BibEntry;
    entry2: BibEntry;
    keepEntry: 'entry1' | 'entry2';
    reason: string;
}
```

### UnusedEntryInfo Interface

```typescript
interface UnusedEntryInfo {
    entry: BibEntry;
    bibFile: vscode.Uri;
    description: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: BibTeX Parsing Round Trip

*For any* valid BibTeX entry, parsing it with `parseBibFile()` and then serializing with `serializeBibEntry()` should produce a semantically equivalent entry (same type, key, and field values).

**Validates: Requirements 3.1**

### Property 2: Citation Key Extraction Completeness

*For any* .tex content containing citation commands (\cite{}, \citep{}, \citet{}, etc.), `extractCitationKeys()` should return all keys referenced in those commands without duplicates.

**Validates: Requirements 2.2**

### Property 3: Unused Citation Detection Correctness

*For any* set of used citation keys and set of defined BibTeX entries, the unused entries should be exactly those entries whose keys are not in the used keys set.

**Validates: Requirements 2.3**

### Property 4: API Key Validation

*For any* string, `validateApiKey()` should return true only if the string is non-empty and has at least 20 characters.

**Validates: Requirements 4.8**

### Property 5: Retry Mechanism Respects Max Retries

*For any* API call that consistently fails, the `AIFormatter` should attempt exactly `maxRetries` times before throwing an error.

**Validates: Requirements 6.5, 6.6**

### Property 6: Entry Deletion Preserves Other Entries

*For any* .bib file content and entry to delete, removing that entry should preserve all other entries unchanged.

**Validates: Requirements 2.6, 3.5**

### Property 7: Format Command Preserves Text on Failure

*For any* selected text, if the AI API call fails, the document text should remain unchanged.

**Validates: Requirements 1.6**

### Property 8: Output Format Correctness

*For any* unused BibEntry, the formatted output string should contain the entry's key, author (if present), and truncated title.

**Validates: Requirements 2.4**

## Error Handling

### Error Classification Strategy

```typescript
// 错误类型枚举（已在aiFormatter.ts中定义）
enum AIErrorType {
    INVALID_API_KEY,   // 401 错误
    NETWORK_ERROR,     // 网络连接失败
    TIMEOUT,           // 请求超时
    API_ERROR,         // 其他API错误
    PARSE_ERROR,       // 响应解析失败
    RATE_LIMIT,        // 429 错误
    UNKNOWN            // 未知错误
}
```

### Error Handling Flow

```
API调用 → 捕获异常 → 分类错误 → 判断是否重试 → 显示用户友好消息
                                    ↓
                              重试（指数退避）
```

### User-Friendly Error Messages

| 错误类型 | 用户消息 | 建议操作 |
|---------|---------|---------|
| INVALID_API_KEY | API Key无效或已过期 | 请在设置中检查并更新您的Anthropic API Key |
| NETWORK_ERROR | 网络连接失败 | 请检查网络连接和代理设置 |
| TIMEOUT | 请求超时 | 请检查网络连接，或在设置中增加超时时间 |
| RATE_LIMIT | API请求过于频繁 | 请稍后再试，或升级您的API配额 |

## Testing Strategy

### Unit Tests

单元测试用于验证具体示例和边界情况：

1. **bibParser.ts 测试**
   - 解析单个条目
   - 解析多个条目
   - 处理嵌套花括号
   - 处理多行字段
   - 处理格式错误的条目

2. **citationScanner.ts 测试**
   - 提取 \cite{key} 中的 key
   - 提取 \citep{key1,key2} 中的多个 keys
   - 处理带可选参数的引用 \cite[p.1]{key}
   - 处理空文件

3. **config.ts 测试**
   - 验证有效的 API key
   - 拒绝空字符串
   - 拒绝过短的字符串

4. **aiFormatter.ts 测试**
   - 清理 markdown 代码块标记
   - 解析 JSON 响应
   - 错误分类

### Property-Based Tests

属性测试用于验证通用属性在所有输入上成立：

- 使用 **fast-check** 库进行属性测试
- 每个属性测试运行至少 100 次迭代
- 每个测试需要注释引用的设计文档属性

```typescript
// 示例：属性测试配置
import fc from 'fast-check';

describe('BibTeX Parser Properties', () => {
    it('Property 1: Round trip preserves entry data', () => {
        fc.assert(
            fc.property(
                arbitraryBibEntry(),
                (entry) => {
                    const serialized = serializeBibEntry(entry);
                    const parsed = parseSingleEntry(serialized);
                    return parsed !== null &&
                           parsed.type === entry.type &&
                           parsed.key === entry.key;
                }
            ),
            { numRuns: 100 }
        );
    });
});
```

### Test File Structure

```
src/
├── test/
│   ├── unit/
│   │   ├── bibParser.test.ts
│   │   ├── citationScanner.test.ts
│   │   ├── config.test.ts
│   │   └── aiFormatter.test.ts
│   └── property/
│       ├── bibParser.property.test.ts
│       ├── citationScanner.property.test.ts
│       └── generators.ts  // 自定义生成器
```
