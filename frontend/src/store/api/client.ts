export const formatPrice = (value: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value);

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveAssetUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function extractErrorMessage(error: unknown, fallback: string) {
    if (error && typeof error === 'object' && 'data' in error) {
        const data = (error as { data?: unknown }).data;
        if (typeof data === 'string' && data.trim()) return data;
    }

    if (error instanceof Error) return error.message;

    return fallback;
}