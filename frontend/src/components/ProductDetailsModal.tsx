import { FormEvent, useEffect, useMemo, useState } from 'react';
import { extractErrorMessage, formatPrice } from '../api/client';
import { useProductActions } from '../hooks/useProductActions';
import { useCreateReviewMutation, useGetProductReviewsQuery } from '../store/api/reviewsApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';
import type { Product } from '../types';

type ProductDetailsModalProps = {
  product: Product;
  onClose: () => void;
};

export function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: reviews = [] } = useGetProductReviewsQuery(product.id);
  const [createReview] = useCreateReviewMutation();
  const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();
  const isFavorite = favoriteProductIds.has(product.id);

  const gallery = useMemo(() => {
    const urls = [product.imageUrl, ...(product.imageUrls ?? [])].filter(Boolean);
    return Array.from(new Set(urls));
  }, [product.imageUrl, product.imageUrls]);
  const [activeImageUrl, setActiveImageUrl] = useState(gallery[0] ?? product.imageUrl);

  useEffect(() => {
    setActiveImageUrl(gallery[0] ?? product.imageUrl);
  }, [gallery, product.imageUrl]);

  async function handleCreateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    try {
      await createReview({
        productId: product.id,
        rating: Number(data.get('rating')),
        text: data.get('text') as string,
      }).unwrap();
      event.currentTarget.reset();
      dispatch(messageSet('Відгук додано.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося додати відгук.')));
    }
  }

  return (
      <section className="product-details">
        <button type="button" onClick={onClose}>Закрити</button>
        <div className="details-layout">
          <div className="product-gallery">
            <div className="product-gallery-main">
              <img src={activeImageUrl} alt={product.title} />
            </div>
            {gallery.length > 1 && (
                <div className="product-thumbnails" aria-label="Фото товару">
                  {gallery.map((url, index) => (
                      <button
                          className={`thumbnail-button${url === activeImageUrl ? ' active' : ''}`}
                          key={url}
                          type="button"
                          onClick={() => setActiveImageUrl(url)}
                          aria-label={`Показати фото ${index + 1}`}
                      >
                        <img src={url} alt={`${product.title} фото ${index + 1}`} />
                      </button>
                  ))}
                </div>
            )}
          </div>
          <div>
            <span className="badge">{product.badge}</span>
            <h1>{product.title}</h1>
            <p>{product.description}</p>
            <h2>{formatPrice(product.price)}</h2>
            <p>{product.brand} · ★ {product.rating.toFixed(1)} · {product.reviewsCount} відгуків</p>
            <pre>{product.specifications}</pre>
            {product.manufacturerUrl && <a href={product.manufacturerUrl} target="_blank" rel="noreferrer">Офіційний сайт виробника</a>}
            <div className="action-row">
              <button className="primary" type="button" onClick={() => addToCart(product.id)}>До кошика</button>
              <button type="button" onClick={() => toggleFavorite(product.id)}>{isFavorite ? 'В обраному' : 'В обране'}</button>
            </div>
          </div>
        </div>
        <div className="reviews">
          <h2>Відгуки</h2>
          {user && (
              <form onSubmit={handleCreateReview}>
                <select name="rating" defaultValue="5">
                  <option value="5">5 зірок</option>
                  <option value="4">4 зірки</option>
                  <option value="3">3 зірки</option>
                  <option value="2">2 зірки</option>
                  <option value="1">1 зірка</option>
                </select>
                <textarea name="text" placeholder="Ваш відгук" required />
                <button>Надіслати відгук</button>
              </form>
          )}
          {reviews.map((review) => (
              <article className="review" key={review.id}>
                <strong>{review.userFullName} · ★ {review.rating}</strong>
                <p>{review.text}</p>
              </article>
          ))}
        </div>
      </section>
  );
}