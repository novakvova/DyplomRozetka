import { useNavigate } from 'react-router-dom';
import { ProductGrid } from '../components/ProductGrid';
import { useProductActions } from '../hooks/useProductActions';
import { useAppSelector } from '../store/hooks';

export function FavoritesPage() {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const { favorites, favoriteProductIds, addToCart, toggleFavorite } = useProductActions();

    return (
        <section>
            <h1>Обране</h1>
            {!user ? (
                <p>Увійдіть, щоб бачити обрані товари.</p>
            ) : (
                <ProductGrid
                    products={favorites.map((item) => item.product)}
                    favoriteProductIds={favoriteProductIds}
                    onOpen={(product) => navigate(`/product/${product.id}`)}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                />
            )}
        </section>
    );
}