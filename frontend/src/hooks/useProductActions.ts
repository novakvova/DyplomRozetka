import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../api/client';
import { useAddCartItemMutation } from '../store/api/cartApi';
import { useGetFavoritesQuery, useToggleFavoriteMutation } from '../store/api/favoritesApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

export function useProductActions() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { data: favorites = [] } = useGetFavoritesQuery(undefined, { skip: !user });
    const [addCartItem] = useAddCartItemMutation();
    const [toggleFavoriteMutation] = useToggleFavoriteMutation();

    const favoriteProductIds = useMemo(() => new Set(favorites.map((item) => item.product.id)), [favorites]);

    async function addToCart(productId: string) {
        if (!user) {
            dispatch(messageSet('Увійдіть в акаунт, щоб додати товар у кошик.'));
            navigate('/profile');
            return;
        }

        try {
            await addCartItem({ productId, quantity: 1 }).unwrap();
            dispatch(messageSet('Товар додано в кошик.'));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося додати товар у кошик.')));
        }
    }

    async function toggleFavorite(productId: string) {
        if (!user) {
            dispatch(messageSet('Увійдіть в акаунт, щоб додавати товари в обране.'));
            navigate('/profile');
            return;
        }

        try {
            await toggleFavoriteMutation(productId).unwrap();
            dispatch(messageSet('Обране оновлено.'));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оновити обране.')));
        }
    }

    return { favorites, favoriteProductIds, addToCart, toggleFavorite };
}