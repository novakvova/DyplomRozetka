import { useState } from 'react';
import { Check } from 'lucide-react';
import type { CatalogFacets, FacetOption } from '../types';
import { PriceRange } from './PriceRange';

const COLLAPSED_BRANDS = 6;

type CatalogFiltersProps = {
    facets: CatalogFacets | undefined;
    category: string;
    brands: string[];
    conditions: string[];
    deliveries: string[];
    minPrice: number | undefined;
    maxPrice: number | undefined;
    hasActiveFilters: boolean;
    onCategoryChange: (slug: string) => void;
    onBrandsChange: (values: string[]) => void;
    onConditionsChange: (values: string[]) => void;
    onDeliveriesChange: (values: string[]) => void;
    onPriceChange: (min: number | undefined, max: number | undefined) => void;
    onReset: () => void;
};

function toggle(values: string[], value: string) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

type CheckListProps = {
    options: FacetOption[];
    selected: string[];
    onChange: (values: string[]) => void;
};

function CheckList({ options, selected, onChange }: CheckListProps) {
    return (
        <ul className="filter-list">
            {options.map((option) => {
                const checked = selected.includes(option.value);
                const unavailable = option.count === 0 && !checked;

                return (
                    <li key={option.value}>
                        <label className={`filter-check${unavailable ? ' filter-check-muted' : ''}`}>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onChange(toggle(selected, option.value))}
                            />
                            <span className="filter-check-box">
                                <Check size={11} strokeWidth={3.4} />
                            </span>
                            <span className="filter-check-label">{option.label}</span>
                            <span className="filter-count">{option.count.toLocaleString('uk-UA')}</span>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
}

export function CatalogFilters({
                                   facets,
                                   category,
                                   brands,
                                   conditions,
                                   deliveries,
                                   minPrice,
                                   maxPrice,
                                   hasActiveFilters,
                                   onCategoryChange,
                                   onBrandsChange,
                                   onConditionsChange,
                                   onDeliveriesChange,
                                   onPriceChange,
                                   onReset,
                               }: CatalogFiltersProps) {
    const [showAllBrands, setShowAllBrands] = useState(false);

    const brandOptions = facets?.brands ?? [];
    const selectedMissing = brands
        .filter((value) => !brandOptions.some((option) => option.value === value))
        .map((value) => ({ value, label: value, count: 0 }));
    const allBrands = [...brandOptions, ...selectedMissing];
    const visibleBrands = showAllBrands ? allBrands : allBrands.slice(0, COLLAPSED_BRANDS);
    const hiddenCount = allBrands.length - COLLAPSED_BRANDS;

    return (
        <aside className="catalog-filters" aria-label="Фільтри каталогу">
            <section className="filter-card" style={{ animationDelay: '0ms' }}>
                <h3>Категорії</h3>
                <ul className="filter-list">
                    <li>
                        <button
                            type="button"
                            className={`filter-category${category === '' ? ' filter-category-active' : ''}`}
                            onClick={() => onCategoryChange('')}
                        >
                            <span>Усі товари</span>
                            <span className="filter-count">
                                {(facets?.categories ?? []).reduce((sum, item) => sum + item.count, 0).toLocaleString('uk-UA')}
                            </span>
                        </button>
                    </li>
                    {(facets?.categories ?? []).map((item) => (
                        <li key={item.slug}>
                            <button
                                type="button"
                                className={`filter-category${category === item.slug ? ' filter-category-active' : ''}`}
                                onClick={() => onCategoryChange(item.slug)}
                            >
                                <span>{item.title}</span>
                                <span className="filter-count">{item.count.toLocaleString('uk-UA')}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="filter-card" style={{ animationDelay: '60ms' }}>
                <h3>Ціна</h3>
                <PriceRange
                    min={facets?.minPrice ?? 0}
                    max={facets?.maxPrice ?? 0}
                    valueMin={minPrice}
                    valueMax={maxPrice}
                    onCommit={onPriceChange}
                />
            </section>

            <section className="filter-card" style={{ animationDelay: '120ms' }}>
                <h3>Виробник</h3>
                <CheckList options={visibleBrands} selected={brands} onChange={onBrandsChange} />
                {hiddenCount > 0 && (
                    <button type="button" className="filter-more" onClick={() => setShowAllBrands((value) => !value)}>
                        {showAllBrands ? 'Згорнути' : `Інші (${hiddenCount})`}
                    </button>
                )}
            </section>

            <section className="filter-card" style={{ animationDelay: '180ms' }}>
                <h3>Стан товару</h3>
                <CheckList options={facets?.conditions ?? []} selected={conditions} onChange={onConditionsChange} />
            </section>

            <section className="filter-card" style={{ animationDelay: '240ms' }}>
                <h3>Доставка</h3>
                <CheckList options={facets?.deliveries ?? []} selected={deliveries} onChange={onDeliveriesChange} />
            </section>

            <button type="button" className="filter-reset" onClick={onReset} disabled={!hasActiveFilters}>
                Скинути фільтри
            </button>
        </aside>
    );
}