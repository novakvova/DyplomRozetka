const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('rozetka_fullstack_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(text || defaultApiMessage(response.status), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function defaultApiMessage(status: number) {
  if (status === 401) return 'Сесія застаріла. Увійдіть ще раз.';
  if (status === 403) return 'Недостатньо прав для цієї дії.';
  if (status === 404) return 'Запитаний ресурс не знайдено.';
  return 'Помилка запиту до API';
}

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value);
