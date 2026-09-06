import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProductGrid } from '../components/ProductGrid';
import { GridSkeleton } from '../components/GridSkeleton';
import { useProductActions } from '../hooks/useProductActions';
import { useGetCategoriesQuery, useGetProductsQuery } from '../store/api/catalogApi';
import type { ProductSort } from '../store/api/catalogApi';

const SORTS: { value: ProductSort | ''; label: string }[] = [
    { value: '', label: 'За популярністю' },
    { value: 'price_asc', label: 'Дешевші спочатку' },
    { value: 'price_desc', label: 'Дорожчі спочатку' },
    { value: 'rating', label: 'За рейтингом' },
    { value: 'newest', label: 'Нові надходження' },
];

export function CatalogPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const category = searchParams.get('category') ?? '';
    const appliedSearch = searchParams.get('search') ?? '';
    const sort = (searchParams.get('sort') as ProductSort) || undefined;

    const { data: categories = [] } = useGetCategoriesQuery();
    const { data, isFetching } = useGetProductsQuery({ search: appliedSearch, category, sort, pageSize: 24 });
    const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();

    function updateParams(next: Record<string, string>) {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(next)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        setSearchParams(params);
    }

    return (
        <section className="catalog-page reveal in-view">
            <div className="breadcrumbs">
                <a href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>Головна</a>
                {' / '}
                <span>Каталог{category ? ` · ${categories.find((c) => c.slug === category)?.title ?? ''}` : ''}</span>
            </div>

            <h1 className="page-title">Каталог товарів</h1>

            <div className="storefront-tools">
                <span className="results-count">{data ? `Знайдено ${data.totalCount} товарів` : 'Завантаження...'}</span>
                <select value={sort ?? ''} onChange={(event) => updateParams({ sort: event.target.value })}>
                    {SORTS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {isFetching && !data ? (
                <GridSkeleton count={8} />
            ) : (
                <ProductGrid
                    products={data?.items ?? []}
                    favoriteProductIds={favoriteProductIds}
                    onOpen={(product) => navigate(`/product/${product.id}`)}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                />
            )}

            {data && data.items.length === 0 && !isFetching && (
                <p className="empty-state">Нічого не знайдено. Спробуйте змінити запит або категорію.</p>
            )}
        </section>
    );
}