# Reference Manager Pro - User Guide

🎓 AI-Powered LaTeX Bibliography Management Tool

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

Reference Manager Pro is a VS Code / Kiro extension designed for academic researchers, students, and authors. It leverages AI technology to simplify BibTeX bibliography management, allowing you to focus on your research.

### Who Is This For?

- 📚 Researchers writing academic papers
- 🎓 Students working on theses and dissertations
- 📝 Authors managing large bibliographies
- 🔬 Scientists using LaTeX for typesetting

### Core Benefits

- **Save Time**: Automatically format messy BibTeX entries
- **Stay Organized**: Detect and clean up unused citations
- **Avoid Duplicates**: Smart detection of duplicate entries (e.g., arXiv preprints vs. published versions)
- **Work Offline**: Local formatting works without internet

---

## Features

### 🤖 AI-Powered Formatting

Use Claude AI to normalize BibTeX entries:
- Standardize author name format (Last, First and Last, First)
- Normalize journal abbreviations (e.g., Physical Review Letters → Phys. Rev. Lett.)
- Auto-complete DOI when inferable
- Standardize page number format (123--456)
- Clean up extra whitespace and line breaks

### 📝 Local Formatting (Free & Unlimited)

Offline formatting without API Key:
- Fix common field name typos (e.g., autor → author)
- Arrange fields in standard order
- Clean up extra whitespace
- Standardize indentation

### 🔍 Unused Citation Detection

Scan your entire LaTeX project to find unreferenced entries in .bib files:
- Support for multiple citation commands (\cite, \citep, \citet, etc.)
- Compatible with natbib and biblatex
- One-click deletion of unused entries
- Detailed statistics display

### 🔄 Smart Duplicate Detection

Use AI to identify duplicate entries:
- Detect arXiv preprints and published versions
- Identify entries with different formats but same content
- AI recommends which version to keep
- Provides reasoning for decisions

### 📦 Batch Formatting (Pro Feature)

Format all entries in a .bib file at once:
- Real-time progress display
- Cancellation support
- Failed entries retain original text
- Processing statistics

---

## Installation

### Method 1: Install from VSIX File

1. Download the `reference-manager-pro-x.x.x.vsix` file
2. Open VS Code or Kiro
3. Press `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
4. Type "Install from VSIX"
5. Select the downloaded .vsix file
6. Reload the window

### Method 2: Install from Marketplace (Coming Soon)

1. Open VS Code Extensions panel (`Ctrl+Shift+X`)
2. Search for "Reference Manager Pro"
3. Click Install

### System Requirements

- VS Code 1.85.0 or higher
- Or Kiro IDE
- (Optional) Anthropic API Key for AI features

---

## Quick Start

### Features Without API Key

Even without an Anthropic API Key, you can use these features:

1. **Local Formatting**
   - Open a .bib file
   - Select the entry to format
   - Press `Ctrl+Shift+P`
   - Type "Reference Manager: Format BibTeX Entry (Local)"
   - Done!

2. **Remove Duplicates** (Basic)
   - Open a .bib file
   - Run "Reference Manager: Remove Duplicate Entries"

### Configure API Key (Enable AI Features)

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up and get your API Key
3. Press `Ctrl+,` in VS Code to open Settings
4. Search for "Reference Manager"
5. Enter your API Key in the `Api Key` field

### Basic Workflow

```
1. Open your LaTeX project
2. Open a .bib file
3. Select the entry to format
4. Ctrl+Shift+P → "Format BibTeX Entry"
5. Review the formatted result
```

---

## Detailed Feature Guide

### Command List

| Command | Description | Requires API Key |
|---------|-------------|------------------|
| Format BibTeX Entry | AI-powered formatting | ✅ |
| Format BibTeX Entry (Local) | Rule-based formatting | ❌ |
| Find Unused Citations | Find unreferenced entries | ✅ |
| Remove Duplicate Entries | Detect and remove duplicates | ✅ |
| Format All Entries (Pro) | Batch format all entries | ✅ |
| Activate License | Activate Pro license | ❌ |
| View License Status | Check license status | ❌ |

### AI Formatting Example

**Before:**
```bibtex
@article{einstein,
author={A. Einstein},
title={On the Electrodynamics of Moving Bodies},
journal={Annalen der Physik},
year=1905,
volume={17},
pages={891-921}
}
```

**After:**
```bibtex
@article{einstein,
  author = {Einstein, Albert},
  title = {On the Electrodynamics of Moving Bodies},
  journal = {Ann. Phys.},
  year = {1905},
  volume = {17},
  pages = {891--921},
  doi = {10.1002/andp.19053221004}
}
```

### Local Formatting Example

**Before:**
```bibtex
@article{key,
autor={John Smith},
  tilte={Some Paper},
year={2024},
journal={Nature}
}
```

**After:**
```bibtex
@article{key,
  author = {John Smith},
  title = {Some Paper},
  journal = {Nature},
  year = {2024},
}
```

### Supported Citation Commands

This extension supports the following LaTeX citation commands:

- Standard: `\cite`
- natbib: `\citep`, `\citet`, `\citeauthor`, `\citeyear`, `\citealt`, `\citealp`
- biblatex: `\parencite`, `\textcite`, `\autocite`, `\footcite`, `\fullcite`
- Others: `\nocite`, `\Cite`, `\Citep`, `\Citet`

---

## Configuration

Search for "Reference Manager" in VS Code settings to find these options:

| Setting | Description | Default |
|---------|-------------|---------|
| `referenceManager.apiKey` | Anthropic API Key | empty |
| `referenceManager.licenseKey` | Pro license key | empty |
| `referenceManager.maxRetries` | Max API retry attempts | 3 |
| `referenceManager.timeout` | API timeout in milliseconds | 30000 |
| `referenceManager.model` | Claude model to use | claude-sonnet-4-20250514 |

---

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| AI Formatting | 5/day | ✅ Unlimited |
| Find Unused Citations | 3/day | ✅ Unlimited |
| Remove Duplicates | ✅ | ✅ |
| Local Formatting | ✅ Unlimited | ✅ Unlimited |
| Batch Formatting | ❌ | ✅ |

### Upgrade to Pro

1. Visit [Gumroad purchase page](https://gumroad.com/l/reference-manager-pro)
2. Complete purchase to get License Key
3. Run "Reference Manager: Activate License" in VS Code
4. Enter your License Key
5. Enjoy unlimited usage!

---

## FAQ

### Q: Can I use it without an Anthropic API Key?

**A:** Yes! Local formatting is completely free and requires no API Key. It can:
- Fix field name typos
- Standardize field order
- Clean up formatting

AI features (smart formatting, unused citation detection, duplicate detection) require an API Key.

### Q: Does the API Key cost money?

**A:** Anthropic provides free credits that are usually sufficient for personal use. Visit [console.anthropic.com](https://console.anthropic.com) for details.

### Q: When does the daily usage limit reset?

**A:** It resets automatically at UTC 0:00 each day.

### Q: What's the Pro License Key format?

**A:** License Keys start with "RMP-" and are at least 20 characters. Example: `RMP-XXXX-XXXX-XXXX-XXXX`

### Q: Which BibTeX entry types are supported?

**A:** All standard types are supported:
- @article
- @book
- @inproceedings
- @conference
- @phdthesis
- @mastersthesis
- @techreport
- @misc
- And more

### Q: Can I use this in Kiro?

**A:** Yes! This extension is fully compatible with Kiro IDE.

---

## Troubleshooting

### Issue: API Call Failed

**Possible causes and solutions:**

1. **Invalid API Key**
   - Check if the API Key in settings is correct
   - Confirm the key hasn't expired

2. **Network Issues**
   - Check your internet connection
   - If using a proxy, ensure it's configured correctly

3. **Request Timeout**
   - Increase the `timeout` value in settings
   - Check network stability

4. **Rate Limiting**
   - Wait a few minutes and retry
   - Consider upgrading your API quota

### Issue: Formatting Results Not Ideal

**Solutions:**
- Ensure you've selected the complete BibTeX entry
- Check if the original entry has severe formatting errors
- Try using local formatting first to clean up basic formatting

### Issue: Citations in .tex Files Not Detected

**Possible causes:**
- .tex files are not in the workspace
- Using unsupported citation commands
- File encoding issues

### Issue: Extension Not Activating

**Solutions:**
1. Make sure you have a .bib or .tex file open
2. Check if the extension is enabled
3. Reload the VS Code window

---

## Support

- 📧 Email: support@example.com
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-username/reference-manager-pro/issues)
- 📖 Changelog: See CHANGELOG.md

---

## License

MIT License - See LICENSE file for details

---

*Reference Manager Pro - Making Bibliography Management Simple* 🎓
