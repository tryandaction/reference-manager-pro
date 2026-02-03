/**
 * localFormatter.ts - 本地离线格式化模块
 *
 * 职责：提供无需 API 的本地规则格式化功能，并统一字段顺序/空白/常见拼写。
 */

import { BibEntry, BibFields, parseBibFile, serializeBibEntry } from './bibParser';

export interface LocalFormatOptions {
    normalizeAuthors: boolean;
    protectTitleWords: string[];
    journalAbbreviations: Record<string, string>;
}

/**
 * 常见期刊/会议的标准缩写映射（完整版）
 * 基于 ISO 4 标准和各出版商官方缩写
 */
const DEFAULT_JOURNAL_ABBREVIATIONS: Record<string, string> = {
    // ============ Physical Review 系列 (APS) ============
    'Physical Review Letters': 'Phys. Rev. Lett.',
    'Phys. Rev. Lett.': 'Phys. Rev. Lett.',
    'Physical Review A': 'Phys. Rev. A',
    'Phys. Rev. A': 'Phys. Rev. A',
    'Physical Review B': 'Phys. Rev. B',
    'Phys. Rev. B': 'Phys. Rev. B',
    'Physical Review C': 'Phys. Rev. C',
    'Phys. Rev. C': 'Phys. Rev. C',
    'Physical Review D': 'Phys. Rev. D',
    'Phys. Rev. D': 'Phys. Rev. D',
    'Physical Review E': 'Phys. Rev. E',
    'Phys. Rev. E': 'Phys. Rev. E',
    'Physical Review X': 'Phys. Rev. X',
    'Phys. Rev. X': 'Phys. Rev. X',
    'Physical Review Applied': 'Phys. Rev. Applied',
    'Phys. Rev. Applied': 'Phys. Rev. Applied',
    'Physical Review Research': 'Phys. Rev. Research',
    'Phys. Rev. Research': 'Phys. Rev. Research',
    'Physical Review Accelerators and Beams': 'Phys. Rev. Accel. Beams',
    'Physical Review Fluids': 'Phys. Rev. Fluids',
    'Physical Review Materials': 'Phys. Rev. Materials',
    'Physical Review Physics Education Research': 'Phys. Rev. Phys. Educ. Res.',
    'Reviews of Modern Physics': 'Rev. Mod. Phys.',
    'Rev. Mod. Phys.': 'Rev. Mod. Phys.',
    'PRX Quantum': 'PRX Quantum',
    'PRX Energy': 'PRX Energy',
    'PRX Life': 'PRX Life',

    // ============ Nature 系列 (Springer Nature) ============
    'Nature': 'Nature',
    'Nature Physics': 'Nat. Phys.',
    'Nat. Phys.': 'Nat. Phys.',
    'Nature Photonics': 'Nat. Photonics',
    'Nat. Photonics': 'Nat. Photonics',
    'Nature Communications': 'Nat. Commun.',
    'Nat. Commun.': 'Nat. Commun.',
    'Nature Nanotechnology': 'Nat. Nanotechnol.',
    'Nat. Nanotechnol.': 'Nat. Nanotechnol.',
    'Nature Materials': 'Nat. Mater.',
    'Nat. Mater.': 'Nat. Mater.',
    'Nature Methods': 'Nat. Methods',
    'Nature Chemistry': 'Nat. Chem.',
    'Nature Electronics': 'Nat. Electron.',
    'Nature Astronomy': 'Nat. Astron.',
    'Nature Reviews Physics': 'Nat. Rev. Phys.',
    'Nature Computational Science': 'Nat. Comput. Sci.',
    'Communications Physics': 'Commun. Phys.',
    'npj Quantum Information': 'npj Quantum Inf.',
    'npj Quantum Inf.': 'npj Quantum Inf.',

    // ============ Science 系列 (AAAS) ============
    'Science': 'Science',
    'Science Advances': 'Sci. Adv.',
    'Sci. Adv.': 'Sci. Adv.',
    'Scientific Reports': 'Sci. Rep.',
    'Sci. Rep.': 'Sci. Rep.',
    'Science Robotics': 'Sci. Robot.',

    // ============ Optica/OSA 系列 (Optica Publishing Group) ============
    'Optica': 'Optica',
    'Optics Express': 'Opt. Express',
    'Opt. Express': 'Opt. Express',
    'Optics Letters': 'Opt. Lett.',
    'Opt. Lett.': 'Opt. Lett.',
    'Applied Optics': 'Appl. Opt.',
    'Appl. Opt.': 'Appl. Opt.',
    'Journal of the Optical Society of America A': 'J. Opt. Soc. Am. A',
    'J. Opt. Soc. Am. A': 'J. Opt. Soc. Am. A',
    'Journal of the Optical Society of America B': 'J. Opt. Soc. Am. B',
    'J. Opt. Soc. Am. B': 'J. Opt. Soc. Am. B',
    'Photonics Research': 'Photonics Res.',
    'Photonics Res.': 'Photonics Res.',
    'Advanced Photonics': 'Adv. Photonics',
    'Adv. Photonics': 'Adv. Photonics',
    'Optical Materials Express': 'Opt. Mater. Express',
    'Journal of Lightwave Technology': 'J. Lightwave Technol.',

    // ============ IOP Publishing ============
    'New Journal of Physics': 'New J. Phys.',
    'New J. Phys.': 'New J. Phys.',
    'Quantum Science and Technology': 'Quantum Sci. Technol.',
    'Quantum Sci. Technol.': 'Quantum Sci. Technol.',
    'Journal of Physics A: Mathematical and Theoretical': 'J. Phys. A: Math. Theor.',
    'Journal of Physics B: Atomic, Molecular and Optical Physics': 'J. Phys. B: At. Mol. Opt. Phys.',
    'J. Phys. B: At. Mol. Opt. Phys.': 'J. Phys. B: At. Mol. Opt. Phys.',
    'Journal of Physics: Condensed Matter': 'J. Phys.: Condens. Matter',
    'Classical and Quantum Gravity': 'Class. Quantum Grav.',
    'Class. Quantum Grav.': 'Class. Quantum Grav.',
    'Reports on Progress in Physics': 'Rep. Prog. Phys.',
    'Rep. Prog. Phys.': 'Rep. Prog. Phys.',
    'Superconductor Science and Technology': 'Supercond. Sci. Technol.',
    'Nanotechnology': 'Nanotechnology',
    'Journal of Optics': 'J. Opt.',
    'J. Opt.': 'J. Opt.',
    'Journal of Optics B: Quantum and Semiclassical Optics': 'J. Opt. B: Quantum Semiclass. Opt.',
    'Metrologia': 'Metrologia',
    '2D Materials': '2D Mater.',
    'Plasma Sources Science and Technology': 'Plasma Sources Sci. Technol.',

    // ============ AIP Publishing ============
    'Applied Physics Letters': 'Appl. Phys. Lett.',
    'Appl. Phys. Lett.': 'Appl. Phys. Lett.',
    'Applied Physics Reviews': 'Appl. Phys. Rev.',
    'Appl. Phys. Rev.': 'Appl. Phys. Rev.',
    'Journal of Applied Physics': 'J. Appl. Phys.',
    'J. Appl. Phys.': 'J. Appl. Phys.',
    'Review of Scientific Instruments': 'Rev. Sci. Instrum.',
    'Rev. Sci. Instrum.': 'Rev. Sci. Instrum.',
    'The Journal of Chemical Physics': 'J. Chem. Phys.',
    'Journal of Chemical Physics': 'J. Chem. Phys.',
    'J. Chem. Phys.': 'J. Chem. Phys.',
    'Physics of Plasmas': 'Phys. Plasmas',
    'Phys. Plasmas': 'Phys. Plasmas',
    'Physics of Fluids': 'Phys. Fluids',
    'Phys. Fluids': 'Phys. Fluids',
    'AIP Advances': 'AIP Adv.',
    'AIP Adv.': 'AIP Adv.',
    'AVS Quantum Science': 'AVS Quantum Sci.',
    'AVS Quantum Sci.': 'AVS Quantum Sci.',
    'APL Photonics': 'APL Photonics',
    'APL Quantum': 'APL Quantum',
    'APL Materials': 'APL Mater.',

    // ============ ACS (American Chemical Society) ============
    'Nano Letters': 'Nano Lett.',
    'Nano Lett.': 'Nano Lett.',
    'ACS Nano': 'ACS Nano',
    'ACS Photonics': 'ACS Photonics',
    'Journal of the American Chemical Society': 'J. Am. Chem. Soc.',
    'J. Am. Chem. Soc.': 'J. Am. Chem. Soc.',
    'The Journal of Physical Chemistry Letters': 'J. Phys. Chem. Lett.',
    'Journal of Physical Chemistry Letters': 'J. Phys. Chem. Lett.',
    'J. Phys. Chem. Lett.': 'J. Phys. Chem. Lett.',
    'The Journal of Physical Chemistry A': 'J. Phys. Chem. A',
    'The Journal of Physical Chemistry B': 'J. Phys. Chem. B',
    'The Journal of Physical Chemistry C': 'J. Phys. Chem. C',
    'Chemistry of Materials': 'Chem. Mater.',

    // ============ Elsevier ============
    'Physics Letters A': 'Phys. Lett. A',
    'Phys. Lett. A': 'Phys. Lett. A',
    'Physics Letters B': 'Phys. Lett. B',
    'Phys. Lett. B': 'Phys. Lett. B',
    'Nuclear Physics A': 'Nucl. Phys. A',
    'Nucl. Phys. A': 'Nucl. Phys. A',
    'Nuclear Physics B': 'Nucl. Phys. B',
    'Nucl. Phys. B': 'Nucl. Phys. B',
    'Physics Reports': 'Phys. Rep.',
    'Phys. Rep.': 'Phys. Rep.',
    'Annals of Physics': 'Ann. Phys.',
    'Ann. Phys.': 'Ann. Phys.',
    'Nuclear Instruments and Methods in Physics Research Section A': 'Nucl. Instrum. Methods Phys. Res. A',
    'Nuclear Instruments and Methods in Physics Research Section B': 'Nucl. Instrum. Methods Phys. Res. B',
    'Optics Communications': 'Opt. Commun.',
    'Opt. Commun.': 'Opt. Commun.',
    'Journal of Quantitative Spectroscopy and Radiative Transfer': 'J. Quant. Spectrosc. Radiat. Transfer',
    'Computer Physics Communications': 'Comput. Phys. Commun.',

    // ============ Springer ============
    'The European Physical Journal A': 'Eur. Phys. J. A',
    'European Physical Journal A': 'Eur. Phys. J. A',
    'Eur. Phys. J. A': 'Eur. Phys. J. A',
    'The European Physical Journal B': 'Eur. Phys. J. B',
    'European Physical Journal B': 'Eur. Phys. J. B',
    'The European Physical Journal C': 'Eur. Phys. J. C',
    'European Physical Journal C': 'Eur. Phys. J. C',
    'The European Physical Journal D': 'Eur. Phys. J. D',
    'European Physical Journal D': 'Eur. Phys. J. D',
    'Eur. Phys. J. D': 'Eur. Phys. J. D',
    'Applied Physics B': 'Appl. Phys. B',
    'Appl. Phys. B': 'Appl. Phys. B',
    'Applied Physics A': 'Appl. Phys. A',
    'Appl. Phys. A': 'Appl. Phys. A',
    'Quantum Information Processing': 'Quantum Inf. Process.',
    'Quantum Inf. Process.': 'Quantum Inf. Process.',
    'Journal of High Energy Physics': 'J. High Energy Phys.',
    'J. High Energy Phys.': 'J. High Energy Phys.',
    'JHEP': 'J. High Energy Phys.',
    'Living Reviews in Relativity': 'Living Rev. Relativ.',

    // ============ IEEE ============
    'IEEE Transactions on Quantum Engineering': 'IEEE Trans. Quantum Eng.',
    'IEEE Transactions on Microwave Theory and Techniques': 'IEEE Trans. Microw. Theory Tech.',
    'IEEE Transactions on Applied Superconductivity': 'IEEE Trans. Appl. Supercond.',
    'IEEE Journal of Quantum Electronics': 'IEEE J. Quantum Electron.',
    'IEEE Photonics Technology Letters': 'IEEE Photonics Technol. Lett.',
    'IEEE Photonics Journal': 'IEEE Photonics J.',
    'Proceedings of the IEEE': 'Proc. IEEE',

    // ============ 其他重要期刊 ============
    'Quantum': 'Quantum',
    'Physical Review': 'Phys. Rev.',
    'Phys. Rev.': 'Phys. Rev.',
    'Proceedings of the National Academy of Sciences': 'Proc. Natl. Acad. Sci. U.S.A.',
    'PNAS': 'Proc. Natl. Acad. Sci. U.S.A.',
    'Proc. Natl. Acad. Sci. U.S.A.': 'Proc. Natl. Acad. Sci. U.S.A.',
    'Soviet Journal of Nuclear Physics': 'Sov. J. Nucl. Phys.',
    'Sov. J. Nucl. Phys.': 'Sov. J. Nucl. Phys.',
    'Soviet Physics JETP': 'Sov. Phys. JETP',
    'Sov. Phys. JETP': 'Sov. Phys. JETP',
    'Journal of Experimental and Theoretical Physics': 'J. Exp. Theor. Phys.',
    'JETP Letters': 'JETP Lett.',
    'JETP Lett.': 'JETP Lett.',
    'Opto-Electronics Review': 'Opto-Electron. Rev.',
    'Opto-Electron. Rev.': 'Opto-Electron. Rev.',
    'Laser Physics Letters': 'Laser Phys. Lett.',
    'Laser Phys. Lett.': 'Laser Phys. Lett.',
    'Laser Physics': 'Laser Phys.',
    'Chinese Physics Letters': 'Chin. Phys. Lett.',
    'Chinese Physics B': 'Chin. Phys. B',
    'Frontiers of Physics': 'Front. Phys.',
    'Annalen der Physik': 'Ann. Phys. (Berlin)',
    'Physica Scripta': 'Phys. Scr.',
    'Phys. Scr.': 'Phys. Scr.',
    'Journal of Modern Optics': 'J. Mod. Opt.',
    'J. Mod. Opt.': 'J. Mod. Opt.',
    'Foundations of Physics': 'Found. Phys.',
    'Found. Phys.': 'Found. Phys.',
    'Communications in Mathematical Physics': 'Commun. Math. Phys.',
    'Commun. Math. Phys.': 'Commun. Math. Phys.',
    'Monthly Notices of the Royal Astronomical Society': 'Mon. Not. R. Astron. Soc.',
    'The Astrophysical Journal': 'Astrophys. J.',
    'Astrophysical Journal': 'Astrophys. J.',
    'Astrophys. J.': 'Astrophys. J.',
    'The Astrophysical Journal Letters': 'Astrophys. J. Lett.',
    'Astronomy & Astrophysics': 'Astron. Astrophys.',
    'Astron. Astrophys.': 'Astron. Astrophys.',
};

/**
 * 输出字段顺序：偏学术期刊/会议的常见字段排序
 */
const FIELD_ORDER = [
    'author',
    'title',
    'journal',
    'booktitle',
    'year',
    'month',
    'volume',
    'number',
    'pages',
    'doi',
    'url',
    'publisher',
    'address',
    'edition',
    'note',
    'abstract',
    'keywords',
] as const;

/**
 * 常见字段名拼写错误映射
 */
const FIELD_TYPOS: Record<string, string> = {
    autor: 'author',
    authr: 'author',
    authro: 'author',
    titl: 'title',
    titel: 'title',
    tilte: 'title',
    journl: 'journal',
    jounral: 'journal',
    jounal: 'journal',
    publihser: 'publisher',
    pubisher: 'publisher',
    publishr: 'publisher',
    yer: 'year',
    yaer: 'year',
    yera: 'year',
    volum: 'volume',
    vlume: 'volume',
    numbr: 'number',
    nubmer: 'number',
    pags: 'pages',
    pagse: 'pages',
    abstact: 'abstract',
    abstrac: 'abstract',
    keywrods: 'keywords',
    keywods: 'keywords',
};

/**
 * BibLaTeX 常见字段别名 → BibTeX 标准字段
 */
const FIELD_ALIASES: Record<string, string> = {
    journaltitle: 'journal',
    date: 'year',
    issue: 'number',
    location: 'address',
};

/**
 * 清理 MathML/HTML/XML 标签，将其转换为 LaTeX 格式
 * DOI 返回的官方 BibTeX 中经常包含这些标签
 */
function cleanXmlTags(value: string): string {
    let result = value;

    // 处理 MathML 数学公式标签
    // 例如: <mml:math xmlns:mml="..."><mml:mi>CP</mml:mi></mml:math> -> $CP$
    // 或: <mml:math><mml:mi>Λ</mml:mi></mml:math> -> $\Lambda$
    result = result.replace(/<mml:math[^>]*>([\s\S]*?)<\/mml:math>/gi, (_, content) => {
        // 提取 MathML 内容并转换为 LaTeX
        let mathContent = content
            // 移除 mml: 前缀的标签
            .replace(/<\/?mml:[^>]+>/gi, '')
            // 移除其他 XML 标签
            .replace(/<[^>]+>/g, '')
            .trim();

        // 希腊字母映射
        const greekMap: Record<string, string> = {
            'Α': '\\Alpha', 'Β': '\\Beta', 'Γ': '\\Gamma', 'Δ': '\\Delta',
            'Ε': '\\Epsilon', 'Ζ': '\\Zeta', 'Η': '\\Eta', 'Θ': '\\Theta',
            'Ι': '\\Iota', 'Κ': '\\Kappa', 'Λ': '\\Lambda', 'Μ': '\\Mu',
            'Ν': '\\Nu', 'Ξ': '\\Xi', 'Ο': '\\Omicron', 'Π': '\\Pi',
            'Ρ': '\\Rho', 'Σ': '\\Sigma', 'Τ': '\\Tau', 'Υ': '\\Upsilon',
            'Φ': '\\Phi', 'Χ': '\\Chi', 'Ψ': '\\Psi', 'Ω': '\\Omega',
            'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
            'ε': '\\epsilon', 'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta',
            'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu',
            'ν': '\\nu', 'ξ': '\\xi', 'ο': '\\omicron', 'π': '\\pi',
            'ρ': '\\rho', 'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon',
            'φ': '\\phi', 'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
        };

        for (const [greek, latex] of Object.entries(greekMap)) {
            mathContent = mathContent.replace(new RegExp(greek, 'g'), latex);
        }

        // 如果内容非空，包裹在 $ 中
        if (mathContent.length > 0) {
            return `$${mathContent}$`;
        }
        return '';
    });

    // 处理 HTML 实体
    const htmlEntities: Record<string, string> = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '\\&',
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&ndash;': '--',
        '&mdash;': '---',
        '&minus;': '-',
        '&times;': '$\\times$',
        '&plusmn;': '$\\pm$',
        '&deg;': '$^\\circ$',
        '&mu;': '$\\mu$',
        '&alpha;': '$\\alpha$',
        '&beta;': '$\\beta$',
        '&gamma;': '$\\gamma$',
        '&delta;': '$\\delta$',
        '&epsilon;': '$\\epsilon$',
        '&lambda;': '$\\lambda$',
        '&pi;': '$\\pi$',
        '&sigma;': '$\\sigma$',
        '&omega;': '$\\omega$',
        '&Omega;': '$\\Omega$',
        '&infin;': '$\\infty$',
        '&rarr;': '$\\rightarrow$',
        '&larr;': '$\\leftarrow$',
        '&harr;': '$\\leftrightarrow$',
        '&ne;': '$\\neq$',
        '&le;': '$\\leq$',
        '&ge;': '$\\geq$',
        '&sim;': '$\\sim$',
        '&asymp;': '$\\approx$',
        '&equiv;': '$\\equiv$',
        '&prop;': '$\\propto$',
        '&sum;': '$\\sum$',
        '&prod;': '$\\prod$',
        '&int;': '$\\int$',
        '&part;': '$\\partial$',
        '&nabla;': '$\\nabla$',
        '&radic;': '$\\sqrt{}$',
        '&ang;': '$\\angle$',
        '&perp;': '$\\perp$',
        '&para;': '$\\parallel$',
        '&sub;': '$\\subset$',
        '&sup;': '$\\supset$',
        '&cup;': '$\\cup$',
        '&cap;': '$\\cap$',
        '&isin;': '$\\in$',
        '&notin;': '$\\notin$',
        '&empty;': '$\\emptyset$',
        '&forall;': '$\\forall$',
        '&exist;': '$\\exists$',
    };

    for (const [entity, replacement] of Object.entries(htmlEntities)) {
        result = result.replace(new RegExp(entity, 'g'), replacement);
    }

    // 处理数字实体 (&#xxx; 或 &#xXXX;)
    result = result.replace(/&#(\d+);/g, (_, code) => {
        return String.fromCharCode(parseInt(code, 10));
    });
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
        return String.fromCharCode(parseInt(code, 16));
    });

    // 移除其他 HTML/XML 标签（如 <sub>, <sup>, <i>, <b> 等）
    // <sub>2</sub> -> $_2$
    result = result.replace(/<sub>([^<]*)<\/sub>/gi, (_, content) => `$_{${content}}$`);
    // <sup>2</sup> -> $^2$
    result = result.replace(/<sup>([^<]*)<\/sup>/gi, (_, content) => `$^{${content}}$`);
    // <i>text</i> -> \textit{text}
    result = result.replace(/<i>([^<]*)<\/i>/gi, (_, content) => `\\textit{${content}}`);
    result = result.replace(/<em>([^<]*)<\/em>/gi, (_, content) => `\\textit{${content}}`);
    // <b>text</b> -> \textbf{text}
    result = result.replace(/<b>([^<]*)<\/b>/gi, (_, content) => `\\textbf{${content}}`);
    result = result.replace(/<strong>([^<]*)<\/strong>/gi, (_, content) => `\\textbf{${content}}`);

    // 移除剩余的 XML/HTML 标签
    result = result.replace(/<[^>]+>/g, '');

    // 合并连续的数学模式 $...$..$ -> $...$
    result = result.replace(/\$\s*\$/g, '');

    return result;
}

function collapseWhitespace(value: string): string {
    return value
        .replace(/\s+/g, ' ')
        .replace(/\s*[\r\n]+\s*/g, ' ')
        .trim();
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function protectTitleWords(title: string, words: string[]): string {
    let out = title;
    for (const w of words) {
        const trimmed = w.trim();
        if (!trimmed) {
            continue;
        }
        // 仅在未被 {} 包裹的情况下保护；这是启发式规则，避免破坏已有的大括号结构。
        const re = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'g');
        out = out.replace(re, (m, offset) => {
            const before = out[offset - 1];
            const after = out[offset + m.length];
            if (before === '{' && after === '}') {
                return m;
            }
            return `{${m}}`;
        });
    }
    return out;
}

function abbreviateVenue(value: string, map: Record<string, string>): string {
    const v = collapseWhitespace(value);
    if (!v) {
        return v;
    }
    if (map[v]) {
        return map[v]!;
    }
    const lower = v.toLowerCase();
    for (const [k, abbr] of Object.entries(map)) {
        if (k.toLowerCase() === lower) {
            return abbr;
        }
    }
    return v;
}

function normalizePages(pages: string): string {
    const cleaned = pages.replace(/\s+/g, '');
    return cleaned.replace(/-+/g, '--');
}

function normalizeYear(year: string): string {
    const match = year.match(/\d{4}/);
    return match ? match[0] : collapseWhitespace(year);
}

function extractDateParts(value: string): { year?: string; month?: string } {
    const normalized = collapseWhitespace(value);
    const match = normalized.match(/(\d{4})[/-](\d{1,2})(?:[/-]\d{1,2})?/);
    if (!match) {
        return {};
    }

    const monthNum = Number.parseInt(match[2]!, 10);
    const month = monthNum >= 1 && monthNum <= 12 ? String(monthNum) : undefined;

    return {
        year: match[1],
        month,
    };
}

function normalizeDoi(doi: string): string {
    const trimmed = collapseWhitespace(doi);
    return trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();
}

function normalizeAuthors(value: string): string {
    const rawAuthors = value.split(/\s+and\s+/i).map(a => a.trim()).filter(Boolean);
    const normalized = rawAuthors.map(author => {
        if (author.includes('{')) {
            // 保留手动保护的大写/顺序
            return collapseWhitespace(author);
        }
        const nameValue = normalizeBiblatexNameValue(author);
        if (nameValue) {
            return nameValue;
        }
        if (author.includes(',')) {
            const parts = author.split(',').map(p => p.trim()).filter(Boolean);
            return parts.join(', ');
        }

        const parts = author.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            const last = parts.pop()!;
            return `${last}, ${parts.join(' ')}`;
        }
        return author.trim();
    });

    return normalized.join(' and ');
}

function normalizeBiblatexNameValue(author: string): string | null {
    if (!author.includes('=')) {
        return null;
    }

    const kvPairs = author.split(',').map(part => part.trim()).filter(Boolean);
    const map: Record<string, string> = {};
    let sawPair = false;

    for (const pair of kvPairs) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex === -1) {
            continue;
        }
        const key = pair.slice(0, eqIndex).trim().toLowerCase();
        const value = pair.slice(eqIndex + 1).trim();
        if (!value) {
            continue;
        }
        sawPair = true;
        map[key] = value;
    }

    if (!sawPair) {
        return null;
    }

    const family = map.family ?? '';
    const given = map.given ?? '';
    const prefix = map.prefix ?? '';
    const suffix = map.suffix ?? '';

    const last = [prefix, family].filter(Boolean).join(' ').trim();
    if (!last && !given) {
        return null;
    }

    let name = last || given;
    if (given && last) {
        name = `${last}, ${given}`;
    }
    if (suffix) {
        name = `${name}, ${suffix}`;
    }

    return collapseWhitespace(name);
}

function normalizeFieldValue(key: string, value: string, options: LocalFormatOptions): string {
    // 首先清理所有字段中的 XML/HTML 标签
    const cleanedValue = cleanXmlTags(value);

    switch (key) {
        case 'pages':
            return normalizePages(cleanedValue);
        case 'year':
            return normalizeYear(cleanedValue);
        case 'author':
            return options.normalizeAuthors ? normalizeAuthors(cleanedValue) : collapseWhitespace(cleanedValue);
        case 'title':
            return protectTitleWords(collapseWhitespace(cleanedValue), options.protectTitleWords);
        case 'doi':
            return normalizeDoi(cleanedValue);
        case 'journal':
        case 'booktitle':
            return abbreviateVenue(cleanedValue, options.journalAbbreviations);
        default:
            return collapseWhitespace(cleanedValue);
    }
}

function normalizeFields(fields: BibFields, options: LocalFormatOptions): BibFields {
    const normalized: BibFields = {};

    for (const [rawKey, rawValue] of Object.entries(fields)) {
        if (rawValue === undefined) {
            continue;
        }

        const fixedKey = FIELD_TYPOS[rawKey] ?? rawKey;
        const canonicalKey = FIELD_ALIASES[fixedKey] ?? fixedKey;
        if (fixedKey === 'date') {
            const dateParts = extractDateParts(rawValue);
            const yearValue = normalizeFieldValue('year', rawValue, options);
            if (yearValue.length > 0 && normalized.year === undefined) {
                normalized.year = yearValue;
            }
            if (dateParts.month && normalized.month === undefined) {
                normalized.month = dateParts.month;
            }
            continue;
        }
        const cleanedValue = normalizeFieldValue(canonicalKey, rawValue, options);

        if (cleanedValue.length === 0) {
            continue;
        }

        if (normalized[canonicalKey] === undefined) {
            normalized[canonicalKey] = cleanedValue;
        }
    }

    // 确保未声明但重要的字段按顺序输出
    const ordered: BibFields = {};
    for (const key of FIELD_ORDER) {
        if (normalized[key] !== undefined) {
            ordered[key] = normalized[key];
        }
    }

    // 附加额外字段（如 arxiv、isbn 等），按字母序放在末尾
    const remainingKeys = Object.keys(normalized)
        .filter(k => !(FIELD_ORDER as readonly string[]).includes(k))
        .sort();
    for (const key of remainingKeys) {
        ordered[key] = normalized[key];
    }

    return ordered;
}

function normalizeEntry(entry: BibEntry, options: LocalFormatOptions): BibEntry {
    return {
        ...entry,
        type: entry.type.toLowerCase(),
        key: entry.key.trim(),
        fields: normalizeFields(entry.fields, options),
    };
}

function formatEntriesInContent(
    content: string,
    entries: BibEntry[],
    options: LocalFormatOptions
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
        out += serializeBibEntry(normalizeEntry(entry, options), '  ').trim();

        cursor = entry.endIndex + 1;

        if (next) {
            const between = content.slice(cursor, next.startIndex);
            out += between.trim().length === 0 ? '\n\n' : between;
            cursor = next.startIndex;
        }
    }

    out += content.slice(cursor);
    return out;
}

/**
 * 本地格式化 BibTeX 条目
 *
 * @param entryText 原始 BibTeX 条目文本
 * @returns 格式化后的条目文本
 */
export function formatBibEntryLocal(entryText: string): string {
    return formatBibEntryLocalWithOptions(entryText, {
        normalizeAuthors: true,
        protectTitleWords: ['LaTeX', 'BibTeX', 'arXiv', 'GitHub', 'OpenAI', 'GPU', 'CPU', 'AI', 'DOI', 'NOON', 'Hong-Ou-Mandel', 'Rydberg', 'CP'],
        journalAbbreviations: DEFAULT_JOURNAL_ABBREVIATIONS
    });
}

export function formatBibEntryLocalWithOptions(entryText: string, options: LocalFormatOptions): string {
    const parsed = parseBibFile(entryText);
    if (parsed.entries.length === 0) {
        return entryText;
    }

    if (parsed.entries.length === 1) {
        const entry = parsed.entries[0]!;
        const isWholeEntry = entry.startIndex === 0 && entry.endIndex === entryText.length - 1;
        if (isWholeEntry) {
            const normalized = normalizeEntry(entry, options);
            return serializeBibEntry(normalized, '  ');
        }
    }

    return formatEntriesInContent(entryText, parsed.entries, options);
}
