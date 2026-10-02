import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../api/client';
import { useAddCartItemMutation } from '../store/api/cartApi';
import { useGetFavoritesQuery, useToggleFavoriteMutation } from '../store/api/favoritesApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet, cartModalOpened, favoriteModalOpened } from '../store/uiSlice';

export function useProductActions() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { data: favoritesData } = useGetFavoritesQuery(undefined, { skip: !user });
    const favorites = useMemo(() => (user ? favoritesData ?? [] : []), [user, favoritesData]);
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
            dispatch(cartModalOpened());
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

        const wasFavorite = favoriteProductIds.has(productId);

        try {
            await toggleFavoriteMutation(productId).unwrap();
            if (wasFavorite) {
                dispatch(messageSet('Товар видалено з вибраного.'));
            } else {
                dispatch(favoriteModalOpened());
            }
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оновити обране.')));
        }
    }

    return { favorites, favoriteProductIds, addToCart, toggleFavorite };
}