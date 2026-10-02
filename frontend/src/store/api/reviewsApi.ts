import { apiSlice } from '../apiSlice';
import type { Review } from '../../types';

type CreateReviewRequest = {
    productId: string;
    rating: number;
    text: string;
};

type ReviewReactionRequest = {
    reviewId: string;
    productId: string;
    reaction: 'like' | 'dislike';
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
        reactToReview: builder.mutation<Review, ReviewReactionRequest>({
            query: ({ reviewId, reaction }) => ({ url: `/reviews/${reviewId}/reaction`, method: 'PUT', body: { reaction } }),
            invalidatesTags: (_result, _error, arg) => [{ type: 'Reviews', id: arg.productId }],
        }),
    }),
});

export const { useGetProductReviewsQuery, useCreateReviewMutation, useReactToReviewMutation } = reviewsApi;