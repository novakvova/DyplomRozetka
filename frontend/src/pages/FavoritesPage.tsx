import { ProductGrid } from '../components/ProductGrid';
import type { Favorite, Product, User } from '../types';

type FavoritesPageProps = {
  user: User | null;
  favorites: Favorite[];
  favoriteProductIds: Set<string>;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
};

export function FavoritesPage({ user, favorites, favoriteProductIds, onOpenProduct, onAddToCart, onToggleFavorite }: FavoritesPageProps) {
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
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </section>
  );
}
