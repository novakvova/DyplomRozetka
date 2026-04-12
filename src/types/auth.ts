import type { NovaPoshtaDeliveryDetails } from './delivery';

export type AuthProvider = 'credentials' | 'google';
export type UserRole = 'user' | 'admin';

export type AuthSession = {
  email: string;
  loggedInAt: string;
};

export type RegisteredUser = {
  email: string;
  authMethods: AuthProvider[];
  role: UserRole;
  password?: string;
  fullName?: string;
  avatarUrl?: string;
  googleSubject?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  email: string;
  fullName: string;
  phone: string;
  city: string;
  updatedAt: string;
  novaPoshta?: NovaPoshtaDeliveryDetails;
};

export type AuthActionResult = {
  ok: boolean;
  message?: string;
};

export type GoogleLoginPayload = {
  email: string;
  fullName: string;
  avatarUrl?: string;
  googleSubject?: string;
};
