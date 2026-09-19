import { useRef, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { resolveAssetUrl} from "../store/api/client";
import { getCategoryIcon } from '../data/categoryIcons';
import { AccountDrawer } from './AccountDrawer';
import { AuthModal } from './AuthModal';
import { useGetCartQuery } from '../store/api/cartApi';
import { useGetCategoriesQuery } from '../store/api/catalogApi';
import { useGetFavoritesQuery } from '../store/api/favoritesApi';
import { useAppSelector } from '../store/hooks';

function SolidHeartIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 21s-6.7-4.35-9.33-8.28C1.02 10.62 1.4 7.6 3.6 5.9c1.9-1.47 4.6-1.14 6.13.56L12 8.9l2.27-2.44c1.53-1.7 4.23-2.03 6.13-.56 2.2 1.7 2.58 4.72.93 6.82C18.7 16.65 12 21 12 21z"
                fill="currentColor"
            />
        </svg>
    );
}

function SolidUserIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path d="M4 20.5c0-4.42 3.58-7.5 8-7.5s8 3.08 8 7.5V21H4v-.5z" fill="currentColor" />
        </svg>
    );
}

function SolidBagIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 8V6.5a5 5 0 0 1 10 0V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path
                d="M5.2 8h13.6l-1.14 11.3a2 2 0 0 1-2 1.8H8.34a2 2 0 0 1-2-1.8L5.2 8z"
                fill="currentColor"
            />
        </svg>
    );
}

function SearchGlyph() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
            <line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
    );
}

export function Header() {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const { data: cart } = useGetCartQuery(undefined, { skip: !user });
    const { data: favorites = [] } = useGetFavoritesQuery(undefined, { skip: !user });
    const { data: categories = [] } = useGetCategoriesQuery();
    const cartItemsCount = (cart?.items ?? []).reduce((total, item) => total + item.quantity, 0);

    const [search, setSearch] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const stripRef = useRef<HTMLDivElement | null>(null);

    function handleSearch(event: FormEvent) {
        event.preventDefault();
        navigate(search.trim() ? `/catalog?search=${encodeURIComponent(search.trim())}` : '/catalog');
    }

    function scrollStrip(direction: -1 | 1) {
        stripRef.current?.scrollBy({ left: direction * 280, behavior: 'smooth' });
    }

    return (
        <header className="site-header">
            <div className="topbar">
                <button
                    type="button"
                    className="hamburger-button"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Меню акаунта"
                    aria-expanded={drawerOpen}
                >
                    <Menu size={27} strokeWidth={1.9} />
                </button>

                <NavLink className="brand-lockup" to="/" aria-label="Lumio — на головну">
                    <span className="brand-word" aria-hidden="true">
                        Lum<span className="brand-i">ı<i className="brand-star">★</i></span>o
                    </span>
                </NavLink>

                <form className="search-bar" onSubmit={handleSearch} role="search">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Шукати товари..."
                        aria-label="Пошук товарів"
                    />
                    <button type="submit" aria-label="Знайти">
                        <SearchGlyph />
                    </button>
                </form>

                <div className="icon-actions">
                    <NavLink to="/favorites" className="icon-action" aria-label="Обране">
                        <SolidHeartIcon size={26} />
                        {favorites.length > 0 && <span className="icon-badge">{favorites.length}</span>}
                    </NavLink>

                    <button
                        type="button"
                        className="icon-action"
                        aria-label="Акаунт"
                        onClick={() => (user ? navigate('/profile') : setAuthModalOpen(true))}
                    >
                        <SolidUserIcon size={26} />
                    </button>

                    <NavLink to="/cart" className="icon-action icon-action-cart" aria-label="Кошик">
                        <SolidBagIcon size={26} />
                        {cartItemsCount > 0 && <span className="icon-badge">{cartItemsCount}</span>}
                    </NavLink>
                </div>
            </div>

            <div className="category-strip-wrap">
                <button type="button" className="strip-arrow strip-arrow-left" onClick={() => scrollStrip(-1)} aria-label="Прокрутити ліворуч">
                    <ChevronLeft size={18} />
                </button>

                <div className="category-strip" ref={stripRef}>
                    {categories.map((category) => {
                        const Icon = getCategoryIcon(category.slug);
                        return (
                            <NavLink
                                key={category.id}
                                to={`/catalog?category=${category.slug}`}
                                className="category-tile-mini"
                                title={category.description}
                            >
                                <span className="category-tile-mini-icon">
                                    {category.imageUrl
                                        ? <img src={resolveAssetUrl(category.imageUrl)} alt={category.title} />
                                        : <Icon size={30} strokeWidth={1.6} />}
                                </span>
                                <span>{category.title}</span>
                            </NavLink>
                        );
                    })}
                </div>

                <button type="button" className="strip-arrow strip-arrow-right" onClick={() => scrollStrip(1)} aria-label="Прокрутити праворуч">
                    <ChevronRight size={18} />
                </button>
            </div>

            <AccountDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onOpenAuth={() => setAuthModalOpen(true)} />
            <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </header>
    );
}