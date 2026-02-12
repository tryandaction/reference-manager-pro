# Reference Manager Pro - User Guide

🎓 Professional LaTeX bibliography manager (Smart Fix + Official Metadata + Rollback)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Detailed Feature Guide](#detailed-feature-guide)
6. [Configuration](#configuration)
7. [Free vs Pro](#free-vs-pro)
8. [FAQ](#faq)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

Reference Manager Pro is a VS Code / Kiro extension for academic researchers and authors. It moves beyond formatting: it prioritizes **official DOI metadata**, adds confidence scores, and keeps every change reversible.

### Core Benefits

- **Official alignment**: fetches publisher BibTeX when DOI is available
- **Minimal friction**: Smart Fix is one click, advanced tools stay hidden
- **Transparent trust**: change summary + confidence + source label
- **Rollback ready**: every auto edit can be undone

---

## Features

### ✨ Smart Fix (Recommended)

One-click fix for a single entry:
- **Prefers official DOI metadata**
- Falls back to local rules if no DOI
- Optional AI enhancement when API key exists
- Change summary + confidence + source label
- Use `Advanced: Smart Fix (Official Raw)` to keep the official BibTeX layout

### 🧰 Smart Fix All (Batch)

Batch fix entire .bib file:
- Pulls official metadata when DOI is available
- Safe fallback to local rules
- Summary of official/local/fail counts
- Use `Advanced: Batch Official Fix (Raw)` to keep the official BibTeX layout

### ✅ Quality Validation (Validate)

Professional validation with scoring:
- Missing required fields
- Invalid year/pages/DOI formats
- **Duplicate DOI / duplicate key**
- Clean output (error/warn only)

### 🧾 Change History (History)

Full audit trail:
- Source labels (official/AI/local)
- Confidence score
- One-click rollback

### 🔍 Advanced Tools

- Unused citation detection
- AI duplicate detection
- Batch formatting (Pro)
- Official metadata availability report

---

## Installation

### Method 1: Install from VSIX

1. Download `reference-manager-pro-x.x.x.vsix`
2. Open VS Code / Kiro
3. `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
4. Type "Install from VSIX"
5. Select the .vsix file
6. Reload the window

### Method 2: Marketplace (Coming Soon)

1. Open Extensions panel (`Ctrl+Shift+X`)
2. Search "Reference Manager Pro"
3. Click Install

---

## Quick Start

### No API Key Needed (Recommended)

1. Open a `.bib` file  
2. Run `Reference Manager: Smart Fix`  
3. For batch: `Advanced: Smart Fix All (Official)` or `Advanced: Batch Official Fix (Raw)`  
4. Run `Validate References` to check quality  

### Enable AI Enhancement (Optional)

We recommend Groq (free and fast):

1. Visit [console.groq.com](https://console.groq.com)
2. Get an API Key
3. In VS Code settings, search "Reference Manager"
4. Set `AI Provider` to `groq`
5. Paste your `Groq Api Key`

---

## Detailed Feature Guide

### Command List (Simplified)

| Command | Description |
|---------|-------------|
| Smart Fix | One-click fix for a single entry |
| Advanced: Smart Fix (Official Raw) | Official raw BibTeX (no local normalization) |
| Advanced: Smart Fix All (Official) | Batch official fix |
| Advanced: Batch Official Fix (Raw) | Batch official raw BibTeX |
| Advanced: Official Metadata Report | Official metadata availability report |
| Validate References | Quality validation and scoring |
| History | Change history and rollback |
| Advanced: Find Unused Citations | Unused citations |
| Advanced: Remove Duplicate Entries | AI duplicate detection |
| Advanced: Format Entry (Local/AI) | Legacy formatting |
| Advanced: Format All Entries (Pro) | Batch format |

### Recommended Workflow

```
.bib → Smart Fix → Validate → (if needed) History rollback
```

---

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `referenceManager.aiProvider` | AI provider | groq |
| `referenceManager.groqApiKey` | Groq API key | empty |
| `referenceManager.apiKey` | Anthropic API key | empty |
| `referenceManager.officialMetadata.enabled` | Enable official DOI lookup | true |
| `referenceManager.officialMetadata.timeout` | DOI lookup timeout (ms) | 8000 |
| `referenceManager.officialMetadata.keyPolicy` | Cite key policy | officialWhenUnused |
| `referenceManager.officialMetadata.formatMode` | Official formatting mode (normalized/raw) | normalized |
| `referenceManager.validation.strictness` | Validation strictness | normal |

Advanced formatting options (optional):
`referenceManager.localFormat.*`

---

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Smart Fix (official metadata) | ✅ | ✅ |
| AI enhancement | 5/day | ✅ Unlimited |
| Validate / History | ✅ | ✅ |
| Unused citations | 3/day | ✅ Unlimited |
| Batch formatting | ❌ | ✅ |

---

## FAQ

### Q: Why didn't Smart Fix "fix" my entry?

**A:** If DOI is missing or official lookup fails, Smart Fix falls back to local rules only. Add DOI and retry.

### Q: Will Smart Fix change my cite key?

**A:** Default policy is `officialWhenUnused` (replace only when the key is not used in .tex). You can set it to preserve or always replace in settings.
If replaced, the old key is appended as a comment on the entry header.

### Q: Why do I see duplicate DOI/Key warnings?

**A:** The same paper appears multiple times. Use `Remove Duplicate Entries` to clean.

---

## Troubleshooting

### Official metadata lookup failed

Possible causes:
- Invalid DOI
- Network timeout
- Remote access restrictions

Fixes:
- Check DOI format
- Increase `officialMetadata.timeout`
- Temporarily disable official metadata lookup

---

## Support

- 📧 Email: 2812149844@qq.com
- 🐛 GitHub Issues: https://github.com/tryandaction/reference-manager-pro/issues

---

*Reference Manager Pro - Trustworthy bibliography management* 🎓
