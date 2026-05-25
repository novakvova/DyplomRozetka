import { NavLink } from 'react-router-dom';
import rozetkaLogo from '../assets/rozetka-logo.svg';
import type { User } from '../types';

type HeaderProps = {
  user: User | null;
  cartItemsCount: number;
  favoritesCount: number;
  onLogout: () => void;
};

export function Header({ user, cartItemsCount, favoritesCount, onLogout }: HeaderProps) {
  return (
    <header className="topbar">
      <NavLink className="catalog-button" to="/">☰ Каталог</NavLink>
      <NavLink className="brand-lockup" to="/">
        <img className="brand-mark" src={rozetkaLogo} alt="Rozetka" />
        <strong>Rozetka</strong>
      </NavLink>
      <nav>
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-active' : ''}>Товари</NavLink>
        <NavLink to="/favorites" className={({ isActive }) => isActive ? 'nav-active' : ''}>Обране ({favoritesCount})</NavLink>
        <NavLink to="/cart" className={({ isActive }) => isActive ? 'nav-active' : ''}>Кошик ({cartItemsCount})</NavLink>
        <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-active' : ''}>Замовлення</NavLink>
        {user?.role === 'Admin' && <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-active' : ''}>Адмінка</NavLink>}
      </nav>
      {user ? (
        <div className="account">
          <NavLink to="/profile">{user.fullName}</NavLink>
          <button onClick={onLogout}>Вийти</button>
        </div>
      ) : (
        <NavLink to="/profile">Увійти</NavLink>
      )}
    </header>
  );
}
