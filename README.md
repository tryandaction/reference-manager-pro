# Reference Manager Pro

🎓 Professional LaTeX bibliography management for VS Code

Streamline your research workflow with Smart Fix, quality validation, and transparent change history.

## ✨ Features

### ✨ Smart Fix (Recommended)
One-click fix for messy BibTeX entries. Uses local rules by default and upgrades to AI when available, with safe fallback.
If DOI is present, Smart Fix can pull official metadata automatically.

### 🔍 Unused Citation Detection
Scan your entire LaTeX project to find citations in your `.bib` file that are never referenced. Clean up your bibliography effortlessly.

### 🔄 Smart Duplicate Removal
Detect duplicate entries (like arXiv preprints and published versions) using AI. Get recommendations on which version to keep.

### ✅ Quality Validation
Check reference quality and surface missing/incorrect fields with a clear confidence score.

### 🧾 Change History
Every automatic edit is recorded and can be rolled back in one click, with source and confidence shown.

### 🔍 Transparent Change Summary
After Smart Fix, you get a concise summary of what changed and a confidence label.
The summary also indicates whether changes came from local rules or AI enhancement.
Official metadata lookups keep your original citation key by default.
When the key is replaced, the old key is preserved as a comment on the entry header.

## 📊 Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Smart Fix (AI enhanced) | 5/day | ✅ Unlimited |
| Validate References | ✅ | ✅ |
| Change History | ✅ | ✅ |
| Find Unused Citations | 3/day | ✅ Unlimited |
| Remove Duplicates | ✅ | ✅ |
| Batch Format All | ❌ | ✅ |

## 🚀 Quick Start

1. Install the extension from VS Code Marketplace
2. (Optional) Enable Smart Fix AI enhancement (Groq recommended - it's free!):
   - Press `Ctrl+,` to open Settings
   - Search for "Reference Manager"
   - Set `AI Provider` to `groq`
   - Get a free API key from [console.groq.com](https://console.groq.com)
   - Enter it in `Groq Api Key`
3. Open a `.bib` file and run `Smart Fix`

### Commands (Simplified)

- `Reference Manager: Smart Fix` - One-click fix for a BibTeX entry (recommended)
- `Reference Manager: Advanced: Smart Fix (Official Raw)` - Official raw BibTeX output (no local normalization)
- `Reference Manager: Advanced: Smart Fix All (Official)` - Batch Smart Fix using official DOI metadata when available
- `Reference Manager: Advanced: Batch Official Fix (Raw)` - Batch official raw BibTeX output
- `Reference Manager: Advanced: Official Metadata Report` - Official metadata availability report
- `Reference Manager: Validate References` - Check reference quality and highlight issues
- `Reference Manager: History` - View and rollback recent changes
- `Reference Manager: Advanced: Format Entry (AI)` - Format selected entry with AI
- `Reference Manager: Advanced: Format Entry (Local)` - Format with local rules (free, unlimited)
- `Reference Manager: Advanced: Find Unused Citations` - Scan workspace for unused references
- `Reference Manager: Advanced: Remove Duplicate Entries` - Find and remove duplicates
- `Reference Manager: Advanced: Format All Entries (Pro)` - Batch format entire file
- `Reference Manager: Activate License` - Enter your Pro license key
- `Reference Manager: View License Status` - Check your current plan

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `referenceManager.aiProvider` | AI provider (groq/anthropic) | groq |
| `referenceManager.groqApiKey` | Groq API key (free!) | - |
| `referenceManager.apiKey` | Anthropic API key | - |
| `referenceManager.groqModel` | Groq model | llama-3.3-70b-versatile |
| `referenceManager.model` | Anthropic model | claude-sonnet-4-20250514 |
| `referenceManager.licenseKey` | Pro license key | - |
| `referenceManager.maxRetries` | Max API retry attempts | 3 |
| `referenceManager.timeout` | API timeout (ms) | 30000 |
| `referenceManager.officialMetadata.enabled` | Enable official DOI metadata lookup | true |
| `referenceManager.officialMetadata.timeout` | DOI lookup timeout (ms) | 8000 |
| `referenceManager.officialMetadata.formatMode` | Official formatting mode (normalized/raw) | normalized |
| `referenceManager.officialMetadata.keyPolicy` | Cite key policy (preserve/officialWhenUnused/officialAlways) | officialWhenUnused |

## ✅ Trust & Transparency

- Smart Fix never hides changes: every edit is tracked and reversible
- Validation highlights missing/incorrect fields so you know what to trust
- AI is an enhancement layer, not a blind overwrite

## 💡 Tips

- **Use Groq (Free!)**: Get a free API key at [console.groq.com](https://console.groq.com) - fast and unlimited
- **Or Anthropic**: Visit [console.anthropic.com](https://console.anthropic.com) for Claude (new users get $5 free)
- **Upgrade to Pro**: Purchase a license at [Gumroad](https://gumroad.com/l/reference-manager-pro) for unlimited AI features
- **Use Local Format**: When offline or to save API calls, use the local formatting option

## 📝 Changelog

### v0.3.0
- **批量官方修复大幅增强**：Citation Key 生成支持所有主流期刊（覆盖率从 ~10% 提升到 ~100%）
- **期刊缩写完善**：从 2 个扩展到 40+ 个主流期刊的标准缩写
- **旧 key 注释修复**：key 替换后正确添加 `% oldkey: xxx` 注释
- **标题保护词增强**：新增物理学专有名词自动保护

### v0.2.9
- Official key policy (preserve / when-unused / always replace)
- Smart Fix notes when official metadata is unavailable

### v0.2.8
- Smart Fix All (Official) for batch DOI-based correction
- Validation detects duplicate DOI/key entries

### v0.2.7
- Smart Fix fetches official metadata by DOI (keeps original cite key)
- Summary and History now show official source and confidence

### v0.2.6
- Smart Fix unified entry with safe AI fallback
- Quality validation with confidence score and concise output
- Change history with rollback and source/confidence labels

### v0.2.1
- Added fetch polyfill for older VS Code hosts (fixes Groq/Anthropic calls)
- Local & AI formatting now produce standardized academic output (normalized authors/field order/pages/DOI)
- Duplicate check now guards against huge .bib files; unused-citation scan warns when no .tex citations

### v0.2.2
- Added integration smoke tests (`npm run test:integration`) to ensure core commands run end-to-end
- Improved observability with OutputChannel logs for key commands and failures

### v0.2.3
- Added one-click batch local formatting for the whole `.bib` file (`Format All Entries (Local)`)
- Batch AI formatting now writes back safely by entry ranges and falls back to local formatting per-entry on failure

### v0.2.4
- One-click single-entry formatting: no selection required (cursor inside an entry is enough)
- Added onCommand activation events for more reliable command execution

### v0.2.5
- Local formatting is now configurable (author normalization, title protected words, journal abbreviation mapping)
- AI formatting post-processing uses the same local rules to keep the whole library consistent

### v0.2.0
- Added Groq AI support (free!)
- Multiple AI provider selection (Groq/Anthropic)
- Groq models: Llama 3.3 70B, Llama 3.1 8B, Mixtral, Gemma 2
- Updated documentation

### v0.1.0
- Initial release
- AI-powered BibTeX formatting
- Unused citation detection
- Smart duplicate removal
- Local offline formatting
- Pro features: batch formatting

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Support

- Report issues on [GitHub](https://github.com/tryandaction/reference-manager-pro/issues)
- Questions? Email 2812149844@qq.com
