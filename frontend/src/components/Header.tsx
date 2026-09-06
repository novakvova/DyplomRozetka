import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Menu, PackageSearch, Search, Settings, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { resolveAssetUrl} from "../store/api/client";
import { getCategoryIcon } from '../data/categoryIcons';
import { useGetCartQuery } from '../store/api/cartApi';
import { useGetCategoriesQuery } from '../store/api/catalogApi';
import { useGetFavoritesQuery } from '../store/api/favoritesApi';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

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

export function Header() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { data: cart } = useGetCartQuery(undefined, { skip: !user });
    const { data: favorites = [] } = useGetFavoritesQuery(undefined, { skip: !user });
    const { data: categories = [] } = useGetCategoriesQuery();
    const cartItemsCount = (cart?.items ?? []).reduce((total, item) => total + item.quantity, 0);

    const [search, setSearch] = useState('');
    const [accountOpen, setAccountOpen] = useState(false);
    const stripRef = useRef<HTMLDivElement | null>(null);
    const accountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleLogout() {
        setAccountOpen(false);
        dispatch(logout());
        navigate('/');
    }

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
                <button type="button" className="hamburger-button" onClick={() => navigate('/catalog')} aria-label="Каталог товарів">
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
                        <Search size={20} strokeWidth={2.4} />
                    </button>
                </form>

                <div className="icon-actions">
                    <NavLink to="/favorites" className="icon-action" aria-label="Обране">
                        <SolidHeartIcon size={26} />
                        {favorites.length > 0 && <span className="icon-badge">{favorites.length}</span>}
                    </NavLink>

                    <div className="account-menu-wrap" ref={accountRef}>
                        <button
                            type="button"
                            className="icon-action"
                            aria-label="Акаунт"
                            aria-expanded={accountOpen}
                            onClick={() => setAccountOpen((open) => !open)}
                        >
                            <SolidUserIcon size={26} />
                        </button>

                        {accountOpen && (
                            <div className="account-menu">
                                {user ? (
                                    <>
                                        <div className="account-menu-name">{user.fullName}</div>
                                        <NavLink to="/profile" onClick={() => setAccountOpen(false)}>
                                            <User size={15} /> Профіль
                                        </NavLink>
                                        <NavLink to="/orders" onClick={() => setAccountOpen(false)}>
                                            <PackageSearch size={15} /> Мої замовлення
                                        </NavLink>
                                        {user.role === 'Admin' && (
                                            <NavLink to="/admin" onClick={() => setAccountOpen(false)}>
                                                <Settings size={15} /> Адмінка
                                            </NavLink>
                                        )}
                                        <button type="button" className="account-menu-logout" onClick={handleLogout}>
                                            <LogOut size={15} /> Вийти
                                        </button>
                                    </>
                                ) : (
                                    <NavLink to="/profile" onClick={() => setAccountOpen(false)}>
                                        <User size={15} /> Увійти або зареєструватися
                                    </NavLink>
                                )}
                            </div>
                        )}
                    </div>

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
        </header>
    );
}