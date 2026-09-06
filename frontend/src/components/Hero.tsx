import { ArrowRight, Headphones, Percent, Shirt, Smartphone, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
    const navigate = useNavigate();

    return (
        <section className="hero reveal in-view">
            <div className="hero-copy">
                <span className="hero-eyebrow"><Sparkles size={12} /> Зараз у тренді</span>
                <h1>Відкрийте для себе товари, які вам сподобаються</h1>
                <p>Поповніть свій кошик найактуальнішими новинками сезону та отримайте персональні знижки вже сьогодні.</p>
                <div className="hero-actions">
                    <button type="button" className="primary hero-cta" onClick={() => navigate('/catalog')}>
                        Купити зараз <ArrowRight size={18} />
                    </button>
                    <button type="button" className="hero-cta-outline" onClick={() => navigate('/catalog')}>
                        Переглянути
                    </button>
                </div>
            </div>

            <div className="hero-art" aria-hidden="true">
                <div className="hero-chair" />
                <svg className="hero-illustration" viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="120" cy="266" rx="70" ry="10" fill="#000" opacity="0.06" />
                    <path d="M46 280 C46 196 78 150 120 150 C162 150 194 196 194 280 Z" fill="#f4a300" />
                    <path d="M46 280 C46 220 60 178 90 160 L90 280 Z" fill="#e59400" />
                    <circle cx="120" cy="96" r="54" fill="#ffd9b8" />
                    <path d="M66 92 C66 48 96 24 120 24 C150 24 176 46 176 84 C176 60 158 40 130 38 C104 36 84 50 78 78 C76 86 70 90 66 92 Z" fill="#2c2320" />
                    <rect x="76" y="94" width="88" height="26" rx="13" fill="#1c1c1c" />
                    <rect x="76" y="94" width="40" height="26" rx="13" fill="#2c2c2c" />
                    <rect x="124" y="94" width="40" height="26" rx="13" fill="#2c2c2c" />
                    <rect x="112" y="102" width="16" height="6" rx="3" fill="#1c1c1c" />
                </svg>

                <div className="hero-card hero-card-1">
                    <Smartphone size={18} />
                    <div>
                        <strong>Флагманські смартфони</strong>
                        <span>вже в наявності</span>
                    </div>
                </div>
                <div className="hero-card hero-card-2">
                    <Headphones size={18} />
                    <div>
                        <strong>Аудіо-новинки</strong>
                        <span>для чистого звуку</span>
                    </div>
                </div>
                <div className="hero-card hero-card-3">
                    <Shirt size={18} />
                    <div>
                        <strong>Стиль сезону</strong>
                        <span>підбір під настрій</span>
                    </div>
                </div>
                <div className="hero-badge">
                    <Percent size={16} />
                    <span>До -70%</span>
                </div>
            </div>
        </section>
    );
}