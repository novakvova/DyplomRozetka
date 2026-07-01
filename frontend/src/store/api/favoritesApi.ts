import { apiSlice } from '../apiSlice';
import type { Favorite } from '../../types';

export const favoritesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getFavorites: builder.query<Favorite[], void>({
            query: () => '/favorites',
            providesTags: ['Favorites'],
        }),
        toggleFavorite: builder.mutation<Favorite[], string>({
            query: (productId) => ({ url: `/favorites/${productId}`, method: 'POST' }),
            invalidatesTags: ['Favorites'],
        }),
    }),
});

export const { useGetFavoritesQuery, useToggleFavoriteMutation } = favoritesApi;