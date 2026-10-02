import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import { CatalogFilters } from '../components/CatalogFilters';
import { GridSkeleton } from '../components/GridSkeleton';
import { Guarantees } from '../components/Guarantees';
import { Pagination } from '../components/Pagination';
import { ProductGrid } from '../components/ProductGrid';
import { SelectField } from '../components/SelectField';
import { useProductActions } from '../hooks/useProductActions';
import { useGetCategoriesQuery, useGetFacetsQuery, useGetProductsQuery } from '../store/api/catalogApi';
import type { ProductSort } from '../store/api/catalogApi';
import { pluralizeGoods } from '../utils/plural';

const PAGE_SIZE = 12;

const SORTS: { value: ProductSort | ''; label: string }[] = [
    { value: '', label: 'За популярністю' },
    { value: 'price_asc', label: 'Дешевші спочатку' },
    { value: 'price_desc', label: 'Дорожчі спочатку' },
    { value: 'rating', label: 'За рейтингом' },
    { value: 'newest', label: 'Нові надходження' },
];

function parseList(value: string | null) {
    return value ? value.split(',').filter(Boolean) : [];
}

function parseNumber(value: string | null) {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function CatalogPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const resultsRef = useRef<HTMLDivElement | null>(null);

    const category = searchParams.get('category') ?? '';
    const search = searchParams.get('search') ?? '';
    const sort = (searchParams.get('sort') as ProductSort) || undefined;
    const page = Math.max(1, parseNumber(searchParams.get('page')) ?? 1);
    const brands = useMemo(() => parseList(searchParams.get('brands')), [searchParams]);
    const conditions = useMemo(() => parseList(searchParams.get('condition')), [searchParams]);
    const deliveries = useMemo(() => parseList(searchParams.get('delivery')), [searchParams]);
    const minPrice = parseNumber(searchParams.get('minPrice'));
    const maxPrice = parseNumber(searchParams.get('maxPrice'));

    const filterArgs = {
        search,
        category,
        brands: brands.join(',') || undefined,
        condition: conditions.join(',') || undefined,
        delivery: deliveries.join(',') || undefined,
        minPrice,
        maxPrice,
    };

    const { data: categories = [] } = useGetCategoriesQuery();
    const { data, isFetching, isError } = useGetProductsQuery({ ...filterArgs, sort, page, pageSize: PAGE_SIZE });
    const { data: facets } = useGetFacetsQuery(filterArgs);
    const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();

    const hasActiveFilters =
        brands.length > 0 || conditions.length > 0 || deliveries.length > 0 || minPrice !== undefined || maxPrice !== undefined;

    const activeCategory = categories.find((item) => item.slug === category);
    const title = activeCategory?.title ?? (search ? `Пошук: ${search}` : 'Каталог');
    const totalCount = data?.totalCount ?? 0;
    const totalPages = data?.totalPages ?? 0;

    useEffect(() => {
        if (data && page > 1 && page > data.totalPages) {
            const params = new URLSearchParams(searchParams);
            params.delete('page');
            setSearchParams(params, { replace: true });
        }
    }, [data, page, searchParams, setSearchParams]);

    function updateParams(next: Record<string, string | undefined>, keepPage = false) {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(next)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        if (!keepPage) params.delete('page');
        setSearchParams(params);
    }

    function changePage(nextPage: number) {
        updateParams({ page: nextPage > 1 ? String(nextPage) : undefined }, true);
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetFilters() {
        updateParams({
            brands: undefined,
            condition: undefined,
            delivery: undefined,
            minPrice: undefined,
            maxPrice: undefined,
        });
    }

    const sortLabel = SORTS.find((option) => option.value === (sort ?? ''))?.label ?? SORTS[0].label;
    const isInitialLoad = !data && !isError;
    const results = data?.items ?? [];

    return (
        <section className="catalog-page reveal in-view">
            <nav className="catalog-breadcrumbs" aria-label="Навігація">
                <a href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>Головна</a>
                <span className="catalog-breadcrumbs-sep">&gt;</span>
                <strong>{title}</strong>
            </nav>

            <div className="catalog-heading">
                <h1>
                    {title}
                    <span className="catalog-total">
                        {' '}({totalCount.toLocaleString('uk-UA')} {pluralizeGoods(totalCount)})
                    </span>
                </h1>

                <div className="catalog-heading-tools">
                    <button
                        type="button"
                        className="catalog-filters-toggle"
                        onClick={() => setFiltersOpen((value) => !value)}
                        aria-expanded={filtersOpen}
                    >
                        <SlidersHorizontal size={16} /> Фільтри
                    </button>

                    <div className="catalog-sort">
                        <SelectField
                            value={sortLabel}
                            onChange={(label) => {
                                const found = SORTS.find((option) => option.label === label);
                                updateParams({ sort: found?.value || undefined });
                            }}
                            options={SORTS.map((option) => option.label)}
                            placeholder="Сортування"
                        />
                    </div>
                </div>
            </div>

            <div className="catalog-layout">
                <div className={`catalog-filters-wrap${filtersOpen ? ' catalog-filters-wrap-open' : ''}`}>
                    <CatalogFilters
                        facets={facets}
                        category={category}
                        brands={brands}
                        conditions={conditions}
                        deliveries={deliveries}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        hasActiveFilters={hasActiveFilters}
                        onCategoryChange={(slug) => updateParams({ category: slug || undefined })}
                        onBrandsChange={(values) => updateParams({ brands: values.join(',') || undefined })}
                        onConditionsChange={(values) => updateParams({ condition: values.join(',') || undefined })}
                        onDeliveriesChange={(values) => updateParams({ delivery: values.join(',') || undefined })}
                        onPriceChange={(min, max) =>
                            updateParams({ minPrice: min !== undefined ? String(min) : undefined, maxPrice: max !== undefined ? String(max) : undefined })
                        }
                        onReset={resetFilters}
                    />
                </div>

                <div className="catalog-results" ref={resultsRef}>
                    {isInitialLoad ? (
                        <GridSkeleton count={6} variant="catalog" />
                    ) : results.length > 0 ? (
                        <div
                            className={`catalog-results-grid${isFetching ? ' catalog-results-grid-loading' : ''}`}
                            key={`${page}-${category}-${sort ?? ''}-${search}`}
                        >
                            <ProductGrid
                                variant="catalog"
                                products={results}
                                favoriteProductIds={favoriteProductIds}
                                onOpen={(product) => navigate(`/product/${product.id}`)}
                                onAddToCart={addToCart}
                                onToggleFavorite={toggleFavorite}
                            />
                        </div>
                    ) : (
                        <div className="catalog-empty">
                            <span className="catalog-empty-icon"><SearchX size={34} strokeWidth={1.5} /></span>
                            <strong>Нічого не знайдено</strong>
                            <p>Спробуйте змінити запит або скинути фільтри.</p>
                            {hasActiveFilters && (
                                <button type="button" className="primary" onClick={resetFilters}>Скинути фільтри</button>
                            )}
                        </div>
                    )}

                    <Pagination page={page} totalPages={totalPages} onChange={changePage} />
                </div>
            </div>

            <Guarantees />
        </section>
    );
}