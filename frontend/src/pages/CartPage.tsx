import { useNavigate } from 'react-router-dom';
import { Headphones, RefreshCcw, ShieldCheck, ShoppingCart, Truck, X } from 'lucide-react';
import { formatPrice, resolveAssetUrl } from '../store/api/client';
import { ProductGrid } from '../components/ProductGrid';
import { useProductActions } from '../hooks/useProductActions';
import { useGetProductsQuery } from '../store/api/catalogApi';
import { useClearCartMutation, useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '../store/api/cartApi';
import { useAppSelector } from '../store/hooks';

const emptyCart = { items: [], total: 0 };

const GUARANTEES = [
  { icon: Truck, title: 'Безкоштовна доставка', note: 'при замовленні від 1 000 грн' },
  { icon: RefreshCcw, title: 'Повернення товару', note: 'протягом 14 днів' },
  { icon: ShieldCheck, title: 'Гарантія якості', note: 'тільки оригінальні товари' },
  { icon: Headphones, title: 'Підтримка 24/7', note: 'ми завжди на зв\u2019язку' },
];

function Guarantees() {
  return (
      <div className="cart-guarantees">
        {GUARANTEES.map(({ icon: Icon, title, note }) => (
            <div className="cart-guarantee" key={title}>
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

export function CartPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data: cart = emptyCart } = useGetCartQuery(undefined, { skip: !user });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const [clearCart] = useClearCartMutation();

  const { favoriteProductIds, addToCart, toggleFavorite } = useProductActions();
  const { data: suggestions } = useGetProductsQuery({ pageSize: 4, sort: 'rating' });

  const suggestionItems = (suggestions?.items ?? []).filter(
      (item) => !cart.items.some((cartItem) => cartItem.product.id === item.id),
  );

  const isEmpty = cart.items.length === 0;

  if (!user) {
    return (
        <section className="cart-page cart-empty-page">
          <div className="cart-empty-art" aria-hidden="true">
            <ShoppingCart size={64} strokeWidth={1.3} />
          </div>
          <h1>Увійдіть, щоб побачити кошик</h1>
          <p>Ваші товари зберігаються в акаунті Lumio.</p>
          <button type="button" className="primary cart-empty-cta" onClick={() => navigate('/profile')}>
            Увійти в акаунт
          </button>
        </section>
    );
  }

  if (isEmpty) {
    return (
        <section className="cart-page cart-empty-page">
          <div className="cart-empty-art" aria-hidden="true">
            <ShoppingCart size={64} strokeWidth={1.3} />
          </div>
          <h1>Ваш кошик порожній</h1>
          <p>Додайте товари, щоб зробити покупку</p>
          <button type="button" className="primary cart-empty-cta" onClick={() => navigate('/catalog')}>
            Перейти до каталогу
          </button>

          {suggestionItems.length > 0 && (
              <div className="cart-suggestions">
                <h2>Останні переглянуті товари</h2>
                <ProductGrid
                    products={suggestionItems}
                    favoriteProductIds={favoriteProductIds}
                    onOpen={(item) => navigate(`/product/${item.id}`)}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                />
              </div>
          )}

          <Guarantees />
        </section>
    );
  }

  return (
      <section className="cart-page">
        <h1 className="cart-title">Ваш кошик</h1>

        <div className="cart-layout">
          <div className="cart-main">
            <div className="cart-table-head">
              <span>Товар</span>
              <span>Ціна</span>
              <span>Кількість</span>
              <span>Сума</span>
              <span />
            </div>

            <div className="cart-items">
              {cart.items.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <div className="cart-item-product">
                      <button
                          type="button"
                          className="cart-item-media"
                          onClick={() => navigate(`/product/${item.product.id}`)}
                      >
                        <img src={resolveAssetUrl(item.product.imageUrl)} alt={item.product.title} />
                      </button>
                      <div className="cart-item-info">
                        <button
                            type="button"
                            className="cart-item-title"
                            onClick={() => navigate(`/product/${item.product.id}`)}
                        >
                          {item.product.title}
                        </button>
                        <span className={`cart-item-stock${item.product.stockQuantity > 0 ? '' : ' cart-item-stock-out'}`}>
                                            {item.product.stockQuantity > 0 ? 'В наявності' : 'Немає в наявності'}
                                        </span>
                        {item.product.stockQuantity > 0 && item.product.stockQuantity <= 10 && (
                            <span className="cart-item-low">Залишилось лише {item.product.stockQuantity} шт.</span>
                        )}
                      </div>
                    </div>

                    <span className="cart-item-price">{formatPrice(item.product.price)}</span>

                    <div className="cart-qty">
                      <button
                          type="button"
                          onClick={() => updateCartItem({ itemId: item.id, productId: item.product.id, quantity: Math.max(1, item.quantity - 1) })}
                          disabled={item.quantity <= 1}
                          aria-label="Зменшити кількість"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                          type="button"
                          onClick={() => updateCartItem({ itemId: item.id, productId: item.product.id, quantity: item.quantity + 1 })}
                          aria-label="Збільшити кількість"
                      >
                        +
                      </button>
                    </div>

                    <strong className="cart-item-sum">{formatPrice(item.product.price * item.quantity)}</strong>

                    <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => removeCartItem(item.id)}
                        aria-label="Видалити товар"
                    >
                      <X size={18} />
                    </button>
                  </article>
              ))}
            </div>

            <div className="cart-actions">
              <button type="button" className="cart-clear" onClick={() => clearCart()}>
                Очистити кошик
              </button>
              <button type="button" className="primary cart-continue" onClick={() => navigate('/catalog')}>
                Продовжити покупки
              </button>
            </div>
          </div>

          <aside className="cart-summary">
            <h2>Підсумок замовлення</h2>

            <div className="cart-summary-rows">
              <div className="cart-summary-row">
                <span>Товари ({cart.items.reduce((total, item) => total + item.quantity, 0)})</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              {cart.items.map((item) => (
                  <div className="cart-summary-line" key={item.id}>
                    <span>{item.product.title}</span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
              ))}
            </div>

            <div className="cart-summary-total">
              <span>До сплати</span>
              <strong>{formatPrice(cart.total)}</strong>
            </div>
            <p className="cart-summary-note">Безкоштовна доставка від 1 000 грн</p>

            <button type="button" className="primary cart-checkout" onClick={() => navigate('/checkout')}>
              Оформити замовлення
            </button>

            <div className="cart-delivery-card">
              <div className="cart-delivery-row">
                <Truck size={17} />
                <div>
                  <strong>Орієнтовна доставка</strong>
                  <span>2–5 робочих днів</span>
                </div>
              </div>
              <div className="cart-delivery-row">
                <ShieldCheck size={17} />
                <div>
                  <strong>Способи оплати</strong>
                  <span>Visa, Mastercard, післяплата</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {suggestionItems.length > 0 && (
            <div className="cart-suggestions">
              <h2>Разом із цими товарами купують</h2>
              <ProductGrid
                  products={suggestionItems}
                  favoriteProductIds={favoriteProductIds}
                  onOpen={(item) => navigate(`/product/${item.id}`)}
                  onAddToCart={addToCart}
                  onToggleFavorite={toggleFavorite}
              />
            </div>
        )}

        <Guarantees />
      </section>
  );
}