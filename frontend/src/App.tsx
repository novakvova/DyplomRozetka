import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, formatPrice } from './api/client';
import rozetkaLogo from './assets/rozetka-logo.svg';
import type { AuthResponse, Cart, Category, Favorite, Order, Product, Review, User } from './types';

type View = 'catalog' | 'cart' | 'favorites' | 'orders' | 'profile' | 'admin';
type AuthMode = 'login' | 'register' | 'recover';

const emptyCart: Cart = { items: [], total: 0 };
const novaPoshta = [
  { city: 'Київ', points: ['Відділення №12, вул. Січових Стрільців', 'Поштомат №4331, ТРЦ Gulliver'] },
  { city: 'Львів', points: ['Відділення №7, вул. Городоцька', 'Поштомат №2104, Forum Lviv'] },
  { city: 'Одеса', points: ['Відділення №18, вул. Дерибасівська', 'Поштомат №1190, City Center'] },
  { city: 'Харків', points: ['Відділення №3, просп. Науки', 'Поштомат №3022, ТРЦ Nikolsky'] },
];

type GoogleWindow = Window & {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (options: {
          client_id: string;
          scope: string;
          callback: (response: { access_token?: string }) => void;
        }) => { requestAccessToken: () => void };
      };
    };
  };
};

export function App() {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('rozetka_fullstack_user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [view, setView] = useState<View>('catalog');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deliveryCity, setDeliveryCity] = useState(novaPoshta[0].city);
  const [loading, setLoading] = useState(false);

  const cartItemsCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const favoriteProductIds = useMemo(() => new Set(favorites.map((item) => item.product.id)), [favorites]);
  const selectedCity = novaPoshta.find((item) => item.city === deliveryCity) ?? novaPoshta[0];

  useEffect(() => {
    loadCatalog();
  }, [category]);

  useEffect(() => {
    if (!user) return;
    loadCart();
    loadOrders();
    loadFavorites();
    if (user.role === 'Admin') loadUsers();
  }, [user]);

  async function loadCatalog() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category });
      const [nextCategories, nextProducts] = await Promise.all([
        api<Category[]>('/catalog/categories'),
        api<Product[]>(`/catalog/products?${params.toString()}`),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не вдалося завантажити каталог.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCart() {
    setCart(await api<Cart>('/cart'));
  }

  async function loadOrders() {
    setOrders(await api<Order[]>('/orders'));
  }

  async function loadFavorites() {
    setFavorites(await api<Favorite[]>('/favorites'));
  }

  async function loadUsers() {
    setUsers(await api<User[]>('/admin/users'));
  }

  async function openProduct(product: Product) {
    setSelectedProduct(product);
    setReviews(await api<Review[]>(`/reviews/product/${product.id}`));
  }

  function saveAuth(response: AuthResponse) {
    localStorage.setItem('rozetka_fullstack_token', response.token);
    localStorage.setItem('rozetka_fullstack_user', JSON.stringify(response.user));
    setUser(response.user);
    setAuthMode('login');
    setMessage(`Вітаємо, ${response.user.fullName}!`);
  }

  function saveUser(nextUser: User) {
    localStorage.setItem('rozetka_fullstack_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      if (authMode === 'recover') {
        await api('/auth/recover', {
          method: 'POST',
          body: JSON.stringify({ email: data.get('email'), newPassword: data.get('password') }),
        });
        form.reset();
        setAuthMode('login');
        setMessage('Пароль оновлено. Тепер можна увійти.');
        return;
      }

      if (authMode === 'register' && data.get('password') !== data.get('passwordConfirm')) {
        setMessage('Підтвердження паролю не збігається.');
        return;
      }

      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const response = await api<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      saveAuth(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Помилка авторизації.');
    }
  }

  async function googleLogin() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (clientId) {
      const googleWindow = window as GoogleWindow;
      if (!googleWindow.google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Не вдалося завантажити Google Sign-In.'));
          document.head.appendChild(script);
        });
      }

      googleWindow.google?.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (!tokenResponse.access_token) {
            setMessage('Google не повернув access token.');
            return;
          }

          const profile = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }).then((response) => response.json() as Promise<{ email: string; name: string }>);

          const response = await api<AuthResponse>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ email: profile.email, fullName: profile.name, googleToken: tokenResponse.access_token }),
          });
          saveAuth(response);
        },
      }).requestAccessToken();
      return;
    }

    const email = window.prompt('Введіть Google email для демонстраційного входу');
    if (!email) return;

    const response = await api<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, fullName: email.split('@')[0], googleToken: 'google-demo-token' }),
    });
    saveAuth(response);
  }

  async function addToCart(productId: string) {
    if (!user) {
      setMessage('Увійдіть в акаунт, щоб додати товар у кошик.');
      return;
    }

    setCart(await api<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: 1 }),
    }));
    setMessage('Товар додано в кошик.');
  }

  async function updateCartItem(itemId: string, productId: string, quantity: number) {
    setCart(await api<Cart>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    }));
  }

  async function removeCartItem(itemId: string) {
    setCart(await api<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' }));
  }

  async function toggleFavorite(productId: string) {
    if (!user) {
      setMessage('Увійдіть в акаунт, щоб додавати товари в обране.');
      return;
    }

    setFavorites(await api<Favorite[]>(`/favorites/${productId}`, { method: 'POST' }));
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api<Order>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
      });
      setCart(emptyCart);
      await loadOrders();
      setView('orders');
      setMessage('Замовлення оформлено.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не вдалося оформити замовлення.');
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUser = await api<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    saveUser(nextUser);
    setMessage('Профіль оновлено.');
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    event.currentTarget.reset();
    setMessage('Пароль змінено.');
  }

  async function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;

    const data = new FormData(event.currentTarget);
    await api<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ productId: selectedProduct.id, rating: Number(data.get('rating')), text: data.get('text') }),
    });
    event.currentTarget.reset();
    await openProduct(selectedProduct);
    await loadCatalog();
    setMessage('Відгук додано.');
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        sku: data.get('sku'),
        title: data.get('title'),
        subtitle: data.get('subtitle'),
        brand: data.get('brand'),
        price: Number(data.get('price')),
        previousPrice: Number(data.get('previousPrice')) || null,
        badge: data.get('badge'),
        imageUrl: data.get('imageUrl'),
        description: data.get('description'),
        manufacturerUrl: data.get('manufacturerUrl'),
        specifications: data.get('specifications'),
        stockQuantity: Number(data.get('stockQuantity')),
        categoryId: data.get('categoryId'),
      }),
    });
    event.currentTarget.reset();
    await loadCatalog();
    setMessage('Товар додано.');
  }

  async function deleteProduct(id: string) {
    await api(`/admin/products/${id}`, { method: 'DELETE' });
    await loadCatalog();
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    event.currentTarget.reset();
    await loadCatalog();
  }

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api<User>('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    event.currentTarget.reset();
    await loadUsers();
    setMessage('Нового адміністратора додано.');
  }

  async function toggleUserBlock(id: string) {
    await api<User>(`/admin/users/${id}/block`, { method: 'PUT' });
    await loadUsers();
  }

  async function toggleUserRole(id: string) {
    await api<User>(`/admin/users/${id}/role`, { method: 'PUT' });
    await loadUsers();
  }

  function logout() {
    localStorage.removeItem('rozetka_fullstack_token');
    localStorage.removeItem('rozetka_fullstack_user');
    setUser(null);
    setCart(emptyCart);
    setOrders([]);
    setFavorites([]);
    setView('catalog');
  }

  return (
    <main className="min-h-screen">
      <header className="topbar">
        <button className="catalog-button" onClick={() => setView('catalog')}>☰ Каталог</button>
        <button className="brand-lockup" onClick={() => setView('catalog')}>
          <img className="brand-mark" src={rozetkaLogo} alt="Rozetka" />
          <strong>Rozetka</strong>
        </button>
        <nav>
          <button className={view === 'catalog' ? 'nav-active' : ''} onClick={() => setView('catalog')}>Товари</button>
          <button className={view === 'favorites' ? 'nav-active' : ''} onClick={() => setView('favorites')}>Обране ({favorites.length})</button>
          <button className={view === 'cart' ? 'nav-active' : ''} onClick={() => setView('cart')}>Кошик ({cartItemsCount})</button>
          <button className={view === 'orders' ? 'nav-active' : ''} onClick={() => setView('orders')}>Замовлення</button>
          {user?.role === 'Admin' && <button className={view === 'admin' ? 'nav-active' : ''} onClick={() => setView('admin')}>Адмінка</button>}
        </nav>
        {user ? (
          <div className="account">
            <button onClick={() => setView('profile')}>{user.fullName}</button>
            <button onClick={logout}>Вийти</button>
          </div>
        ) : (
          <button onClick={() => setView('profile')}>Увійти</button>
        )}
      </header>

      {message && <p className="notice">{message}</p>}

      {view === 'profile' && (
        <section className="split">
          {!user ? (
            <form onSubmit={submitAuth}>
              <div className="tabs">
                <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Вхід</button>
                <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Реєстрація</button>
                <button type="button" className={authMode === 'recover' ? 'active' : ''} onClick={() => setAuthMode('recover')}>Recovery</button>
              </div>
              <input name="email" type="email" placeholder="Email" defaultValue="radon.bogdan09@gmail.com" required />
              <input name="password" type="password" placeholder={authMode === 'recover' ? 'Новий пароль' : 'Пароль'} defaultValue="Admin12345" required />
              {authMode === 'register' && (
                <>
                  <input name="passwordConfirm" type="password" placeholder="Підтвердження паролю" required />
                  <input name="fullName" placeholder="ПІБ" required />
                  <input name="phone" placeholder="Телефон" required />
                  <input name="city" placeholder="Місто" required />
                </>
              )}
              <button className="primary">{authMode === 'recover' ? 'Оновити пароль' : authMode === 'login' ? 'Увійти' : 'Створити акаунт'}</button>
              <button type="button" onClick={googleLogin}>Увійти через Google</button>
            </form>
          ) : (
            <>
              <form onSubmit={updateProfile}>
                <h1>Профіль</h1>
                <input name="fullName" defaultValue={user.fullName} placeholder="ПІБ" required />
                <input name="phone" defaultValue={user.phone} placeholder="Телефон" />
                <input name="city" defaultValue={user.city} placeholder="Місто" />
                <button className="primary">Зберегти профіль</button>
              </form>
              <form onSubmit={changePassword}>
                <h2>Зміна паролю</h2>
                <input name="currentPassword" type="password" placeholder="Поточний пароль" required />
                <input name="newPassword" type="password" placeholder="Новий пароль" required />
                <button>Змінити пароль</button>
              </form>
            </>
          )}
        </section>
      )}

      {view === 'catalog' && (
        <section>
          <div className="storefront-tools">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Пошук товарів" />
            <button onClick={loadCatalog}>Знайти</button>
          </div>

          <div className="category-strip">
            <button className={!category ? 'pill-active' : ''} onClick={() => setCategory('')}>Усі товари</button>
            {categories.map((item) => (
              <button key={item.id} className={category === item.slug ? 'pill-active' : ''} onClick={() => setCategory(item.slug)}>
                {item.title}
              </button>
            ))}
          </div>
          {loading && <p>Завантаження...</p>}
          <ProductGrid products={products} favoriteProductIds={favoriteProductIds} onOpen={openProduct} onAddToCart={addToCart} onToggleFavorite={toggleFavorite} />
        </section>
      )}

      {view === 'favorites' && (
        <section>
          <h1>Обране</h1>
          {!user ? <p>Увійдіть, щоб бачити обрані товари.</p> : <ProductGrid products={favorites.map((item) => item.product)} favoriteProductIds={favoriteProductIds} onOpen={openProduct} onAddToCart={addToCart} onToggleFavorite={toggleFavorite} />}
        </section>
      )}

      {view === 'cart' && (
        <section className="split">
          <div>
            <h1>Кошик</h1>
            {!user && <p>Увійдіть, щоб оформити замовлення.</p>}
            {cart.items.map((item) => (
              <article className="row" key={item.id}>
                <strong>{item.product.title}</strong>
                <span>{formatPrice(item.product.price)}</span>
                <input type="number" min="1" value={item.quantity} onChange={(event) => updateCartItem(item.id, item.product.id, Number(event.target.value))} />
                <button onClick={() => removeCartItem(item.id)}>Видалити</button>
              </article>
            ))}
            <h2>Разом: {formatPrice(cart.total)}</h2>
          </div>
          {user && (
            <form onSubmit={checkout}>
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
      )}

      {view === 'orders' && (
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
      )}

      {view === 'admin' && user?.role === 'Admin' && (
        <section className="admin-grid">
          <form onSubmit={createProduct}>
            <h2>Додати товар</h2>
            <input name="sku" placeholder="SKU" required />
            <input name="title" placeholder="Назва" required />
            <input name="subtitle" placeholder="Короткий опис" required />
            <input name="brand" placeholder="Бренд" required />
            <input name="price" type="number" placeholder="Ціна" required />
            <input name="previousPrice" type="number" placeholder="Стара ціна" />
            <input name="badge" placeholder="Бейдж" />
            <input name="imageUrl" placeholder="URL зображення" defaultValue="https://placehold.co/640x480/f5f7fb/1f2937?text=Rozetka" />
            <input name="manufacturerUrl" placeholder="Офіційний сайт виробника" />
            <textarea name="specifications" placeholder="Характеристики" defaultValue="Гарантія: 12 місяців" />
            <textarea name="description" placeholder="Опис товару" />
            <input name="stockQuantity" type="number" placeholder="Залишок" defaultValue="10" required />
            <select name="categoryId" required>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <button className="primary">Зберегти товар</button>
          </form>

          <div className="panel">
            <h2>Список товарів</h2>
            {products.map((item) => (
              <article className="row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.category.title}</span>
                <button onClick={() => deleteProduct(item.id)}>Видалити</button>
              </article>
            ))}
          </div>

          <form onSubmit={createCategory}>
            <h2>Категорії</h2>
            <input name="slug" placeholder="slug" required />
            <input name="title" placeholder="Назва категорії" required />
            <textarea name="description" placeholder="Опис" />
            <button>Додати категорію</button>
            {categories.map((item) => <small key={item.id}>{item.title} · {item.slug}</small>)}
          </form>

          <div className="panel">
            <h2>Користувачі</h2>
            {users.map((item) => (
              <article className="row" key={item.id}>
                <strong>{item.email}</strong>
                <span>{item.role}{item.isBlocked ? ' · blocked' : ''}</span>
                <button onClick={() => toggleUserBlock(item.id)}>{item.isBlocked ? 'Розблокувати' : 'Блокувати'}</button>
                <button onClick={() => toggleUserRole(item.id)}>Змінити роль</button>
              </article>
            ))}
          </div>

          <form onSubmit={createAdmin}>
            <h2>Новий адміністратор</h2>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Пароль" required />
            <input name="fullName" placeholder="ПІБ" required />
            <input name="phone" placeholder="Телефон" />
            <input name="city" placeholder="Місто" />
            <button>Додати адміністратора</button>
          </form>
        </section>
      )}

      {selectedProduct && (
        <section className="product-details">
          <button onClick={() => setSelectedProduct(null)}>Закрити</button>
          <div className="details-layout">
            <img src={selectedProduct.imageUrl} alt={selectedProduct.title} />
            <div>
              <span className="badge">{selectedProduct.badge}</span>
              <h1>{selectedProduct.title}</h1>
              <p>{selectedProduct.description}</p>
              <h2>{formatPrice(selectedProduct.price)}</h2>
              <p>{selectedProduct.brand} · ★ {selectedProduct.rating.toFixed(1)} · {selectedProduct.reviewsCount} відгуків</p>
              <pre>{selectedProduct.specifications}</pre>
              {selectedProduct.manufacturerUrl && <a href={selectedProduct.manufacturerUrl} target="_blank" rel="noreferrer">Офіційний сайт виробника</a>}
              <div className="action-row">
                <button className="primary" onClick={() => addToCart(selectedProduct.id)}>До кошика</button>
                <button onClick={() => toggleFavorite(selectedProduct.id)}>{favoriteProductIds.has(selectedProduct.id) ? 'В обраному' : 'В обране'}</button>
              </div>
            </div>
          </div>
          <div className="reviews">
            <h2>Відгуки</h2>
            {user && (
              <form onSubmit={createReview}>
                <select name="rating" defaultValue="5">
                  <option value="5">5 зірок</option>
                  <option value="4">4 зірки</option>
                  <option value="3">3 зірки</option>
                  <option value="2">2 зірки</option>
                  <option value="1">1 зірка</option>
                </select>
                <textarea name="text" placeholder="Ваш відгук" required />
                <button>Надіслати відгук</button>
              </form>
            )}
            {reviews.map((review) => (
              <article className="review" key={review.id}>
                <strong>{review.userFullName} · ★ {review.rating}</strong>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ProductGrid({
  products,
  favoriteProductIds,
  onOpen,
  onAddToCart,
  onToggleFavorite,
}: {
  products: Product[];
  favoriteProductIds: Set<string>;
  onOpen: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
}) {
  return (
    <div className="grid">
      {products.map((product) => (
        <article className="product" key={product.id}>
          <button className="favorite-button" onClick={() => onToggleFavorite(product.id)}>
            {favoriteProductIds.has(product.id) ? '♥' : '♡'}
          </button>
          <div className="product-media" onClick={() => onOpen(product)}>
            <img src={product.imageUrl} alt={product.title} />
          </div>
          <span className="badge">{product.badge}</span>
          <h2 onClick={() => onOpen(product)}>{product.title}</h2>
          <p>{product.subtitle}</p>
          <div className="price-line">
            <strong>{formatPrice(product.price)}</strong>
            {product.previousPrice ? <small>{formatPrice(product.previousPrice)}</small> : null}
          </div>
          <small>{product.brand} · {product.category.title} · ★ {product.rating.toFixed(1)}</small>
          <button className="primary" onClick={() => onAddToCart(product.id)}>До кошика</button>
        </article>
      ))}
    </div>
  );
}
