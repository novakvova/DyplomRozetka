import { GitCompare, Heart, ShoppingCart, Star } from 'lucide-react';
import { formatPrice, resolveAssetUrl} from "../store/api/client";
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
        {products.map((product, index) => {
          const isFavorite = favoriteProductIds.has(product.id);
          const hasDiscount = !!product.previousPrice && product.previousPrice > product.price;
          const discountPercent = hasDiscount
              ? Math.round(100 - (product.price / (product.previousPrice as number)) * 100)
              : 0;
          const filledStars = Math.round(product.rating);

          return (
              <article
                  className="product"
                  key={product.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                {hasDiscount && <span className="discount-chip">-{discountPercent}%</span>}

                <div className="product-media" onClick={() => onOpen(product)}>
                  {product.imageUrl && <img src={resolveAssetUrl(product.imageUrl)} alt={product.title} loading="lazy" />}
                </div>

                {product.badge && <span className="badge">{product.badge}</span>}
                <h2 onClick={() => onOpen(product)}>{product.title}</h2>

                <div className="product-rating-row">
              <span className="product-stars" aria-label={`Рейтинг ${product.rating.toFixed(1)} з 5`}>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                        key={starIndex}
                        size={15}
                        strokeWidth={1.6}
                        fill={starIndex < filledStars ? '#f6a609' : 'none'}
                        stroke={starIndex < filledStars ? '#f6a609' : '#c7cdd3'}
                    />
                ))}
              </span>

                  <span className="product-quick-actions">
                <button type="button" className="quick-action-button" aria-label="Порівняти">
                  <GitCompare size={17} strokeWidth={1.8} />
                </button>
                <button
                    type="button"
                    className={`quick-action-button${isFavorite ? ' quick-action-button-active' : ''}`}
                    onClick={() => onToggleFavorite(product.id)}
                    aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
                >
                  <Heart size={17} strokeWidth={1.8} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </span>
                </div>

                <div className="product-bottom-row">
                  <div className="price-line">
                    <strong>{formatPrice(product.price)}</strong>
                    {product.previousPrice ? <small>{formatPrice(product.previousPrice)}</small> : null}
                  </div>

                  <button className="cart-icon-button" type="button" onClick={() => onAddToCart(product.id)} aria-label="Додати до кошика">
                    <ShoppingCart size={19} strokeWidth={2.1} />
                  </button>
                </div>
              </article>
          );
        })}
      </div>
  );
}