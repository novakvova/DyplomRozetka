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

import {
    NavLink,
    useLocation,
} from 'react-router-dom';

import {useEffect} from 'react';

import {useAdminSidebar} from '../context/AdminSidebarContext';

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
    const {
        isExpanded,
        isMobileOpen,
        isHovered,
        setIsHovered,
        setIsMobileOpen,
    } = useAdminSidebar();

    const location = useLocation();

    const showContent =
        isExpanded ||
        isHovered ||
        isMobileOpen;

    // TailAdmin behavior:
    // після переходу на іншу сторінку
    // mobile sidebar автоматично закривається.
    useEffect(() => {
        if (isMobileOpen) {
            setIsMobileOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <aside
            className={`
                fixed left-0 top-0 z-50
                flex h-screen flex-col
                border-r border-gray-200
                bg-white text-gray-900
                transition-all duration-300 ease-in-out

                ${
                isExpanded ||
                isHovered ||
                isMobileOpen
                    ? 'w-[290px]'
                    : 'w-[90px]'
            }

                ${
                isMobileOpen
                    ? 'translate-x-0'
                    : '-translate-x-full'
            }

                xl:translate-x-0
            `}
            onMouseEnter={() => {
                if (!isExpanded) {
                    setIsHovered(true);
                }
            }}
            onMouseLeave={() => {
                setIsHovered(false);
            }}
        >
            {/* LOGO */}

            <div
                className={`
                    flex h-[76px]
                    shrink-0 items-center
                    border-b border-gray-200
                    px-5

                    ${
                    showContent
                        ? 'justify-start'
                        : 'xl:justify-center'
                }
                `}
            >
                <NavLink
                    to="/admin"
                    className="flex items-center gap-3"
                >
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                        <Boxes size={21}/>
                    </div>

                    {showContent && (
                        <div className="min-w-0">
                            <div className="text-xl font-bold tracking-tight text-gray-900">
                                Lumio
                            </div>

                            <div className="text-xs text-gray-500">
                                Admin Panel
                            </div>
                        </div>
                    )}
                </NavLink>
            </div>

            {/* NAVIGATION */}

            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="mb-3">
                    {showContent ? (
                        <p className="m-0 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Меню
                        </p>
                    ) : (
                        <div className="flex justify-center text-lg font-bold tracking-widest text-gray-400">
                            ···
                        </div>
                    )}
                </div>

                <nav className="space-y-1">
                    {menuItems.map(
                        (item) => {
                            const Icon =
                                item.icon;

                            return (
                                <NavLink
                                    key={
                                        item.path
                                    }
                                    to={
                                        item.path
                                    }
                                    end={
                                        item.end
                                    }
                                    title={
                                        !showContent
                                            ? item.title
                                            : undefined
                                    }
                                    className={({isActive}) =>
                                        [
                                            'flex min-h-11 w-full items-center rounded-lg text-sm font-medium transition',

                                            showContent
                                                ? 'gap-3 px-3'
                                                : 'justify-center px-0',

                                            isActive
                                                ? 'bg-orange-50 text-orange-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                        ].join(' ')
                                    }
                                >
                                    <Icon
                                        size={
                                            20
                                        }
                                        className="shrink-0"
                                    />

                                    {showContent && (
                                        <span className="whitespace-nowrap">
                                            {
                                                item.title
                                            }
                                        </span>
                                    )}
                                </NavLink>
                            );
                        },
                    )}
                </nav>
            </div>

            {/* STORE LINK */}

            <div className="shrink-0 border-t border-gray-200 p-4">
                <NavLink
                    to="/"
                    title={
                        !showContent
                            ? 'Повернутися в магазин'
                            : undefined
                    }
                    className={`
                        flex min-h-11 w-full items-center
                        rounded-lg
                        text-sm font-medium
                        text-gray-600
                        transition
                        hover:bg-gray-50
                        hover:text-gray-900

                        ${
                        showContent
                            ? 'gap-3 px-3'
                            : 'justify-center px-0'
                    }
                    `}
                >
                    <LogOut
                        size={20}
                        className="shrink-0"
                    />

                    {showContent && (
                        <span className="whitespace-nowrap">
                            Повернутися в магазин
                        </span>
                    )}
                </NavLink>
            </div>
        </aside>
    );
}