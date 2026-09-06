import { Camera, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';

export function PromoBanner() {
    const navigate = useNavigate();
    const reveal = useReveal<HTMLElement>();

    return (
        <section className="promo-banner reveal" ref={reveal}>
            <div className="promo-banner-glow" aria-hidden="true" />
            <div className="promo-banner-content">
                <span className="promo-flag"><Flame size={14} /> Супер розпродаж</span>
                <h2>Чорна п&rsquo;ятниця</h2>
                <p>Знижки до 70% на електроніку, аксесуари та техніку для дому. Пропозиція обмежена в часі.</p>
                <button type="button" className="promo-cta" onClick={() => navigate('/catalog')}>
                    Перейти до знижок
                </button>
            </div>
            <div className="promo-banner-art" aria-hidden="true">
                <Camera size={96} strokeWidth={1.1} />
            </div>
        </section>
    );
}