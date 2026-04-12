import AsyncStorage from '@react-native-async-storage/async-storage';

import { resolveUserRole } from '../data/admin';
import type { AuthProvider, RegisteredUser } from '../types/auth';

const USERS_STORAGE_KEY = 'rozetka-team-project:users';

const defaultAuthMethods: AuthProvider[] = ['credentials'];

function isValidAuthProvider(value: unknown): value is AuthProvider {
  return value === 'credentials' || value === 'google';
}

function isValidRegisteredUser(value: Partial<RegisteredUser>): value is RegisteredUser {
  return (
    typeof value.email === 'string' &&
    Array.isArray(value.authMethods) &&
    value.authMethods.every((item) => isValidAuthProvider(item)) &&
    (value.role === 'admin' || value.role === 'user') &&
    (value.password === undefined || typeof value.password === 'string') &&
    (value.fullName === undefined || typeof value.fullName === 'string') &&
    (value.avatarUrl === undefined || typeof value.avatarUrl === 'string') &&
    (value.googleSubject === undefined || typeof value.googleSubject === 'string') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function normalizeStoredUser(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const user = value as Partial<RegisteredUser> & {
    password?: unknown;
    authMethods?: unknown;
    role?: unknown;
    fullName?: unknown;
    avatarUrl?: unknown;
    googleSubject?: unknown;
  };

  const authMethods = Array.isArray(user.authMethods)
    ? user.authMethods.filter((item): item is AuthProvider => isValidAuthProvider(item))
    : defaultAuthMethods;

  const normalizedUser: Partial<RegisteredUser> = {
    email: typeof user.email === 'string' ? user.email.trim().toLowerCase() : '',
    authMethods: authMethods.length ? authMethods : defaultAuthMethods,
    role:
      typeof user.email === 'string'
        ? resolveUserRole(
            user.email,
            user.role === 'admin' || user.role === 'user' ? user.role : undefined
          )
        : 'user',
    password: typeof user.password === 'string' ? user.password : undefined,
    fullName: typeof user.fullName === 'string' ? user.fullName : undefined,
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : undefined,
    googleSubject: typeof user.googleSubject === 'string' ? user.googleSubject : undefined,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : '',
    updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : '',
  };

  if (!normalizedUser.password && normalizedUser.authMethods?.includes('credentials')) {
    normalizedUser.authMethods = normalizedUser.authMethods.filter((item) => item !== 'credentials');
  }

  return isValidRegisteredUser(normalizedUser) ? normalizedUser : null;
}

export async function loadRegisteredUsers() {
  try {
    const rawValue = await AsyncStorage.getItem(USERS_STORAGE_KEY);

    if (!rawValue) {
      return [] as RegisteredUser[];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      await AsyncStorage.removeItem(USERS_STORAGE_KEY);
      return [] as RegisteredUser[];
    }

    const users = parsedValue
      .map((item) => normalizeStoredUser(item))
      .filter((item): item is RegisteredUser => item !== null);

    if (users.length !== parsedValue.length) {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    return users;
  } catch {
    await AsyncStorage.removeItem(USERS_STORAGE_KEY);
    return [] as RegisteredUser[];
  }
}

export async function saveRegisteredUsers(users: RegisteredUser[]) {
  await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export async function deleteRegisteredUser(email: string) {
  const users = await loadRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  await saveRegisteredUsers(
    users.filter((user) => user.email.trim().toLowerCase() !== normalizedEmail)
  );
}
