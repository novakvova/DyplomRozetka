import { Clock, Heart, Headphones, ListChecks, Package, RefreshCcw, Settings, ShieldCheck, Truck, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

function initials(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ProfileSidebar() {
    const user = useAppSelector((state) => state.auth.user);
    if (!user) return null;

    return (
        <aside className="profile-sidebar">
            <div className="profile-sidebar-user">
                <span className="profile-sidebar-avatar">{initials(user.fullName)}</span>
                <strong>{user.fullName}</strong>
                <span className="profile-sidebar-email">{user.email}</span>
            </div>

            <nav className="profile-sidebar-nav">
                <div className="profile-sidebar-group">
                    <span className="profile-sidebar-group-title">Мій профіль</span>
                    <NavLink to="/profile" end>
                        <User size={16} /> Особисті дані
                    </NavLink>
                    <NavLink to="/profile/addresses">
                        <Truck size={16} /> Мої адреси
                    </NavLink>
                </div>

                <div className="profile-sidebar-group">
                    <span className="profile-sidebar-group-title">Мої замовлення</span>
                    <NavLink to="/orders">
                        <Package size={16} /> Переглянути всі
                    </NavLink>
                    <NavLink to="/orders?status=pending">
                        <Clock size={16} /> Очікує оплати
                    </NavLink>
                    <NavLink to="/orders?status=processing">
                        <RefreshCcw size={16} /> В обробці
                    </NavLink>
                    <NavLink to="/orders?status=shipped">
                        <Truck size={16} /> Відправлено
                    </NavLink>
                    <NavLink to="/orders?status=completed">
                        <ListChecks size={16} /> Завершено
                    </NavLink>
                </div>

                <div className="profile-sidebar-group">
                    <span className="profile-sidebar-group-title">Список бажань</span>
                    <NavLink to="/favorites">
                        <Heart size={16} /> Мої списки
                    </NavLink>
                </div>

                <div className="profile-sidebar-group">
                    <span className="profile-sidebar-group-title">Налаштування</span>
                    <NavLink to="/profile#security">
                        <ShieldCheck size={16} /> Інформація про безпеку
                    </NavLink>
                    <NavLink to="/profile">
                        <Settings size={16} /> Персональна інформація
                    </NavLink>
                </div>
            </nav>

            <div className="profile-sidebar-help">
                <strong>Потрібна допомога?</strong>
                <span>Ми завжди на зв'язку</span>
                <button type="button">
                    <Headphones size={15} /> Написати в підтримку
                </button>
            </div>
        </aside>
    );
}