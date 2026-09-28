import {apiSlice} from '../apiSlice';
import type {AuthResponse, User} from '../../types';

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
    city: string;
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
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (body) => ({url: '/auth/login', method: 'POST', body}),
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
        forgotPassword: builder.mutation<void, { email: string }>({
            query: (body) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body,
            }),
        }),

        resetPassword: builder.mutation<
            void,
            {
                email: string;
                token: string;
                newPassword: string;
            }
        >({
            query: (body) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetMeQuery,
    useLoginMutation,
    useRegisterMutation,
    useGoogleLoginMutation,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useSetTwoFactorMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = authApi;