import { apiSlice } from '../apiSlice';
import type { Category, Product } from '../../types';

type ProductsQueryArgs = {
    search?: string;
    category?: string;
};

export const catalogApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCategories: builder.query<Category[], void>({
            query: () => '/catalog/categories',
            providesTags: ['Categories'],
        }),
        getProducts: builder.query<Product[], ProductsQueryArgs>({
            query: ({ search = '', category = '' }) => {
                const params = new URLSearchParams({ search, category });
                return `/catalog/products?${params.toString()}`;
            },
            providesTags: ['Products'],
        }),
    }),
});

export const { useGetCategoriesQuery, useGetProductsQuery } = catalogApi;