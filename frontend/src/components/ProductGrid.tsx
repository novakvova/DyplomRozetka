import { formatPrice } from '../api/client';
import type { Product } from '../types';

type ProductGridProps = {
  products: Product[];
  favoriteProductIds: Set<string>;
  onOpen: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
};

export function ProductGrid({ products, favoriteProductIds, onOpen, onAddToCart, onToggleFavorite }: ProductGridProps) {
  return (
    <div className="grid">
      {products.map((product) => (
        <article className="product" key={product.id}>
          <button className="favorite-button" type="button" onClick={() => onToggleFavorite(product.id)}>
            {favoriteProductIds.has(product.id) ? '♥' : '♡'}
          </button>
          <div className="product-media" onClick={() => onOpen(product)}>
            <img src={product.imageUrl} alt={product.title} />
          </div>
          <span className="badge">{product.badge}</span>
          <h2 onClick={() => onOpen(product)}>{product.title}</h2>
          <p>{product.subtitle}</p>
          <div className="price-line">
            <strong>{formatPrice(product.price)}</strong>
            {product.previousPrice ? <small>{formatPrice(product.previousPrice)}</small> : null}
          </div>
          <small>{product.brand} · {product.category.title} · ★ {product.rating.toFixed(1)}</small>
          <button className="primary" type="button" onClick={() => onAddToCart(product.id)}>До кошика</button>
        </article>
      ))}
    </div>
  );
}
