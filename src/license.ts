/**
 * license.ts - License 和使用限制管理模块
 *
 * 职责：管理免费版使用次数限制和 License Key 验证
 * Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import * as vscode from 'vscode';

/**
 * License 状态接口
 */
export interface LicenseInfo {
    /** 是否为 Pro 用户 */
    isPro: boolean;
    /** License Key（如果有） */
    licenseKey: string | null;
    /** 今日格式化使用次数 */
    formatUsageToday: number;
    /** 今日查找未使用引用次数 */
    findUnusedUsageToday: number;
    /** 上次重置日期 (YYYY-MM-DD) */
    lastResetDate: string;
}

/**
 * 使用限制常量
 */
export const USAGE_LIMITS = {
    /** 免费版每日格式化次数限制 */
    FORMAT_DAILY_LIMIT: 5,
    /** 免费版每日查找未使用引用次数限制 */
    FIND_UNUSED_DAILY_LIMIT: 3,
} as const;

/**
 * 存储键名常量
 */
const STORAGE_KEYS = {
    FORMAT_USAGE: 'referenceManager.formatUsage',
    FIND_UNUSED_USAGE: 'referenceManager.findUnusedUsage',
    LAST_RESET_DATE: 'referenceManager.lastResetDate',
} as const;

/**
 * 配置键名常量
 */
const CONFIG_KEYS = {
    SECTION: 'referenceManager',
    LICENSE_KEY: 'licenseKey',
} as const;

/** 全局状态存储引用 */
let globalState: vscode.Memento | null = null;

/**
 * 初始化 License 模块
 * 必须在 extension activate 时调用
 */
export function initLicenseModule(context: vscode.ExtensionContext): void {
    globalState = context.globalState;
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
function getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 检查并重置每日使用次数（如果是新的一天）
 * Requirements: 7.5
 */
async function checkAndResetDailyUsage(): Promise<void> {
    if (!globalState) {
        throw new Error('License module not initialized');
    }

    const today = getTodayString();
    const lastResetDate = globalState.get<string>(STORAGE_KEYS.LAST_RESET_DATE, '');

    if (lastResetDate !== today) {
        // 新的一天，重置计数
        await globalState.update(STORAGE_KEYS.FORMAT_USAGE, 0);
        await globalState.update(STORAGE_KEYS.FIND_UNUSED_USAGE, 0);
        await globalState.update(STORAGE_KEYS.LAST_RESET_DATE, today);
    }
}

/**
 * 验证 License Key 格式
 * Requirements: 8.3
 *
 * @param key License Key
 * @returns 格式是否有效
 */
export function validateLicenseKeyFormat(key: string): boolean {
    if (!key || key.trim() === '') {
        return false;
    }
    // 格式：RMP- 开头，至少 20 个字符
    return key.startsWith('RMP-') && key.length >= 20;
}

/**
 * 获取 License Key（从设置中读取）
 * Requirements: 8.1
 */
export function getLicenseKey(): string | null {
    const config = vscode.workspace.getConfiguration(CONFIG_KEYS.SECTION);
    const key = config.get<string>(CONFIG_KEYS.LICENSE_KEY, '');
    return key && validateLicenseKeyFormat(key) ? key : null;
}

/**
 * 获取当前 License 状态
 * Requirements: 7.1, 8.7
 */
export async function getLicenseStatus(): Promise<LicenseInfo> {
    if (!globalState) {
        throw new Error('License module not initialized');
    }

    await checkAndResetDailyUsage();

    const licenseKey = getLicenseKey();
    const isPro = licenseKey !== null;

    return {
        isPro,
        licenseKey,
        formatUsageToday: globalState.get<number>(STORAGE_KEYS.FORMAT_USAGE, 0),
        findUnusedUsageToday: globalState.get<number>(STORAGE_KEYS.FIND_UNUSED_USAGE, 0),
        lastResetDate: globalState.get<string>(STORAGE_KEYS.LAST_RESET_DATE, getTodayString()),
    };
}


/**
 * 检查格式化功能使用限制
 * Requirements: 7.2
 *
 * @returns 是否可以使用（未达到限制或是 Pro 用户）
 */
export async function checkFormatUsageLimit(): Promise<boolean> {
    const status = await getLicenseStatus();

    // Pro 用户无限制 (Req 7.6)
    if (status.isPro) {
        return true;
    }

    return status.formatUsageToday < USAGE_LIMITS.FORMAT_DAILY_LIMIT;
}

/**
 * 检查查找未使用引用功能使用限制
 * Requirements: 7.3
 *
 * @returns 是否可以使用（未达到限制或是 Pro 用户）
 */
export async function checkFindUnusedUsageLimit(): Promise<boolean> {
    const status = await getLicenseStatus();

    // Pro 用户无限制 (Req 7.6)
    if (status.isPro) {
        return true;
    }

    return status.findUnusedUsageToday < USAGE_LIMITS.FIND_UNUSED_DAILY_LIMIT;
}

/**
 * 增加格式化使用次数
 * Requirements: 7.1
 */
export async function incrementFormatUsage(): Promise<void> {
    if (!globalState) {
        throw new Error('License module not initialized');
    }

    await checkAndResetDailyUsage();
    const current = globalState.get<number>(STORAGE_KEYS.FORMAT_USAGE, 0);
    await globalState.update(STORAGE_KEYS.FORMAT_USAGE, current + 1);
}

/**
 * 增加查找未使用引用使用次数
 * Requirements: 7.1
 */
export async function incrementFindUnusedUsage(): Promise<void> {
    if (!globalState) {
        throw new Error('License module not initialized');
    }

    await checkAndResetDailyUsage();
    const current = globalState.get<number>(STORAGE_KEYS.FIND_UNUSED_USAGE, 0);
    await globalState.update(STORAGE_KEYS.FIND_UNUSED_USAGE, current + 1);
}

/**
 * 显示升级提示
 * Requirements: 7.4
 */
export async function showUpgradePrompt(feature: string): Promise<void> {
    const action = await vscode.window.showWarningMessage(
        `今日免费 ${feature} 次数已用完，升级到 Pro 版解锁无限使用`,
        '了解 Pro 版',
        '取消'
    );

    if (action === '了解 Pro 版') {
        vscode.env.openExternal(vscode.Uri.parse('https://gumroad.com/l/reference-manager-pro'));
    }
}

/**
 * 激活 License Key
 * Requirements: 8.2, 8.3, 8.4, 8.5, 8.6
 */
export async function activateLicense(): Promise<boolean> {
    // 显示输入框
    const key = await vscode.window.showInputBox({
        prompt: '请输入您的 License Key',
        placeHolder: 'RMP-XXXX-XXXX-XXXX-XXXX',
        password: false,
        validateInput: (value) => {
            if (!value || value.trim() === '') {
                return 'License Key 不能为空';
            }
            if (!validateLicenseKeyFormat(value)) {
                return 'License Key 格式无效（应以 RMP- 开头，至少 20 个字符）';
            }
            return null;
        }
    });

    if (!key) {
        return false; // 用户取消
    }

    // 存储到设置 (Req 8.4)
    const config = vscode.workspace.getConfiguration(CONFIG_KEYS.SECTION);
    await config.update(CONFIG_KEYS.LICENSE_KEY, key, vscode.ConfigurationTarget.Global);

    // 显示成功消息 (Req 8.5)
    vscode.window.showInformationMessage('✅ License activated! 感谢支持 Reference Manager Pro');
    return true;
}

/**
 * 查看 License 状态
 * Requirements: 8.7, 8.8
 */
export async function viewLicenseStatus(): Promise<void> {
    const status = await getLicenseStatus();

    const planName = status.isPro ? 'Pro' : 'Free';
    const formatRemaining = status.isPro
        ? '无限制'
        : `${USAGE_LIMITS.FORMAT_DAILY_LIMIT - status.formatUsageToday}/${USAGE_LIMITS.FORMAT_DAILY_LIMIT}`;
    const findUnusedRemaining = status.isPro
        ? '无限制'
        : `${USAGE_LIMITS.FIND_UNUSED_DAILY_LIMIT - status.findUnusedUsageToday}/${USAGE_LIMITS.FIND_UNUSED_DAILY_LIMIT}`;

    const message = status.isPro
        ? `📋 License 状态\n\n计划: ${planName}\nLicense Key: ${status.licenseKey?.substring(0, 12)}...`
        : `📋 License 状态\n\n计划: ${planName}\n今日格式化剩余: ${formatRemaining}\n今日查找未使用剩余: ${findUnusedRemaining}`;

    const action = await vscode.window.showInformationMessage(
        `Reference Manager Pro - ${planName} 版`,
        { modal: true, detail: message },
        status.isPro ? '确定' : '升级到 Pro'
    );

    if (action === '升级到 Pro') {
        vscode.env.openExternal(vscode.Uri.parse('https://gumroad.com/l/reference-manager-pro'));
    }
}


/**
 * 存储键名常量 - 评分相关
 */
const RATING_STORAGE_KEYS = {
    SUCCESS_COUNT: 'referenceManager.successCount',
    RATING_REQUESTED: 'referenceManager.ratingRequested',
} as const;

/**
 * 增加成功操作计数并检查是否应该请求评分
 * Requirements: 11.5
 */
export async function trackSuccessAndMaybeRequestRating(): Promise<void> {
    if (!globalState) {
        return;
    }

    // 检查是否已经请求过评分
    const ratingRequested = globalState.get<boolean>(RATING_STORAGE_KEYS.RATING_REQUESTED, false);
    if (ratingRequested) {
        return;
    }

    // 增加成功计数
    const currentCount = globalState.get<number>(RATING_STORAGE_KEYS.SUCCESS_COUNT, 0);
    const newCount = currentCount + 1;
    await globalState.update(RATING_STORAGE_KEYS.SUCCESS_COUNT, newCount);

    // 10 次成功操作后请求评分
    if (newCount >= 10) {
        const action = await vscode.window.showInformationMessage(
            '🎉 您已成功使用 Reference Manager Pro 10 次！如果觉得好用，请给我们一个好评吧！',
            '去评分',
            '稍后再说',
            '不再提醒'
        );

        if (action === '去评分') {
            vscode.env.openExternal(vscode.Uri.parse(
                'https://marketplace.visualstudio.com/items?itemName=your-publisher-id.reference-manager-pro&ssr=false#review-details'
            ));
            await globalState.update(RATING_STORAGE_KEYS.RATING_REQUESTED, true);
        } else if (action === '不再提醒') {
            await globalState.update(RATING_STORAGE_KEYS.RATING_REQUESTED, true);
        }
        // "稍后再说" 不做任何操作，下次还会提醒
    }
}
