import type { UserRole } from '../types/auth';

const defaultAdminEmails = ['radon.bogdan09@gmail.com'];

export function resolveUserRole(email: string, role?: UserRole): UserRole {
  if (role === 'admin' || role === 'user') {
    return role;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return defaultAdminEmails.includes(normalizedEmail) ? 'admin' : 'user';
}

export function isAdminEmail(email: string) {
  return resolveUserRole(email) === 'admin';
}
