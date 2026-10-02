import type { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';

import type { Order } from '../../types';

type AdminOrdersChartProps = {
    orders: Order[];
};

const monthNames = [
    'Січ',
    'Лют',
    'Бер',
    'Кві',
    'Тра',
    'Чер',
    'Лип',
    'Сер',
    'Вер',
    'Жов',
    'Лис',
    'Гру',
];

export function AdminOrdersChart({
    orders,
}: AdminOrdersChartProps) {
    const currentYear = new Date().getFullYear();

    const monthlyOrders =
        Array<number>(12).fill(0);

    orders.forEach((order) => {
        const date = new Date(order.createdAt);

        if (
            Number.isNaN(date.getTime()) ||
            date.getFullYear() !== currentYear
        ) {
            return;
        }

        monthlyOrders[date.getMonth()] += 1;
    });

    const totalOrders = monthlyOrders.reduce(
        (sum, value) => sum + value,
        0,
    );

    const completedOrders = orders.filter((order) => {
        const date = new Date(order.createdAt);

        return (
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() === currentYear &&
            order.status === 'Completed'
        );
    }).length;

    const options: ApexOptions = {
        colors: ['#f97316'],

        chart: {
            type: 'area',
            height: 310,
            toolbar: {
                show: false,
            },
            fontFamily: 'inherit',
        },

        stroke: {
            curve: 'smooth',
            width: 2,
        },

        fill: {
            type: 'gradient',
            gradient: {
                opacityFrom: 0.35,
                opacityTo: 0.03,
            },
        },

        markers: {
            size: 0,
            strokeWidth: 2,

            hover: {
                size: 6,
            },
        },

        dataLabels: {
            enabled: false,
        },

        legend: {
            show: false,
        },

        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 4,

            xaxis: {
                lines: {
                    show: false,
                },
            },

            yaxis: {
                lines: {
                    show: true,
                },
            },
        },

        xaxis: {
            type: 'category',
            categories: monthNames,

            axisBorder: {
                show: false,
            },

            axisTicks: {
                show: false,
            },

            tooltip: {
                enabled: false,
            },
        },

        yaxis: {
            min: 0,
            forceNiceScale: true,

            labels: {
                formatter: (value: number) =>
                    Math.round(value).toString(),
            },
        },

        tooltip: {
            y: {
                formatter: (value: number) =>
                    `${Math.round(value)} замовл.`,
            },
        },

        states: {
            hover: {
                filter: {
                    type: 'none',
                },
            },

            active: {
                filter: {
                    type: 'none',
                },
            },
        },
    };

    const series = [
        {
            name: 'Замовлення',
            data: monthlyOrders,
        },
    ];

    return (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="m-0 text-lg font-semibold text-gray-800">
                        Статистика замовлень
                    </h3>

                    <p className="mb-0 mt-1 text-sm text-gray-500">
                        Кількість замовлень по місяцях за{' '}
                        {currentYear} рік
                    </p>
                </div>

                <div className="flex gap-6">
                    <div className="sm:text-right">
                        <p className="m-0 text-xs text-gray-500">
                            Всього
                        </p>

                        <p className="mb-0 mt-1 text-lg font-bold text-gray-800">
                            {totalOrders}
                        </p>
                    </div>

                    <div className="sm:text-right">
                        <p className="m-0 text-xs text-gray-500">
                            Завершено
                        </p>

                        <p className="mb-0 mt-1 text-lg font-bold text-green-600">
                            {completedOrders}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[700px] xl:min-w-full">
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="area"
                        height={310}
                    />
                </div>
            </div>
        </div>
    );
}