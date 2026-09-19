import { useNavigate } from 'react-router-dom';
import { Heart, Headphones, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import { ProductGrid } from '../components/ProductGrid';
import { useProductActions } from '../hooks/useProductActions';
import { useAppSelector } from '../store/hooks';

const GUARANTEES = [
    { icon: Truck, title: 'Безкоштовна доставка', note: 'при замовленні від 1 000 грн' },
    { icon: RefreshCcw, title: 'Повернення товару', note: 'протягом 14 днів' },
    { icon: ShieldCheck, title: 'Гарантія якості', note: 'тільки оригінальні товари' },
    { icon: Headphones, title: 'Підтримка 24/7', note: 'ми завжди на зв\u2019язку' },
];

function Guarantees() {
    return (
        <div className="cart-guarantees">
            {GUARANTEES.map(({ icon: Icon, title, note }) => (
                <div className="cart-guarantee" key={title}>
                    <Icon size={20} strokeWidth={1.8} />
                    <div>
                        <strong>{title}</strong>
                        <span>{note}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function FavoritesPage() {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const { favorites, favoriteProductIds, addToCart, toggleFavorite } = useProductActions();

    if (!user) {
        return (
            <section className="cart-page cart-empty-page">
                <div className="cart-empty-art" aria-hidden="true">
                    <Heart size={64} strokeWidth={1.3} />
                </div>
                <h1>Увійдіть, щоб бачити обране</h1>
                <p>Ваші збережені товари зберігаються в акаунті Lumio.</p>
                <button type="button" className="primary cart-empty-cta" onClick={() => navigate('/profile')}>
                    Увійти в акаунт
                </button>
            </section>
        );
    }

    if (favorites.length === 0) {
        return (
            <section className="cart-page cart-empty-page">
                <div className="cart-empty-art" aria-hidden="true">
                    <Heart size={64} strokeWidth={1.3} />
                </div>
                <h1>Список бажань порожній</h1>
                <p>Додавайте товари в обране, щоб не загубити їх</p>
                <button type="button" className="primary cart-empty-cta" onClick={() => navigate('/catalog')}>
                    Перейти до каталогу
                </button>
                <Guarantees />
            </section>
        );
    }

    return (
        <section className="cart-page">
            <h1 className="cart-title">Обране</h1>
            <p className="favorites-count">{favorites.length} товарів у списку бажань</p>

            <ProductGrid
                products={favorites.map((item) => item.product)}
                favoriteProductIds={favoriteProductIds}
                onOpen={(product) => navigate(`/product/${product.id}`)}
                onAddToCart={addToCart}
                onToggleFavorite={toggleFavorite}
            />

            <Guarantees />
        </section>
    );
}