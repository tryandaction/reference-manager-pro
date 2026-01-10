# Requirements Document

## Introduction

Reference Manager Pro 是一个 VS Code 插件，旨在帮助科研人员管理 LaTeX 参考文献。该插件利用 AI（Anthropic Claude API）提供智能格式化、未使用引用检测和重复条目去重功能，提升科研写作效率。

### 商业化策略（低成本优先）
- **API 成本**：用户自带 Anthropic API Key（零成本）
- **收款平台**：Gumroad（简单，支持中国收款）
- **付费模式**：一次性买断 $9.99（解锁高级功能）
- **推广策略**：先免费获取用户和好评，再推付费版

## Glossary

- **Extension**: VS Code 插件，提供 BibTeX 管理功能
- **BibTeX_Entry**: 单个文献条目，如 @article{key, author={...}, title={...}}
- **Citation_Key**: 引用标识符，用于 \cite{key} 命令
- **AI_Formatter**: 封装 Anthropic Claude API 的模块，负责智能格式化和重复检测
- **Citation_Scanner**: 扫描 .tex 文件提取引用 key 的模块
- **Bib_Parser**: 解析 .bib 文件内容的模块
- **Progress_Notification**: VS Code 进度通知，显示操作进度
- **Output_Panel**: VS Code 输出面板，用于显示检测结果

## Requirements

### Requirement 1: 智能格式化 BibTeX 条目

**User Story:** As a researcher, I want to format messy BibTeX entries using AI, so that my bibliography maintains consistent formatting standards.

#### Acceptance Criteria

1. WHEN a user selects BibTeX text and triggers the format command, THE Extension SHALL send the selected text to AI_Formatter for processing
2. WHEN AI_Formatter returns formatted text, THE Extension SHALL replace the selected text with the formatted result
3. WHEN the format operation starts, THE Extension SHALL display a Progress_Notification with "Formatting BibTeX entry..." message
4. WHEN the format operation succeeds, THE Extension SHALL display a success notification with "✅ Entry formatted!" message
5. IF the AI API call fails, THEN THE Extension SHALL display an error notification with the error message and suggestion
6. IF the AI API call fails, THEN THE Extension SHALL NOT modify the original selected text
7. WHEN no text is selected, THE Extension SHALL show a warning message prompting user to select text
8. THE AI_Formatter SHALL normalize journal names to standard abbreviations (e.g., Physical Review Letters → Phys. Rev. Lett.)
9. THE AI_Formatter SHALL unify author format to "Last, First" style
10. THE AI_Formatter SHALL remove excessive whitespace and line breaks

### Requirement 2: 检测未使用的引用

**User Story:** As a researcher, I want to find citations in my .bib file that are never used in .tex files, so that I can clean up my bibliography.

#### Acceptance Criteria

1. WHEN a user triggers the find unused citations command, THE Citation_Scanner SHALL scan all .tex files in the workspace
2. WHEN scanning .tex files, THE Citation_Scanner SHALL extract all citation keys from \cite{}, \citep{}, \citet{}, and other citation commands
3. WHEN scanning is complete, THE Extension SHALL compare extracted keys with entries in .bib files
4. WHEN unused entries are found, THE Extension SHALL display them in the Output_Panel with format "⚠️ Unused: {key} ({author}, \"{title}...\")"
5. WHEN unused entries are found, THE Extension SHALL ask user if they want to delete these entries
6. IF user confirms deletion, THEN THE Extension SHALL remove the unused entries from the .bib file
7. WHEN the scan operation starts, THE Extension SHALL display a Progress_Notification showing scan progress
8. IF no .tex files are found in workspace, THEN THE Extension SHALL display a warning message
9. IF no .bib files are found in workspace, THEN THE Extension SHALL display a warning message
10. WHEN all citations are used, THE Extension SHALL display a success message "✅ All citations are in use!"

### Requirement 3: 智能去重

**User Story:** As a researcher, I want to identify and remove duplicate BibTeX entries (like arXiv preprints and published versions), so that my bibliography stays clean.

#### Acceptance Criteria

1. WHEN a user triggers the remove duplicates command, THE Bib_Parser SHALL parse all entries from the active .bib file
2. WHEN entries are parsed, THE Extension SHALL compare each pair of entries using AI_Formatter.checkDuplicate()
3. WHEN AI determines two entries are duplicates, THE Extension SHALL display both entries and the AI's recommendation
4. WHEN duplicates are found, THE Extension SHALL ask user to confirm which entry to keep
5. IF user confirms removal, THEN THE Extension SHALL delete the duplicate entry from the .bib file
6. WHEN the deduplication operation starts, THE Extension SHALL display a Progress_Notification showing progress
7. WHEN no duplicates are found, THE Extension SHALL display a success message "✅ No duplicates found!"
8. IF AI API call fails during comparison, THEN THE Extension SHALL skip that pair and continue with others
9. THE AI_Formatter SHALL prefer keeping officially published versions over preprints (e.g., journal article over arXiv)
10. WHEN deduplication completes, THE Extension SHALL display summary "Removed {n} duplicate entries"

### Requirement 4: 配置管理

**User Story:** As a user, I want to configure the extension settings, so that I can use my own API key and customize behavior.

#### Acceptance Criteria

1. THE Extension SHALL read API key from VS Code settings (referenceManager.apiKey)
2. THE Extension SHALL read max retries from VS Code settings (referenceManager.maxRetries)
3. THE Extension SHALL read timeout from VS Code settings (referenceManager.timeout)
4. THE Extension SHALL read model selection from VS Code settings (referenceManager.model)
5. IF API key is not configured, THEN THE Extension SHALL display a warning with "打开设置" action
6. WHEN user clicks "打开设置", THE Extension SHALL open VS Code settings page focused on API key setting
7. WHEN configuration changes, THE Extension SHALL update AI_Formatter with new settings
8. THE Extension SHALL validate API key format before making API calls

### Requirement 5: 用户体验

**User Story:** As a user, I want clear feedback during operations, so that I know what the extension is doing.

#### Acceptance Criteria

1. WHEN any operation takes longer than 2 seconds, THE Extension SHALL display a Progress_Notification
2. WHEN an operation succeeds, THE Extension SHALL display a green ✅ notification
3. WHEN an operation fails, THE Extension SHALL display a red ❌ notification with error details and suggestions
4. THE Extension SHALL provide right-click context menu for "Format BibTeX Entry" in .bib files
5. THE Extension SHALL register all commands in the command palette with "Reference Manager" category
6. WHEN processing multiple entries, THE Extension SHALL show progress as "Processing {current}/{total}..."

### Requirement 6: 错误处理

**User Story:** As a user, I want helpful error messages when something goes wrong, so that I can troubleshoot issues.

#### Acceptance Criteria

1. IF API key is invalid, THEN THE Extension SHALL display "API Key无效或已过期" with suggestion to check settings
2. IF network connection fails, THEN THE Extension SHALL display "网络连接失败" with suggestion to check network
3. IF request times out, THEN THE Extension SHALL display "请求超时" with suggestion to increase timeout
4. IF rate limit is exceeded, THEN THE Extension SHALL display "API请求过于频繁" with suggestion to wait
5. THE AI_Formatter SHALL implement retry mechanism with exponential backoff (2s, 4s, 8s...)
6. THE AI_Formatter SHALL retry up to maxRetries times before failing


### Requirement 7: 免费版功能限制

**User Story:** As a free user, I want to try the core features with reasonable limits, so that I can evaluate the extension before purchasing.

#### Acceptance Criteria

1. THE Extension SHALL track daily usage count for AI-powered features in VS Code global state
2. WHEN a free user triggers format command, THE Extension SHALL check if daily limit (5 times) is reached
3. WHEN a free user triggers find unused command, THE Extension SHALL check if daily limit (3 times) is reached
4. WHEN daily limit is reached, THE Extension SHALL display "今日免费次数已用完" with upgrade prompt
5. THE Extension SHALL reset usage count at midnight (local time)
6. WHEN user has valid license key, THE Extension SHALL bypass all usage limits
7. THE Extension SHALL provide "本地格式化" command that works offline without limits (rule-based, no AI)

### Requirement 8: License Key 验证

**User Story:** As a paying user, I want to enter my license key to unlock all features, so that I can use the extension without limits.

#### Acceptance Criteria

1. THE Extension SHALL read license key from VS Code settings (referenceManager.licenseKey)
2. THE Extension SHALL provide "Activate License" command to enter license key
3. WHEN license key is entered, THE Extension SHALL validate format (starts with "RMP-", 20+ characters)
4. WHEN license key is valid format, THE Extension SHALL store it in VS Code settings
5. WHEN license key is stored, THE Extension SHALL display "✅ License activated!" message
6. IF license key format is invalid, THEN THE Extension SHALL display "License Key 格式无效"
7. THE Extension SHALL check license status on startup and cache result
8. THE Extension SHALL provide "View License Status" command showing current plan (Free/Pro)

### Requirement 9: 本地离线格式化（免费无限制）

**User Story:** As a user without API key or internet, I want to format BibTeX entries using local rules, so that I can still use basic formatting.

#### Acceptance Criteria

1. THE Extension SHALL provide "Format BibTeX (Local)" command that works without API
2. WHEN local format is triggered, THE Extension SHALL apply rule-based formatting:
   - Normalize field order (author, title, journal, year, ...)
   - Remove excessive whitespace
   - Unify bracket style to {}
   - Fix common typos in field names (autor → author)
3. THE Local_Formatter SHALL NOT require API key or internet connection
4. THE Local_Formatter SHALL have no usage limits
5. WHEN local format succeeds, THE Extension SHALL display "✅ Entry formatted (local mode)"

### Requirement 10: 批量格式化（Pro 功能）

**User Story:** As a Pro user, I want to format all entries in a .bib file at once, so that I can save time on large bibliographies.

#### Acceptance Criteria

1. THE Extension SHALL provide "Format All Entries" command (Pro only)
2. WHEN batch format is triggered, THE Extension SHALL check license status
3. IF user is not Pro, THEN THE Extension SHALL display upgrade prompt
4. WHEN batch format starts, THE Extension SHALL parse all entries from active .bib file
5. WHEN processing entries, THE Extension SHALL show progress "Formatting {current}/{total}..."
6. THE Extension SHALL format entries sequentially with 500ms delay to avoid rate limits
7. WHEN batch format completes, THE Extension SHALL display "✅ Formatted {n} entries"
8. IF any entry fails, THE Extension SHALL continue with others and report failures at end

### Requirement 11: Marketplace 优化

**User Story:** As a potential user browsing VS Code Marketplace, I want to see clear feature descriptions and demos, so that I can decide to install.

#### Acceptance Criteria

1. THE Extension SHALL have a compelling README with:
   - Clear feature list with emoji icons
   - GIF demos for each main feature
   - Comparison table (Free vs Pro)
   - Quick start guide
2. THE Extension SHALL have optimized keywords for search discovery
3. THE Extension SHALL have a professional icon (128x128 PNG)
4. THE Extension SHALL have changelog documenting updates
5. THE Extension SHALL request user ratings after 10 successful operations
