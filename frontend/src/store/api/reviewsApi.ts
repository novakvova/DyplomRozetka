import { apiSlice } from '../apiSlice';
import type { Review } from '../../types';

type CreateReviewRequest = {
    productId: string;
    rating: number;
    text: string;
};

export const reviewsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProductReviews: builder.query<Review[], string>({
            query: (productId) => `/reviews/product/${productId}`,
            providesTags: (_result, _error, productId) => [{ type: 'Reviews', id: productId }],
        }),
        createReview: builder.mutation<Review, CreateReviewRequest>({
            query: (body) => ({ url: '/reviews', method: 'POST', body }),
            invalidatesTags: (_result, _error, arg) => [{ type: 'Reviews', id: arg.productId }, 'Products'],
        }),
    }),
});

export const { useGetProductReviewsQuery, useCreateReviewMutation } = reviewsApi;