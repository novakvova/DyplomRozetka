import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronRight,
    Clock,
    CreditCard,
    ListChecks,
    MapPin,
    Package,
    PackageX,
    Phone,
    RefreshCcw,
    RotateCcw,
    ShoppingBag,
    Truck,
    User as UserIcon,
} from 'lucide-react';
import { extractErrorMessage, formatPrice, resolveAssetUrl } from '../store/api/client';
import { AuthModal } from '../components/AuthModal';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { useAddCartItemMutation } from '../store/api/cartApi';
import { useGetOrdersQuery } from '../store/api/ordersApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';
import type { Order } from '../types';

type TabKey = 'all' | 'pending' | 'processing' | 'shipped' | 'completed';

const TABS: { key: TabKey; label: string; status?: string }[] = [
    { key: 'all', label: 'Усі замовлення' },
    { key: 'pending', label: 'Очікує оплати', status: 'Placed' },
    { key: 'processing', label: 'В обробці', status: 'Processing' },
    { key: 'shipped', label: 'Відправлено', status: 'Shipped' },
    { key: 'completed', label: 'Завершено', status: 'Completed' },
];

const STATUS_META: Record<string, { label: string; className: string; icon: typeof Clock }> = {
    Placed: { label: 'Очікує оплати', className: 'order-badge-pending', icon: Clock },
    Processing: { label: 'В обробці', className: 'order-badge-processing', icon: RefreshCcw },
    Shipped: { label: 'Відправлено', className: 'order-badge-shipped', icon: Truck },
    Completed: { label: 'Завершено', className: 'order-badge-completed', icon: ListChecks },
    Cancelled: { label: 'Скасовано', className: 'order-badge-cancelled', icon: PackageX },
};

const PAYMENT_LABELS: Record<string, string> = {
    card: 'Карткою онлайн',
    cash: 'Готівкою при отриманні',
};

function formatOrderDate(value: string) {
    return `${new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))} р.`;
}

export function OrdersPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [searchParams, setSearchParams] = useSearchParams();
    const [authOpen, setAuthOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [reorderingId, setReorderingId] = useState<string | null>(null);
    const [addCartItem] = useAddCartItemMutation();

    const { data: orders = [], isFetching } = useGetOrdersQuery(undefined, { skip: !user });

    const rawStatus = searchParams.get('status');
    const activeTab = TABS.find((tab) => tab.key === rawStatus) ?? TABS[0];

    const filteredOrders = useMemo(
        () => (activeTab.status ? orders.filter((order) => order.status === activeTab.status) : orders),
        [orders, activeTab],
    );

    function selectTab(tab: (typeof TABS)[number]) {
        setSearchParams(tab.key === 'all' ? {} : { status: tab.key });
    }

    function toggleExpanded(orderId: string) {
        setExpandedIds((previous) => {
            const next = new Set(previous);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    }

    async function handleReorder(order: Order) {
        setReorderingId(order.id);
        try {
            for (const item of order.items) {
                await addCartItem({ productId: item.productId, quantity: item.quantity }).unwrap();
            }
            dispatch(messageSet('Товари із замовлення додано в кошик.'));
            navigate('/cart');
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося повторити замовлення.')));
        } finally {
            setReorderingId(null);
        }
    }

    if (!user) {
        return (
            <section className="profile-page profile-guest">
                <h1>Увійдіть в акаунт Lumio</h1>
                <p>Щоб переглядати історію своїх замовлень, увійдіть у свій акаунт.</p>
                <button type="button" className="primary" onClick={() => setAuthOpen(true)}>
                    Увійти або зареєструватися
                </button>
                <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
            </section>
        );
    }

    return (
        <section className="profile-page">
            <div className="profile-layout">
                <ProfileSidebar />

                <div className="profile-content">
                    <div className="account-panel">
                        <div className="account-panel-head">
                            <h1>Мої замовлення</h1>
                        </div>

                        <div className="orders-tabs" role="tablist">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab.key === tab.key}
                                    className={`orders-tab${activeTab.key === tab.key ? ' orders-tab-active' : ''}`}
                                    onClick={() => selectTab(tab)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {isFetching && orders.length === 0 && (
                            <div className="orders-loading">Завантаження замовлень…</div>
                        )}

                        {!isFetching && filteredOrders.length === 0 && (
                            <div className="orders-empty">
                    <span className="orders-empty-icon">
                      <ShoppingBag size={36} strokeWidth={1.4} />
                    </span>
                                <strong>
                                    {activeTab.key === 'all'
                                        ? 'У вас ще немає замовлень'
                                        : `Немає замовлень зі статусом «${activeTab.label}»`}
                                </strong>
                                <p>Перегляньте каталог і оберіть щось цікаве для себе.</p>
                                <button type="button" className="primary" onClick={() => navigate('/catalog')}>
                                    Перейти до каталогу
                                </button>
                            </div>
                        )}

                        <div className="orders-list">
                            {filteredOrders.map((order, index) => {
                                const meta = STATUS_META[order.status] ?? STATUS_META.Placed;
                                const StatusIcon = meta.icon;
                                const expanded = expandedIds.has(order.id);
                                const visibleThumbs = order.items.slice(0, 3);
                                const extraCount = order.items.length - visibleThumbs.length;

                                return (
                                    <article
                                        className={`order-card${expanded ? ' order-card-expanded' : ''}`}
                                        key={order.id}
                                        style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                                    >
                                        <button
                                            type="button"
                                            className="order-card-summary"
                                            onClick={() => toggleExpanded(order.id)}
                                            aria-expanded={expanded}
                                        >
                                            <div className="order-thumbs">
                                                {visibleThumbs.map((item, itemIndex) => (
                                                    <span
                                                        className="order-thumb"
                                                        key={item.id}
                                                        style={{ zIndex: visibleThumbs.length - itemIndex }}
                                                    >
                                  <img src={resolveAssetUrl(item.imageUrl)} alt={item.productTitle} loading="lazy" />
                                </span>
                                                ))}
                                                {extraCount > 0 && <span className="order-thumb order-thumb-extra">+{extraCount}</span>}
                                            </div>

                                            <div className="order-info">
                            <span className={`order-badge ${meta.className}`}>
                              <StatusIcon size={12} /> {meta.label}
                            </span>
                                                <strong className="order-number">Замовлення №{order.number}</strong>
                                                <span className="order-date">{formatOrderDate(order.createdAt)}</span>
                                            </div>

                                            <div className="order-meta">
                                                <strong className="order-total">{formatPrice(order.total)}</strong>
                                                <ChevronRight className="order-chevron" size={20} />
                                            </div>
                                        </button>

                                        <div className={`order-details${expanded ? ' order-details-open' : ''}`}>
                                            <div className="order-details-inner">
                                                <div className="order-items">
                                                    {order.items.map((item) => (
                                                        <div className="order-item-row" key={item.id}>
                                                            <button
                                                                type="button"
                                                                className="order-item-media"
                                                                onClick={() => navigate(`/product/${item.productId}`)}
                                                                aria-label={item.productTitle}
                                                            >
                                                                <img src={resolveAssetUrl(item.imageUrl)} alt={item.productTitle} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="order-item-title"
                                                                onClick={() => navigate(`/product/${item.productId}`)}
                                                            >
                                                                {item.productTitle}
                                                            </button>
                                                            <span className="order-item-qty">{item.quantity} шт.</span>
                                                            <span className="order-item-price">{formatPrice(item.unitPrice * item.quantity)}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="order-delivery">
                                                    <div className="order-delivery-row">
                                                        <MapPin size={16} />
                                                        <div>
                                                            <strong>Доставка</strong>
                                                            <span>{order.city}, {order.deliveryPoint}</span>
                                                        </div>
                                                    </div>
                                                    <div className="order-delivery-row">
                                                        <UserIcon size={16} />
                                                        <div>
                                                            <strong>Отримувач</strong>
                                                            <span>{order.recipientFullName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="order-delivery-row">
                                                        <Phone size={16} />
                                                        <div>
                                                            <strong>Телефон</strong>
                                                            <span>{order.recipientPhone}</span>
                                                        </div>
                                                    </div>
                                                    <div className="order-delivery-row">
                                                        <CreditCard size={16} />
                                                        <div>
                                                            <strong>Оплата</strong>
                                                            <span>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                                                        </div>
                                                    </div>
                                                    {order.comment && (
                                                        <div className="order-delivery-row">
                                                            <Package size={16} />
                                                            <div>
                                                                <strong>Коментар</strong>
                                                                <span>{order.comment}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="order-actions">
                                                    <button
                                                        type="button"
                                                        className="primary order-reorder"
                                                        onClick={() => handleReorder(order)}
                                                        disabled={reorderingId === order.id}
                                                    >
                                                        <RotateCcw size={16} /> {reorderingId === order.id ? 'Додаємо…' : 'Повторити замовлення'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}