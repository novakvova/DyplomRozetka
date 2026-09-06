import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { sessionExpiredSet } from './authSlice';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api';

type AuthTokenState = {
    auth: { token: string | null };
};

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as AuthTokenState).auth.token;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && (result.error.status === 401 || result.error.status === 403)) {
        const hadToken = (api.getState() as AuthTokenState).auth.token;
        if (hadToken) {
            api.dispatch(sessionExpiredSet());
        }
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Auth', 'Categories', 'Products', 'Cart', 'Orders', 'Favorites', 'Reviews', 'Users'],
    endpoints: () => ({}),
});