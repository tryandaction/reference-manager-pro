/**
 * localFormatter.ts - 本地离线格式化模块
 *
 * 职责：提供无需 API 的本地规则格式化功能
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

/**
 * 标准字段顺序
 */
const FIELD_ORDER = [
    'author',
    'title',
    'journal',
    'booktitle',
    'publisher',
    'year',
    'volume',
    'number',
    'pages',
    'doi',
    'url',
    'abstract',
    'keywords',
    'note',
];

/**
 * 常见字段名拼写错误映射
 */
const FIELD_TYPOS: Record<string, string> = {
    'autor': 'author',
    'authr': 'author',
    'authro': 'author',
    'titl': 'title',
    'titel': 'title',
    'tilte': 'title',
    'journl': 'journal',
    'jounral': 'journal',
    'jounal': 'journal',
    'publihser': 'publisher',
    'pubisher': 'publisher',
    'publishr': 'publisher',
    'yer': 'year',
    'yaer': 'year',
    'yera': 'year',
    'volum': 'volume',
    'vlume': 'volume',
    'numbr': 'number',
    'nubmer': 'number',
    'pags': 'pages',
    'pagse': 'pages',
    'abstact': 'abstract',
    'abstrac': 'abstract',
    'keywrods': 'keywords',
    'keywods': 'keywords',
};

/**
 * 解析 BibTeX 条目的字段
 */
function parseFields(content: string): Map<string, string> {
    const fields = new Map<string, string>();

    // 匹配字段: fieldname = {value} 或 fieldname = "value"
    const fieldRegex = /(\w+)\s*=\s*(?:\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}|"([^"]*)")/g;
    let match;

    while ((match = fieldRegex.exec(content)) !== null) {
        const fieldName = match[1]!.toLowerCase();
        const value = match[2] ?? match[3] ?? '';
        fields.set(fieldName, value.trim());
    }

    return fields;
}

/**
 * 修复字段名拼写错误
 * Requirements: 9.2
 */
function fixFieldTypos(fields: Map<string, string>): Map<string, string> {
    const fixed = new Map<string, string>();

    for (const [key, value] of fields) {
        const correctedKey = FIELD_TYPOS[key] ?? key;
        fixed.set(correctedKey, value);
    }

    return fixed;
}

/**
 * 清理字段值中的多余空白
 * Requirements: 9.2
 */
function cleanFieldValue(value: string): string {
    return value
        .replace(/\s+/g, ' ')  // 多个空白替换为单个空格
        .replace(/\s*\n\s*/g, ' ')  // 换行替换为空格
        .trim();
}

/**
 * 按标准顺序排列字段
 * Requirements: 9.2
 */
function sortFields(fields: Map<string, string>): Array<[string, string]> {
    const sorted: Array<[string, string]> = [];
    const remaining = new Map(fields);

    // 先按标准顺序添加
    for (const fieldName of FIELD_ORDER) {
        if (remaining.has(fieldName)) {
            sorted.push([fieldName, remaining.get(fieldName)!]);
            remaining.delete(fieldName);
        }
    }

    // 剩余字段按字母顺序添加
    const remainingKeys = Array.from(remaining.keys()).sort();
    for (const key of remainingKeys) {
        sorted.push([key, remaining.get(key)!]);
    }

    return sorted;
}

/**
 * 本地格式化 BibTeX 条目
 * Requirements: 9.2, 9.3
 *
 * @param entry 原始 BibTeX 条目文本
 * @returns 格式化后的条目文本
 */
export function formatBibEntryLocal(entry: string): string {
    // 提取条目类型和 key
    const headerMatch = entry.match(/@(\w+)\s*\{\s*([^,\s]+)\s*,/);
    if (!headerMatch) {
        // 无法解析，返回原文
        return entry;
    }

    const entryType = headerMatch[1]!.toLowerCase();
    const entryKey = headerMatch[2]!;

    // 提取字段内容（去掉头部和尾部的 }）
    const contentStart = entry.indexOf(',') + 1;
    const contentEnd = entry.lastIndexOf('}');
    if (contentStart <= 0 || contentEnd <= contentStart) {
        return entry;
    }

    const content = entry.substring(contentStart, contentEnd);

    // 解析字段
    let fields = parseFields(content);

    // 修复拼写错误
    fields = fixFieldTypos(fields);

    // 清理字段值
    for (const [key, value] of fields) {
        fields.set(key, cleanFieldValue(value));
    }

    // 排序字段
    const sortedFields = sortFields(fields);

    // 重新构建条目
    const lines: string[] = [];
    lines.push(`@${entryType}{${entryKey},`);

    for (const [fieldName, value] of sortedFields) {
        lines.push(`  ${fieldName} = {${value}},`);
    }

    lines.push('}');

    return lines.join('\n');
}
