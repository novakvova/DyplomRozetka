import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractErrorMessage, formatPrice } from '../api/client';
import { novaPoshta } from '../data/nova-poshta';
import { useCheckoutMutation } from '../store/api/ordersApi';
import { useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '../store/api/cartApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

const emptyCart = { items: [], total: 0 };

export function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: cart = emptyCart } = useGetCartQuery(undefined, { skip: !user });
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const [checkout] = useCheckoutMutation();
  const [deliveryCity, setDeliveryCity] = useState(novaPoshta[0].city);
  const selectedCity = novaPoshta.find((item) => item.city === deliveryCity) ?? novaPoshta[0];

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as {
      recipientFullName: string;
      recipientPhone: string;
      city: string;
      deliveryPoint: string;
      paymentMethod: string;
      comment: string;
    };

    try {
      await checkout(data).unwrap();
      navigate('/orders');
      dispatch(messageSet('Замовлення оформлено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оформити замовлення.')));
    }
  }

  return (
      <section className="split">
        <div>
          <h1>Кошик</h1>
          {!user && <p>Увійдіть, щоб оформити замовлення.</p>}
          {cart.items.map((item) => (
              <article className="row" key={item.id}>
                <strong>{item.product.title}</strong>
                <span>{formatPrice(item.product.price)}</span>
                <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateCartItem({ itemId: item.id, productId: item.product.id, quantity: Number(event.target.value) })}
                />
                <button onClick={() => removeCartItem(item.id)}>Видалити</button>
              </article>
          ))}
          <h2>Разом: {formatPrice(cart.total)}</h2>
        </div>

        {user && (
            <form onSubmit={handleCheckout}>
              <h2>Оформлення</h2>
              <input name="recipientFullName" placeholder="ПІБ отримувача" defaultValue={user.fullName} required />
              <input name="recipientPhone" placeholder="Телефон" defaultValue={user.phone} required />
              <select name="city" value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)}>
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