export const formatPrice = (value: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value);

export function extractErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string' && data.trim()) return data;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}