/**
 * metadataValidator.ts - BibTeX 元数据校验与评分
 *
 * 职责：仅校验条目质量，不修改原始内容
 */

import { BibEntry } from './bibParser';

export type ValidationSeverity = 'error' | 'warn' | 'info';

export type ValidationStrictness = 'loose' | 'normal' | 'strict';

export type ValidationIssueCode =
    | 'MISSING_REQUIRED'
    | 'INVALID_YEAR'
    | 'INVALID_DOI'
    | 'BAD_PAGES'
    | 'CONFLICT_VENUE'
    | 'UNKNOWN_TYPE'
    | 'DUPLICATE_KEY'
    | 'DUPLICATE_DOI';

export interface ValidationIssue {
    key: string;
    severity: ValidationSeverity;
    code: ValidationIssueCode;
    message: string;
    field?: string;
}

export interface EntryValidationResult {
    key: string;
    score: number; // 0-100
    issues: ValidationIssue[];
}

const REQUIRED_BY_TYPE: Record<string, Array<Array<string>>> = {
    article: [['author'], ['title'], ['journal'], ['year']],
    inproceedings: [['author'], ['title'], ['booktitle'], ['year']],
    proceedings: [['title'], ['year']],
    incollection: [['author'], ['title'], ['booktitle'], ['year']],
    book: [['title'], ['year'], ['publisher'], ['author', 'editor']],
    thesis: [['author'], ['title'], ['year']],
    phdthesis: [['author'], ['title'], ['year'], ['school']],
    mastersthesis: [['author'], ['title'], ['year'], ['school']],
    techreport: [['author'], ['title'], ['year'], ['institution']],
};

const SCORE_PENALTY: Record<ValidationSeverity, number> = {
    error: 20,
    warn: 10,
    info: 2,
};

function hasField(entry: BibEntry, field: string): boolean {
    const value = entry.fields[field];
    return typeof value === 'string' && value.trim().length > 0;
}

function resolveSeverity(
    strictness: ValidationStrictness,
    kind: 'missing' | 'format' | 'conflict' | 'unknown'
): ValidationSeverity {
    if (strictness === 'loose') {
        return kind === 'missing' ? 'warn' : 'info';
    }
    if (strictness === 'strict') {
        return kind === 'format' || kind === 'conflict' ? 'error' : 'error';
    }
    // normal
    return kind === 'missing' ? 'error' : kind === 'format' ? 'warn' : 'info';
}

function validateRequired(entry: BibEntry, strictness: ValidationStrictness): ValidationIssue[] {
    const groups = REQUIRED_BY_TYPE[entry.type];
    if (!groups) {
        return [];
    }

    const issues: ValidationIssue[] = [];
    for (const group of groups) {
        const ok = group.some(field => hasField(entry, field));
        if (!ok) {
            issues.push({
                key: entry.key,
                severity: resolveSeverity(strictness, 'missing'),
                code: 'MISSING_REQUIRED',
                message: `缺少必填字段：${group.join(' 或 ')}`,
                field: group.length === 1 ? group[0] : undefined,
            });
        }
    }
    return issues;
}

function validateYear(entry: BibEntry, strictness: ValidationStrictness): ValidationIssue[] {
    const value = entry.fields.year;
    if (!value) {
        return [];
    }
    if (!/^\d{4}$/.test(value.trim())) {
        return [{
            key: entry.key,
            severity: resolveSeverity(strictness, 'format'),
            code: 'INVALID_YEAR',
            message: `年份格式异常：${value}`,
            field: 'year',
        }];
    }
    return [];
}

function validateDoi(entry: BibEntry, strictness: ValidationStrictness): ValidationIssue[] {
    const value = entry.fields.doi;
    if (!value) {
        return [];
    }
    if (!/^10\./i.test(value.trim())) {
        return [{
            key: entry.key,
            severity: resolveSeverity(strictness, 'format'),
            code: 'INVALID_DOI',
            message: `DOI 格式可能不正确：${value}`,
            field: 'doi',
        }];
    }
    return [];
}

function validatePages(entry: BibEntry, strictness: ValidationStrictness): ValidationIssue[] {
    const value = entry.fields.pages;
    if (!value) {
        return [];
    }
    const trimmed = value.trim();
    const single = /^\d+$/.test(trimmed);
    const range = /^\d+--\d+$/.test(trimmed);
    if (!single && !range) {
        return [{
            key: entry.key,
            severity: resolveSeverity(strictness, 'format'),
            code: 'BAD_PAGES',
            message: `页码格式异常：${value}`,
            field: 'pages',
        }];
    }
    if (trimmed.includes('-') && !trimmed.includes('--')) {
        return [{
            key: entry.key,
            severity: resolveSeverity(strictness, 'format'),
            code: 'BAD_PAGES',
            message: `页码范围建议使用双连字符：${value}`,
            field: 'pages',
        }];
    }
    return [];
}

function validateVenueConflict(entry: BibEntry, strictness: ValidationStrictness): ValidationIssue[] {
    const hasJournal = hasField(entry, 'journal');
    const hasBooktitle = hasField(entry, 'booktitle');
    if (hasJournal && hasBooktitle) {
        return [{
            key: entry.key,
            severity: resolveSeverity(strictness, 'conflict'),
            code: 'CONFLICT_VENUE',
            message: 'journal 与 booktitle 同时存在，可能冲突',
            field: 'journal',
        }];
    }
    return [];
}

function validateUnknownType(entry: BibEntry, strictness: ValidationStrictness): ValidationIssue[] {
    if (REQUIRED_BY_TYPE[entry.type]) {
        return [];
    }
    return [{
        key: entry.key,
        severity: resolveSeverity(strictness, 'unknown'),
        code: 'UNKNOWN_TYPE',
        message: `未知条目类型：${entry.type}`,
    }];
}

export function validateEntry(
    entry: BibEntry,
    strictness: ValidationStrictness = 'normal'
): EntryValidationResult {
    const issues: ValidationIssue[] = [
        ...validateRequired(entry, strictness),
        ...validateYear(entry, strictness),
        ...validateDoi(entry, strictness),
        ...validatePages(entry, strictness),
        ...validateVenueConflict(entry, strictness),
        ...validateUnknownType(entry, strictness),
    ];

    let score = 100;
    for (const issue of issues) {
        score -= SCORE_PENALTY[issue.severity];
    }
    if (score < 0) {
        score = 0;
    }

    return { key: entry.key, score, issues };
}

export function validateEntries(
    entries: BibEntry[],
    strictness: ValidationStrictness = 'normal',
    options: { detectDuplicates?: boolean } = {}
): EntryValidationResult[] {
    const results = entries.map(entry => validateEntry(entry, strictness));
    const detectDuplicates = options.detectDuplicates !== false;

    if (!detectDuplicates) {
        return results;
    }

    const resultMap = new Map<string, EntryValidationResult>();
    for (const result of results) {
        resultMap.set(result.key, result);
    }

    const keyMap = new Map<string, string[]>();
    const doiMap = new Map<string, string[]>();

    for (const entry of entries) {
        if (!keyMap.has(entry.key)) {
            keyMap.set(entry.key, []);
        }
        keyMap.get(entry.key)!.push(entry.key);

        const doiRaw = entry.fields.doi;
        if (doiRaw) {
            const doi = doiRaw.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();
            if (!doiMap.has(doi)) {
                doiMap.set(doi, []);
            }
            doiMap.get(doi)!.push(entry.key);
        }
    }

    for (const [key, keys] of keyMap) {
        if (keys.length <= 1) {
            continue;
        }
        const result = resultMap.get(key);
        if (!result) {
            continue;
        }
        result.issues.push({
            key,
            severity: 'error',
            code: 'DUPLICATE_KEY',
            message: `重复引用 key（共 ${keys.length} 个）`,
            field: 'key',
        });
    }

    for (const [, keys] of doiMap) {
        if (keys.length <= 1) {
            continue;
        }
        for (const key of keys) {
            const result = resultMap.get(key);
            if (!result) {
                continue;
            }
            result.issues.push({
                key,
                severity: 'warn',
                code: 'DUPLICATE_DOI',
                message: `重复 DOI（共 ${keys.length} 个）`,
                field: 'doi',
            });
        }
    }

    return results;
}
