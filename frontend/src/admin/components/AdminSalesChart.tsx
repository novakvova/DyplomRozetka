import type { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';

import type { Order } from '../../types';

type AdminSalesChartProps = {
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

export function AdminSalesChart({
    orders,
}: AdminSalesChartProps) {
    const currentYear =
        new Date().getFullYear();

    const monthlySales =
        Array<number>(12).fill(0);

    orders.forEach((order) => {
        if (order.status === 'Cancelled') {
            return;
        }

        const date =
            new Date(order.createdAt);

        if (
            Number.isNaN(date.getTime()) ||
            date.getFullYear() !==
                currentYear
        ) {
            return;
        }

        monthlySales[date.getMonth()] +=
            order.total;
    });

    const totalSales =
        monthlySales.reduce(
            (sum, value) => sum + value,
            0,
        );

    const options: ApexOptions = {
        colors: ['#f97316'],

        chart: {
            type: 'bar',
            height: 300,
            toolbar: {
                show: false,
            },
            fontFamily:
                'inherit',
        },

        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                borderRadius: 5,
                borderRadiusApplication:
                    'end',
            },
        },

        dataLabels: {
            enabled: false,
        },

        stroke: {
            show: false,
        },

        xaxis: {
            categories: monthNames,

            axisBorder: {
                show: false,
            },

            axisTicks: {
                show: false,
            },
        },

        yaxis: {
            labels: {
                formatter: (
                    value: number,
                ) =>
                    `${Math.round(
                        value,
                    ).toLocaleString(
                        'uk-UA',
                    )} ₴`,
            },
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

        fill: {
            opacity: 1,
        },

        legend: {
            show: false,
        },

        tooltip: {
            y: {
                formatter: (
                    value: number,
                ) =>
                    `${value.toLocaleString(
                        'uk-UA',
                    )} ₴`,
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
            name: 'Продажі',
            data: monthlySales,
        },
    ];

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="m-0 text-lg font-semibold text-gray-800">
                        Продажі
                    </h3>

                    <p className="mb-0 mt-1 text-sm text-gray-500">
                        Продажі по місяцях за{' '}
                        {currentYear} рік
                    </p>
                </div>

                <div className="mt-2 sm:mt-0 sm:text-right">
                    <p className="m-0 text-xs text-gray-500">
                        Всього за рік
                    </p>

                    <p className="mb-0 mt-1 text-lg font-bold text-gray-800">
                        {totalSales.toLocaleString(
                            'uk-UA',
                        )}{' '}
                        ₴
                    </p>
                </div>
            </div>

            <div className="mt-4 max-w-full overflow-x-auto">
                <div className="min-w-[650px] xl:min-w-full">
                    <ReactApexChart
                        options={options}
                        series={series}
                        type="bar"
                        height={300}
                    />
                </div>
            </div>
        </div>
    );
}