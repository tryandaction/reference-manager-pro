/**
 * fetchPolyfill.ts - 为旧版本 Node/VSC 的扩展宿主提供 fetch 支持
 *
 * VS Code 旧版本可能运行在不带全局 fetch 的 Node 16 环境。
 * 我们使用 undici 提供的实现做惰性注入，避免 Groq/Anthropic 调用报错。
 */

import {
    fetch as undiciFetch,
    Headers as UndiciHeaders,
    Request as UndiciRequest,
    Response as UndiciResponse,
    FormData as UndiciFormData
} from 'undici';

let patched = false;

export function ensureFetchSupport(): void {
    if (patched) {
        return;
    }

    if (typeof globalThis.fetch !== 'function') {
        globalThis.fetch = undiciFetch as unknown as typeof fetch;
    }
    if (typeof globalThis.Headers === 'undefined') {
        globalThis.Headers = UndiciHeaders as unknown as typeof Headers;
    }
    if (typeof globalThis.Request === 'undefined') {
        globalThis.Request = UndiciRequest as unknown as typeof Request;
    }
    if (typeof globalThis.Response === 'undefined') {
        globalThis.Response = UndiciResponse as unknown as typeof Response;
    }
    if (typeof globalThis.FormData === 'undefined') {
        globalThis.FormData = UndiciFormData as unknown as typeof FormData;
    }

    patched = true;
}
