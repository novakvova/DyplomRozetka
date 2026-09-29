import { Bell, Search, UserRound } from 'lucide-react';

import { useAppSelector } from '../../store/hooks';

export function AdminHeader() {
    const user = useAppSelector((state) => state.auth.user);

    return (
        <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-gray-200 bg-white px-4 md:px-6">
            <div className="flex w-full items-center justify-between gap-4">
                <div className="hidden w-full max-w-md items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 md:flex">
                    <Search
                        size={19}
                        className="shrink-0 text-gray-400"
                    />

                    <input
                        type="search"
                        placeholder="Пошук..."
                        className="w-full border-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    />
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
                        aria-label="Сповіщення"
                    >
                        <Bell size={19} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                            <UserRound size={20} />
                        </div>

                        <div className="hidden sm:block">
                            <p className="m-0 text-sm font-semibold text-gray-800">
                                {user?.fullName || 'Адміністратор'}
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