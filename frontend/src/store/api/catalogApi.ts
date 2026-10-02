import { apiSlice } from '../apiSlice';
import type { CatalogFacets, Category, PagedResult, Product } from '../../types';

export type ProductSort = 'price_asc' | 'price_desc' | 'rating' | 'newest';

type ProductsQueryArgs = {
    search?: string;
    category?: string;
    brands?: string;
    condition?: string;
    delivery?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: ProductSort;
    page?: number;
    pageSize?: number;
};

export type FacetsQueryArgs = Omit<ProductsQueryArgs, 'sort' | 'page' | 'pageSize'>;

export const catalogApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCategories: builder.query<Category[], void>({
            query: () => '/catalog/categories',
            providesTags: ['Categories'],
        }),
        getProducts: builder.query<PagedResult<Product>, ProductsQueryArgs>({
            query: (args) => ({ url: '/catalog/products', params: args }),
            providesTags: (result) =>
                result?.items
                    ? [
                        ...result.items.map((item) => ({ type: 'Products' as const, id: item.id })),
                        { type: 'Products' as const, id: 'LIST' },
                    ]
                    : [{ type: 'Products' as const, id: 'LIST' }],
        }),
        getFacets: builder.query<CatalogFacets, FacetsQueryArgs>({
            query: (args) => ({ url: '/catalog/facets', params: args }),
            providesTags: [{ type: 'Products', id: 'LIST' }],
        }),
        getProductById: builder.query<Product, string>({
            query: (id) => `/catalog/products/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Products', id }],
        }),
    }),
});

export const { useGetCategoriesQuery, useGetProductsQuery, useGetFacetsQuery, useGetProductByIdQuery } = catalogApi;