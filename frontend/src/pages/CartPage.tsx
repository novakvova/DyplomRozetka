import { FormEvent } from 'react';
import { formatPrice } from '../api/client';
import { novaPoshta, type NovaPoshtaCity } from '../data/nova-poshta';
import type { Cart, User } from '../types';

type CartPageProps = {
  user: User | null;
  cart: Cart;
  deliveryCity: string;
  selectedCity: NovaPoshtaCity;
  onDeliveryCityChange: (value: string) => void;
  onCheckout: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateCartItem: (itemId: string, productId: string, quantity: number) => void;
  onRemoveCartItem: (itemId: string) => void;
};

export function CartPage({
  user,
  cart,
  deliveryCity,
  selectedCity,
  onDeliveryCityChange,
  onCheckout,
  onUpdateCartItem,
  onRemoveCartItem,
}: CartPageProps) {
  return (
    <section className="split">
      <div>
        <h1>Кошик</h1>
        {!user && <p>Увійдіть, щоб оформити замовлення.</p>}
        {cart.items.map((item) => (
          <article className="row" key={item.id}>
            <strong>{item.product.title}</strong>
            <span>{formatPrice(item.product.price)}</span>
            <input type="number" min="1" value={item.quantity} onChange={(event) => onUpdateCartItem(item.id, item.product.id, Number(event.target.value))} />
            <button onClick={() => onRemoveCartItem(item.id)}>Видалити</button>
          </article>
        ))}
        <h2>Разом: {formatPrice(cart.total)}</h2>
      </div>

      {user && (
        <form onSubmit={onCheckout}>
          <h2>Оформлення</h2>
          <input name="recipientFullName" placeholder="ПІБ отримувача" defaultValue={user.fullName} required />
          <input name="recipientPhone" placeholder="Телефон" defaultValue={user.phone} required />
          <select name="city" value={deliveryCity} onChange={(event) => onDeliveryCityChange(event.target.value)}>
            {novaPoshta.map((item) => <option key={item.city} value={item.city}>{item.city}</option>)}
          </select>
          <select name="deliveryPoint">
            {selectedCity.points.map((point) => <option key={point} value={point}>{point}</option>)}
          </select>
          <select name="paymentMethod" defaultValue="card">
            <option value="card">Карткою</option>
            <option value="cash">Післяплата</option>
            <option value="installments">Оплата частинами</option>
          </select>
          <textarea name="comment" placeholder="Коментар" />
          <button className="primary" disabled={cart.items.length === 0}>Оформити замовлення</button>
        </form>
      )}
    </section>
  );
}
