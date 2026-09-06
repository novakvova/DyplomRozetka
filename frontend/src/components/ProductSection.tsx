import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { ProductGrid } from './ProductGrid';
import { GridSkeleton } from './GridSkeleton';
import { useProductActions } from '../hooks/useProductActions';
import { useReveal } from '../hooks/useReveal';
import { useGetProductsQuery } from '../store/api/catalogApi';
import type { ProductSort } from '../store/api/catalogApi';

type ProductSectionProps = {
    title: string;
    subtitle?: string;
    sort?: ProductSort;
    category?: string;
};

const PAGE_SIZE_STEP = 4;

export function ProductSection({ title, subtitle, sort, category }: ProductSectionProps) {
    const navigate = useNavigate();
    const reveal = useReveal<HTMLElement>();
    const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP);
    const { data, isFetching } = useGetProductsQuery({ sort, category, page: 1, pageSize });
    const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();

    return (
        <section className="product-section reveal" ref={reveal}>
            <div className="product-section-head">
                <div>
                    <h2>{title}</h2>
                    {subtitle && <p className="section-subtitle">{subtitle}</p>}
                </div>
                <button type="button" className="section-link" onClick={() => navigate(category ? `/catalog?category=${category}` : '/catalog')}>
                    Дивитись усі <ArrowRight size={16} />
                </button>
            </div>

            {!data && isFetching ? (
                <GridSkeleton count={pageSize} />
            ) : (
                <ProductGrid
                    products={data?.items ?? []}
                    favoriteProductIds={favoriteProductIds}
                    onOpen={(product) => navigate(`/product/${product.id}`)}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                />
            )}

            {data && pageSize < data.totalCount && (
                <div className="load-more">
                    <button type="button" disabled={isFetching} onClick={() => setPageSize((size) => size + PAGE_SIZE_STEP)}>
                        {isFetching ? <Loader2 size={16} className="spin" /> : null}
                        {isFetching ? 'Завантаження...' : 'Показати ще'}
                    </button>
                </div>
            )}
        </section>
    );
}