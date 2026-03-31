# Reference Manager Pro

Trustworthy BibTeX cleanup and management for academic writing.

Reference Manager Pro runs inside VS Code / Kiro and is built for researchers, students, and paper authors who need more than simple formatting.

## Product Positioning

Many BibTeX tools solve formatting only. Real users usually face a broader workflow problem:

- entries come from mixed and inconsistent sources
- fields are incomplete or noisy
- cite-key changes can break existing `.tex` references
- menus become crowded and unclear
- automated cleanup is hard to review and hard to undo

Reference Manager Pro is designed around that full workflow.

## Core Value

### 1. Trustworthy cleanup, not just formatting

It prefers official DOI metadata first.  
If official data is unavailable, it falls back to local rules and then optional AI enhancement.

### 2. Default actions are immediately understandable

The default surface now exposes the 5 most common actions directly:

- `Smart Fix`
- `Check This Entry`
- `Clean Unused Citations`
- `Smart Fix All`
- `Check This File`

The remaining lower-frequency modes stay under:

- `More Tools`

This means users first see the task they want to do, not the implementation mode behind it.

### 3. Transparent and reversible

Automatic edits are paired with:

- change summaries
- source labels
- history records
- rollback support

## Main Features

### Smart Fix

The default one-click flow for the current entry:

- prefers official DOI metadata
- falls back to local rules
- upgrades to AI when available
- shows a summary and next-step CTA

### Check This Entry

Checks only the current entry for:

- missing fields
- DOI / pages / year format issues
- entry-level quality score

### Clean Unused Citations

Finds bibliography entries that exist in `.bib` but are not referenced by workspace `.tex` files.

### Smart Fix All

Processes the whole current `.bib` file.

### Check This File

Checks issues across the current `.bib` file, not just the current entry.

### More Tools

It is no longer the main surface for high-frequency tasks.  
It now keeps only the remaining lower-frequency modes and advanced tools.

From here you can access:

- official raw mode
- local single-entry formatting
- AI single-entry formatting
- local batch formatting
- AI batch formatting
- duplicate cleanup
- official metadata report
- history and rollback
- experimental workflows

### History & Restore

Inspect automated changes and roll back when needed.

## Default Surface And Presets

- The default context menu keeps the 5 core actions plus `More Tools`
- `referenceManager.ui.preset = minimal`: no extra pinned advanced action
- `referenceManager.ui.preset = review`: pins `History & Restore` by default
- `referenceManager.ui.preset = power`: pins `History & Restore` and `Official Metadata Check`
- `referenceManager.ui.contextMenuPins`: pin up to 2 additional advanced actions

## Recommended Usage

1. Open a `.bib` file
2. Run `Smart Fix`
3. Run `Check This Entry` when you want to inspect one entry
4. Run `Clean Unused Citations` when you want to clean unused entries
5. Run `Smart Fix All` when you want to process the whole file
6. Run `Check This File` when you want to inspect the whole file
7. Open `More Tools` for the remaining advanced modes
8. Use `History & Restore` if you want rollback

## Documentation

- [Bilingual Root README](./README.md)
- [中文版](./README_CN.md)
- [Quick Start](./docs/guides/QUICK_START.md)
- [Key Handling Guide](./docs/guides/KEY_REPLACEMENT_GUIDE.md)
- [Test Guide](./docs/guides/TEST_GUIDE.md)

## Current Version

Current version: `v0.4.0`

Release focus:

- primary actions moved out to the default surface
- `More Tools` reduced to lower-frequency advanced tools
- single-entry and full-file validation separated
- unified cite-key policy
- real validate-on-save and inline diagnostics
