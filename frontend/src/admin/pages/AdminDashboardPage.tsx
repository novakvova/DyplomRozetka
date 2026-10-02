import {
    FolderTree,
    PackageCheck,
    ShoppingBag,
    Users,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {AdminSalesChart} from '../components/AdminSalesChart';
import {AdminOrdersChart} from '../components/AdminOrdersChart';

import {
    useGetAdminOrdersQuery,
    useGetUsersQuery,
} from '../../store/api/adminApi';

import {
    useGetCategoriesQuery,
    useGetProductsQuery,
} from '../../store/api/catalogApi';

export function AdminDashboardPage() {
    const {
        data: categories = [],
    } = useGetCategoriesQuery();

    const {
        data: productsPage,
    } = useGetProductsQuery({
        pageSize: 100,
    });

    const {
        data: users = [],
    } = useGetUsersQuery();

    const {
        data: orders = [],
        isLoading: ordersLoading,
    } = useGetAdminOrdersQuery();

    const products =
        productsPage?.items ?? [];

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

    const recentOrders =
        orders.slice(0, 5);

    return (
        <div>
            {/* PAGE HEADER */}

            <div className="mb-6">
                <h1 className="m-0 text-2xl font-bold text-gray-900">
                    Головна
                </h1>

                <p className="mb-0 mt-1 text-sm text-gray-500">
                    Огляд магазину Lumio
                </p>
            </div>

            {/* DASHBOARD GRID */}

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                {/* METRICS */}

                <div className="col-span-12">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                        {stats.map((stat) => {
                            const Icon =
                                stat.icon;

                            return (
                                <div
                                    key={
                                        stat.title
                                    }
                                    className="
                                        rounded-2xl
                                        border
                                        border-gray-200
                                        bg-white
                                        p-5
                                        md:p-6
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            h-12
                                            w-12
                                            items-center
                                            justify-center
                                            rounded-xl
                                            bg-gray-100
                                            text-gray-800
                                        "
                                    >
                                        <Icon
                                            size={
                                                24
                                            }
                                        />
                                    </div>

                                    <div className="mt-5">
                                        <span className="text-sm text-gray-500">
                                            {
                                                stat.title
                                            }
                                        </span>

                                        <h4 className="mb-0 mt-2 text-2xl font-bold text-gray-800">
                                            {
                                                stat.value
                                            }
                                        </h4>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* CHARTS */}

                <div className="col-span-12 xl:col-span-5">
                    <AdminSalesChart
                        orders={orders}
                    />
                </div>

                <div className="col-span-12 xl:col-span-7">
                    <AdminOrdersChart
                        orders={orders}
                    />
                </div>
                {/* RECENT ORDERS */}

                <div className="col-span-12">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        {/* CARD HEADER */}

                        <div
                            className="flex flex-col gap-3 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                            <div>
                                <h2 className="m-0 text-lg font-semibold text-gray-800">
                                    Останні замовлення
                                </h2>

                                <p className="mb-0 mt-1 text-sm text-gray-500">
                                    Останні замовлення магазину
                                </p>
                            </div>

                            <Link
                                to="/admin/orders"
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                            >
                                Переглянути всі
                            </Link>
                        </div>

                        {/* LOADING */}

                        {ordersLoading ? (
                            <div className="p-10 text-center text-sm text-gray-500">
                                Завантаження...
                            </div>
                        ) : recentOrders.length ===
                        0 ? (
                            <div className="p-10 text-center text-sm text-gray-500">
                                Замовлень
                                поки немає.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 md:px-6">
                                            Замовлення
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                            Клієнт
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                            Дата
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                            Сума
                                        </th>

                                        <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-medium uppercase text-gray-500 md:px-6">
                                            Статус
                                        </th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {recentOrders.map(
                                        (
                                            order,
                                        ) => (
                                            <tr
                                                key={
                                                    order.id
                                                }
                                                className="border-b border-gray-100 last:border-b-0"
                                            >
                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-800 md:px-6">
                                                    {
                                                        order.number
                                                    }
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {
                                                        order.recipientFullName
                                                    }
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                    {new Date(
                                                        order.createdAt,
                                                    ).toLocaleDateString(
                                                        'uk-UA',
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-800">
                                                    {order.total.toLocaleString(
                                                        'uk-UA',
                                                    )}{' '}
                                                    ₴
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 md:px-6">
                                                    <OrderStatusBadge
                                                        status={
                                                            order.status
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrderStatusBadge({
                              status,
                          }: {
    status: string;
}) {
    const label =
        getOrderStatusLabel(status);

    const color =
        getOrderStatusColor(status);

    return (
        <span
            className={`
                inline-flex
                items-center
                rounded-full
                px-2.5
                py-1
                text-xs
                font-medium
                ${color}
            `}
        >
            {label}
        </span>
    );
}

function getOrderStatusColor(
    status: string,
) {
    switch (status) {
        case 'Placed':
            return 'bg-amber-50 text-amber-700';

        case 'Processing':
            return 'bg-blue-50 text-blue-700';

        case 'Shipped':
            return 'bg-indigo-50 text-indigo-700';

        case 'Completed':
            return 'bg-green-50 text-green-700';

        case 'Cancelled':
            return 'bg-red-50 text-red-700';

        default:
            return 'bg-gray-100 text-gray-700';
    }
}

function getOrderStatusLabel(
    status: string,
) {
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