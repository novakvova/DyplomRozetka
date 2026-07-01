import { apiSlice } from '../apiSlice';
import type { Category, Product, User } from '../../types';

type ProductRequest = {
    sku: string;
    title: string;
    subtitle: string;
    brand: string;
    price: number;
    previousPrice: number | null;
    badge: string;
    imageUrl: string;
    description: string;
    manufacturerUrl: string;
    specifications: string;
    stockQuantity: number;
    categoryId: string;
};

type CategoryRequest = {
    slug: string;
    title: string;
    description: string;
};

type AdminRequest = {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    city: string;
};

export const adminApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => '/admin/users',
            providesTags: ['Users'],
        }),
        createProduct: builder.mutation<Product, ProductRequest>({
            query: (body) => ({ url: '/admin/products', method: 'POST', body }),
            invalidatesTags: ['Products', 'Categories'],
        }),
        deleteProduct: builder.mutation<void, string>({
            query: (id) => ({ url: `/admin/products/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Products'],
        }),
        createCategory: builder.mutation<Category, CategoryRequest>({
            query: (body) => ({ url: '/admin/categories', method: 'POST', body }),
            invalidatesTags: ['Categories'],
        }),
        createAdmin: builder.mutation<User, AdminRequest>({
            query: (body) => ({ url: '/admin/admins', method: 'POST', body }),
            invalidatesTags: ['Users'],
        }),
        toggleUserBlock: builder.mutation<User, string>({
            query: (id) => ({ url: `/admin/users/${id}/block`, method: 'PUT' }),
            invalidatesTags: ['Users'],
        }),
        toggleUserRole: builder.mutation<User, string>({
            query: (id) => ({ url: `/admin/users/${id}/role`, method: 'PUT' }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useCreateProductMutation,
    useDeleteProductMutation,
    useCreateCategoryMutation,
    useCreateAdminMutation,
    useToggleUserBlockMutation,
    useToggleUserRoleMutation,
} = adminApi;