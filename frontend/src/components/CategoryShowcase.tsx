import { useNavigate } from 'react-router-dom';
import { resolveAssetUrl} from "../store/api/client";
import { getCategoryIcon } from '../data/categoryIcons';
import { useReveal } from '../hooks/useReveal';
import { useGetCategoriesQuery } from '../store/api/catalogApi';

export function CategoryShowcase() {
    const navigate = useNavigate();
    const reveal = useReveal<HTMLElement>();
    const { data: categories = [], isLoading } = useGetCategoriesQuery();

    if (!isLoading && categories.length === 0) return null;

    return (
        <section className="category-showcase reveal" ref={reveal}>
            <div className="product-section-head">
                <div>
                    <h2>Популярні категорії</h2>
                    <p className="section-subtitle">Перейдіть одразу до того, що шукаєте</p>
                </div>
            </div>

            <div className="category-tiles">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => <div className="category-tile skeleton" key={index} />)
                    : categories.map((category, index) => {
                        const Icon = getCategoryIcon(category.slug);
                        return (
                            <button
                                type="button"
                                key={category.id}
                                className="category-tile"
                                style={{ animationDelay: `${index * 60}ms` }}
                                onClick={() => navigate(`/catalog?category=${category.slug}`)}
                            >
                                <span className="category-tile-icon">
                                    {category.imageUrl
                                        ? <img src={resolveAssetUrl(category.imageUrl)} alt={category.title} />
                                        : <Icon size={26} strokeWidth={1.8} />}
                                </span>
                                <strong>{category.title}</strong>
                                <span className="category-tile-desc">{category.description}</span>
                            </button>
                        );
                    })}
            </div>
        </section>
    );
}