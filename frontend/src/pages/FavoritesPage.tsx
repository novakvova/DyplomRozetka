import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { SelectField } from '../components/SelectField';
import { formatPrice, resolveAssetUrl } from '../store/api/client';
import { useProductActions } from '../hooks/useProductActions';
import { useAppSelector } from '../store/hooks';

type SortKey = 'added' | 'price-asc' | 'price-desc' | 'title';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'added', label: 'За додаванням' },
    { key: 'price-asc', label: 'Спочатку дешевші' },
    { key: 'price-desc', label: 'Спочатку дорожчі' },
    { key: 'title', label: 'За назвою (А-Я)' },
];

function pluralizeGoods(count: number) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'товар';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'товари';
    return 'товарів';
}

export function FavoritesPage() {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const [authOpen, setAuthOpen] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('added');
    const { favorites, addToCart, toggleFavorite } = useProductActions();

    const sortedFavorites = useMemo(() => {
        const list = [...favorites];
        if (sortKey === 'price-asc') return list.sort((a, b) => a.product.price - b.product.price);
        if (sortKey === 'price-desc') return list.sort((a, b) => b.product.price - a.product.price);
        if (sortKey === 'title') return list.sort((a, b) => a.product.title.localeCompare(b.product.title, 'uk'));
        return list;
    }, [favorites, sortKey]);

    if (!user) {
        return (
            <section className="profile-page profile-guest">
                <h1>Увійдіть в акаунт Lumio</h1>
                <p>Щоб бачити свій список бажань, увійдіть у свій акаунт.</p>
                <button type="button" className="primary" onClick={() => setAuthOpen(true)}>
                    Увійти або зареєструватися
                </button>
                <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
            </section>
        );
    }

    const count = favorites.length;
    const activeSortLabel = SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? SORT_OPTIONS[0].label;

    return (
        <section className="profile-page">
            <div className="profile-layout">
                <ProfileSidebar />

                <div className="profile-content">
                    <div className="account-panel">
                        <div className="account-panel-head">
                            <h1>Вибране</h1>
                        </div>

                        <div className="favorites-toolbar">
                            <p className="favorites-summary">{count} {pluralizeGoods(count)} у списку бажань</p>

                            {count > 0 && (
                                <div className="favorites-sort">
                                    <span>Сортування:</span>
                                    <SelectField
                                        value={activeSortLabel}
                                        onChange={(label) => {
                                            const found = SORT_OPTIONS.find((option) => option.label === label);
                                            if (found) setSortKey(found.key);
                                        }}
                                        options={SORT_OPTIONS.map((option) => option.label)}
                                        placeholder="Сортування"
                                    />
                                </div>
                            )}
                        </div>

                        {count === 0 ? (
                            <div className="favorites-empty">
                                <div className="favorites-empty-art" aria-hidden="true">
                                    <span className="favorites-empty-spark favorites-empty-spark-1">✦</span>
                                    <span className="favorites-empty-spark favorites-empty-spark-2">✦</span>
                                    <div className="favorites-empty-circle">
                                        <ShoppingBag size={32} strokeWidth={1.6} />
                                        <span className="favorites-empty-heart">
                          <Heart size={12} fill="currentColor" strokeWidth={0} />
                        </span>
                                    </div>
                                </div>

                                <strong>У вас ще немає товарів у вибраному</strong>
                                <p>Додайте товари до вибраного, щоб швидко повертатися до них</p>
                                <button type="button" className="primary" onClick={() => navigate('/catalog')}>
                                    Перейти до каталогу
                                </button>
                            </div>
                        ) : (
                            <div className="favorites-list">
                                {sortedFavorites.map((favorite, index) => {
                                    const product = favorite.product;
                                    const outOfStock = product.stockQuantity <= 0;

                                    return (
                                        <article
                                            className="favorites-item"
                                            key={favorite.id}
                                            style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
                                        >
                                            <button
                                                type="button"
                                                className="favorites-item-media"
                                                onClick={() => navigate(`/product/${product.id}`)}
                                                aria-label={product.title}
                                            >
                                                <img src={resolveAssetUrl(product.imageUrl)} alt={product.title} loading="lazy" />
                                            </button>

                                            <button
                                                type="button"
                                                className="favorites-item-title"
                                                onClick={() => navigate(`/product/${product.id}`)}
                                            >
                                                {product.title}
                                            </button>

                                            <strong className="favorites-item-price">{formatPrice(product.price)}</strong>

                                            <button
                                                type="button"
                                                className="primary favorites-item-add"
                                                onClick={() => addToCart(product.id)}
                                                disabled={outOfStock}
                                            >
                                                <ShoppingCart size={14} /> {outOfStock ? 'немає в наявності' : 'додати в кошик'}
                                            </button>

                                            <button
                                                type="button"
                                                className="cart-item-remove favorites-item-remove"
                                                onClick={() => toggleFavorite(product.id)}
                                                aria-label="Видалити з обраного"
                                            >
                                                <X size={16} />
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}