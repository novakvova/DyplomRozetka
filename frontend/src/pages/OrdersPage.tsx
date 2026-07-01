import { formatPrice } from '../api/client';
import { useGetOrdersQuery } from '../store/api/ordersApi';
import { useAppSelector } from '../store/hooks';

export function OrdersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: orders = [] } = useGetOrdersQuery(undefined, { skip: !user });

  return (
      <section>
        <h1>Мої замовлення</h1>
        {!user && <p>Увійдіть, щоб переглянути історію замовлень.</p>}
        {orders.map((order) => (
            <article className="order" key={order.id}>
              <strong>{order.number}</strong>
              <span>{formatPrice(order.total)} · {order.status}</span>
              <p>{order.city}, {order.deliveryPoint}</p>
              {order.items.map((item) => <small key={item.id}>{item.productTitle} x {item.quantity}</small>)}
            </article>
        ))}
      </section>
  );
}