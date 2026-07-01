import { NavLink, useNavigate } from 'react-router-dom';
import rozetkaLogo from '../assets/rozetka-logo.svg';
import { useGetCartQuery } from '../store/api/cartApi';
import { useGetFavoritesQuery } from '../store/api/favoritesApi';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function Header() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { data: cart } = useGetCartQuery(undefined, { skip: !user });
    const { data: favorites = [] } = useGetFavoritesQuery(undefined, { skip: !user });
    const cartItemsCount = (cart?.items ?? []).reduce((total, item) => total + item.quantity, 0);

    function handleLogout() {
        dispatch(logout());
        navigate('/');
    }

    return (
        <header className="topbar">
            <NavLink className="catalog-button" to="/">☰ Каталог</NavLink>
            <NavLink className="brand-lockup" to="/">
                <img className="brand-mark" src={rozetkaLogo} alt="Rozetka" />
                <strong>Rozetka</strong>
            </NavLink>
            <nav>
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-active' : ''}>Товари</NavLink>
                <NavLink to="/favorites" className={({ isActive }) => isActive ? 'nav-active' : ''}>Обране ({favorites.length})</NavLink>
                <NavLink to="/cart" className={({ isActive }) => isActive ? 'nav-active' : ''}>Кошик ({cartItemsCount})</NavLink>
                <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-active' : ''}>Замовлення</NavLink>
                {user?.role === 'Admin' && <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-active' : ''}>Адмінка</NavLink>}
            </nav>
            {user ? (
                <div className="account">
                    <NavLink to="/profile">{user.fullName}</NavLink>
                    <button onClick={handleLogout}>Вийти</button>
                </div>
            ) : (
                <NavLink to="/profile">Увійти</NavLink>
            )}
        </header>
    );
}