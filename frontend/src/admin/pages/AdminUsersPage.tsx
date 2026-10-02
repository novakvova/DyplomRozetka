import {
    ShieldCheck,
    ShieldOff,
    UserRound,
    Users,
} from 'lucide-react';

import {
    useGetUsersQuery,
    useToggleUserBlockMutation,
    useToggleUserRoleMutation,
} from '../../store/api/adminApi';

export function AdminUsersPage() {
    const {
        data: users = [],
        isLoading,
        isError,
    } = useGetUsersQuery();

    const [toggleUserBlock] =
        useToggleUserBlockMutation();

    const [toggleUserRole] =
        useToggleUserRoleMutation();

    const blockedCount = users.filter(
        (user) => user.isBlocked,
    ).length;

    const adminCount = users.filter(
        (user) => user.role === 'Admin',
    ).length;

    return (
        <div className="space-y-6">
            {/* HEADER */}

            <div>
                <h1 className="m-0 text-2xl font-bold text-gray-900">
                    Користувачі
                </h1>

                <p className="mb-0 mt-1 text-sm text-gray-500">
                    Керування користувачами магазину
                    Lumio
                </p>
            </div>

            {/* STATS */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    title="Всього користувачів"
                    value={users.length}
                    icon={<Users size={21} />}
                />

                <StatCard
                    title="Адміністраторів"
                    value={adminCount}
                    icon={<ShieldCheck size={21} />}
                />

                <StatCard
                    title="Заблокованих"
                    value={blockedCount}
                    icon={<ShieldOff size={21} />}
                />
            </div>

            {/* USERS */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="m-0 text-lg font-semibold text-gray-900">
                        Список користувачів
                    </h2>

                    <p className="mb-0 mt-1 text-sm text-gray-500">
                        Всього: {users.length}
                    </p>
                </div>

                {isLoading && (
                    <div className="p-10 text-center text-sm text-gray-500">
                        Завантаження...
                    </div>
                )}

                {isError && (
                    <div className="p-10 text-center text-sm text-red-500">
                        Не вдалося завантажити
                        користувачів.
                    </div>
                )}

                {!isLoading &&
                    !isError &&
                    users.length === 0 && (
                        <div className="p-10 text-center text-sm text-gray-500">
                            Користувачів немає.
                        </div>
                    )}

                {!isLoading &&
                    !isError &&
                    users.length > 0 && (
                        <div className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    {/* USER */}

                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                                            <UserRound
                                                size={20}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="m-0 truncate text-sm font-semibold text-gray-900">
                                                {user.email}
                                            </p>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <RoleBadge
                                                    role={
                                                        user.role
                                                    }
                                                />

                                                {user.isBlocked && (
                                                    <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                                        Заблокований
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTIONS */}

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void toggleUserBlock(
                                                    user.id,
                                                )
                                            }
                                            className={
                                                user.isBlocked
                                                    ? greenButtonClass
                                                    : redButtonClass
                                            }
                                        >
                                            {user.isBlocked
                                                ? 'Розблокувати'
                                                : 'Блокувати'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void toggleUserRole(
                                                    user.id,
                                                )
                                            }
                                            className={secondaryButtonClass}
                                        >
                                            <ShieldCheck
                                                size={16}
                                            />

                                            Змінити роль
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    );
}

function RoleBadge({
    role,
}: {
    role: string;
}) {
    if (role === 'Admin') {
        return (
            <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                Admin
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {role}
        </span>
    );
}

function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                {icon}
            </div>

            <p className="m-0 text-sm text-gray-500">
                {title}
            </p>

            <p className="mb-0 mt-1 text-2xl font-bold text-gray-900">
                {value}
            </p>
        </div>
    );
}

const secondaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50';

const redButtonClass =
    'inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50';

const greenButtonClass =
    'inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50';