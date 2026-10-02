import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { sessionExpiredSet } from './authSlice';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api';

type AuthUserState = {
    auth: { user: unknown | null };
};

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    credentials: 'include',
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && (result.error.status === 401 || result.error.status === 403)) {
        const wasLoggedIn = (api.getState() as AuthUserState).auth.user;
        if (wasLoggedIn) {
            api.dispatch(sessionExpiredSet());
        }
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Auth', 'Categories', 'Products', 'Cart', 'Orders', 'Favorites', 'Reviews', 'Users', 'ProductImages', 'Addresses', 'PaymentCards'],
    endpoints: () => ({}),
});