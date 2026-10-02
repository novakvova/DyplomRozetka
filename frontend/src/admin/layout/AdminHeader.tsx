import {
    Bell,
    Menu,
    UserRound,
    X,
} from 'lucide-react';

import { useAppSelector } from '../../store/hooks';
import { AdminSearch } from '../components/AdminSearch';
import { useAdminSidebar } from '../context/AdminSidebarContext';

export function AdminHeader() {
    const user = useAppSelector(
        (state) => state.auth.user,
    );

    const {
        isMobileOpen,
        toggleSidebar,
        toggleMobileSidebar,
    } = useAdminSidebar();

    function handleSidebarToggle() {
        if (window.innerWidth >= 1280) {
            toggleSidebar();
        } else {
            toggleMobileSidebar();
        }
    }

    return (
        <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white">
            <div className="flex min-h-[76px] w-full items-center gap-3 px-5 md:px-6">
                {/* SIDEBAR TOGGLE */}

                <button
                    type="button"
                    onClick={handleSidebarToggle}
                    className={`
                        flex h-10 w-10
                        shrink-0 items-center
                        justify-center
                        rounded-lg
                        border border-gray-200
                        text-gray-500
                        transition
                        hover:bg-gray-50
                        hover:text-gray-700
                        ${
                            isMobileOpen
                                ? 'bg-gray-100'
                                : 'bg-white'
                        }
                    `}
                    aria-label={
                        isMobileOpen
                            ? 'Закрити меню'
                            : 'Відкрити меню'
                    }
                >
                    {isMobileOpen ? (
                        <X size={20} />
                    ) : (
                        <Menu size={20} />
                    )}
                </button>

                {/* MOBILE LOGO */}

                <div className="flex items-center gap-2 xl:hidden">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white">
                        L
                    </div>

                    <span className="hidden font-bold text-gray-900 sm:inline">
                        Lumio
                    </span>
                </div>

                {/* SEARCH */}

                <AdminSearch />

                {/* RIGHT SIDE */}

                <div className="ml-auto flex shrink-0 items-center gap-3">
                    {/* NOTIFICATIONS */}

                    <button
                        type="button"
                        className="
                            flex h-10 w-10
                            items-center
                            justify-center
                            rounded-full
                            border border-gray-200
                            text-gray-500
                            transition
                            hover:bg-gray-50
                            hover:text-gray-700
                        "
                        aria-label="Сповіщення"
                    >
                        <Bell size={19} />
                    </button>

                    {/* USER */}

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                            <UserRound size={20} />
                        </div>

                        <div className="hidden sm:block">
                            <p className="m-0 max-w-[180px] truncate text-sm font-semibold text-gray-800">
                                {user?.fullName ||
                                    'Адміністратор'}
                            </p>

                            <p className="m-0 text-xs text-gray-500">
                                Administrator
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}