import { apiSlice } from '../apiSlice';
import type { PaymentCard, PaymentCardRequest } from '../../types';

export type PaymentCardUpdateRequest = {
    id: string;
    cardholderName: string;
    cardNumber: string | null;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
};

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
        updatePaymentCard: builder.mutation<PaymentCard, PaymentCardUpdateRequest>({
            query: ({ id, ...body }) => ({ url: `/payment-cards/${id}`, method: 'PUT', body }),
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
    useUpdatePaymentCardMutation,
    useSetDefaultPaymentCardMutation,
    useDeletePaymentCardMutation,
} = paymentCardsApi;