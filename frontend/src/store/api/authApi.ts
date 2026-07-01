import { apiSlice } from '../apiSlice';
import type { AuthResponse, User } from '../../types';

type LoginRequest = {
    email: string;
    password: string;
};

type RegisterRequest = LoginRequest & {
    fullName: string;
    phone: string;
    city: string;
};

type RecoverRequest = {
    email: string;
    newPassword: string;
};

type GoogleLoginRequest = {
    email: string;
    fullName: string;
    googleToken: string;
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
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
        }),
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (body) => ({ url: '/auth/register', method: 'POST', body }),
        }),
        recoverPassword: builder.mutation<void, RecoverRequest>({
            query: (body) => ({ url: '/auth/recover', method: 'POST', body }),
        }),
        googleLogin: builder.mutation<AuthResponse, GoogleLoginRequest>({
            query: (body) => ({ url: '/auth/google', method: 'POST', body }),
        }),
        updateProfile: builder.mutation<User, ProfileUpdateRequest>({
            query: (body) => ({ url: '/auth/profile', method: 'PUT', body }),
            invalidatesTags: ['Auth'],
        }),
        changePassword: builder.mutation<void, PasswordChangeRequest>({
            query: (body) => ({ url: '/auth/password', method: 'PUT', body }),
        }),
    }),
});

export const {
    useGetMeQuery,
    useLoginMutation,
    useRegisterMutation,
    useRecoverPasswordMutation,
    useGoogleLoginMutation,
    useUpdateProfileMutation,
    useChangePasswordMutation,
} = authApi;