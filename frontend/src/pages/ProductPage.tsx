import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { extractErrorMessage, formatPrice } from '../api/client';
import { useProductActions } from '../hooks/useProductActions';
import { useGetProductByIdQuery, useGetProductsQuery } from '../store/api/catalogApi';
import { useCreateReviewMutation, useGetProductReviewsQuery } from '../store/api/reviewsApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

export function ProductPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const { data: product, isLoading, isError } = useGetProductByIdQuery(id, { skip: !id });
    const { data: reviews = [] } = useGetProductReviewsQuery(id, { skip: !id });
    const { data: related } = useGetProductsQuery(
        { category: product?.category.slug, pageSize: 4 },
        { skip: !product },
    );
    const [createReview] = useCreateReviewMutation();
    const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();

    const gallery = useMemo(() => {
        if (!product) return [];
        const urls = [product.imageUrl, ...(product.imageUrls ?? [])].filter(Boolean);
        return Array.from(new Set(urls));
    }, [product]);
    const [activeImageUrl, setActiveImageUrl] = useState('');

    useEffect(() => {
        setActiveImageUrl(gallery[0] ?? '');
    }, [gallery]);

    async function handleCreateReview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!product) return;
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

    if (isLoading) return <p>Завантаження товару...</p>;
    if (isError || !product) return <p>Товар не знайдено.</p>;

    const isFavorite = favoriteProductIds.has(product.id);

    return (
        <section className="product-details">
            <nav className="breadcrumbs">
                <Link to="/">Головна</Link> / <Link to={`/catalog?category=${product.category.slug}`}>{product.category.title}</Link> / {product.title}
            </nav>

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
                    {product.previousPrice ? <small>{formatPrice(product.previousPrice)}</small> : null}
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

            {related && related.items.filter((item) => item.id !== product.id).length > 0 && (
                <div className="related-products">
                    <h2>Схожі товари</h2>
                    <div className="grid">
                        {related.items
                            .filter((item) => item.id !== product.id)
                            .map((item) => (
                                <article
                                    className="product"
                                    key={item.id}
                                    onClick={() => navigate(`/product/${item.id}`)}
                                >
                                    <img src={item.imageUrl} alt={item.title} />
                                    <h3>{item.title}</h3>
                                    <strong>{formatPrice(item.price)}</strong>
                                </article>
                            ))}
                    </div>
                </div>
            )}
        </section>
    );
}