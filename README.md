# Reference Manager Pro

🎓 AI-powered LaTeX bibliography management for VS Code

Streamline your research workflow with intelligent BibTeX formatting, unused citation detection, and duplicate removal.

## ✨ Features

### 🤖 AI-Powered Formatting
Format messy BibTeX entries with one click. AI normalizes author names, journal abbreviations, and field formatting.

### 🔍 Unused Citation Detection
Scan your entire LaTeX project to find citations in your `.bib` file that are never referenced. Clean up your bibliography effortlessly.

### 🔄 Smart Duplicate Removal
Detect duplicate entries (like arXiv preprints and published versions) using AI. Get recommendations on which version to keep.

### 📝 Local Formatting (Free, Unlimited)
Format entries offline using rule-based formatting. No API key required, no usage limits.

## 📊 Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| AI Format Entry | 5/day | ✅ Unlimited |
| Find Unused Citations | 3/day | ✅ Unlimited |
| Remove Duplicates | ✅ | ✅ |
| Local Format | ✅ Unlimited | ✅ Unlimited |
| Batch Format All | ❌ | ✅ |

## 🚀 Quick Start

1. Install the extension from VS Code Marketplace
2. Configure your AI provider (Groq recommended - it's free!):
   - Press `Ctrl+,` to open Settings
   - Search for "Reference Manager"
   - Set `AI Provider` to `groq`
   - Get a free API key from [console.groq.com](https://console.groq.com)
   - Enter it in `Groq Api Key`
3. Open a `.bib` file and start using!

### Commands

- `Reference Manager: Format BibTeX Entry` - Format selected entry with AI
- `Reference Manager: Format BibTeX Entry (Local)` - Format with local rules (free, unlimited)
- `Reference Manager: Find Unused Citations` - Scan workspace for unused references
- `Reference Manager: Remove Duplicate Entries` - Find and remove duplicates
- `Reference Manager: Format All Entries (Pro)` - Batch format entire file
- `Reference Manager: Activate License` - Enter your Pro license key
- `Reference Manager: View License Status` - Check your current plan

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `referenceManager.aiProvider` | AI provider (groq/anthropic) | groq |
| `referenceManager.groqApiKey` | Groq API key (free!) | - |
| `referenceManager.groqModel` | Groq model | llama-3.3-70b-versatile |
| `referenceManager.apiKey` | Anthropic API key | - |
| `referenceManager.model` | Anthropic model | claude-sonnet-4-20250514 |
| `referenceManager.licenseKey` | Pro license key | - |
| `referenceManager.maxRetries` | Max API retry attempts | 3 |
| `referenceManager.timeout` | API timeout (ms) | 30000 |

## 💡 Tips

- **Use Groq (Free!)**: Get a free API key at [console.groq.com](https://console.groq.com) - fast and unlimited
- **Or Anthropic**: Visit [console.anthropic.com](https://console.anthropic.com) for Claude (new users get $5 free)
- **Upgrade to Pro**: Purchase a license at [Gumroad](https://gumroad.com/l/reference-manager-pro) for unlimited AI features
- **Use Local Format**: When offline or to save API calls, use the local formatting option

## 📝 Changelog

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

- Report issues on [GitHub](https://github.com/your-username/reference-manager-pro/issues)
- Questions? Email support@example.com
