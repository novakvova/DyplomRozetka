import { apiSlice } from '../apiSlice';
import type { Category, Product, ProductImage, User } from '../../types';

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
    image?: File | null;
};

function toCategoryFormData(body: CategoryRequest): FormData {
    const form = new FormData();
    form.append('slug', body.slug);
    form.append('title', body.title);
    form.append('description', body.description);
    if (body.image) {
        form.append('image', body.image);
    }
    return form;
}

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
            query: (body) => ({ url: '/admin/categories', method: 'POST', body: toCategoryFormData(body) }),
            invalidatesTags: ['Categories'],
        }),
        updateCategory: builder.mutation<Category, CategoryRequest & { id: string }>({
            query: ({ id, ...body }) => ({ url: `/admin/categories/${id}`, method: 'PUT', body: toCategoryFormData(body) }),
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
        getProductImages: builder.query<ProductImage[], string>({
            query: (productId) => `/admin/products/${productId}/images`,
            providesTags: (_result, _error, productId) => [{ type: 'ProductImages', id: productId }],
        }),
        uploadProductImages: builder.mutation<ProductImage[], { productId: string; files: File[] }>({
            query: ({ productId, files }) => {
                const form = new FormData();
                files.forEach((file) => form.append('File', file));
                return { url: `/admin/products/${productId}/images`, method: 'POST', body: form };
            },
            invalidatesTags: (_result, _error, { productId }) => [{ type: 'ProductImages', id: productId }, 'Products'],
        }),
        deleteProductImage: builder.mutation<void, { productId: string; imageId: string }>({
            query: ({ productId, imageId }) => ({ url: `/admin/products/${productId}/images/${imageId}`, method: 'DELETE' }),
            invalidatesTags: (_result, _error, { productId }) => [{ type: 'ProductImages', id: productId }, 'Products'],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useCreateProductMutation,
    useDeleteProductMutation,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useCreateAdminMutation,
    useToggleUserBlockMutation,
    useToggleUserRoleMutation,
    useGetProductImagesQuery,
    useUploadProductImagesMutation,
    useDeleteProductImageMutation,
} = adminApi;