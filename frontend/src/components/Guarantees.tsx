import { Headphones, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';

const GUARANTEES = [
    { icon: Truck, title: 'Безкоштовна доставка', note: 'при замовленні від 1 000 грн' },
    { icon: RefreshCcw, title: 'Повернення товару', note: 'протягом 14 днів' },
    { icon: ShieldCheck, title: 'Гарантія якості', note: 'тільки оригінальні товари' },
    { icon: Headphones, title: 'Підтримка 24/7', note: 'ми завжди на зв\u2019язку' },
];

export function Guarantees() {
    return (
        <div className="cart-guarantees">
            {GUARANTEES.map(({ icon: Icon, title, note }, index) => (
                <div className="cart-guarantee" key={title} style={{ animationDelay: `${index * 70}ms` }}>
                    <Icon size={20} strokeWidth={1.8} />
                    <div>
                        <strong>{title}</strong>
                        <span>{note}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}