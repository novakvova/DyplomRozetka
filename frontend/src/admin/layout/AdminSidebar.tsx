import {
    Boxes,
    FolderTree,
    LayoutDashboard,
    LogOut,
    PackageCheck,
    ShieldCheck,
    ShoppingBag,
    Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const menuItems = [
    {
        title: 'Головна',
        path: '/admin',
        icon: LayoutDashboard,
        end: true,
    },
    {
        title: 'Товари',
        path: '/admin/products',
        icon: ShoppingBag,
    },
    {
        title: 'Категорії',
        path: '/admin/categories',
        icon: FolderTree,
    },
    {
        title: 'Замовлення',
        path: '/admin/orders',
        icon: PackageCheck,
    },
    {
        title: 'Користувачі',
        path: '/admin/users',
        icon: Users,
    },
    {
        title: 'Адміністратори',
        path: '/admin/admins',
        icon: ShieldCheck,
    },
];

export function AdminSidebar() {
    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[290px] border-r border-gray-200 bg-white lg:flex lg:flex-col">
            <div className="flex h-[76px] items-center border-b border-gray-200 px-7">
                <NavLink
                    to="/admin"
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                        <Boxes size={21} />
                    </div>

                    <div>
                        <div className="text-xl font-bold tracking-tight text-gray-900">
                            Lumio
                        </div>

                        <div className="text-xs text-gray-500">
                            Admin Panel
                        </div>
                    </div>
                </NavLink>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Меню
                </p>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition',
                                        isActive
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    ].join(' ')
                                }
                            >
                                <Icon size={20} />

                                <span>{item.title}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-gray-200 p-4">
                <NavLink
                    to="/"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                >
                    <LogOut size={20} />

                    <span>Повернутися в магазин</span>
                </NavLink>
            </div>
        </aside>
    );
}