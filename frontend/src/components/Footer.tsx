import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

function InstagramGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
    );
}

function FacebookGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
            <path
                d="M13.6 9.2h1.6V6.9h-1.8c-1.9 0-2.9 1.1-2.9 2.9v1.3H9v2.3h1.5V18h2.4v-4.6h1.7l.3-2.3h-2v-.9c0-.6.2-1 .7-1z"
                fill="currentColor"
            />
        </svg>
    );
}

function PinterestGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
            <path
                d="M11.2 18.3c-.2-1 0-1.9.3-2.9l1-4.1s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.4 0 .8-.5 2.1-.8 3.2-.2 1 .5 1.7 1.4 1.7 1.7 0 2.9-2.2 2.9-4.7 0-2-1.3-3.4-3.7-3.4-2.7 0-4.4 2-4.4 4.3 0 .8.2 1.4.6 1.8.2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.6.2-.9-.4-1.4-1.7-1.4-2.8 0-2.3 1.9-5 5.9-5 3.2 0 5.3 2.3 5.3 4.7 0 3.2-1.8 5.6-4.4 5.6-.9 0-1.7-.5-2-1l-.5 2.1c-.2.7-.6 1.6-.9 2.1"
                fill="currentColor"
            />
        </svg>
    );
}

function ViberGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 4c-4.4 0-7.5 2.7-7.5 7 0 2.8 1.4 5 3.7 6.2v3l3.1-2.1c.2 0 .5 0 .7 0 4.4 0 7.5-2.7 7.5-7S16.4 4 12 4z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <path
                d="M9.2 9.4c.1 2.9 2.1 5 5 5.2m-5-5.2c0-.9.1-1.6.8-1.7m4.2 6.9c.9 0 1.6-.2 1.7-.9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    );
}

function TikTokGlyph() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M14 4v9.6a2.6 2.6 0 1 1-2.1-2.55"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14 4c.3 2 1.8 3.5 3.8 3.7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function BagIllustration() {
    return (
        <svg viewBox="0 0 120 120" className="footer-card-art" aria-hidden="true">
            <rect x="26" y="42" width="68" height="58" rx="10" fill="var(--brand)" />
            <path d="M42 46V34a18 18 0 0 1 36 0v12" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
            <text x="60" y="78" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" fontFamily="Inter, sans-serif">
                Lumio
            </text>
        </svg>
    );
}

function PhoneIllustration() {
    return (
        <svg viewBox="0 0 120 120" className="footer-card-art" aria-hidden="true">
            <rect x="34" y="14" width="52" height="92" rx="12" fill="#1c1f26" />
            <rect x="40" y="24" width="40" height="62" rx="4" fill="#fff" />
            <path d="M46 34l3 3 5-6M46 44l3 3 5-6M46 54l3 3 5-6" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="58" y1="34" x2="74" y2="34" stroke="#d8dee3" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="58" y1="44" x2="74" y2="44" stroke="#d8dee3" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="58" y1="54" x2="74" y2="54" stroke="#d8dee3" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="60" cy="72" r="9" fill="var(--brand)" />
            <path d="M56 72h8M60 68v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function TruckIllustration() {
    return (
        <svg viewBox="0 0 120 120" className="footer-card-art" aria-hidden="true">
            <rect x="14" y="50" width="52" height="30" rx="4" fill="var(--brand)" />
            <path d="M66 58h18l14 14v8H66z" fill="#ffab91" />
            <circle cx="36" cy="86" r="8" fill="#1c1f26" />
            <circle cx="36" cy="86" r="3" fill="#fff" />
            <circle cx="86" cy="86" r="8" fill="#1c1f26" />
            <circle cx="86" cy="86" r="3" fill="#fff" />
            <path d="M18 40h30M18 46h20" stroke="#fdd0c4" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

function MonitorIllustration() {
    return (
        <svg viewBox="0 0 120 120" className="footer-card-art" aria-hidden="true">
            <rect x="16" y="26" width="88" height="58" rx="8" fill="#1c1f26" />
            <rect x="24" y="34" width="72" height="42" rx="4" fill="#fff" />
            <rect x="48" y="88" width="24" height="8" fill="#1c1f26" />
            <rect x="38" y="96" width="44" height="6" rx="3" fill="#1c1f26" />
            <circle cx="42" cy="55" r="8" stroke="var(--brand)" strokeWidth="3" fill="none" />
            <line x1="48" y1="61" x2="54" y2="67" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
            <path d="M66 50h20M66 58h20M66 66h14" stroke="#c7cdd3" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

type InfoCard = {
    title: string;
    text: string;
    art?: ReactNode;
    span: 'half' | 'third';
};

const INFO_CARDS: InfoCard[] = [
    {
        title: 'Lumio — це сучасний інтернет-магазин',
        text: 'Ми створили Lumio, щоб зробити онлайн-шопінг швидким, комфортним і приємним. Широкий асортимент товарів у різних категоріях дозволяє легко знаходити потрібне та здійснювати покупки всього за кілька кліків.',
        art: <BagIllustration />,
        span: 'half',
    },
    {
        title: 'Ми піклуємося про наших користувачів',
        text: 'Основною метою Lumio є забезпечення комфортного процесу вибору та придбання товарів. Платформа пропонує зручні фільтри, детальні характеристики продукції, фото та відгуки покупців, які допомагають швидко знайти потрібний товар.',
        art: <PhoneIllustration />,
        span: 'half',
    },
    {
        title: 'Наше бачення',
        text: 'Lumio поєднує інтуїтивно зрозумілий інтерфейс, високу швидкість роботи та інноваційні рішення, які допомагають покупцям швидко знаходити потрібні товари й отримувати найкращий досвід онлайн-покупок.',
        span: 'third',
    },
    {
        title: 'Безпечна оплата',
        text: 'Lumio підтримує різні способи оплати: банківські картки, онлайн-банкінг, електронні гаманці та оплату при отриманні. Усі транзакції захищені сучасними протоколами.',
        span: 'third',
    },
    {
        title: 'Акції та знижки',
        text: 'Ми регулярно проводимо акції та розпродажі, щоб ви могли купувати улюблені товари за найвигіднішими цінами. Слідкуйте за оновленнями, щоб не пропустити спеціальні пропозиції.',
        span: 'third',
    },
    {
        title: 'Швидка доставка',
        text: 'Ми співпрацюємо з надійними службами доставки, щоб ваші замовлення приїжджали швидко та вчасно. Доставка по всій країні, а також можливість відстеження посилки в реальному часі.',
        art: <TruckIllustration />,
        span: 'half',
    },
    {
        title: 'Сучасні можливості платформи',
        text: 'Lumio підтримує зручне оформлення замовлення, персональний кабінет користувача, список бажань та розширене порівняння товарів для швидкого й точного вибору.',
        art: <MonitorIllustration />,
        span: 'half',
    },
];

const LINK_COLUMNS: { title: string; links: { label: string; to?: string; href?: string }[] }[] = [
    {
        title: 'Інформація про компанію',
        links: [
            { label: 'Про нас', href: '#' },
            { label: 'Умови використання сайту', href: '#' },
            { label: 'Вакансії', href: '#' },
            { label: 'Контакти', href: '#' },
            { label: 'Всі категорії', to: '/catalog' },
        ],
    },
    {
        title: 'Допомога',
        links: [
            { label: 'Доставка та оплата', href: '#' },
            { label: 'Кредит', href: '#' },
            { label: 'Гарантія', href: '#' },
            { label: 'Повернення товару', href: '#' },
            { label: 'Сервісні центри', href: '#' },
        ],
    },
    {
        title: 'Сервіси',
        links: [
            { label: 'Мої замовлення', to: '/orders' },
            { label: 'Кошик', to: '/cart' },
            { label: 'Обране', to: '/favorites' },
            { label: 'Подарункові сертифікати', href: '#' },
            { label: 'Корпоративним клієнтам', href: '#' },
        ],
    },
    {
        title: 'Партнерам',
        links: [
            { label: 'Продавати на Lumio', href: '#' },
            { label: 'Реклама на Lumio', href: '#' },
            { label: 'Співпраця з нами', href: '#' },
            { label: 'Франчайзинг', href: '#' },
            { label: 'Оренда приміщень', href: '#' },
        ],
    },
];

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-cards">
                {INFO_CARDS.map((card) => (
                    <div className={`footer-info-card footer-info-card-${card.span}`} key={card.title}>
                        <div className="footer-info-card-text">
                            <h3>{card.title}</h3>
                            <p>{card.text}</p>
                        </div>
                        {card.art && <div className="footer-info-card-art-wrap">{card.art}</div>}
                    </div>
                ))}
            </div>

            <div className="footer-links-section">
                <div className="footer-links-inner">
                    <div className="footer-social-col">
                        <span className="footer-social-title">Ми в соціальних мережах</span>
                        <div className="footer-social">
                            <a href="#" aria-label="Instagram"><InstagramGlyph /></a>
                            <a href="#" aria-label="Facebook"><FacebookGlyph /></a>
                            <a href="#" aria-label="Pinterest"><PinterestGlyph /></a>
                            <a href="#" aria-label="Viber"><ViberGlyph /></a>
                            <a href="#" aria-label="TikTok"><TikTokGlyph /></a>
                        </div>
                    </div>

                    {LINK_COLUMNS.map((column) => (
                        <div className="footer-col" key={column.title}>
                            <h3>{column.title}</h3>
                            {column.links.map((link) =>
                                link.to ? (
                                    <NavLink to={link.to} key={link.label}>{link.label}</NavLink>
                                ) : (
                                    <a href={link.href} key={link.label}>{link.label}</a>
                                ),
                            )}
                        </div>
                    ))}
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} Інтернет-магазин «Lumio»® — ТМ використовується на підставі ліцензії правовласника LumioLTD.</span>
                    <span>Усі права захищено</span>
                </div>
            </div>
        </footer>
    );
}