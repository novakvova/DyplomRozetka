import { apiSlice } from '../apiSlice';
import type { UserAddress, UserAddressRequest } from '../../types';

export const addressesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAddresses: builder.query<UserAddress[], void>({
            query: () => '/addresses',
            providesTags: ['Addresses'],
        }),
        createAddress: builder.mutation<UserAddress, UserAddressRequest>({
            query: (body) => ({ url: '/addresses', method: 'POST', body }),
            invalidatesTags: ['Addresses'],
        }),
        updateAddress: builder.mutation<UserAddress, UserAddressRequest & { id: string }>({
            query: ({ id, ...body }) => ({ url: `/addresses/${id}`, method: 'PUT', body }),
            invalidatesTags: ['Addresses'],
        }),
        deleteAddress: builder.mutation<void, string>({
            query: (id) => ({ url: `/addresses/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Addresses'],
        }),
    }),
});

export const {
    useGetAddressesQuery,
    useCreateAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
} = addressesApi;