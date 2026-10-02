import {
    CalendarDays,
    PackageCheck,
    ShoppingBag,
    UserRound,
} from 'lucide-react';

import {
    useGetAdminOrdersQuery,
    useUpdateOrderStatusMutation,
} from '../../store/api/adminApi';

import { extractErrorMessage } from '../../store/api/client';
import { useAppDispatch } from '../../store/hooks';
import { messageSet } from '../../store/uiSlice';

import type { OrderStatus } from '../../types';

export function AdminOrdersPage() {
    const dispatch = useAppDispatch();

    // ============================================================
    // DATA
    // ============================================================

    const {
        data: orders = [],
        isLoading,
        isError,
    } = useGetAdminOrdersQuery();

    // ============================================================
    // MUTATIONS
    // ============================================================

    const [updateOrderStatus] =
        useUpdateOrderStatusMutation();

    // ============================================================
    // STATUS UPDATE
    // ============================================================

    async function handleOrderStatusChange(
        orderId: string,
        status: OrderStatus,
    ) {
        try {
            await updateOrderStatus({
                id: orderId,
                status,
            }).unwrap();

            dispatch(
                messageSet(
                    'Статус замовлення успішно змінено.',
                ),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося змінити статус замовлення.',
                    ),
                ),
            );
        }
    }

    // ============================================================
    // STATS
    // ============================================================

    const placedCount = orders.filter(
        (order) => order.status === 'Placed',
    ).length;

    const processingCount = orders.filter(
        (order) => order.status === 'Processing',
    ).length;

    const completedCount = orders.filter(
        (order) => order.status === 'Completed',
    ).length;

    // ============================================================
    // JSX
    // ============================================================

    return (
        <div className="space-y-6">
            {/* HEADER */}

            <div>
                <h1 className="m-0 text-2xl font-bold text-gray-900">
                    Замовлення
                </h1>

                <p className="mb-0 mt-1 text-sm text-gray-500">
                    Перегляд замовлень та керування
                    їхніми статусами
                </p>
            </div>

            {/* STATS */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Всього"
                    value={orders.length}
                    icon={<ShoppingBag size={21} />}
                />

                <StatCard
                    title="Очікують оплати"
                    value={placedCount}
                    icon={<CalendarDays size={21} />}
                />

                <StatCard
                    title="В обробці"
                    value={processingCount}
                    icon={<PackageCheck size={21} />}
                />

                <StatCard
                    title="Завершені"
                    value={completedCount}
                    icon={<PackageCheck size={21} />}
                />
            </div>

            {/* ORDERS */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="m-0 text-lg font-semibold text-gray-900">
                        Список замовлень
                    </h2>

                    <p className="mb-0 mt-1 text-sm text-gray-500">
                        Всього замовлень: {orders.length}
                    </p>
                </div>

                {isLoading && (
                    <div className="p-10 text-center text-sm text-gray-500">
                        Завантаження замовлень...
                    </div>
                )}

                {isError && (
                    <div className="p-10 text-center text-sm text-red-500">
                        Не вдалося завантажити
                        замовлення.
                    </div>
                )}

                {!isLoading &&
                    !isError &&
                    orders.length === 0 && (
                        <div className="p-10 text-center text-sm text-gray-500">
                            Замовлень поки немає.
                        </div>
                    )}

                {!isLoading &&
                    !isError &&
                    orders.length > 0 && (
                        <>
                            {/* DESKTOP TABLE */}

                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <TableHeader>
                                                Замовлення
                                            </TableHeader>

                                            <TableHeader>
                                                Клієнт
                                            </TableHeader>

                                            <TableHeader>
                                                Дата
                                            </TableHeader>

                                            <TableHeader>
                                                Сума
                                            </TableHeader>

                                            <TableHeader>
                                                Статус
                                            </TableHeader>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orders.map(
                                            (order) => (
                                                <tr
                                                    key={
                                                        order.id
                                                    }
                                                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                                                <ShoppingBag
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            </div>

                                                            <div>
                                                                <p className="m-0 text-sm font-semibold text-gray-900">
                                                                    {
                                                                        order.number
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <UserRound
                                                                size={
                                                                    17
                                                                }
                                                                className="shrink-0 text-gray-400"
                                                            />

                                                            <span className="text-sm text-gray-700">
                                                                {
                                                                    order.recipientFullName
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                        {new Date(
                                                            order.createdAt,
                                                        ).toLocaleString(
                                                            'uk-UA',
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                                                        {order.total.toLocaleString(
                                                            'uk-UA',
                                                        )}{' '}
                                                        ₴
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <OrderStatusSelect
                                                            orderId={
                                                                order.id
                                                            }
                                                            status={
                                                                order.status
                                                            }
                                                            onChange={
                                                                handleOrderStatusChange
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE */}

                            <div className="divide-y divide-gray-100 lg:hidden">
                                {orders.map(
                                    (order) => (
                                        <article
                                            key={
                                                order.id
                                            }
                                            className="space-y-4 p-5"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="m-0 text-xs text-gray-500">
                                                        Замовлення
                                                    </p>

                                                    <strong className="mt-1 block text-sm text-gray-900">
                                                        {
                                                            order.number
                                                        }
                                                    </strong>
                                                </div>

                                                <strong className="whitespace-nowrap text-sm text-gray-900">
                                                    {order.total.toLocaleString(
                                                        'uk-UA',
                                                    )}{' '}
                                                    ₴
                                                </strong>
                                            </div>

                                            <div>
                                                <p className="m-0 text-sm font-medium text-gray-700">
                                                    {
                                                        order.recipientFullName
                                                    }
                                                </p>

                                                <p className="mb-0 mt-1 text-xs text-gray-500">
                                                    {new Date(
                                                        order.createdAt,
                                                    ).toLocaleString(
                                                        'uk-UA',
                                                    )}
                                                </p>
                                            </div>

                                            <OrderStatusSelect
                                                orderId={
                                                    order.id
                                                }
                                                status={
                                                    order.status
                                                }
                                                onChange={
                                                    handleOrderStatusChange
                                                }
                                            />
                                        </article>
                                    ),
                                )}
                            </div>
                        </>
                    )}
            </div>
        </div>
    );
}

// ============================================================
// STATUS SELECT
// ============================================================

function OrderStatusSelect({
    orderId,
    status,
    onChange,
}: {
    orderId: string;
    status: OrderStatus;
    onChange: (
        orderId: string,
        status: OrderStatus,
    ) => void | Promise<void>;
}) {
    return (
        <select
            value={status}
            onChange={(event) =>
                void onChange(
                    orderId,
                    event.target.value as OrderStatus,
                )
            }
            className={`min-w-[165px] rounded-lg border px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 focus:ring-orange-100 ${getStatusClass(
                status,
            )}`}
        >
            <option value="Placed">
                Очікує оплати
            </option>

            <option value="Processing">
                В обробці
            </option>

            <option value="Shipped">
                Відправлено
            </option>

            <option value="Completed">
                Завершено
            </option>

            <option value="Cancelled">
                Скасовано
            </option>
        </select>
    );
}

// ============================================================
// STATUS STYLE
// ============================================================

function getStatusClass(
    status: OrderStatus,
) {
    switch (status) {
        case 'Placed':
            return 'border-amber-200 bg-amber-50 text-amber-700';

        case 'Processing':
            return 'border-blue-200 bg-blue-50 text-blue-700';

        case 'Shipped':
            return 'border-violet-200 bg-violet-50 text-violet-700';

        case 'Completed':
            return 'border-green-200 bg-green-50 text-green-700';

        case 'Cancelled':
            return 'border-red-200 bg-red-50 text-red-700';

        default:
            return 'border-gray-200 bg-gray-50 text-gray-700';
    }
}

// ============================================================
// STAT CARD
// ============================================================

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

// ============================================================
// TABLE HEADER
// ============================================================

function TableHeader({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            {children}
        </th>
    );
}