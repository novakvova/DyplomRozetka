import { apiSlice } from '../apiSlice';
import type { PaymentCard, PaymentCardRequest } from '../../types';

export const paymentCardsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPaymentCards: builder.query<PaymentCard[], void>({
            query: () => '/payment-cards',
            providesTags: ['PaymentCards'],
        }),
        createPaymentCard: builder.mutation<PaymentCard, PaymentCardRequest>({
            query: (body) => ({ url: '/payment-cards', method: 'POST', body }),
            invalidatesTags: ['PaymentCards'],
        }),
        setDefaultPaymentCard: builder.mutation<PaymentCard, string>({
            query: (id) => ({ url: `/payment-cards/${id}/default`, method: 'PUT' }),
            invalidatesTags: ['PaymentCards'],
        }),
        deletePaymentCard: builder.mutation<void, string>({
            query: (id) => ({ url: `/payment-cards/${id}`, method: 'DELETE' }),
            invalidatesTags: ['PaymentCards'],
        }),
    }),
});

export const {
    useGetPaymentCardsQuery,
    useCreatePaymentCardMutation,
    useSetDefaultPaymentCardMutation,
    useDeletePaymentCardMutation,
} = paymentCardsApi;