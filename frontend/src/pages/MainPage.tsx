import { Hero } from '../components/Hero';
import { ProductSection } from '../components/ProductSection';
import { PromoBanner } from '../components/PromoBanner';

export function MainPage() {
    return (
        <div className="main-page">
            <Hero />
            <ProductSection title="Рекомендації для вас" subtitle="Дібрано на основі популярних товарів" />
            <ProductSection title="Найвищий рейтинг" subtitle="Товари з найкращими відгуками покупців" sort="rating" />
            <PromoBanner />
            <ProductSection title="Нові надходження" subtitle="Щойно з'явилось у каталозі" sort="newest" />
        </div>
    );
}