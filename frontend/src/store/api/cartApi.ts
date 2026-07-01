import { apiSlice } from '../apiSlice';
import type { Cart } from '../../types';

type AddCartItemRequest = {
    productId: string;
    quantity: number;
};

type UpdateCartItemRequest = {
    itemId: string;
    productId: string;
    quantity: number;
};

export const cartApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCart: builder.query<Cart, void>({
            query: () => '/cart',
            providesTags: ['Cart'],
        }),
        addCartItem: builder.mutation<Cart, AddCartItemRequest>({
            query: (body) => ({ url: '/cart/items', method: 'POST', body }),
            invalidatesTags: ['Cart'],
        }),
        updateCartItem: builder.mutation<Cart, UpdateCartItemRequest>({
            query: ({ itemId, ...body }) => ({ url: `/cart/items/${itemId}`, method: 'PUT', body }),
            invalidatesTags: ['Cart'],
        }),
        removeCartItem: builder.mutation<Cart, string>({
            query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
            invalidatesTags: ['Cart'],
        }),
    }),
});

export const {
    useGetCartQuery,
    useAddCartItemMutation,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation,
} = cartApi;