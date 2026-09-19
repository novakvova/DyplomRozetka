import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Headphones, Lock, MapPin, Package, Truck, User, Wallet } from 'lucide-react';
import { extractErrorMessage, formatPrice, resolveAssetUrl } from '../store/api/client';
import { novaPoshta } from '../data/nova-poshta';
import { useCheckoutMutation } from '../store/api/ordersApi';
import { useGetCartQuery } from '../store/api/cartApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';
import type { Order } from '../types';

const emptyCart = { items: [], total: 0 };

const DELIVERY_OPTIONS = [
    { id: 'nova-poshta', icon: MapPin, title: 'Нова Пошта', note: 'Доставка у відділення', price: 'від 70 ₴' },
    { id: 'courier', icon: Truck, title: "Кур'єр Нова Пошта", note: 'Доставка кур\u2019єром за адресою', price: 'від 140 ₴' },
    { id: 'pickup', icon: Package, title: 'Самовивіз з магазину Lumio', note: 'Безкоштовно', price: 'Безкоштовно' },
];

const PAYMENT_OPTIONS = [
    { id: 'card', icon: CreditCard, title: 'Оплата онлайн карткою', note: 'Visa, Mastercard' },
    { id: 'cash', icon: Wallet, title: 'Оплата при отриманні', note: 'Готівкою або карткою у відділенні Нової Пошти' },
    { id: 'installments', icon: Headphones, title: 'Оплата частинами', note: 'Без переплат до 6 місяців' },
];

type Step = 'form' | 'confirm' | 'success';

export function CheckoutPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { data: cart = emptyCart } = useGetCartQuery(undefined, { skip: !user });
    const [checkout, { isLoading }] = useCheckoutMutation();

    const [step, setStep] = useState<Step>('form');
    const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

    const [fullName, setFullName] = useState(user?.fullName ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [deliveryId, setDeliveryId] = useState(DELIVERY_OPTIONS[0].id);
    const [paymentId, setPaymentId] = useState(PAYMENT_OPTIONS[0].id);
    const [city, setCity] = useState(novaPoshta[0].city);
    const [deliveryPoint, setDeliveryPoint] = useState(novaPoshta[0].points[0]);
    const [comment, setComment] = useState('');

    const selectedCity = novaPoshta.find((item) => item.city === city) ?? novaPoshta[0];
    const delivery = DELIVERY_OPTIONS.find((item) => item.id === deliveryId) ?? DELIVERY_OPTIONS[0];
    const payment = PAYMENT_OPTIONS.find((item) => item.id === paymentId) ?? PAYMENT_OPTIONS[0];

    const itemsCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    if (!user) {
        return (
            <section className="checkout-page checkout-guard">
                <h1>Увійдіть, щоб оформити замовлення</h1>
                <button type="button" className="primary" onClick={() => navigate('/profile')}>Увійти в акаунт</button>
            </section>
        );
    }

    if (cart.items.length === 0 && step !== 'success') {
        return (
            <section className="checkout-page checkout-guard">
                <h1>Кошик порожній</h1>
                <p>Додайте товари, щоб оформити замовлення.</p>
                <button type="button" className="primary" onClick={() => navigate('/catalog')}>Перейти до каталогу</button>
            </section>
        );
    }

    function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStep('confirm');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleConfirm() {
        try {
            const order = await checkout({
                recipientFullName: fullName,
                recipientPhone: phone,
                city: deliveryId === 'pickup' ? 'Самовивіз' : city,
                deliveryPoint: deliveryId === 'pickup' ? 'Магазин Lumio' : deliveryPoint,
                paymentMethod: payment.title,
                comment,
            }).unwrap();
            setPlacedOrder(order);
            setStep('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оформити замовлення.')));
        }
    }

    const summaryItems = placedOrder
        ? placedOrder.items.map((item) => ({
            id: item.id,
            title: item.productTitle,
            quantity: item.quantity,
            sum: item.unitPrice * item.quantity,
            imageUrl: '',
        }))
        : cart.items.map((item) => ({
            id: item.id,
            title: item.product.title,
            quantity: item.quantity,
            sum: item.product.price * item.quantity,
            imageUrl: item.product.imageUrl,
        }));

    const summaryTotal = placedOrder ? placedOrder.total : cart.total;

    function OrderSummary() {
        return (
            <aside className="checkout-summary">
                <h2>Ваше замовлення ({placedOrder ? placedOrder.items.length : cart.items.length})</h2>

                <div className="checkout-summary-items">
                    {summaryItems.map((item) => (
                        <div className="checkout-summary-item" key={item.id}>
                            <span className="checkout-summary-media">
                                {item.imageUrl ? <img src={resolveAssetUrl(item.imageUrl)} alt={item.title} /> : <Package size={22} />}
                            </span>
                            <div className="checkout-summary-info">
                                <strong>{item.title}</strong>
                                <span>Кількість: {item.quantity}</span>
                            </div>
                            <span className="checkout-summary-price">{formatPrice(item.sum)}</span>
                        </div>
                    ))}
                </div>

                <div className="checkout-summary-rows">
                    <div className="checkout-summary-row">
                        <span>Товари ({itemsCount || summaryItems.length})</span>
                        <span>{formatPrice(summaryTotal)}</span>
                    </div>
                    <div className="checkout-summary-row">
                        <span>Доставка</span>
                        <span>{delivery.price}</span>
                    </div>
                </div>

                <div className="checkout-summary-total">
                    <span>До сплати</span>
                    <strong>{formatPrice(summaryTotal)}</strong>
                </div>

                {step === 'confirm' && (
                    <>
                        <button type="button" className="primary checkout-submit" onClick={handleConfirm} disabled={isLoading}>
                            {isLoading ? 'Оформлюємо...' : 'Підтвердити замовлення'}
                        </button>
                        <p className="checkout-terms">Оформлюючи замовлення, ви погоджуєтесь з умовами користування</p>
                    </>
                )}
            </aside>
        );
    }

    if (step === 'success' && placedOrder) {
        return (
            <section className="checkout-page checkout-success">
                <div className="checkout-success-badge">
                    <Check size={34} strokeWidth={3} />
                </div>
                <h1>Дякуємо за ваше замовлення!</h1>
                <p className="checkout-success-note">Ваше замовлення успішно оформлено</p>
                <div className="checkout-order-number">Номер замовлення {placedOrder.number}</div>
                <p className="checkout-success-date">
                    Дата оформлення: {new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(placedOrder.createdAt))}
                </p>

                <div className="checkout-success-cards">
                    <div className="checkout-success-card">
                        <h3><MapPin size={17} /> Доставка</h3>
                        <strong>{placedOrder.city}</strong>
                        <span>{placedOrder.deliveryPoint}</span>
                    </div>
                    <div className="checkout-success-card">
                        <h3><CreditCard size={17} /> Оплата</h3>
                        <strong>{placedOrder.paymentMethod}</strong>
                        <span>Статус: {placedOrder.status}</span>
                    </div>
                    <div className="checkout-success-card">
                        <h3><Truck size={17} /> Очікувана доставка</h3>
                        <strong>2–5 робочих днів</strong>
                        <span>Ми надішлемо номер накладної</span>
                    </div>
                </div>

                <div className="checkout-success-items">
                    <h2>Ваше замовлення ({placedOrder.items.length})</h2>
                    {placedOrder.items.map((item) => (
                        <div className="checkout-summary-item" key={item.id}>
                            <span className="checkout-summary-media"><Package size={22} /></span>
                            <div className="checkout-summary-info">
                                <strong>{item.productTitle}</strong>
                                <span>Кількість: {item.quantity}</span>
                            </div>
                            <span className="checkout-summary-price">{formatPrice(item.unitPrice * item.quantity)}</span>
                        </div>
                    ))}
                    <div className="checkout-summary-total">
                        <span>До сплати</span>
                        <strong>{formatPrice(placedOrder.total)}</strong>
                    </div>
                </div>

                <div className="checkout-success-actions">
                    <button type="button" className="primary" onClick={() => navigate('/orders')}>Мої замовлення</button>
                    <button type="button" onClick={() => navigate('/catalog')}>Продовжити покупки</button>
                </div>
            </section>
        );
    }

    if (step === 'confirm') {
        return (
            <section className="checkout-page">
                <h1 className="checkout-title">Підтвердити замовлення</h1>

                <div className="checkout-layout">
                    <div className="checkout-main">
                        <div className="checkout-block">
                            <span className="checkout-block-title">1. Контактні дані</span>
                            <div className="checkout-review-card">
                                <span className="checkout-review-icon"><User size={19} /></span>
                                <div>
                                    <strong>{fullName}</strong>
                                    <span>{phone}</span>
                                    {email && <span>{email}</span>}
                                </div>
                                <button type="button" onClick={() => setStep('form')}>Редагувати</button>
                            </div>
                        </div>

                        <div className="checkout-block">
                            <span className="checkout-block-title">2. Доставка</span>
                            <div className="checkout-review-card">
                                <span className="checkout-review-icon"><MapPin size={19} /></span>
                                <div>
                                    <strong>{delivery.title}</strong>
                                    {deliveryId !== 'pickup' && <span>{city}</span>}
                                    <span>{deliveryId === 'pickup' ? 'Магазин Lumio' : deliveryPoint}</span>
                                </div>
                                <button type="button" onClick={() => setStep('form')}>Редагувати</button>
                            </div>
                        </div>

                        <div className="checkout-block">
                            <span className="checkout-block-title">3. Оплата</span>
                            <div className="checkout-review-card">
                                <span className="checkout-review-icon"><CreditCard size={19} /></span>
                                <div>
                                    <strong>{payment.title}</strong>
                                    <span>{payment.note}</span>
                                </div>
                                <button type="button" onClick={() => setStep('form')}>Редагувати</button>
                            </div>
                        </div>

                        <div className="checkout-secure-note">
                            <Lock size={17} />
                            <div>
                                <strong>Безпечно та надійно</strong>
                                <span>Ваші дані захищені та не будуть передані третім особам</span>
                            </div>
                        </div>
                    </div>

                    <OrderSummary />
                </div>
            </section>
        );
    }

    return (
        <section className="checkout-page">
            <h1 className="checkout-title">Оформити замовлення</h1>

            <div className="checkout-layout">
                <form className="checkout-main" onSubmit={handleSubmitForm}>
                    <div className="checkout-block">
                        <span className="checkout-block-title">1. Контактні дані</span>
                        <div className="checkout-fields">
                            <label className="checkout-field">
                                ПІБ
                                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Введіть ваше ПІБ" required />
                            </label>
                            <label className="checkout-field">
                                Телефон
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380 XX XXX XX XX" required />
                            </label>
                            <label className="checkout-field checkout-field-wide">
                                E-mail (необов'язково)
                                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="example@mail.com" />
                            </label>
                        </div>
                    </div>

                    <div className="checkout-block">
                        <span className="checkout-block-title">2. Доставка</span>
                        <div className="checkout-options">
                            {DELIVERY_OPTIONS.map(({ id, icon: Icon, title, note, price }) => (
                                <label className={`checkout-option${deliveryId === id ? ' checkout-option-active' : ''}`} key={id}>
                                    <input
                                        type="radio"
                                        name="delivery"
                                        checked={deliveryId === id}
                                        onChange={() => setDeliveryId(id)}
                                    />
                                    <span className="checkout-option-icon"><Icon size={18} /></span>
                                    <div className="checkout-option-text">
                                        <strong>{title}</strong>
                                        <span>{note}</span>
                                    </div>
                                    <span className="checkout-option-price">{price}</span>
                                </label>
                            ))}
                        </div>

                        {deliveryId !== 'pickup' && (
                            <div className="checkout-fields checkout-fields-delivery">
                                <label className="checkout-field">
                                    Місто
                                    <select
                                        value={city}
                                        onChange={(e) => {
                                            setCity(e.target.value);
                                            const next = novaPoshta.find((item) => item.city === e.target.value);
                                            setDeliveryPoint(next?.points[0] ?? '');
                                        }}
                                    >
                                        {novaPoshta.map((item) => <option key={item.city} value={item.city}>{item.city}</option>)}
                                    </select>
                                </label>
                                <label className="checkout-field">
                                    Відділення
                                    <select value={deliveryPoint} onChange={(e) => setDeliveryPoint(e.target.value)}>
                                        {selectedCity.points.map((point) => <option key={point} value={point}>{point}</option>)}
                                    </select>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="checkout-block">
                        <span className="checkout-block-title">3. Оплата</span>
                        <div className="checkout-options">
                            {PAYMENT_OPTIONS.map(({ id, icon: Icon, title, note }) => (
                                <label className={`checkout-option${paymentId === id ? ' checkout-option-active' : ''}`} key={id}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentId === id}
                                        onChange={() => setPaymentId(id)}
                                    />
                                    <span className="checkout-option-icon"><Icon size={18} /></span>
                                    <div className="checkout-option-text">
                                        <strong>{title}</strong>
                                        <span>{note}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="checkout-block">
                        <span className="checkout-block-title">4. Коментар до замовлення</span>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Побажання до замовлення (необов'язково)"
                        />
                    </div>

                    <button type="submit" className="primary checkout-submit checkout-submit-inline">
                        Підтвердити замовлення
                    </button>
                </form>

                <OrderSummary />
            </div>
        </section>
    );
}