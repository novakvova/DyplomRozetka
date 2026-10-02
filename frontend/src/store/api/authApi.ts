import { apiSlice } from '../apiSlice';
import type { AuthResponse, LoginResult, TwoFactorSetup, User } from '../../types';

type LoginRequest = {
    email: string;
    password: string;
};

type RegisterRequest = LoginRequest & {
    fullName: string;
    phone: string;
    city: string;
    birthDate?: string | null;
    gender?: string | null;
};

type GoogleLoginRequest = {
    credential: string;
};

type ProfileUpdateRequest = {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    birthDate?: string | null;
    gender?: string | null;
};

type PasswordChangeRequest = {
    currentPassword: string;
    newPassword: string;
};

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMe: builder.query<User, void>({
            query: () => '/auth/me',
            providesTags: ['Auth'],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
        }),
        login: builder.mutation<LoginResult, LoginRequest>({
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
        }),
        loginTwoFactor: builder.mutation<LoginResult, LoginRequest & { code: string }>({
            query: (body) => ({ url: '/auth/login/two-factor', method: 'POST', body }),
        }),
        resendLoginCode: builder.mutation<LoginResult, LoginRequest>({
            query: (body) => ({ url: '/auth/login/two-factor/resend', method: 'POST', body }),
        }),
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (body) => ({url: '/auth/register', method: 'POST', body}),
        }),
        googleLogin: builder.mutation<AuthResponse, GoogleLoginRequest>({
            query: (body) => ({url: '/auth/google', method: 'POST', body}),
        }),
        forgotPassword: builder.mutation<void, { email: string }>({
            query: (body) => ({url: '/auth/forgot-password', method: 'POST', body}),
        }),
        resetPassword: builder.mutation<void, { email: string; token: string; newPassword: string }>({
            query: (body) => ({url: '/auth/reset-password', method: 'POST', body}),
        }),
        updateProfile: builder.mutation<User, ProfileUpdateRequest>({
            query: (body) => ({url: '/auth/profile', method: 'PUT', body}),
            invalidatesTags: ['Auth'],
        }),
        changePassword: builder.mutation<void, PasswordChangeRequest>({
            query: (body) => ({url: '/auth/password', method: 'PUT', body}),
        }),
        setTwoFactor: builder.mutation<User, { enabled: boolean; password?: string }>({
            query: (body) => ({url: '/auth/two-factor', method: 'PUT', body}),
            invalidatesTags: ['Auth'],
        }),
        setupTwoFactor: builder.mutation<TwoFactorSetup, void>({
            query: () => ({ url: '/auth/two-factor/setup', method: 'POST' }),
        }),
        enableTwoFactor: builder.mutation<User, { code: string }>({
            query: (body) => ({ url: '/auth/two-factor/enable', method: 'POST', body }),
            invalidatesTags: ['Auth'],
        }),
        uploadAvatar: builder.mutation<User, File>({
            query: (file) => {
                const form = new FormData();
                form.append('File', file);
                return { url: '/auth/avatar', method: 'POST', body: form };
            },
            invalidatesTags: ['Auth'],
        }),
        deleteAvatar: builder.mutation<User, void>({
            query: () => ({ url: '/auth/avatar', method: 'DELETE' }),
            invalidatesTags: ['Auth'],
        }),
    }),
});

export const {
    useGetMeQuery,
    useLoginMutation,
    useLoginTwoFactorMutation,
    useResendLoginCodeMutation,
    useSetupTwoFactorMutation,
    useEnableTwoFactorMutation,
    useRegisterMutation,
    useGoogleLoginMutation,
    useLogoutMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useSetTwoFactorMutation,
    useUploadAvatarMutation,
    useDeleteAvatarMutation,
} = authApi;