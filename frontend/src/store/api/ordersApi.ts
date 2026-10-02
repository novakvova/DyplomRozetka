import { apiSlice } from '../apiSlice';
import type { Order } from '../../types';

type CheckoutRequest = {
    recipientFullName: string;
    recipientPhone: string;
    city: string;
    deliveryPoint: string;
    paymentMethod: string;
    comment: string;
};

export const ordersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getOrders: builder.query<Order[], void>({
            query: () => '/orders',
            providesTags: ['Orders'],
        }),
        checkout: builder.mutation<Order, CheckoutRequest>({
            query: (body) => ({ url: '/orders/checkout', method: 'POST', body }),
            invalidatesTags: ['Orders', 'Cart'],
        }),
        cancelOrder: builder.mutation<void, string>({
            query: (id) => ({ url: `/orders/${id}/cancel`, method: 'POST' }),
            invalidatesTags: ['Orders'],
        }),
    }),
});

export const { useGetOrdersQuery, useCheckoutMutation, useCancelOrderMutation } = ordersApi;