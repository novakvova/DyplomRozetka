import { useState } from 'react';
import { ProductGrid } from '../components/ProductGrid';
import { useProductActions } from '../hooks/useProductActions';
import { useGetCategoriesQuery, useGetProductsQuery } from '../store/api/catalogApi';
import type { Product } from '../types';

type CatalogPageProps = {
  onOpenProduct: (product: Product) => void;
};

export function CatalogPage({ onOpenProduct }: CatalogPageProps) {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('');
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: products = [], isFetching } = useGetProductsQuery({ search: appliedSearch, category });
  const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();

  return (
      <section>
        <div className="storefront-tools">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Пошук товарів" />
          <button onClick={() => setAppliedSearch(search)}>Знайти</button>
        </div>

        <div className="category-strip">
          <button className={!category ? 'pill-active' : ''} onClick={() => setCategory('')}>Усі товари</button>
          {categories.map((item) => (
              <button key={item.id} className={category === item.slug ? 'pill-active' : ''} onClick={() => setCategory(item.slug)}>
                {item.title}
              </button>
          ))}
        </div>

        {isFetching && <p>Завантаження...</p>}
        <ProductGrid
            products={products}
            favoriteProductIds={favoriteProductIds}
            onOpen={onOpenProduct}
            onAddToCart={addToCart}
            onToggleFavorite={toggleFavorite}
        />
      </section>
  );
}