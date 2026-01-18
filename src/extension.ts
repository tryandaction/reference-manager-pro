/**
 * Reference Manager Pro - VS Code Extension 主入口
 *
 * 这是插件的入口文件，VS Code会在插件激活时调用activate函数
 * 在这里我们注册所有的命令和事件监听器
 */

import * as vscode from 'vscode';
import { AIFormatter, AIError } from './aiFormatter';
import { parseBibFile, BibEntry, getEntryDescription } from './bibParser';
import { scanWorkspaceForCitations, findBibFiles } from './citationScanner';
import { getConfig, ensureConfigured, onConfigChange } from './config';
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
import { formatBibEntryLocal } from './localFormatter';

/** AI格式化器实例 */
let formatter: AIFormatter | null = null;

/** 输出面板 */
let outputChannel: vscode.OutputChannel | null = null;

/**
 * 重复条目对接口
 */
interface DuplicatePair {
    entry1: BibEntry;
    entry2: BibEntry;
    keepEntry: 'entry1' | 'entry2';
    reason: string;
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
    // 1. 获取当前编辑器和选中文本
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件');
        return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    // 2. 验证选中内容非空 (Req 1.7)
    if (!text.trim()) {
        vscode.window.showWarningMessage('请先选中要格式化的BibTeX条目');
        return;
    }

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
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, formatted);
            });
        });

        // 7. 增加使用次数 (Req 7.1)
        await incrementFormatUsage();

        // 8. 显示成功消息 (Req 1.4)
        vscode.window.showInformationMessage('✅ Entry formatted!');

        // 9. 追踪成功操作并可能请求评分 (Req 11.5)
        await trackSuccessAndMaybeRequestRating();
    } catch (error) {
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
    // 1. 获取当前编辑器和选中文本
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件');
        return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    // 2. 验证选中内容非空
    if (!text.trim()) {
        vscode.window.showWarningMessage('请先选中要格式化的BibTeX条目');
        return;
    }

    // 3. 本地格式化（无需API Key检查，无使用次数限制）
    try {
        const formatted = formatBibEntryLocal(text);

        // 替换选中文本
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, formatted);
        });

        // 显示成功消息 (Req 9.5)
        vscode.window.showInformationMessage('✅ Entry formatted (local mode)');

        // 追踪成功操作 (Req 11.5)
        await trackSuccessAndMaybeRequestRating();
    } catch (error) {
        vscode.window.showErrorMessage(`❌ 本地格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}

/**
 * 处理批量格式化命令（Pro 功能）
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */
async function handleBatchFormat(): Promise<void> {
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
            '了解 Pro 版',
            '取消'
        );
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

    // 6. 批量格式化 (Req 10.5, 10.6)
    let successCount = 0;
    let failCount = 0;
    const failures: string[] = [];
    let newContent = content;

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
                newContent = newContent.replace(entry.rawText, formatted);
                successCount++;
            } catch (error) {
                // 继续处理其他条目 (Req 10.8)
                failCount++;
                failures.push(entry.key);
                console.warn(`格式化失败: ${entry.key}`, error);
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
        return;
    }

    // 7. 应用更改
    const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
    await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, newContent);
    });

    // 8. 显示结果 (Req 10.7, 10.8)
    if (failCount === 0) {
        vscode.window.showInformationMessage(`✅ Formatted ${successCount} entries`);
        await trackSuccessAndMaybeRequestRating();
    } else {
        vscode.window.showWarningMessage(
            `✅ Formatted ${successCount} entries, ❌ ${failCount} failed: ${failures.join(', ')}`
        );
    }
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
        let content = document.getText();

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
        await document.save();
    }

    return deletedCount;
}

/**
 * 处理查找未使用引用命令
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 7.3
 */
async function handleFindUnused(): Promise<void> {
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
        usedKeys = await scanWorkspaceForCitations(progress);

        // 检查是否找到.tex文件 (Req 2.8)
        if (usedKeys.size === 0) {
            // 可能没有.tex文件或没有引用
        }

        // 2.2 查找.bib文件 (Req 2.9)
        progress.report({ message: '查找 .bib 文件...' });
        const bibFiles = await findBibFiles();

        if (bibFiles.length === 0) {
            vscode.window.showWarningMessage('未找到 .bib 文件');
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
    await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, content);
    });

    // 显示统计 (Req 3.10)
    vscode.window.showInformationMessage(`✅ Removed ${deletedCount} duplicate entries`);
}

/**
 * 处理去重命令
 * Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 3.9
 */
async function handleRemoveDuplicates(): Promise<void> {
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

    if (entries.length < 2) {
        vscode.window.showInformationMessage('✅ 条目数量不足，无需检测重复');
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
}

/**
 * 插件激活时调用
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Reference Manager Pro is now active!');

    // 初始化 License 模块
    initLicenseModule(context);

    // 初始化formatter
    formatter = initFormatter();

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

    context.subscriptions.push(
        formatCommand,
        findUnusedCommand,
        removeDuplicatesCommand,
        activateLicenseCommand,
        viewLicenseStatusCommand,
        formatEntryLocalCommand,
        batchFormatCommand
    );

    // 启动时检查配置 (Req 5.2)
    const config = getConfig();
    const hasValidApiKey = config.aiProvider === 'groq' 
        ? !!config.groqApiKey 
        : !!config.apiKey;
    
    if (!hasValidApiKey) {
        const providerName = config.aiProvider === 'groq' ? 'Groq' : 'Anthropic';
        const settingKey = config.aiProvider === 'groq' 
            ? 'referenceManager.groqApiKey' 
            : 'referenceManager.apiKey';
        
        vscode.window.showInformationMessage(
            `Reference Manager Pro: 请配置 ${providerName} API Key 以启用 AI 功能（本地格式化功能可直接使用）`,
            '打开设置'
        ).then(action => {
            if (action === '打开设置') {
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
