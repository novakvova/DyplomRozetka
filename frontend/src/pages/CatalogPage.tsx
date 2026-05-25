import { ProductGrid } from '../components/ProductGrid';
import type { Category, Product } from '../types';

type CatalogPageProps = {
  categories: Category[];
  products: Product[];
  search: string;
  category: string;
  loading: boolean;
  favoriteProductIds: Set<string>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLoadCatalog: () => void;
  onOpenProduct: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
};

export function CatalogPage({
  categories,
  products,
  search,
  category,
  loading,
  favoriteProductIds,
  onSearchChange,
  onCategoryChange,
  onLoadCatalog,
  onOpenProduct,
  onAddToCart,
  onToggleFavorite,
}: CatalogPageProps) {
  return (
    <section>
      <div className="storefront-tools">
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Пошук товарів" />
        <button onClick={onLoadCatalog}>Знайти</button>
      </div>

      <div className="category-strip">
        <button className={!category ? 'pill-active' : ''} onClick={() => onCategoryChange('')}>Усі товари</button>
        {categories.map((item) => (
          <button key={item.id} className={category === item.slug ? 'pill-active' : ''} onClick={() => onCategoryChange(item.slug)}>
            {item.title}
          </button>
        ))}
      </div>

      {loading && <p>Завантаження...</p>}
      <ProductGrid
        products={products}
        favoriteProductIds={favoriteProductIds}
        onOpen={onOpenProduct}
        onAddToCart={onAddToCart}
        onToggleFavorite={onToggleFavorite}
      />
    </section>
  );
}
