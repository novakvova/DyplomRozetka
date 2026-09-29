import {
    FolderTree,
    PackageCheck,
    ShoppingBag,
    Users,
} from 'lucide-react';

import { useGetAdminOrdersQuery } from '../../store/api/adminApi';
import {
    useGetCategoriesQuery,
    useGetProductsQuery,
} from '../../store/api/catalogApi';
import { useGetUsersQuery } from '../../store/api/adminApi';

export function AdminDashboardPage() {
    const { data: categories = [] } =
        useGetCategoriesQuery();

    const { data: productsPage } =
        useGetProductsQuery({
            pageSize: 100,
        });

    const { data: users = [] } =
        useGetUsersQuery();

    const {
        data: orders = [],
        isLoading: ordersLoading,
    } = useGetAdminOrdersQuery();

    const products = productsPage?.items ?? [];

    const stats = [
        {
            title: 'Товари',
            value: products.length,
            icon: ShoppingBag,
        },
        {
            title: 'Замовлення',
            value: orders.length,
            icon: PackageCheck,
        },
        {
            title: 'Користувачі',
            value: users.length,
            icon: Users,
        },
        {
            title: 'Категорії',
            value: categories.length,
            icon: FolderTree,
        },
    ];

    const recentOrders = orders.slice(0, 5);

    return (
        <div>
            <div className="mb-6">
                <h1 className="m-0 text-2xl font-bold text-gray-900">
                    Головна
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Огляд магазину Lumio
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.title}
                            className="rounded-2xl border border-gray-200 bg-white p-5"
                        >
                            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                                <Icon size={22} />
                            </div>

                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="m-0 text-sm text-gray-500">
                                        {stat.title}
                                    </p>

                                    <h2 className="mb-0 mt-1 text-2xl font-bold text-gray-900">
                                        {stat.value}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 className="m-0 text-lg font-semibold text-gray-900">
                            Останні замовлення
                        </h2>

                        <p className="mb-0 mt-1 text-sm text-gray-500">
                            Останні замовлення магазину
                        </p>
                    </div>
                </div>

                {ordersLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        Завантаження...
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        Замовлень поки немає.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Замовлення
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Клієнт
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Дата
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Сума
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Статус
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-gray-100 last:border-b-0"
                                    >
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                                            {order.number}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {order.recipientFullName}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {new Date(
                                                order.createdAt,
                                            ).toLocaleDateString(
                                                'uk-UA',
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                                            {order.total.toLocaleString(
                                                'uk-UA',
                                            )}{' '}
                                            ₴
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                                {getOrderStatusLabel(
                                                    order.status,
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function getOrderStatusLabel(status: string) {
    switch (status) {
        case 'Placed':
            return 'Очікує оплати';

        case 'Processing':
            return 'В обробці';

        case 'Shipped':
            return 'Відправлено';

        case 'Completed':
            return 'Завершено';

        case 'Cancelled':
            return 'Скасовано';

        default:
            return status;
    }
}