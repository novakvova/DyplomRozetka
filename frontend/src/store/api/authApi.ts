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
            https://github.com/novakvova/DyplomRozetka/pull/23/conflict?name=backend%252FRozetka.Api%252FDtos%252FAuthDtos.cs&ancestor_oid=7f8520753d6f7e81f8f126f7ca76127e1ce6497f&base_oid=1dad86f8665b2a41aa1c2a0be79762dc40830eed&head_oid=993d2e02a2fe961a9e7d7ba3839ccbd9d13341c1invalidatesTags: ['Auth'],
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
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useSetTwoFactorMutation,
    useUploadAvatarMutation,
    useDeleteAvatarMutation,
} = authApi;