import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Heart,
    GitCompare,
    ImageOff,
    Package,
    ShieldCheck,
    Star,
    Store,
    Truck,
} from 'lucide-react';
import { extractErrorMessage, formatPrice, resolveAssetUrl} from "../store/api/client";
import { ProductGrid } from '../components/ProductGrid';
import { useProductActions } from '../hooks/useProductActions';
import { useGetProductByIdQuery, useGetProductsQuery } from '../store/api/catalogApi';
import { useCreateReviewMutation, useGetProductReviewsQuery } from '../store/api/reviewsApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
    const filled = Math.round(rating);
    return (
        <span className="product-stars" aria-label={`Рейтинг ${rating.toFixed(1)} з 5`}>
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    size={size}
                    strokeWidth={1.6}
                    fill={index < filled ? '#f6a609' : 'none'}
                    stroke={index < filled ? '#f6a609' : '#c7cdd3'}
                />
            ))}
        </span>
    );
}

function formatDate(iso: string) {
    try {
        return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
    } catch {
        return iso;
    }
}

export function ProductPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const { data: product, isLoading, isError } = useGetProductByIdQuery(id, { skip: !id });
    const { data: reviews = [] } = useGetProductReviewsQuery(id, { skip: !id });

    const [sameSellerPageSize, setSameSellerPageSize] = useState(4);
    const [otherSellerPageSize, setOtherSellerPageSize] = useState(8);

    const { data: alsoViewed } = useGetProductsQuery(
        { category: product?.category.slug, pageSize: 6 },
        { skip: !product },
    );
    const { data: sameSeller, isFetching: sameSellerLoading } = useGetProductsQuery(
        { category: product?.category.slug, pageSize: sameSellerPageSize },
        { skip: !product },
    );
    const { data: otherSeller, isFetching: otherSellerLoading } = useGetProductsQuery(
        { pageSize: otherSellerPageSize, sort: 'rating' },
        { skip: !product },
    );

    const [createReview] = useCreateReviewMutation();
    const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();
    const reviewStripRef = useRef<HTMLDivElement | null>(null);

    const gallery = useMemo(() => {
        if (!product) return [];
        const uploaded = product.images
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((image) => resolveAssetUrl(image.largeUrl));
        const urls = [resolveAssetUrl(product.imageUrl), ...uploaded, ...product.imageUrls.map(resolveAssetUrl)]
            .filter(Boolean);
        return Array.from(new Set(urls));
    }, [product]);
    const [activeImageUrl, setActiveImageUrl] = useState('');

    useEffect(() => {
        setActiveImageUrl(gallery[0] ?? '');
    }, [gallery]);

    async function handleCreateReview(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!product) return;
        const form = event.currentTarget;
        const data = new FormData(form);

        try {
            await createReview({
                productId: product.id,
                rating: Number(data.get('rating')),
                text: data.get('text') as string,
            }).unwrap();
            form.reset();
            dispatch(messageSet('Відгук додано.'));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося додати відгук.')));
        }
    }

    function handleBuyNow(productId: string) {
        addToCart(productId);
        navigate('/cart');
    }

    function scrollReviews(direction: -1 | 1) {
        reviewStripRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
    }

    if (isLoading) return <p className="page-loading">Завантаження товару...</p>;
    if (isError || !product) return <p className="page-loading">Товар не знайдено.</p>;

    const isFavorite = favoriteProductIds.has(product.id);
    const inStock = product.stockQuantity > 0;
    const alsoViewedItems = (alsoViewed?.items ?? []).filter((item) => item.id !== product.id);
    const sameSellerItems = (sameSeller?.items ?? []).filter(
        (item) => item.id !== product.id && item.brand === product.brand,
    );
    const otherSellerItems = (otherSeller?.items ?? []).filter(
        (item) => item.id !== product.id && item.brand !== product.brand,
    );

    const specRows = product.specifications
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [key, ...rest] = line.split(':');
            return rest.length > 0 ? { key: key.trim(), value: rest.join(':').trim() } : null;
        })
        .filter((row): row is { key: string; value: string } => row !== null);

    return (
        <section className="product-details reveal in-view">
            <nav className="breadcrumbs">
                <Link to="/catalog">Каталог товарів</Link> {' > '}
                <Link to={`/catalog?category=${product.category.slug}`}>{product.category.title}</Link> {' > '}
                <span>{product.title}</span>
            </nav>

            {alsoViewedItems.length > 0 && (
                <div className="also-viewed-strip">
                    <span className="also-viewed-title">Дивитись також</span>
                    <div className="also-viewed-scroll">
                        {alsoViewedItems.slice(0, 6).map((item) => (
                            <button
                                type="button"
                                className="also-viewed-card"
                                key={item.id}
                                onClick={() => navigate(`/product/${item.id}`)}
                            >
                                <span className="also-viewed-media">
                                    {item.imageUrl
                                        ? <img src={resolveAssetUrl(item.imageUrl)} alt={item.title} loading="lazy" />
                                        : <ImageOff size={22} strokeWidth={1.4} className="product-media-empty" />}
                                </span>
                                <span className="also-viewed-name">{item.title}</span>
                                <strong className="also-viewed-price">{formatPrice(item.price)}</strong>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="details-layout">
                <div className="details-main">
                    <div className="gallery-row">
                        <div className="product-gallery">
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
                            <div className="product-gallery-main">
                                {activeImageUrl
                                    ? <img src={activeImageUrl} alt={product.title} />
                                    : <ImageOff size={54} strokeWidth={1.2} className="product-media-empty" />}
                            </div>
                        </div>
                    </div>

                    <div className="product-specs-section">
                        <h2>Характеристики та опис</h2>
                        <div className="product-specs-grid">
                            <div className="spec-row">
                                <span>Виробник</span>
                                <span>{product.brand}</span>
                            </div>
                            {specRows.map((row) => (
                                <div className="spec-row" key={row.key}>
                                    <span>{row.key}</span>
                                    <span>{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <p className="product-description-text">{product.description}</p>
                        {product.manufacturerUrl && (
                            <a href={product.manufacturerUrl} target="_blank" rel="noreferrer" className="manufacturer-link">
                                Офіційний сайт виробника
                            </a>
                        )}
                    </div>
                </div>

                <div className="details-aside">
                    <div className="product-main-info">
                        <h1>{product.title}</h1>
                        <div className="product-meta-row">
                            <span className="product-code">Код: {product.sku}</span>
                            <StarRow rating={product.rating} />
                            <span className="product-reviews-count">{product.reviewsCount} відгуків</span>
                        </div>
                        <span className={`stock-badge${inStock ? '' : ' stock-badge-out'}`}>
                            {inStock ? 'Є в наявності' : 'Немає в наявності'}
                        </span>

                        <div className="product-price-block">
                            <strong>{formatPrice(product.price)}</strong>
                            {product.previousPrice ? <small>{formatPrice(product.previousPrice)}</small> : null}
                        </div>
                        <p className="free-shipping-note">Безкоштовна доставка від 600₴</p>

                        <div className="product-buy-row">
                            <button className="primary product-buy-button" type="button" onClick={() => addToCart(product.id)}>
                                До кошика
                            </button>
                            <button className="product-buy-now-button" type="button" onClick={() => handleBuyNow(product.id)}>
                                Купити зараз
                            </button>
                            <button
                                type="button"
                                className={`icon-square-button${isFavorite ? ' icon-square-button-active' : ''}`}
                                onClick={() => toggleFavorite(product.id)}
                                aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
                            >
                                <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button type="button" className="icon-square-button" aria-label="Порівняти">
                                <GitCompare size={19} />
                            </button>
                        </div>

                        <button
                            type="button"
                            className="product-seller-link"
                            onClick={() => navigate(`/catalog?search=${encodeURIComponent(product.brand)}`)}
                        >
                            <Store size={16} /> Продавець <strong>{product.brand}</strong>
                            <ChevronRight size={15} />
                        </button>
                    </div>

                    <aside className="product-side-cards">
                        <div className="product-side-card">
                            <h3><Truck size={17} /> Доставка</h3>
                            <div className="product-side-row">
                                <span>Магазини Lumio</span>
                                <span className="free-chip">Безкоштовно</span>
                            </div>
                            <p className="product-side-note">На замовлення від 600₴ до 15 кг і 120 см</p>
                            <p className="product-side-note">Доставка 2–5 днів</p>
                            <div className="product-side-row">
                                <span>Нова Пошта</span>
                            </div>
                            <p className="product-side-note">Дізнатись дату доставки в регіоні</p>
                            <button type="button" className="product-side-more">Дивитись все</button>
                        </div>

                        <div className="product-side-card">
                            <h3><ShieldCheck size={17} /> Оплата та гарантії</h3>
                            <div className="product-side-row">
                                <CreditCard size={15} /> <span>Безпечна оплата карткою</span>
                            </div>
                            <p className="product-side-note">Без переплат, Lumio гарантує безпеку та повернення коштів при відмові від посилки</p>
                            <div className="product-side-row">
                                <Package size={15} /> <span>Післяплата</span>
                            </div>
                            <p className="product-side-note">Магазини Lumio, Нова Пошта</p>
                            <button type="button" className="product-side-more">Дивитись все</button>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="reviews">
                <div className="product-section-head">
                    <h2>Відгуки {reviews.length > 0 ? `(${reviews.length})` : ''}</h2>
                    {reviews.length > 0 && (
                        <div className="review-nav-arrows">
                            <button type="button" onClick={() => scrollReviews(-1)} aria-label="Попередні відгуки"><ChevronLeft size={18} /></button>
                            <button type="button" onClick={() => scrollReviews(1)} aria-label="Наступні відгуки"><ChevronRight size={18} /></button>
                        </div>
                    )}
                </div>

                {user && (
                    <form onSubmit={handleCreateReview} className="review-form">
                        <select name="rating" defaultValue="5">
                            <option value="5">5 зірок</option>
                            <option value="4">4 зірки</option>
                            <option value="3">3 зірки</option>
                            <option value="2">2 зірки</option>
                            <option value="1">1 зірка</option>
                        </select>
                        <textarea name="text" placeholder="Ваш відгук" required />
                        <button className="primary">Надіслати відгук</button>
                    </form>
                )}

                {reviews.length > 0 ? (
                    <div className="review-strip" ref={reviewStripRef}>
                        {reviews.map((review) => (
                            <article className="review-card" key={review.id}>
                                <div className="review-card-head">
                                    <StarRow rating={review.rating} />
                                    <span className="review-date">{formatDate(review.createdAt)}</span>
                                </div>
                                <strong className="review-author">{review.userFullName}</strong>
                                <span className="review-provenance">Придбано на Lumio.ua</span>
                                <span className="review-provenance">Продавець: {product.brand}</span>
                                <p className="review-text">{review.text}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">Відгуків поки немає. Будьте першими!</p>
                )}
            </div>

            {sameSellerItems.length > 0 && (
                <section className="product-section">
                    <div className="product-section-head">
                        <h2>Схоже у продавця</h2>
                    </div>
                    <ProductGrid
                        products={sameSellerItems}
                        favoriteProductIds={favoriteProductIds}
                        onOpen={(item) => navigate(`/product/${item.id}`)}
                        onAddToCart={addToCart}
                        onToggleFavorite={toggleFavorite}
                    />
                    {sameSeller && sameSellerPageSize < sameSeller.totalCount && (
                        <div className="load-more">
                            <button type="button" disabled={sameSellerLoading} onClick={() => setSameSellerPageSize((size) => size + 4)}>
                                {sameSellerLoading ? 'Завантаження...' : 'Показати ще'}
                            </button>
                        </div>
                    )}
                </section>
            )}

            {otherSellerItems.length > 0 && (
                <section className="product-section">
                    <div className="product-section-head">
                        <h2>Схоже в інших продавців</h2>
                    </div>
                    <ProductGrid
                        products={otherSellerItems}
                        favoriteProductIds={favoriteProductIds}
                        onOpen={(item) => navigate(`/product/${item.id}`)}
                        onAddToCart={addToCart}
                        onToggleFavorite={toggleFavorite}
                    />
                    {otherSeller && otherSellerPageSize < otherSeller.totalCount && (
                        <div className="load-more">
                            <button type="button" disabled={otherSellerLoading} onClick={() => setOtherSellerPageSize((size) => size + 8)}>
                                {otherSellerLoading ? 'Завантаження...' : 'Показати ще'}
                            </button>
                        </div>
                    )}
                </section>
            )}
        </section>
    );
}