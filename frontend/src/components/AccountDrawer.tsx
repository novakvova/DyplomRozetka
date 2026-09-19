import { useEffect } from 'react';
import { Heart, LogOut, Package, Settings, Shield, ShoppingBag, User, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

type AccountDrawerProps = {
    open: boolean;
    onClose: () => void;
    onOpenAuth: () => void;
};

function initials(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AccountDrawer({ open, onClose, onOpenAuth }: AccountDrawerProps) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    function handleLogout() {
        onClose();
        dispatch(logout());
        navigate('/');
    }

    return createPortal(
        <div className="account-drawer-backdrop" onClick={onClose}>
            <aside className="account-drawer" onClick={(event) => event.stopPropagation()}>
                <div className="account-drawer-top">
                    <span className="account-drawer-title">Акаунт</span>
                    <button type="button" className="account-drawer-close" onClick={onClose} aria-label="Закрити меню">
                        <X size={20} />
                    </button>
                </div>

                {user ? (
                    <>
                        <div className="account-drawer-profile">
                            <span className="account-drawer-avatar">{initials(user.fullName)}</span>
                            <div>
                                <strong>{user.fullName}</strong>
                                <span>{user.email}</span>
                            </div>
                        </div>

                        <nav className="account-drawer-nav">
                            <div className="account-drawer-group">
                                <span className="account-drawer-group-title">Мій профіль</span>
                                <NavLink to="/profile" onClick={onClose}>
                                    <User size={17} /> Особисті дані
                                </NavLink>
                            </div>

                            <div className="account-drawer-group">
                                <span className="account-drawer-group-title">Мої замовлення</span>
                                <NavLink to="/orders" onClick={onClose}>
                                    <Package size={17} /> Переглянути всі
                                </NavLink>
                            </div>

                            <div className="account-drawer-group">
                                <span className="account-drawer-group-title">Список бажань</span>
                                <NavLink to="/favorites" onClick={onClose}>
                                    <Heart size={17} /> Мої списки
                                </NavLink>
                            </div>

                            <div className="account-drawer-group">
                                <span className="account-drawer-group-title">Кошик</span>
                                <NavLink to="/cart" onClick={onClose}>
                                    <ShoppingBag size={17} /> Перейти в кошик
                                </NavLink>
                            </div>

                            <div className="account-drawer-group">
                                <span className="account-drawer-group-title">Налаштування</span>
                                <NavLink to="/profile" onClick={onClose}>
                                    <Settings size={17} /> Персональна інформація
                                </NavLink>
                            </div>

                            {user.role === 'Admin' && (
                                <div className="account-drawer-group">
                                    <span className="account-drawer-group-title">Керування</span>
                                    <NavLink to="/admin" onClick={onClose}>
                                        <Shield size={17} /> Адмінка
                                    </NavLink>
                                </div>
                            )}
                        </nav>

                        <button type="button" className="account-drawer-logout" onClick={handleLogout}>
                            <LogOut size={17} /> Вийти з акаунта
                        </button>
                    </>
                ) : (
                    <div className="account-drawer-guest">
                        <span className="account-drawer-avatar account-drawer-avatar-guest">
                            <User size={22} />
                        </span>
                        <p>Увійдіть, щоб бачити профіль, замовлення та список бажань.</p>
                        <button type="button" className="primary" onClick={() => { onClose(); onOpenAuth(); }}>
                            Увійти або зареєструватися
                        </button>
                    </div>
                )}
            </aside>
        </div>,
        document.body,
    );
}