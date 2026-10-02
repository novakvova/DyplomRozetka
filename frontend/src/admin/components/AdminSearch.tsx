import {
    FolderTree,
    PackageCheck,
    ShoppingBag,
    Users,
} from 'lucide-react';

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    useGetAdminOrdersQuery,
    useGetUsersQuery,
} from '../../store/api/adminApi';

import {
    useGetCategoriesQuery,
    useGetProductsQuery,
} from '../../store/api/catalogApi';

type SearchResult = {
    id: string;
    title: string;
    subtitle: string;
    path: string;
    type:
        | 'product'
        | 'category'
        | 'order'
        | 'user';
};

export function AdminSearch() {
    const navigate = useNavigate();

    const inputRef =
        useRef<HTMLInputElement>(null);

    const containerRef =
        useRef<HTMLDivElement>(null);

    const [query, setQuery] =
        useState('');

    const [isOpen, setIsOpen] =
        useState(false);

    const {
        data: productsPage,
    } = useGetProductsQuery({
        pageSize: 100,
    });

    const {
        data: categories = [],
    } = useGetCategoriesQuery();

    const {
        data: orders = [],
    } = useGetAdminOrdersQuery();

    const {
        data: users = [],
    } = useGetUsersQuery();

    const products =
        productsPage?.items ?? [];

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() ===
                    'k'
            ) {
                event.preventDefault();

                inputRef.current?.focus();
                setIsOpen(true);
            }

            if (event.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        }

        document.addEventListener(
            'keydown',
            handleKeyDown,
        );

        return () => {
            document.removeEventListener(
                'keydown',
                handleKeyDown,
            );
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(
            event: MouseEvent,
        ) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node,
                )
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener(
            'mousedown',
            handleClickOutside,
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside,
            );
        };
    }, []);

    const results =
        useMemo<SearchResult[]>(() => {
            const search =
                query.trim().toLowerCase();

            if (search.length < 2) {
                return [];
            }

            const productResults =
                products
                    .filter((product) => {
                        return [
                            product.title,
                            product.subtitle,
                            product.brand,
                            product.sku,
                        ].some((value) =>
                            value
                                ?.toLowerCase()
                                .includes(search),
                        );
                    })
                    .slice(0, 5)
                    .map((product) => ({
                        id: product.id,
                        title: product.title,
                        subtitle:
                            product.brand ||
                            product.sku,
                        path: '/admin/products',
                        type: 'product' as const,
                    }));

            const categoryResults =
                categories
                    .filter((category) =>
                        [
                            category.title,
                            category.slug,
                        ].some((value) =>
                            value
                                ?.toLowerCase()
                                .includes(search),
                        ),
                    )
                    .slice(0, 5)
                    .map((category) => ({
                        id: category.id,
                        title: category.title,
                        subtitle: 'Категорія',
                        path: '/admin/categories',
                        type: 'category' as const,
                    }));

            const orderResults =
                orders
                    .filter((order) =>
                        [
                            order.number,
                            order.recipientFullName,
                            order.recipientPhone,
                            order.city,
                        ].some((value) =>
                            value
                                ?.toLowerCase()
                                .includes(search),
                        ),
                    )
                    .slice(0, 5)
                    .map((order) => ({
                        id: order.id,
                        title: order.number,
                        subtitle:
                            order.recipientFullName,
                        path: '/admin/orders',
                        type: 'order' as const,
                    }));

            const userResults =
                users
                    .filter((user) =>
                        [
                            user.fullName,
                            user.email,
                            user.phone,
                            user.city,
                        ].some((value) =>
                            value
                                ?.toLowerCase()
                                .includes(search),
                        ),
                    )
                    .slice(0, 5)
                    .map((user) => ({
                        id: user.id,
                        title: user.fullName,
                        subtitle: user.email,
                        path: '/admin/users',
                        type: 'user' as const,
                    }));

            return [
                ...productResults,
                ...categoryResults,
                ...orderResults,
                ...userResults,
            ].slice(0, 8);
        }, [
            query,
            products,
            categories,
            orders,
            users,
        ]);

    function handleResultClick(
        result: SearchResult,
    ) {
        setQuery('');
        setIsOpen(false);

        navigate(result.path);
    }

    return (
        <div
            ref={containerRef}
            className="relative hidden w-full max-w-[420px] md:block"
        >
            <div className="relative">

                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    placeholder="Пошук..."
                    onFocus={() =>
                        setIsOpen(true)
                    }
                    onChange={(event) => {
                        setQuery(
                            event.target.value,
                        );
                        setIsOpen(true);
                    }}
                    className="
                        h-11 w-full
                        rounded-lg
                        border border-gray-200
                        bg-gray-50
                        py-2.5
                        pl-11 pr-16
                        text-sm
                        text-gray-700
                        outline-none
                        transition
                        placeholder:text-gray-400
                        focus:border-orange-300
                        focus:bg-white
                        focus:ring-2
                        focus:ring-orange-100
                    "
                />

                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-400">
                        Ctrl K
                    </span>
                </div>
            </div>

            {isOpen &&
                query.trim().length >= 2 && (
                    <div className="absolute left-0 top-[52px] z-50 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        {results.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Нічого не знайдено
                            </div>
                        ) : (
                            <div className="max-h-[360px] overflow-y-auto p-2">
                                {results.map(
                                    (result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            type="button"
                                            onClick={() =>
                                                handleResultClick(
                                                    result,
                                                )
                                            }
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-gray-50"
                                        >
                                            <ResultIcon
                                                type={
                                                    result.type
                                                }
                                            />

                                            <div className="min-w-0">
                                                <p className="m-0 truncate text-sm font-medium text-gray-800">
                                                    {
                                                        result.title
                                                    }
                                                </p>

                                                <p className="mb-0 mt-0.5 truncate text-xs text-gray-500">
                                                    {
                                                        result.subtitle
                                                    }
                                                </p>
                                            </div>
                                        </button>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                )}
        </div>
    );
}

function ResultIcon({
    type,
}: {
    type: SearchResult['type'];
}) {
    const className =
        'h-5 w-5';

    const wrapperClass =
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600';

    switch (type) {
        case 'product':
            return (
                <div className={wrapperClass}>
                    <ShoppingBag
                        className={className}
                    />
                </div>
            );

        case 'category':
            return (
                <div className={wrapperClass}>
                    <FolderTree
                        className={className}
                    />
                </div>
            );

        case 'order':
            return (
                <div className={wrapperClass}>
                    <PackageCheck
                        className={className}
                    />
                </div>
            );

        case 'user':
            return (
                <div className={wrapperClass}>
                    <Users
                        className={className}
                    />
                </div>
            );
    }
}