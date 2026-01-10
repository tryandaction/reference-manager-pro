/**
 * citationScanner.ts - 引用扫描器
 *
 * 职责：扫描.tex文件，提取所有引用的citation keys
 * 支持多种引用命令：\cite, \citep, \citet, \citeauthor 等
 *
 * 主要功能：
 * - 从单个.tex文件提取引用keys
 * - 扫描整个工作区的所有.tex文件
 * - 查找工作区中的.bib文件
 */

import * as vscode from 'vscode';

/**
 * 支持的LaTeX引用命令列表
 * 包括标准cite和natbib扩展命令
 */
const CITATION_COMMANDS = [
    'cite',           // 标准引用
    'citep',          // natbib: 括号引用 (Author, Year)
    'citet',          // natbib: 文本引用 Author (Year)
    'citeauthor',     // 只引用作者
    'citeyear',       // 只引用年份
    'citealt',        // 无括号引用
    'citealp',        // 无括号括号引用
    'citenum',        // 数字引用
    'citep*',         // 完整作者列表
    'citet*',         // 完整作者列表
    'Cite',           // 句首大写版本
    'Citep',
    'Citet',
    'parencite',      // biblatex: 括号引用
    'textcite',       // biblatex: 文本引用
    'autocite',       // biblatex: 自动选择
    'footcite',       // 脚注引用
    'fullcite',       // 完整引用
    'nocite',         // 不显示但计入参考文献
];

/**
 * 从.tex文件内容中提取所有引用的keys
 *
 * @param texContent .tex文件的内容
 * @returns 引用key数组（已去重）
 *
 * @example
 * const content = '\\cite{einstein1905} and \\citep{feynman1965,dirac1928}';
 * const keys = extractCitationKeys(content);
 * // 返回: ['einstein1905', 'feynman1965', 'dirac1928']
 */
export function extractCitationKeys(texContent: string): string[] {
    const keys = new Set<string>();

    // 构建正则表达式匹配所有支持的引用命令
    // 格式: \cite[可选参数]{key1,key2,...}
    // 或: \cite{key1,key2,...}
    //
    // 正则说明:
    // \\\\            - 匹配反斜杠（在字符串中需要两个\\，正则中再转义）
    // (commands)      - 匹配任意支持的命令
    // (?:\[[^\]]*\])* - 非捕获组，匹配零个或多个可选参数 [...]
    // \{([^}]+)\}     - 捕获花括号内的keys

    const commandPattern = CITATION_COMMANDS
        .map(cmd => cmd.replace('*', '\\*')) // 转义星号
        .join('|');

    const regex = new RegExp(
        `\\\\(${commandPattern})(?:\\[[^\\]]*\\])*\\{([^}]+)\\}`,
        'gi'
    );

    let match: RegExpExecArray | null;

    while ((match = regex.exec(texContent)) !== null) {
        // match[2] 是花括号内的内容，可能包含多个key，用逗号分隔
        const keysString = match[2]!;

        // 分割并清理每个key
        const individualKeys = keysString
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);

        for (const key of individualKeys) {
            keys.add(key);
        }
    }

    return Array.from(keys);
}

/**
 * 扫描工作区中所有.tex文件，收集所有引用的keys
 *
 * @param progress 可选的进度回调
 * @returns Promise<Set<string>> 所有引用key的集合
 *
 * @example
 * const usedKeys = await scanWorkspaceForCitations();
 * console.log(`工作区共引用了 ${usedKeys.size} 个文献`);
 */
export async function scanWorkspaceForCitations(
    progress?: vscode.Progress<{ message?: string; increment?: number }>
): Promise<Set<string>> {
    const allKeys = new Set<string>();

    // 查找所有.tex文件
    const texFiles = await findTexFiles();

    if (texFiles.length === 0) {
        return allKeys;
    }

    const increment = 100 / texFiles.length;

    for (let i = 0; i < texFiles.length; i++) {
        const file = texFiles[i]!;

        // 更新进度
        if (progress) {
            progress.report({
                message: `扫描 ${file.fsPath.split(/[/\\]/).pop()}`,
                increment: i === 0 ? 0 : increment,
            });
        }

        try {
            // 读取文件内容
            const document = await vscode.workspace.openTextDocument(file);
            const content = document.getText();

            // 提取引用keys
            const keys = extractCitationKeys(content);
            for (const key of keys) {
                allKeys.add(key);
            }
        } catch (error) {
            // 文件读取失败时跳过，不中断整个扫描
            console.warn(`无法读取文件 ${file.fsPath}:`, error);
        }
    }

    return allKeys;
}

/**
 * 查找工作区中所有的.tex文件
 *
 * @returns Promise<vscode.Uri[]> .tex文件URI数组
 */
export async function findTexFiles(): Promise<vscode.Uri[]> {
    // 使用glob模式查找所有.tex文件
    // 排除常见的输出目录和临时文件
    const files = await vscode.workspace.findFiles(
        '**/*.tex',
        '{**/node_modules/**,**/.git/**,**/out/**,**/build/**,**/_minted*/**}'
    );

    return files;
}

/**
 * 查找工作区中所有的.bib文件
 *
 * @returns Promise<vscode.Uri[]> .bib文件URI数组
 */
export async function findBibFiles(): Promise<vscode.Uri[]> {
    const files = await vscode.workspace.findFiles(
        '**/*.bib',
        '{**/node_modules/**,**/.git/**,**/out/**,**/build/**}'
    );

    return files;
}

/**
 * 扫描结果接口
 * 用于未使用引用检测功能
 */
export interface UnusedCitationResult {
    /** 未被引用的条目key */
    key: string;
    /** 条目所在的.bib文件 */
    bibFile: vscode.Uri;
    /** 条目的简短描述 */
    description: string;
}

/**
 * 引用统计信息
 */
export interface CitationStats {
    /** 扫描的.tex文件数量 */
    texFileCount: number;
    /** 扫描的.bib文件数量 */
    bibFileCount: number;
    /** .tex中引用的key数量 */
    usedKeyCount: number;
    /** .bib中定义的条目数量 */
    definedEntryCount: number;
    /** 未使用的条目数量 */
    unusedCount: number;
}

/**
 * 从.tex文件内容中提取\bibliography或\addbibresource命令引用的.bib文件名
 *
 * @param texContent .tex文件内容
 * @returns .bib文件名数组（不含扩展名）
 *
 * @example
 * const content = '\\bibliography{refs,extra_refs}';
 * const bibFiles = extractBibliographyFiles(content);
 * // 返回: ['refs', 'extra_refs']
 */
export function extractBibliographyFiles(texContent: string): string[] {
    const bibFiles: string[] = [];

    // 匹配 \bibliography{file1,file2,...}
    const bibRegex = /\\bibliography\{([^}]+)\}/gi;
    let match: RegExpExecArray | null;

    while ((match = bibRegex.exec(texContent)) !== null) {
        const files = match[1]!.split(',').map(f => f.trim());
        bibFiles.push(...files);
    }

    // 匹配 \addbibresource{file.bib} (biblatex)
    const addbibRegex = /\\addbibresource\{([^}]+)\}/gi;

    while ((match = addbibRegex.exec(texContent)) !== null) {
        // 去掉.bib扩展名（如果有）
        const file = match[1]!.replace(/\.bib$/i, '').trim();
        bibFiles.push(file);
    }

    return bibFiles;
}

/**
 * 检查一个key是否在引用集合中
 * 支持大小写不敏感匹配（因为有些LaTeX环境不区分大小写）
 *
 * @param key 要检查的key
 * @param usedKeys 使用中的keys集合
 * @param caseSensitive 是否区分大小写，默认true
 * @returns 是否被使用
 */
export function isKeyUsed(
    key: string,
    usedKeys: Set<string>,
    caseSensitive: boolean = true
): boolean {
    if (caseSensitive) {
        return usedKeys.has(key);
    }

    // 大小写不敏感匹配
    const lowerKey = key.toLowerCase();
    for (const usedKey of usedKeys) {
        if (usedKey.toLowerCase() === lowerKey) {
            return true;
        }
    }

    return false;
}
