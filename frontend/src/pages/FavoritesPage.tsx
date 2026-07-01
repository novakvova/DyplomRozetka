import { ProductGrid } from '../components/ProductGrid';
import { useProductActions } from '../hooks/useProductActions';
import { useAppSelector } from '../store/hooks';
import type { Product } from '../types';

type FavoritesPageProps = {
  onOpenProduct: (product: Product) => void;
};

export function FavoritesPage({ onOpenProduct }: FavoritesPageProps) {
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
                onOpen={onOpenProduct}
                onAddToCart={addToCart}
                onToggleFavorite={toggleFavorite}
            />
        )}
      </section>
  );
}