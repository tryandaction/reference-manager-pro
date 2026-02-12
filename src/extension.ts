/**
 * Reference Manager Pro - VS Code Extension 主入口
 *
 * 这是插件的入口文件，VS Code会在插件激活时调用activate函数
 * 在这里我们注册所有的命令和事件监听器
 */

import * as vscode from 'vscode';
import { AIFormatter, AIError } from './aiFormatter';
import { parseBibFile, parseSingleEntry, serializeBibEntry, BibEntry, getEntryDescription } from './bibParser';
import { scanWorkspaceForCitations, findBibFiles, findTexFiles } from './citationScanner';
import { getConfig, ensureConfigured, onConfigChange, OfficialKeyPolicy, OfficialFormatMode } from './config';
import { ChangeHistory } from './changeHistory';
import { validateEntries, EntryValidationResult } from './metadataValidator';
import { resolveOfficialBibtexFromEntry, extractDoiFromEntryText } from './metadataResolver';
import {
    initLicenseModule,
    checkFormatUsageLimit,
    checkFindUnusedUsageLimit,
    incrementFormatUsage,
    incrementFindUnusedUsage,
    showUpgradePrompt,
    activateLicense,
    viewLicenseStatus,
    getLicenseStatus,
    trackSuccessAndMaybeRequestRating
} from './license';
import { formatBibEntryLocalWithOptions } from './localFormatter';

/** AI格式化器实例 */
let formatter: AIFormatter | null = null;

/** 输出面板 */
let outputChannel: vscode.OutputChannel | null = null;

/** 变更历史 */
let changeHistory: ChangeHistory | null = null;

interface ChangeMeta {
    source?: 'local' | 'ai' | 'official' | 'system';
    confidence?: number | null;
}
/**
 * 重复条目对接口
 */
interface DuplicatePair {
    entry1: BibEntry;
    entry2: BibEntry;
    keepEntry: 'entry1' | 'entry2';
    reason: string;
}

/** 避免在巨大 .bib 文件上做 O(n^2) 的 AI 去重比较 */
const MAX_DUPLICATE_ENTRIES = 80;

function buildFormattedBibFileContent(
    content: string,
    entries: BibEntry[],
    formatEntry: (entry: BibEntry) => string
): string {
    if (entries.length === 0) {
        return content;
    }

    const ordered = [...entries].sort((a, b) => a.startIndex - b.startIndex);
    let cursor = 0;
    let out = '';

    for (let i = 0; i < ordered.length; i++) {
        const entry = ordered[i]!;
        const next = ordered[i + 1];

        out += content.slice(cursor, entry.startIndex);
        out += formatEntry(entry).trim();

        cursor = entry.endIndex + 1;

        if (next) {
            const between = content.slice(cursor, next.startIndex);
            // 如果两条条目之间只有空白，则标准化为一个空行
            out += between.trim().length === 0 ? '\n\n' : between;
            cursor = next.startIndex;
        }
    }

    out += content.slice(cursor);
    // 统一文件末尾换行
    return out.replace(/\s*$/, '\n');
}

/**
 * 获取或创建输出面板
 */
function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Reference Manager Pro');
    }
    return outputChannel;
}

function createChangeId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getShortFileName(path: string): string {
    return path.split(/[/\\]/).pop() ?? path;
}

function truncateValue(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }
    return `${value.slice(0, maxLength - 1)}…`;
}

function compactAuthorValue(value: string): string {
    const parts = value.split(/\s+and\s+/i).map(part => part.trim()).filter(Boolean);
    if (parts.length <= 2) {
        return value;
    }
    return `${parts[0]} and ${parts[1]} et al.`;
}

function compactTitleValue(value: string): string {
    return truncateValue(value, 60);
}

function getConfidenceLabel(score: number): 'High' | 'Medium' | 'Low' {
    if (score >= 85) {
        return 'High';
    }
    if (score >= 65) {
        return 'Medium';
    }
    return 'Low';
}

function formatSourceLabel(source?: 'local' | 'ai' | 'official' | 'system'): string {
    switch (source) {
        case 'ai':
            return 'AI 增强';
        case 'local':
            return '本地规则';
        case 'official':
            return '官方元数据';
        case 'system':
            return '系统操作';
        default:
            return '未知来源';
    }
}

function deriveKeyFromDoi(doi: string): string | null {
    const trimmed = doi
        .trim()
        .replace(/^doi:\s*/i, '')
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');

    // Physical Review 系列 (APS): 10.1103/physrevlett.120.093201 -> PhysRevLett.120.093201
    // 保持 APS 官方的 key 格式
    const prMatch = trimmed.match(/^10\.1103\/(.+)$/i);
    if (prMatch) {
        // 标准化大小写：physrevlett -> PhysRevLett
        const suffix = prMatch[1]!;
        const normalized = suffix.replace(/^(physrev[a-z]*|revmodphys|prx[a-z]*)/i, (m) => {
            const map: Record<string, string> = {
                'physrevlett': 'PhysRevLett',
                'physreva': 'PhysRevA',
                'physrevb': 'PhysRevB',
                'physrevc': 'PhysRevC',
                'physrevd': 'PhysRevD',
                'physreve': 'PhysRevE',
                'physrevx': 'PhysRevX',
                'physrevapplied': 'PhysRevApplied',
                'physrevresearch': 'PhysRevResearch',
                'physrevfluids': 'PhysRevFluids',
                'physrevmaterials': 'PhysRevMaterials',
                'physrevaccelbeams': 'PhysRevAccelBeams',
                'physrevphyseducres': 'PhysRevPhysEducRes',
                'revmodphys': 'RevModPhys',
                'prxquantum': 'PRXQuantum',
                'prxenergy': 'PRXEnergy',
                'prxlife': 'PRXLife',
            };
            return map[m.toLowerCase()] ?? m;
        });
        return normalized;
    }

    // Nature 系列 (Springer Nature): 10.1038/s41586-023-05740-2 -> Nature:s41586-023-05740-2
    const natureMatch = trimmed.match(/^10\.1038\/(.+)$/i);
    if (natureMatch) {
        return `Nature:${natureMatch[1]}`;
    }

    // Optica/OSA 系列: 10.1364/optica.397235 -> Optica:optica.397235
    const opticaMatch = trimmed.match(/^10\.1364\/(.+)$/i);
    if (opticaMatch) {
        return `Optica:${opticaMatch[1]}`;
    }

    // IOP Publishing: 10.1088/2058-9565/ab8962 -> IOP:2058-9565/ab8962
    const iopMatch = trimmed.match(/^10\.1088\/(.+)$/i);
    if (iopMatch) {
        return `IOP:${iopMatch[1]}`;
    }

    // Elsevier: 10.1016/0370-2693(81)90590-6 -> Elsevier:0370-2693(81)90590-6
    const elsevierMatch = trimmed.match(/^10\.1016\/(.+)$/i);
    if (elsevierMatch) {
        return `Elsevier:${elsevierMatch[1]}`;
    }

    // AIP Publishing: 10.1063/1.4938164 -> AIP:1.4938164
    const aipMatch = trimmed.match(/^10\.1063\/(.+)$/i);
    if (aipMatch) {
        return `AIP:${aipMatch[1]}`;
    }

    // Springer (非 Nature): 10.1007/s00340-003-1337-x -> Springer:s00340-003-1337-x
    const springerMatch = trimmed.match(/^10\.1007\/(.+)$/i);
    if (springerMatch) {
        return `Springer:${springerMatch[1]}`;
    }

    // ACS (American Chemical Society): 10.1021/acs.nanolett.9b03512 -> ACS:acs.nanolett.9b03512
    const acsMatch = trimmed.match(/^10\.1021\/(.+)$/i);
    if (acsMatch) {
        return `ACS:${acsMatch[1]}`;
    }

    // Science/AAAS: 10.1126/science.xxx -> Science:science.xxx
    const scienceMatch = trimmed.match(/^10\.1126\/(.+)$/i);
    if (scienceMatch) {
        return `Science:${scienceMatch[1]}`;
    }

    // Wiley: 10.1002/xxx -> Wiley:xxx
    const wileyMatch = trimmed.match(/^10\.1002\/(.+)$/i);
    if (wileyMatch) {
        return `Wiley:${wileyMatch[1]}`;
    }

    // IEEE: 10.1109/xxx -> IEEE:xxx
    const ieeeMatch = trimmed.match(/^10\.1109\/(.+)$/i);
    if (ieeeMatch) {
        return `IEEE:${ieeeMatch[1]}`;
    }

    // arXiv: 10.48550/arxiv.xxx -> arXiv:xxx
    const arxivMatch = trimmed.match(/^10\.48550\/arxiv\.(.+)$/i);
    if (arxivMatch) {
        return `arXiv:${arxivMatch[1]}`;
    }

    // 通用格式：使用 DOI 前缀作为出版商标识
    // 10.xxxx/suffix -> DOI:10.xxxx/suffix (替换 / 为 :)
    return `DOI:${trimmed.replace(/\//g, ':')}`;
}

function appendKeyComment(entryText: string, oldKey: string): string {
    const lines = entryText.split('\n');
    if (lines.length === 0) {
        return entryText;
    }
    const firstLine = lines[0] ?? '';
    if (firstLine.includes('oldkey:')) {
        return entryText;
    }
    lines[0] = `${firstLine} % oldkey: ${oldKey}`;
    return lines.join('\n');
}

function replaceEntryKeyRaw(entryText: string, newKey: string): string {
    const entryStart = /^(\s*@\w+\s*\{)\s*[^,\s]+(\s*,)/m;
    if (!entryStart.test(entryText)) {
        return entryText;
    }
    return entryText.replace(entryStart, `$1${newKey}$2`);
}

function escapeMarkdownCell(value: string): string {
    return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function truncateText(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }
    if (maxLength <= 3) {
        return value.slice(0, maxLength);
    }
    return value.slice(0, maxLength - 3) + '...';
}

interface OfficialReportRow {
    index: number;
    key: string;
    title: string;
    doi: string;
    status: 'OK' | 'NO_DOI' | 'FAILED' | 'SKIPPED';
    note: string;
}

function buildOfficialReportMarkdown(
    fileName: string,
    rows: OfficialReportRow[],
    summary: { total: number; ok: number; noDoi: number; failed: number; skipped: number },
    options: { timeoutMs: number; formatMode: OfficialFormatMode; officialEnabled: boolean }
): string {
    const lines: string[] = [];
    const now = new Date().toISOString();

    lines.push('# Official Metadata Report');
    lines.push('');
    lines.push(`- File: ${fileName}`);
    lines.push(`- Generated: ${now}`);
    lines.push(`- Timeout: ${options.timeoutMs} ms`);
    lines.push(`- Official format mode: ${options.formatMode}`);
    lines.push(`- officialMetadata.enabled: ${options.officialEnabled}`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    lines.push('| Total | Official OK | No DOI | Failed | Skipped |');
    lines.push('|---:|---:|---:|---:|---:|');
    lines.push(`| ${summary.total} | ${summary.ok} | ${summary.noDoi} | ${summary.failed} | ${summary.skipped} |`);
    lines.push('');

    lines.push('## Entries');
    lines.push('');
    lines.push('| # | Key | Title | DOI | Official | Note |');
    lines.push('|---:|---|---|---|---|---|');

    const maxTitle = 80;
    for (const row of rows) {
        const title = escapeMarkdownCell(truncateText(row.title, maxTitle));
        const key = escapeMarkdownCell(row.key);
        const doi = escapeMarkdownCell(row.doi);
        const note = escapeMarkdownCell(row.note);
        lines.push(`| ${row.index} | ${key} | ${title} | ${doi} | ${row.status} | ${note} |`);
    }

    lines.push('');
    lines.push('## Notes');
    lines.push('');
    lines.push('- `OK`: 官方 DOI 入口返回了 BibTeX');
    lines.push('- `NO_DOI`: 条目中未识别到 DOI');
    lines.push('- `FAILED`: DOI 存在但官方获取失败（可能是网络、超时、DOI 无效或出版商限制）');
    lines.push('- `SKIPPED`: 处理中断或被取消');
    lines.push('');

    return lines.join('\n');
}

async function resolveKeyPolicyDecision(
    policy: OfficialKeyPolicy,
    originalKey: string,
    officialKey: string,
    existingKeys: Set<string>
): Promise<{ useOfficial: boolean; reason?: string; usedKeys?: Set<string> }> {
    if (policy === 'preserve') {
        return { useOfficial: false, reason: '保持原引用 key' };
    }

    const canScan = Boolean(vscode.workspace.workspaceFolders);
    const usedKeys = policy === 'officialWhenUnused' || policy === 'officialAlways'
        ? (canScan ? await scanWorkspaceForCitations() : undefined)
        : undefined;

    if (policy === 'officialWhenUnused' && usedKeys?.has(originalKey)) {
        return { useOfficial: false, reason: '原 key 已在 .tex 中使用', usedKeys };
    }
    if (policy === 'officialWhenUnused' && !usedKeys) {
        return { useOfficial: false, reason: '未检测到工作区，保留原 key', usedKeys };
    }

    if (existingKeys.has(officialKey) && officialKey !== originalKey) {
        return { useOfficial: false, reason: '官方 key 与现有条目冲突', usedKeys };
    }

    return { useOfficial: true, usedKeys };
}

function buildEntryDiffSummary(
    beforeText: string,
    afterText: string,
    includeValues: boolean
): string[] {
    const beforeEntry = parseSingleEntry(beforeText);
    const afterEntry = parseSingleEntry(afterText);
    if (!beforeEntry || !afterEntry) {
        return ['已执行格式化（无法生成字段级摘要）'];
    }

    const lines: string[] = [];
    const allFields = new Set([
        ...Object.keys(beforeEntry.fields),
        ...Object.keys(afterEntry.fields),
    ]);

    const sortedFields = Array.from(allFields).sort();
    const primaryFields = new Set(['author', 'title', 'journal', 'booktitle', 'year', 'doi']);
    const primary: string[] = [];
    const secondary: string[] = [];

    for (const field of sortedFields) {
        if (primaryFields.has(field)) {
            primary.push(field);
        } else {
            secondary.push(field);
        }
    }

    const orderedFields = [...primary, ...secondary];
    const maxValueLength = 80;
    const maxLines = 8;
    let secondaryChanges = 0;

    for (const field of orderedFields) {
        const beforeValue = beforeEntry.fields[field];
        const afterValue = afterEntry.fields[field];
        if (beforeValue === afterValue) {
            continue;
        }
        const isSecondary = !primaryFields.has(field);
        if (isSecondary) {
            secondaryChanges++;
        }

        if (beforeValue === undefined && afterValue !== undefined) {
            if (!isSecondary && lines.length < maxLines) {
                let value = includeValues ? truncateValue(afterValue, maxValueLength) : '';
                if (field === 'author') {
                    value = compactAuthorValue(value);
                }
                if (field === 'title') {
                    value = compactTitleValue(value);
                }
                lines.push(includeValues ? `+ ${field}: ${value}` : `+ ${field} 已添加`);
            }
            continue;
        }
        if (beforeValue !== undefined && afterValue === undefined) {
            if (!isSecondary && lines.length < maxLines) {
                let value = includeValues ? truncateValue(beforeValue, maxValueLength) : '';
                if (field === 'author') {
                    value = compactAuthorValue(value);
                }
                if (field === 'title') {
                    value = compactTitleValue(value);
                }
                lines.push(includeValues ? `- ${field}: ${value}` : `- ${field} 已移除`);
            }
            continue;
        }
        if (!isSecondary && lines.length < maxLines) {
            let beforeShort = includeValues ? truncateValue(beforeValue ?? '', maxValueLength) : '';
            let afterShort = includeValues ? truncateValue(afterValue ?? '', maxValueLength) : '';
            if (field === 'author') {
                beforeShort = compactAuthorValue(beforeShort);
                afterShort = compactAuthorValue(afterShort);
            }
            if (field === 'title') {
                beforeShort = compactTitleValue(beforeShort);
                afterShort = compactTitleValue(afterShort);
            }
            lines.push(includeValues ? `~ ${field}: ${beforeShort} → ${afterShort}` : `~ ${field} 已更新`);
        }
    }

    if (secondaryChanges > 0) {
        lines.push(`… 另有 ${secondaryChanges} 个非关键字段变更`);
    }

    if (lines.length === 0) {
        lines.push('未检测到字段级变化');
    }
    return lines;
}

function extractEntryKey(text: string): string | null {
    const entry = parseSingleEntry(text);
    return entry ? entry.key : null;
}

function renderSmartFixSummary(
    label: string,
    beforeText: string,
    afterText: string,
    score: number | null,
    source: 'local' | 'ai' | 'official',
    notes?: string[]
): void {
    const channel = getOutputChannel();
    channel.show(true);
    channel.appendLine('───────────────────────────────────────────────────────────');
    const entryKey = extractEntryKey(afterText) ?? extractEntryKey(beforeText);
    const keyPart = entryKey ? ` · ${entryKey}` : '';
    channel.appendLine(`✨ Smart Fix 摘要: ${label}${keyPart}`);
    channel.appendLine(`🧩 来源: ${formatSourceLabel(source)}`);

    if (score !== null) {
        const confidence = getConfidenceLabel(score);
        channel.appendLine(`🎯 可信度: ${confidence} (${score}/100)`);
    }

    const lines = buildEntryDiffSummary(beforeText, afterText, true);
    for (const line of lines) {
        channel.appendLine(`  ${line}`);
    }

    if (notes && notes.length > 0) {
        channel.appendLine('  —');
        for (const note of notes) {
            channel.appendLine(`  ${note}`);
        }
    }
    channel.appendLine('');
}

async function applyEditorEditWithHistory(
    editor: vscode.TextEditor,
    label: string,
    edit: (editBuilder: vscode.TextEditorEdit) => void,
    meta?: ChangeMeta
): Promise<void> {
    const before = editor.document.getText();
    await editor.edit(edit);
    const after = editor.document.getText();
    if (before !== after && changeHistory) {
        changeHistory.add({
            id: createChangeId(),
            label,
            timestamp: new Date().toISOString(),
            uri: editor.document.uri.toString(),
            before,
            after,
            source: meta?.source,
            confidence: meta?.confidence,
        });
    }
}

function logInfo(message: string): void {
    const oc = getOutputChannel();
    oc.appendLine(`[INFO ${new Date().toISOString()}] ${message}`);
}

function logError(message: string, error?: unknown): void {
    const oc = getOutputChannel();
    oc.appendLine(`[ERROR ${new Date().toISOString()}] ${message}`);
    if (error instanceof Error) {
        oc.appendLine(error.stack ?? error.message);
    } else if (error !== undefined) {
        oc.appendLine(String(error));
    }
    oc.show(true);
}

function getEntryTextAndRange(editor: vscode.TextEditor): { text: string; range: vscode.Range } | null {
    const doc = editor.document;
    const selection = editor.selection;

    // 1) 用户有选中内容：直接用选中内容（但要求看起来像 BibTeX 条目）
    if (!selection.isEmpty) {
        const text = doc.getText(selection);
        if (text.trim()) {
            return { text, range: new vscode.Range(selection.start, selection.end) };
        }
    }

    // 2) 无选中：尝试根据光标位置定位所在条目（真正“一键”）
    const content = doc.getText();
    const cursorOffset = doc.offsetAt(selection.active);
    const parsed = parseBibFile(content);
    const hit = parsed.entries.find(e => cursorOffset >= e.startIndex && cursorOffset <= e.endIndex);
    if (!hit) {
        return null;
    }

    const startPos = doc.positionAt(hit.startIndex);
    const endPos = doc.positionAt(hit.endIndex + 1);
    return { text: hit.rawText, range: new vscode.Range(startPos, endPos) };
}

/**
 * 初始化AI格式化器
 * 根据选择的 AI 提供商检查对应的 API Key
 */
function initFormatter(): AIFormatter | null {
    const config = getConfig();
    
    // 根据 aiProvider 检查对应的 API Key
    if (config.aiProvider === 'groq') {
        if (!config.groqApiKey) {
            return null;
        }
    } else {
        if (!config.apiKey) {
            return null;
        }
    }
    
    return new AIFormatter(config);
}

/**
 * 处理格式化BibTeX条目命令
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.2
 */
async function handleFormatEntry(): Promise<void> {
    logInfo('Command: formatEntry');
    // 1. 获取当前编辑器和选中文本
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件');
        return;
    }

    const target = getEntryTextAndRange(editor);
    if (!target) {
        vscode.window.showWarningMessage('请先选中要格式化的BibTeX条目，或将光标放在条目内部');
        return;
    }

    // 2. 验证选中内容非空 (Req 1.7)
    const text = target.text;

    // 3. 检查使用限制 (Req 7.2)
    if (!await checkFormatUsageLimit()) {
        await showUpgradePrompt('格式化');
        return;
    }

    // 4. 验证配置 (Req 4.5, 4.6)
    if (!await ensureConfigured()) {
        return;
    }

    // 5. 初始化formatter
    if (!formatter) {
        formatter = initFormatter();
    }
    if (!formatter) {
        vscode.window.showErrorMessage('❌ 无法初始化AI格式化器，请检查API Key配置');
        return;
    }

    // 6. 显示进度并调用AI (Req 1.3)
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Formatting BibTeX entry...",
            cancellable: false
        }, async () => {
            const formatted = await formatter!.formatBibEntry(text);
            // 替换选中文本 (Req 1.2)
            await applyEditorEditWithHistory(
                editor,
                `Format Entry (AI): ${getShortFileName(editor.document.fileName)}`,
                editBuilder => {
                    editBuilder.replace(target.range, formatted);
                },
                { source: 'ai' }
            );
        });

        // 7. 增加使用次数 (Req 7.1)
        await incrementFormatUsage();

        // 8. 显示成功消息 (Req 1.4)
        vscode.window.showInformationMessage('✅ Entry formatted!');
        logInfo('formatEntry: success');

        // 9. 追踪成功操作并可能请求评分 (Req 11.5)
        await trackSuccessAndMaybeRequestRating();
    } catch (error) {
        logError('formatEntry: failed', error);
        // 9. 处理错误 (Req 1.5, 1.6)
        if (error instanceof AIError) {
            vscode.window.showErrorMessage(`❌ ${error.getUserMessage()}`);
        } else {
            vscode.window.showErrorMessage(`❌ 格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
        // 原文本保持不变 (Req 1.6)
    }
}

/**
 * 处理本地格式化BibTeX条目命令（无需API）
 * Requirements: 9.1, 9.4, 9.5
 */
async function handleFormatEntryLocal(): Promise<void> {
    logInfo('Command: formatEntryLocal');
    // 1. 获取当前编辑器和选中文本
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件');
        return;
    }

    const target = getEntryTextAndRange(editor);
    if (!target) {
        vscode.window.showWarningMessage('请先选中要格式化的BibTeX条目，或将光标放在条目内部');
        return;
    }

    // 3. 本地格式化（无需API Key检查，无使用次数限制）
    try {
        const localOptions = getConfig().localFormat;
        const formatted = formatBibEntryLocalWithOptions(target.text, localOptions);

        // 替换选中文本
        await applyEditorEditWithHistory(
            editor,
            `Format Entry (Local): ${getShortFileName(editor.document.fileName)}`,
            editBuilder => {
                editBuilder.replace(target.range, formatted);
            },
            { source: 'local' }
        );

        // 显示成功消息 (Req 9.5)
        vscode.window.showInformationMessage('✅ Entry formatted (local mode)');
        logInfo('formatEntryLocal: success');

        // 追踪成功操作 (Req 11.5)
        await trackSuccessAndMaybeRequestRating();
    } catch (error) {
        logError('formatEntryLocal: failed', error);
        vscode.window.showErrorMessage(`❌ 本地格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}

/**
 * 处理批量格式化命令（Pro 功能）
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */
async function handleBatchFormat(): Promise<void> {
    logInfo('Command: formatAllEntries (batch AI)');
    // 1. 验证当前文件是.bib文件
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.bib')) {
        vscode.window.showWarningMessage('请先打开一个 .bib 文件');
        return;
    }

    // 2. 检查 License 状态 (Req 10.2, 10.3)
    const licenseStatus = await getLicenseStatus();
    if (!licenseStatus.isPro) {
        const action = await vscode.window.showWarningMessage(
            '批量格式化是 Pro 版功能，请升级以解锁',
            '本地批量格式化（免费）',
            '了解 Pro 版',
            '取消'
        );
        if (action === '本地批量格式化（免费）') {
            await handleBatchFormatLocal();
            return;
        }
        if (action === '了解 Pro 版') {
            vscode.env.openExternal(vscode.Uri.parse('https://gumroad.com/l/reference-manager-pro'));
        }
        return;
    }

    // 3. 验证配置
    if (!await ensureConfigured()) {
        return;
    }

    // 4. 初始化formatter
    if (!formatter) {
        formatter = initFormatter();
    }
    if (!formatter) {
        vscode.window.showErrorMessage('❌ 无法初始化AI格式化器，请检查API Key配置');
        return;
    }

    // 5. 解析条目 (Req 10.4)
    const content = editor.document.getText();
    const result = parseBibFile(content);
    const entries = result.entries;

    if (entries.length === 0) {
        vscode.window.showInformationMessage('未找到任何 BibTeX 条目');
        return;
    }
    logInfo(`formatAllEntries: entries=${entries.length}`);

    // 6. 批量格式化 (Req 10.5, 10.6)
    let successCount = 0;
    let failCount = 0;
    const failures: string[] = [];
    const formattedByStartIndex = new Map<number, string>();
    const localOptions = getConfig().localFormat;

    const cancelled = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Formatting all entries...",
        cancellable: true
    }, async (progress, token) => {
        for (let i = 0; i < entries.length && !token.isCancellationRequested; i++) {
            const entry = entries[i]!;
            progress.report({
                message: `Formatting ${i + 1}/${entries.length}...`,
                increment: 100 / entries.length
            });

            try {
                const formatted = await formatter!.formatBibEntry(entry.rawText);
                formattedByStartIndex.set(entry.startIndex, formatted);
                successCount++;
            } catch (error) {
                // 继续处理其他条目 (Req 10.8)
                failCount++;
                failures.push(entry.key);
                console.warn(`格式化失败: ${entry.key}`, error);
                logError(`formatAllEntries: failed entry=${entry.key}`, error);
                // 失败回退到本地格式化，确保“一键跑通”
                formattedByStartIndex.set(entry.startIndex, formatBibEntryLocalWithOptions(entry.rawText, localOptions));
            }

            // 500ms 延迟避免 rate limit (Req 10.6)
            if (i < entries.length - 1 && !token.isCancellationRequested) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return token.isCancellationRequested;
    });

    if (cancelled) {
        vscode.window.showInformationMessage('批量格式化已取消');
        logInfo('formatAllEntries: cancelled');
        return;
    }

    // 7. 应用更改
    const replacedContent = buildFormattedBibFileContent(content, entries, (entry) => {
        return formattedByStartIndex.get(entry.startIndex) ?? formatBibEntryLocalWithOptions(entry.rawText, localOptions);
    });
    const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
    await applyEditorEditWithHistory(
        editor,
        `Format All Entries (AI): ${getShortFileName(editor.document.fileName)}`,
        editBuilder => {
            editBuilder.replace(fullRange, replacedContent);
        },
        { source: 'ai' }
    );

    // 8. 显示结果 (Req 10.7, 10.8)
    if (failCount === 0) {
        vscode.window.showInformationMessage(`✅ Formatted ${successCount} entries`);
        logInfo(`formatAllEntries: success entries=${successCount}`);
        await trackSuccessAndMaybeRequestRating();
    } else {
        vscode.window.showWarningMessage(
            `✅ Formatted ${successCount} entries, ❌ ${failCount} failed: ${failures.join(', ')}`
        );
        logInfo(`formatAllEntries: partial success ok=${successCount} failed=${failCount}`);
    }
}

/**
 * 批量本地格式化命令（免费、离线）
 */
async function handleBatchFormatLocal(): Promise<void> {
    logInfo('Command: formatAllEntriesLocal');

    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.bib')) {
        vscode.window.showWarningMessage('请先打开一个 .bib 文件');
        return;
    }

    const content = editor.document.getText();
    const result = parseBibFile(content);
    const entries = result.entries;

    if (entries.length === 0) {
        vscode.window.showInformationMessage('未找到任何 BibTeX 条目');
        return;
    }

    const localOptions = getConfig().localFormat;
    const formatted = buildFormattedBibFileContent(content, entries, (entry) => formatBibEntryLocalWithOptions(entry.rawText, localOptions));
    const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
    await applyEditorEditWithHistory(
        editor,
        `Format All Entries (Local): ${getShortFileName(editor.document.fileName)}`,
        editBuilder => {
            editBuilder.replace(fullRange, formatted);
        },
        { source: 'local' }
    );

    vscode.window.showInformationMessage(`✅ 本地批量格式化完成：${entries.length} 个条目`);
    logInfo(`formatAllEntriesLocal: success entries=${entries.length}`);
}


/**
 * 显示未使用的条目
 * Requirements: 2.4, 2.10
 */
function displayUnusedEntries(
    unusedEntries: Array<{ entry: BibEntry; bibFile: vscode.Uri }>,
    usedCount: number,
    totalCount: number
): void {
    const channel = getOutputChannel();
    channel.clear();
    channel.show(true);

    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('  Reference Manager Pro - 未使用引用检测结果');
    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('');
    channel.appendLine(`📊 统计: 共 ${totalCount} 个条目，${usedCount} 个被引用，${unusedEntries.length} 个未使用`);
    channel.appendLine('');

    if (unusedEntries.length === 0) {
        channel.appendLine('✅ All citations are in use!');
        vscode.window.showInformationMessage('✅ All citations are in use!');
        return;
    }

    channel.appendLine('⚠️ 未使用的条目:');
    channel.appendLine('───────────────────────────────────────────────────────────');

    for (const { entry, bibFile } of unusedEntries) {
        const author = entry.fields.author ?? 'Unknown';
        const title = entry.fields.title ?? 'Untitled';
        const truncatedTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
        const fileName = bibFile.fsPath.split(/[/\\]/).pop() ?? bibFile.fsPath;

        // 格式: ⚠️ Unused: {key} ({author}, "{title...}") (Req 2.4)
        channel.appendLine(`⚠️ Unused: ${entry.key} (${author}, "${truncatedTitle}")`);
        channel.appendLine(`   📁 文件: ${fileName}`);
        channel.appendLine('');
    }

    channel.appendLine('───────────────────────────────────────────────────────────');
}

/**
 * 删除未使用的条目
 * Requirements: 2.5, 2.6
 */
async function deleteUnusedEntries(
    unusedEntries: Array<{ entry: BibEntry; bibFile: vscode.Uri }>
): Promise<number> {
    // 按文件分组
    const entriesByFile = new Map<string, Array<{ entry: BibEntry; bibFile: vscode.Uri }>>();
    for (const item of unusedEntries) {
        const key = item.bibFile.fsPath;
        if (!entriesByFile.has(key)) {
            entriesByFile.set(key, []);
        }
        entriesByFile.get(key)!.push(item);
    }

    let deletedCount = 0;

    for (const [, entries] of entriesByFile) {
        const uri = entries[0]!.bibFile;
        const document = await vscode.workspace.openTextDocument(uri);
        const before = document.getText();
        let content = before;

        // 按起始位置倒序排列，从后往前删除避免位置偏移
        const sortedEntries = [...entries].sort((a, b) => b.entry.startLine - a.entry.startLine);

        for (const { entry } of sortedEntries) {
            // 删除条目的原始文本
            content = content.replace(entry.rawText, '');
            deletedCount++;
        }

        // 清理多余的空行
        content = content.replace(/\n{3,}/g, '\n\n');

        // 写入文件
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), content);
        await vscode.workspace.applyEdit(edit);
        if (changeHistory && before !== content) {
            changeHistory.add({
                id: createChangeId(),
                label: `Delete Unused Entries: ${getShortFileName(uri.fsPath)}`,
                timestamp: new Date().toISOString(),
                uri: uri.toString(),
                before,
                after: content,
                source: 'system',
            });
        }
        await document.save();
    }

    return deletedCount;
}

/**
 * 处理查找未使用引用命令
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 7.3
 */
async function handleFindUnused(): Promise<void> {
    logInfo('Command: findUnusedCitations');
    // 1. 验证工作区存在
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showWarningMessage('请先打开一个工作区');
        return;
    }

    // 2. 检查使用限制 (Req 7.3)
    if (!await checkFindUnusedUsageLimit()) {
        await showUpgradePrompt('查找未使用引用');
        return;
    }

    // 2.1 预检查 .tex 文件，避免空项目误报
    const texFiles = await findTexFiles();
    if (texFiles.length === 0) {
        vscode.window.showWarningMessage('未找到任何 .tex 文件，无法检测未使用引用');
        logInfo('findUnusedCitations: no .tex files');
        return;
    }

    let usedKeys: Set<string> = new Set();
    const allEntries: Array<{ entry: BibEntry; bibFile: vscode.Uri }> = [];

    // 2. 显示进度并扫描 (Req 2.7)
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Scanning for unused citations...",
        cancellable: false
    }, async (progress) => {
        // 2.1 扫描.tex文件获取使用的keys (Req 2.1, 2.2)
        progress.report({ message: '扫描 .tex 文件...' });
        usedKeys = await scanWorkspaceForCitations(progress, texFiles);
        logInfo(`findUnusedCitations: used keys = ${usedKeys.size}`);

        // 2.2 查找.bib文件 (Req 2.9)
        progress.report({ message: '查找 .bib 文件...' });
        const bibFiles = await findBibFiles();

        if (bibFiles.length === 0) {
            vscode.window.showWarningMessage('未找到 .bib 文件');
            logInfo('findUnusedCitations: no .bib files');
            return;
        }

        // 2.3 解析.bib文件获取所有条目
        progress.report({ message: '解析 .bib 文件...' });
        for (const bibFile of bibFiles) {
            try {
                const doc = await vscode.workspace.openTextDocument(bibFile);
                const result = parseBibFile(doc.getText());
                for (const entry of result.entries) {
                    allEntries.push({ entry, bibFile });
                }
            } catch (error) {
                console.warn(`无法解析 ${bibFile.fsPath}:`, error);
            }
        }
    });

    if (usedKeys.size === 0) {
        vscode.window.showInformationMessage('未在 .tex 文件中找到任何引用命令，已跳过未使用引用检测');
        logInfo('findUnusedCitations: no citation commands found');
        return;
    }

    if (allEntries.length === 0) {
        vscode.window.showWarningMessage('未找到任何 BibTeX 条目');
        return;
    }

    // 2.4 找出未使用的条目 (Req 2.3)
    const unusedEntries = allEntries.filter(
        ({ entry }) => !usedKeys.has(entry.key)
    );

    const usedCount = allEntries.length - unusedEntries.length;

    // 2.5 显示结果 (Req 2.4, 2.10)
    displayUnusedEntries(unusedEntries, usedCount, allEntries.length);

    // 2.6 增加使用次数 (Req 7.1)
    await incrementFindUnusedUsage();

    // 2.7 询问是否删除 (Req 2.5)
    if (unusedEntries.length > 0) {
        const action = await vscode.window.showWarningMessage(
            `发现 ${unusedEntries.length} 个未使用的引用，是否删除？`,
            '删除',
            '取消'
        );

        if (action === '删除') {
            const deletedCount = await deleteUnusedEntries(unusedEntries);
            vscode.window.showInformationMessage(`✅ 已删除 ${deletedCount} 个未使用的条目`);
        }
    }
}


/**
 * 处理发现的重复条目
 * Requirements: 3.3, 3.4, 3.5, 3.9, 3.10
 */
async function handleDuplicatesFound(
    duplicates: DuplicatePair[],
    editor: vscode.TextEditor
): Promise<void> {
    const channel = getOutputChannel();
    channel.clear();
    channel.show(true);

    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('  Reference Manager Pro - 重复条目检测结果');
    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('');
    channel.appendLine(`📊 发现 ${duplicates.length} 对重复条目`);
    channel.appendLine('');

    // 显示每对重复条目 (Req 3.3)
    for (let i = 0; i < duplicates.length; i++) {
        const dup = duplicates[i]!;
        channel.appendLine(`───────────────────────────────────────────────────────────`);
        channel.appendLine(`重复 #${i + 1}:`);
        channel.appendLine(`  条目1: ${dup.entry1.key}`);
        channel.appendLine(`    ${getEntryDescription(dup.entry1)}`);
        channel.appendLine(`  条目2: ${dup.entry2.key}`);
        channel.appendLine(`    ${getEntryDescription(dup.entry2)}`);
        channel.appendLine(`  🤖 AI建议: 保留 ${dup.keepEntry === 'entry1' ? dup.entry1.key : dup.entry2.key}`);
        channel.appendLine(`  📝 理由: ${dup.reason}`);
        channel.appendLine('');
    }

    // 询问用户确认 (Req 3.4)
    const action = await vscode.window.showWarningMessage(
        `发现 ${duplicates.length} 对重复条目，是否按AI建议删除重复项？`,
        '按建议删除',
        '取消'
    );

    if (action !== '按建议删除') {
        return;
    }

    // 执行删除 (Req 3.5)
    let content = editor.document.getText();
    let deletedCount = 0;

    // 收集要删除的条目
    const entriesToDelete: BibEntry[] = [];
    for (const dup of duplicates) {
        const entryToDelete = dup.keepEntry === 'entry1' ? dup.entry2 : dup.entry1;
        entriesToDelete.push(entryToDelete);
    }

    // 按起始位置倒序排列，从后往前删除
    entriesToDelete.sort((a, b) => b.startLine - a.startLine);

    for (const entry of entriesToDelete) {
        content = content.replace(entry.rawText, '');
        deletedCount++;
    }

    // 清理多余空行
    content = content.replace(/\n{3,}/g, '\n\n');

    // 应用编辑
    const fullRange = new vscode.Range(
        0, 0,
        editor.document.lineCount, 0
    );
    await applyEditorEditWithHistory(
        editor,
        `Remove Duplicates: ${getShortFileName(editor.document.fileName)}`,
        editBuilder => {
            editBuilder.replace(fullRange, content);
        },
        { source: 'system' }
    );

    // 显示统计 (Req 3.10)
    vscode.window.showInformationMessage(`✅ Removed ${deletedCount} duplicate entries`);
}

/**
 * 处理去重命令
 * Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 3.9
 */
async function handleRemoveDuplicates(): Promise<void> {
    logInfo('Command: removeDuplicates');

    try {
    // 1. 验证当前文件是.bib文件
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.bib')) {
        vscode.window.showWarningMessage('请先打开一个 .bib 文件');
        return;
    }

    // 2. 验证配置
    if (!await ensureConfigured()) {
        return;
    }

    // 3. 初始化formatter
    if (!formatter) {
        formatter = initFormatter();
    }
    if (!formatter) {
        vscode.window.showErrorMessage('❌ 无法初始化AI格式化器，请检查API Key配置');
        return;
    }

    // 4. 解析条目 (Req 3.1)
    const content = editor.document.getText();
    const result = parseBibFile(content);
    const entries = result.entries;
    logInfo(`removeDuplicates: entries = ${entries.length}`);

    if (entries.length < 2) {
        vscode.window.showInformationMessage('✅ 条目数量不足，无需检测重复');
        return;
    }

    if (entries.length > MAX_DUPLICATE_ENTRIES) {
        vscode.window.showWarningMessage(
            `当前文件包含 ${entries.length} 个条目，AI 去重最多支持 ${MAX_DUPLICATE_ENTRIES} 个。` +
            '请拆分文件或先手动筛选后再运行此命令。'
        );
        logInfo('removeDuplicates: aborted due to MAX_DUPLICATE_ENTRIES');
        return;
    }

    // 5. 两两比较 (Req 3.2)
    const duplicates: DuplicatePair[] = [];
    const totalPairs = (entries.length * (entries.length - 1)) / 2;

    const cancelled = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Checking for duplicates...",
        cancellable: true
    }, async (progress, token) => {
        let checked = 0;

        for (let i = 0; i < entries.length && !token.isCancellationRequested; i++) {
            for (let j = i + 1; j < entries.length && !token.isCancellationRequested; j++) {
                const entry1 = entries[i]!;
                const entry2 = entries[j]!;
                try {
                    const checkResult = await formatter!.checkDuplicate(
                        entry1.rawText,
                        entry2.rawText
                    );

                    if (checkResult.isDuplicate) {
                        duplicates.push({
                            entry1,
                            entry2,
                            keepEntry: checkResult.keepEntry,
                            reason: checkResult.reason
                        });
                    }
                } catch (error) {
                    // 跳过失败的比较，继续处理其他 (Req 3.8)
                    console.warn(`比较失败: ${entry1.key} vs ${entry2.key}`, error);
                }

                checked++;
                progress.report({
                    message: `Checking ${checked}/${totalPairs}...`,
                    increment: 100 / totalPairs
                });
            }
        }

        return token.isCancellationRequested;
    });

    if (cancelled) {
        vscode.window.showInformationMessage('检测已取消');
        return;
    }

    // 6. 显示结果 (Req 3.7)
    if (duplicates.length === 0) {
        vscode.window.showInformationMessage('✅ No duplicates found!');
    } else {
        await handleDuplicatesFound(duplicates, editor);
    }
    } catch (error) {
        logError('removeDuplicates: failed', error);
        vscode.window.showErrorMessage(`❌ 去重失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}

async function handleSmartFix(options: { officialFormatMode?: OfficialFormatMode } = {}): Promise<void> {
    logInfo('Command: smartFix');
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件');
        return;
    }

    const target = getEntryTextAndRange(editor);
    if (!target) {
        vscode.window.showWarningMessage('请将光标放在 BibTeX 条目内');
        return;
    }

    const config = getConfig();
    const localOptions = config.localFormat;
    const strictness = config.validation.strictness;
    const validationEnabled = config.validation.enabled;
    const officialEnabled = config.officialMetadata.enabled;
    const officialTimeout = config.officialMetadata.timeout;
    const keyPolicy = config.officialMetadata.keyPolicy;
    const officialFormatMode = options.officialFormatMode ?? config.officialMetadata.formatMode;
    const sourceNotes: string[] = [];

    const validateAndAnalyze = (text: string): { score: number | null; errorCount: number } => {
        if (!validationEnabled) {
            return { score: null, errorCount: 0 };
        }
        const parsed = parseBibFile(text);
        const entry = parsed.entries[0];
        if (!entry) {
            return { score: null, errorCount: 0 };
        }
        const result = validateEntries([entry], strictness)[0];
        if (!result || result.issues.length === 0) {
            return { score: result ? result.score : null, errorCount: 0 };
        }
        const errorCount = result.issues.filter(i => i.severity === 'error').length;
        return { score: result.score, errorCount };
    };

    const runLocal = async (reason?: string) => {
        const formatted = formatBibEntryLocalWithOptions(target.text, localOptions);
        const validation = validateAndAnalyze(formatted);
        await applyEditorEditWithHistory(
            editor,
            `Smart Fix (Local): ${getShortFileName(editor.document.fileName)}`,
            editBuilder => {
                editBuilder.replace(target.range, formatted);
            },
            { source: 'local', confidence: validation.score }
        );
        vscode.window.showInformationMessage(reason ?? '✅ Smart Fix 完成（本地模式）');
        if (validation.errorCount > 0) {
            vscode.window.showWarningMessage(`⚠️ 仍有 ${validation.errorCount} 个关键问题，建议运行 Validate References`);
        }
        renderSmartFixSummary(
            getShortFileName(editor.document.fileName),
            target.text,
            formatted,
            validation.score,
            'local',
            sourceNotes.length > 0 ? sourceNotes : undefined
        );
    };

    if (officialEnabled) {
        try {
            const allEntries = parseBibFile(editor.document.getText()).entries;
            const existingKeys = new Set(allEntries.map(entry => entry.key));
            const official = await resolveOfficialBibtexFromEntry(target.text, officialTimeout);
            if (official) {
                const originalKey = extractEntryKey(target.text);
                let officialText = official.bibtex;
                const officialEntry = parseSingleEntry(officialText);
                const notes: string[] = [];

                let replacedKey = false;
                if (officialEntry && originalKey) {
                    const doiForKey = officialEntry.fields.doi ?? official.doi;
                    const derivedKey = doiForKey ? deriveKeyFromDoi(doiForKey) : null;
                    const officialKey = derivedKey ?? officialEntry.key;
                    if (derivedKey && derivedKey !== officialEntry.key) {
                        notes.push(`已使用 DOI 派生 key：${derivedKey}`);
                    }

                    let targetKey = officialEntry.key;
                    if (officialKey !== originalKey) {
                        const decision = await resolveKeyPolicyDecision(
                            keyPolicy,
                            originalKey,
                            officialKey,
                            existingKeys
                        );
                        if (!decision.useOfficial) {
                            targetKey = originalKey;
                            notes.push(`已保留原引用 key（官方 key: ${officialKey}）`);
                            if (decision.reason) {
                                notes.push(`原因：${decision.reason}`);
                            }
                        } else {
                            targetKey = officialKey;
                            replacedKey = true;
                            if (decision.usedKeys?.has(originalKey)) {
                                notes.push('已使用官方 key，请更新 .tex 中的旧 key');
                            }
                        }
                    }

                    if (officialFormatMode === 'raw') {
                        if (targetKey !== officialEntry.key) {
                            officialText = replaceEntryKeyRaw(officialText, targetKey);
                        }
                        notes.push('输出为官方原始格式（未做本地规范化）');
                    } else {
                        officialEntry.key = targetKey;
                        officialText = serializeBibEntry(officialEntry, '  ');
                    }
                } else if (officialEntry && officialFormatMode !== 'raw') {
                    officialText = serializeBibEntry(officialEntry, '  ');
                }

                let finalText = officialText;
                if (officialFormatMode === 'normalized') {
                    const formatted = formatBibEntryLocalWithOptions(officialText, localOptions);
                    finalText = replacedKey && originalKey
                        ? appendKeyComment(formatted, originalKey)
                        : formatted;
                } else if (replacedKey && originalKey) {
                    finalText = appendKeyComment(officialText, originalKey);
                }
                const validation = validateAndAnalyze(finalText);
                await applyEditorEditWithHistory(
                    editor,
                    `Smart Fix (Official): ${getShortFileName(editor.document.fileName)}`,
                    editBuilder => {
                        editBuilder.replace(target.range, finalText);
                    },
                    { source: 'official', confidence: validation.score }
                );
                const modeLabel = officialFormatMode === 'raw' ? '官方元数据·原始' : '官方元数据';
                vscode.window.showInformationMessage(`✅ Smart Fix 完成（${modeLabel}）`);
                if (validation.errorCount > 0) {
                    vscode.window.showWarningMessage(`⚠️ 仍有 ${validation.errorCount} 个关键问题，建议运行 Validate References`);
                }
                renderSmartFixSummary(
                    getShortFileName(editor.document.fileName),
                    target.text,
                    finalText,
                    validation.score,
                    'official',
                    notes
                );
                return;
            }
            const doi = extractDoiFromEntryText(target.text);
            if (doi) {
                sourceNotes.push('官方元数据获取失败，已使用本地/AI 修复');
            }
        } catch (error) {
            logError('smartFix: official metadata lookup failed', error);
            sourceNotes.push('官方元数据获取异常，已使用本地/AI 修复');
        }
    }

    const hasApiKey = config.aiProvider === 'groq' ? !!config.groqApiKey : !!config.apiKey;
    if (!hasApiKey) {
        await runLocal('✅ Smart Fix 已完成（未启用智能增强）');
        return;
    }

    if (!await checkFormatUsageLimit()) {
        await runLocal('✅ Smart Fix 已完成（已达到智能增强上限）');
        return;
    }

    if (!formatter) {
        formatter = initFormatter();
    }
    if (!formatter) {
        await runLocal('✅ Smart Fix 已完成（智能增强不可用）');
        return;
    }

    try {
        const formatted = await formatter.formatBibEntry(target.text);
        const validation = validateAndAnalyze(formatted);
        await applyEditorEditWithHistory(
            editor,
            `Smart Fix (AI): ${getShortFileName(editor.document.fileName)}`,
            editBuilder => {
                editBuilder.replace(target.range, formatted);
            },
            { source: 'ai', confidence: validation.score }
        );
        await incrementFormatUsage();
        vscode.window.showInformationMessage('✅ Smart Fix 完成（智能增强）');
        if (validation.errorCount > 0) {
            vscode.window.showWarningMessage(`⚠️ 仍有 ${validation.errorCount} 个关键问题，建议运行 Validate References`);
        }
        renderSmartFixSummary(
            getShortFileName(editor.document.fileName),
            target.text,
            formatted,
            validation.score,
            'ai',
            sourceNotes.length > 0 ? sourceNotes : undefined
        );
        await trackSuccessAndMaybeRequestRating();
    } catch (error) {
        logError('smartFix: failed, fallback to local', error);
        await runLocal('✅ Smart Fix 已完成（已自动降级为本地修复）');
    }
}

async function handleSmartFixAll(options: { officialFormatMode?: OfficialFormatMode } = {}): Promise<void> {
    logInfo('Command: smartFixAll');
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.bib')) {
        vscode.window.showWarningMessage('请先打开一个 .bib 文件');
        return;
    }

    const content = editor.document.getText();
    const result = parseBibFile(content);
    const entries = result.entries;
    if (entries.length === 0) {
        vscode.window.showInformationMessage('未找到任何 BibTeX 条目');
        return;
    }

    // 检测重复条目（基于 DOI 和 key）
    const doiToEntries = new Map<string, { key: string; index: number }[]>();
    const keyToIndices = new Map<string, number[]>();
    const duplicateDois: string[] = [];
    const duplicateKeys: string[] = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]!;
        const parsed = parseSingleEntry(entry.rawText);

        // 检测重复 key
        const keyIndices = keyToIndices.get(entry.key) ?? [];
        keyIndices.push(i);
        keyToIndices.set(entry.key, keyIndices);
        if (keyIndices.length === 2) {
            duplicateKeys.push(entry.key);
        }

        // 检测重复 DOI
        if (parsed?.fields.doi) {
            const doi = parsed.fields.doi.toLowerCase().trim();
            const doiEntries = doiToEntries.get(doi) ?? [];
            doiEntries.push({ key: entry.key, index: i });
            doiToEntries.set(doi, doiEntries);
            if (doiEntries.length === 2) {
                duplicateDois.push(doi);
            }
        }
    }

    // 显示重复警告
    if (duplicateDois.length > 0 || duplicateKeys.length > 0) {
        const channel = getOutputChannel();
        channel.appendLine('');
        channel.appendLine('⚠️ 检测到重复条目：');
        channel.appendLine('─────────────────────────────────────');

        if (duplicateKeys.length > 0) {
            channel.appendLine(`\n🔑 重复的 key (${duplicateKeys.length} 个):`);
            for (const key of duplicateKeys) {
                const indices = keyToIndices.get(key)!;
                channel.appendLine(`  • "${key}" 出现 ${indices.length} 次 (条目 #${indices.map(i => i + 1).join(', #')})`);
            }
        }

        if (duplicateDois.length > 0) {
            channel.appendLine(`\n📄 重复的 DOI (${duplicateDois.length} 个):`);
            for (const doi of duplicateDois) {
                const doiEntries = doiToEntries.get(doi)!;
                channel.appendLine(`  • ${doi}`);
                for (const e of doiEntries) {
                    channel.appendLine(`    - key: "${e.key}" (条目 #${e.index + 1})`);
                }
            }
        }

        channel.appendLine('');
        channel.appendLine('建议：手动删除重复条目后再运行 Smart Fix All');
        channel.appendLine('─────────────────────────────────────');
        channel.show(true);

        const action = await vscode.window.showWarningMessage(
            `检测到 ${duplicateKeys.length} 个重复 key 和 ${duplicateDois.length} 个重复 DOI，是否继续？`,
            '继续修复', '取消'
        );
        if (action !== '继续修复') {
            return;
        }
    }

    const config = getConfig();
    const localOptions = config.localFormat;
    const officialEnabled = config.officialMetadata.enabled;
    const officialTimeout = config.officialMetadata.timeout;
    const keyPolicy = config.officialMetadata.keyPolicy;
    const officialFormatMode = options.officialFormatMode ?? config.officialMetadata.formatMode;

    let officialCount = 0;
    let localCount = 0;
    let failCount = 0;
    let keyReplacedCount = 0;
    let keyPreservedCount = 0;
    let keyCollisionCount = 0;

    const formattedByStartIndex = new Map<number, string>();
    const usedKeys = keyPolicy !== 'preserve' && vscode.workspace.workspaceFolders
        ? await scanWorkspaceForCitations()
        : undefined;
    const existingKeys = new Set(entries.map(entry => entry.key));

    const cancelled = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Smart Fix All...",
        cancellable: true
    }, async (progress, token) => {
        for (let i = 0; i < entries.length && !token.isCancellationRequested; i++) {
            const entry = entries[i]!;
            progress.report({
                message: `Processing ${i + 1}/${entries.length}...`,
                increment: 100 / entries.length
            });

            try {
                let formatted: string | null = null;
                let shouldAppendOldKeyComment = false;
                
                if (officialEnabled) {
                    const official = await resolveOfficialBibtexFromEntry(entry.rawText, officialTimeout);
                    if (official) {
                        let officialText = official.bibtex;
                        const officialEntry = parseSingleEntry(officialText);
                        if (officialEntry) {
                            const doiForKey = officialEntry.fields.doi ?? official.doi;
                            const derivedKey = doiForKey ? deriveKeyFromDoi(doiForKey) : null;
                            const officialKey = derivedKey ?? officialEntry.key;
                            if (officialKey !== entry.key) {
                                let useOfficial = false;
                                if (keyPolicy === 'officialAlways') {
                                    useOfficial = true;
                                } else if (keyPolicy === 'officialWhenUnused') {
                                    useOfficial = usedKeys ? !usedKeys.has(entry.key) : false;
                                }

                                if (useOfficial && existingKeys.has(officialKey)) {
                                    useOfficial = false;
                                    keyCollisionCount++;
                                }

                                if (useOfficial) {
                                    existingKeys.delete(entry.key);
                                    existingKeys.add(officialKey);
                                    if (officialFormatMode === 'raw') {
                                        officialText = replaceEntryKeyRaw(officialText, officialKey);
                                    } else {
                                        officialEntry.key = officialKey;
                                        officialText = serializeBibEntry(officialEntry, '  ');
                                    }
                                    shouldAppendOldKeyComment = true;
                                    keyReplacedCount++;
                                } else {
                                    if (officialFormatMode === 'raw') {
                                        if (entry.key !== officialEntry.key) {
                                            officialText = replaceEntryKeyRaw(officialText, entry.key);
                                        }
                                    } else {
                                        officialEntry.key = entry.key;
                                        officialText = serializeBibEntry(officialEntry, '  ');
                                    }
                                    keyPreservedCount++;
                                }
                            } else {
                                keyPreservedCount++;
                                if (officialFormatMode !== 'raw') {
                                    officialText = serializeBibEntry(officialEntry, '  ');
                                }
                            }
                        } else if (officialFormatMode !== 'raw') {
                            officialText = official.bibtex;
                        }

                        if (officialFormatMode === 'normalized') {
                            formatted = formatBibEntryLocalWithOptions(officialText, localOptions);
                            if (shouldAppendOldKeyComment) {
                                formatted = appendKeyComment(formatted, entry.key);
                            }
                        } else {
                            formatted = shouldAppendOldKeyComment
                                ? appendKeyComment(officialText, entry.key)
                                : officialText;
                        }
                        officialCount++;
                    }
                }

                // 如果官方元数据获取失败，尝试从本地DOI生成key
                if (!formatted) {
                    const parsedEntry = parseSingleEntry(entry.rawText);
                    if (parsedEntry && parsedEntry.fields.doi) {
                        const derivedKey = deriveKeyFromDoi(parsedEntry.fields.doi);
                        if (derivedKey && derivedKey !== entry.key) {
                            let useOfficial = false;
                            if (keyPolicy === 'officialAlways') {
                                useOfficial = true;
                            } else if (keyPolicy === 'officialWhenUnused') {
                                useOfficial = usedKeys ? !usedKeys.has(entry.key) : false;
                            }

                            if (useOfficial && existingKeys.has(derivedKey)) {
                                useOfficial = false;
                                keyCollisionCount++;
                            }

                            if (useOfficial) {
                                existingKeys.delete(entry.key);
                                existingKeys.add(derivedKey);
                                parsedEntry.key = derivedKey;
                                shouldAppendOldKeyComment = true;
                                keyReplacedCount++;
                            } else {
                                keyPreservedCount++;
                            }
                            
                            formatted = serializeBibEntry(parsedEntry, '  ');
                            formatted = formatBibEntryLocalWithOptions(formatted, localOptions);
                            if (shouldAppendOldKeyComment) {
                                formatted = appendKeyComment(formatted, entry.key);
                            }
                        } else {
                            formatted = formatBibEntryLocalWithOptions(entry.rawText, localOptions);
                            keyPreservedCount++;
                        }
                    } else {
                        formatted = formatBibEntryLocalWithOptions(entry.rawText, localOptions);
                        keyPreservedCount++;
                    }
                    localCount++;
                }

                formattedByStartIndex.set(entry.startIndex, formatted);
            } catch (error) {
                failCount++;
                formattedByStartIndex.set(entry.startIndex, entry.rawText);
                logError(`smartFixAll: failed entry=${entry.key}`, error);
            }
        }

        return token.isCancellationRequested;
    });

    if (cancelled) {
        vscode.window.showInformationMessage('Smart Fix All 已取消');
        logInfo('smartFixAll: cancelled');
        return;
    }

    const replacedContent = buildFormattedBibFileContent(content, entries, (entry) => {
        return formattedByStartIndex.get(entry.startIndex) ?? entry.rawText;
    });
    const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
    await applyEditorEditWithHistory(
        editor,
        `Smart Fix All: ${getShortFileName(editor.document.fileName)}`,
        editBuilder => {
            editBuilder.replace(fullRange, replacedContent);
        },
        { source: officialCount > 0 ? 'official' : 'local' }
    );

    const modeLabel = officialFormatMode === 'raw' ? '官方原始' : '官方+本地规范化';
    vscode.window.showInformationMessage(
        `✅ Smart Fix All 完成（${modeLabel}）：官方 ${officialCount}，本地 ${localCount}，失败 ${failCount}，key替换 ${keyReplacedCount}，保留 ${keyPreservedCount}` +
        (keyCollisionCount > 0 ? `（冲突跳过 ${keyCollisionCount}）` : '')
    );
}

async function handleOfficialReport(): Promise<void> {
    logInfo('Command: officialReport');
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.bib')) {
        vscode.window.showWarningMessage('请先打开一个 .bib 文件');
        return;
    }

    const content = editor.document.getText();
    const parsed = parseBibFile(content);
    const entries = parsed.entries;
    if (entries.length === 0) {
        vscode.window.showInformationMessage('未找到任何 BibTeX 条目');
        return;
    }

    const config = getConfig();
    const timeoutMs = config.officialMetadata.timeout;
    const formatMode = config.officialMetadata.formatMode;
    const officialEnabled = config.officialMetadata.enabled;

    const rows: OfficialReportRow[] = [];
    let ok = 0;
    let noDoi = 0;
    let failed = 0;
    let skipped = 0;

    const doiCache = new Map<string, boolean>();
    let cancelledAt: number | null = null;

    const cancelled = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Official Metadata Report...',
        cancellable: true
    }, async (progress, token) => {
        for (let i = 0; i < entries.length; i++) {
            if (token.isCancellationRequested) {
                cancelledAt = i;
                break;
            }

            const entry = entries[i]!;
            progress.report({
                message: `Checking ${i + 1}/${entries.length}...`,
                increment: 100 / entries.length
            });

            const title = entry.fields.title ?? 'Untitled';
            const doi = extractDoiFromEntryText(entry.rawText);
            if (!doi) {
                rows.push({
                    index: i + 1,
                    key: entry.key,
                    title,
                    doi: '',
                    status: 'NO_DOI',
                    note: '缺少 DOI'
                });
                noDoi++;
                continue;
            }

            let okFlag: boolean;
            if (doiCache.has(doi)) {
                okFlag = doiCache.get(doi)!;
            } else {
                const official = await resolveOfficialBibtexFromEntry(entry.rawText, timeoutMs);
                okFlag = Boolean(official);
                doiCache.set(doi, okFlag);
            }

            if (okFlag) {
                rows.push({
                    index: i + 1,
                    key: entry.key,
                    title,
                    doi,
                    status: 'OK',
                    note: '官方可获取'
                });
                ok++;
            } else {
                rows.push({
                    index: i + 1,
                    key: entry.key,
                    title,
                    doi,
                    status: 'FAILED',
                    note: '官方获取失败'
                });
                failed++;
            }
        }

        return token.isCancellationRequested;
    });

    if (cancelled && cancelledAt !== null) {
        for (let i = cancelledAt; i < entries.length; i++) {
            const entry = entries[i]!;
            rows.push({
                index: i + 1,
                key: entry.key,
                title: entry.fields.title ?? 'Untitled',
                doi: extractDoiFromEntryText(entry.rawText) ?? '',
                status: 'SKIPPED',
                note: '用户取消'
            });
            skipped++;
        }
    }

    const summary = {
        total: entries.length,
        ok,
        noDoi,
        failed,
        skipped
    };

    const report = buildOfficialReportMarkdown(
        getShortFileName(editor.document.fileName),
        rows,
        summary,
        { timeoutMs, formatMode, officialEnabled }
    );

    const doc = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: report
    });
    await vscode.window.showTextDocument(doc, { preview: false });

    vscode.window.showInformationMessage(
        `✅ 官方元数据报告已生成：OK ${ok}，无 DOI ${noDoi}，失败 ${failed}` +
        (skipped > 0 ? `，跳过 ${skipped}` : '')
    );
}

function renderValidationResults(results: EntryValidationResult[]): void {
    const channel = getOutputChannel();
    channel.clear();
    channel.show(true);

    const allIssues = results.flatMap(r => r.issues);
    const errorCount = allIssues.filter(i => i.severity === 'error').length;
    const warnCount = allIssues.filter(i => i.severity === 'warn').length;
    const infoCount = allIssues.filter(i => i.severity === 'info').length;
    const visibleIssues = allIssues.filter(i => i.severity !== 'info');
    const averageScore = results.length === 0
        ? 100
        : Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('  Reference Manager Pro - 参考文献质量校验');
    channel.appendLine('═══════════════════════════════════════════════════════════');
    channel.appendLine('');
    channel.appendLine(`📊 统计: error ${errorCount}, warn ${warnCount}, info ${infoCount}`);
    channel.appendLine(`🎯 平均可信度评分: ${averageScore}/100 (${getConfidenceLabel(averageScore)})`);
    channel.appendLine('');

    if (visibleIssues.length === 0) {
        channel.appendLine('✅ 未发现明显问题');
        vscode.window.showInformationMessage('✅ 未发现明显问题');
        return;
    }

    for (const result of results) {
        const issues = result.issues.filter(issue => issue.severity !== 'info');
        if (issues.length === 0) {
            continue;
        }
        channel.appendLine(`• ${result.key} (score ${result.score})`);
        for (const issue of issues) {
            channel.appendLine(`  - [${issue.severity}] ${issue.message}`);
        }
        channel.appendLine('');
    }

    if (errorCount > 0) {
        channel.appendLine('👉 建议：先运行 Smart Fix，再运行 Validate References');
        vscode.window.showWarningMessage('⚠️ 发现关键问题，建议先运行 Smart Fix');
    }
}

async function handleValidateEntries(): Promise<void> {
    logInfo('Command: validateEntries');
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.bib')) {
        vscode.window.showWarningMessage('请先打开一个 .bib 文件');
        return;
    }

    const config = getConfig();
    if (!config.validation.enabled) {
        vscode.window.showInformationMessage('当前已关闭参考文献校验，请在设置中开启');
        return;
    }

    const content = editor.document.getText();
    const result = parseBibFile(content);
    if (result.entries.length === 0) {
        vscode.window.showInformationMessage('未找到任何 BibTeX 条目');
        return;
    }

    const results = validateEntries(result.entries, config.validation.strictness);
    renderValidationResults(results);
}

async function handleShowHistory(): Promise<void> {
    logInfo('Command: showHistory');
    if (!changeHistory) {
        vscode.window.showInformationMessage('暂无变更记录');
        return;
    }

    const records = changeHistory.list();
    if (records.length === 0) {
        vscode.window.showInformationMessage('暂无变更记录');
        return;
    }

    const items = records.map(record => {
        const fileName = record.uri.split('/').pop() ?? record.uri;
        const sourceLabel = formatSourceLabel(record.source);
        const confidenceText = typeof record.confidence === 'number'
            ? `${getConfidenceLabel(record.confidence)} ${record.confidence}/100`
            : '可信度未知';
        return {
            label: record.label,
            description: fileName,
            detail: `${sourceLabel} • ${confidenceText} • ${new Date(record.timestamp).toLocaleString()}`,
            record,
        };
    });

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: '选择要回滚的变更记录',
    });

    if (!picked) {
        return;
    }

    const fileName = picked.record.uri.split('/').pop() ?? picked.record.uri;
    const confirmMessage =
        `⚠️ 危险操作检测！\n` +
        `操作类型：回滚文件内容\n` +
        `影响范围：${fileName}\n` +
        `风险评估：将覆盖当前内容\n\n` +
        `请确认是否继续？[需要明确的"是"、"确认"、"继续"]`;

    const action = await vscode.window.showWarningMessage(
        confirmMessage,
        { modal: true },
        '确认'
    );

    if (action !== '确认') {
        return;
    }

    await changeHistory.restore(picked.record);
    vscode.window.showInformationMessage('✅ 已回滚到所选版本');
}

/**
 * 插件激活时调用
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Reference Manager Pro is now active!');
    logInfo('Extension activated');

    // 初始化 License 模块
    initLicenseModule(context);

    // 初始化formatter
    formatter = initFormatter();
    changeHistory = new ChangeHistory(context);

    // 注册配置变化监听 (Req 4.7)
    const configDisposable = onConfigChange((config) => {
        if (formatter) {
            formatter.updateConfig(config);
        } else {
            formatter = initFormatter();
        }
    });
    context.subscriptions.push(configDisposable);

    // 注册命令
    const formatCommand = vscode.commands.registerCommand(
        'referenceManager.formatEntry',
        handleFormatEntry
    );

    const smartFixCommand = vscode.commands.registerCommand(
        'referenceManager.smartFix',
        handleSmartFix
    );

    const smartFixOfficialRawCommand = vscode.commands.registerCommand(
        'referenceManager.smartFixOfficialRaw',
        () => handleSmartFix({ officialFormatMode: 'raw' })
    );

    const smartFixAllCommand = vscode.commands.registerCommand(
        'referenceManager.smartFixAll',
        handleSmartFixAll
    );

    const smartFixAllOfficialRawCommand = vscode.commands.registerCommand(
        'referenceManager.smartFixAllOfficialRaw',
        () => handleSmartFixAll({ officialFormatMode: 'raw' })
    );

    const officialReportCommand = vscode.commands.registerCommand(
        'referenceManager.officialReport',
        handleOfficialReport
    );

    const validateEntriesCommand = vscode.commands.registerCommand(
        'referenceManager.validateEntries',
        handleValidateEntries
    );

    const showHistoryCommand = vscode.commands.registerCommand(
        'referenceManager.showHistory',
        handleShowHistory
    );

    const findUnusedCommand = vscode.commands.registerCommand(
        'referenceManager.findUnusedCitations',
        handleFindUnused
    );

    const removeDuplicatesCommand = vscode.commands.registerCommand(
        'referenceManager.removeDuplicates',
        handleRemoveDuplicates
    );

    // 注册 License 相关命令 (Req 8.2, 8.7)
    const activateLicenseCommand = vscode.commands.registerCommand(
        'referenceManager.activateLicense',
        activateLicense
    );

    const viewLicenseStatusCommand = vscode.commands.registerCommand(
        'referenceManager.viewLicenseStatus',
        viewLicenseStatus
    );

    // 注册本地格式化命令 (Req 9.1)
    const formatEntryLocalCommand = vscode.commands.registerCommand(
        'referenceManager.formatEntryLocal',
        handleFormatEntryLocal
    );

    // 注册批量格式化命令 (Req 10.1)
    const batchFormatCommand = vscode.commands.registerCommand(
        'referenceManager.formatAllEntries',
        handleBatchFormat
    );

    // 注册本地批量格式化命令
    const batchFormatLocalCommand = vscode.commands.registerCommand(
        'referenceManager.formatAllEntriesLocal',
        handleBatchFormatLocal
    );

    context.subscriptions.push(
        smartFixCommand,
        smartFixOfficialRawCommand,
        smartFixAllCommand,
        smartFixAllOfficialRawCommand,
        officialReportCommand,
        validateEntriesCommand,
        showHistoryCommand,
        formatCommand,
        findUnusedCommand,
        removeDuplicatesCommand,
        activateLicenseCommand,
        viewLicenseStatusCommand,
        formatEntryLocalCommand,
        batchFormatCommand,
        batchFormatLocalCommand
    );

    // 启动时检查配置 (Req 5.2)
    const config = getConfig();
    logInfo(`Config: provider=${config.aiProvider}, hasApiKey=${config.aiProvider === 'groq' ? Boolean(config.groqApiKey) : Boolean(config.apiKey)}`);
    const hasValidApiKey = config.aiProvider === 'groq' 
        ? !!config.groqApiKey 
        : !!config.apiKey;
    
    if (!hasValidApiKey) {
        const settingKey = config.aiProvider === 'groq' 
            ? 'referenceManager.groqApiKey' 
            : 'referenceManager.apiKey';
        
        vscode.window.showInformationMessage(
            'Reference Manager Pro: 智能增强未启用，Smart Fix 将使用本地模式',
            '启用智能增强'
        ).then(action => {
            if (action === '启用智能增强') {
                vscode.commands.executeCommand(
                    'workbench.action.openSettings',
                    settingKey
                );
            }
        });
    }
}

/**
 * 插件停用时调用
 */
export function deactivate(): void {
    console.log('Reference Manager Pro is now deactivated.');
    if (outputChannel) {
        outputChannel.dispose();
    }
}
