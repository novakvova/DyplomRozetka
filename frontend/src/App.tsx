import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ApiError, api } from './api/client';
import { Header } from './components/Header';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { novaPoshta } from './data/nova-poshta';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import type { AuthResponse, Cart, Category, Favorite, Order, Product, Review, User } from './types';

export type AuthMode = 'login' | 'register' | 'recover';

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

const emptyCart: Cart = { items: [], total: 0 };

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('rozetka_fullstack_user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [authMode, setAuthMode] = useState<AuthMode>('login');
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
    const token = localStorage.getItem('rozetka_fullstack_token');
    if (!token) {
      clearAuth();
      return;
    }

    api<User>('/auth/me')
      .then(saveUser)
      .catch((error) => {
        if (isSessionError(error)) {
          clearAuth();
          setMessage('Сесія застаріла. Увійдіть ще раз.');
          navigate('/profile');
        }
      });
  }, []);

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
    navigate('/');
  }

  function saveUser(nextUser: User) {
    localStorage.setItem('rozetka_fullstack_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function clearAuth() {
    localStorage.removeItem('rozetka_fullstack_token');
    localStorage.removeItem('rozetka_fullstack_user');
    setUser(null);
    setCart(emptyCart);
    setOrders([]);
    setFavorites([]);
    setUsers([]);
  }

  function isSessionError(error: unknown) {
    return error instanceof ApiError && (error.status === 401 || error.status === 403);
  }

  function handleActionError(error: unknown, fallback: string) {
    if (isSessionError(error)) {
      clearAuth();
      setMessage('Сесія застаріла. Увійдіть ще раз.');
      navigate('/profile');
      return;
    }

    setMessage(error instanceof Error ? error.message : fallback);
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
      navigate('/profile');
      return;
    }

    try {
      setCart(await api<Cart>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      }));
      setMessage('Товар додано в кошик.');
    } catch (error) {
      handleActionError(error, 'Не вдалося додати товар у кошик.');
    }
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
      navigate('/profile');
      return;
    }

    try {
      setFavorites(await api<Favorite[]>(`/favorites/${productId}`, { method: 'POST' }));
      setMessage('Обране оновлено.');
    } catch (error) {
      handleActionError(error, 'Не вдалося оновити обране.');
    }
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
      navigate('/orders');
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
    navigate('/');
  }

  return (
    <main className="min-h-screen">
      <Header user={user} cartItemsCount={cartItemsCount} favoritesCount={favorites.length} onLogout={logout} />
      {message && <p className="notice">{message}</p>}

      <Routes>
        <Route
          path="/"
          element={(
            <CatalogPage
              categories={categories}
              products={products}
              search={search}
              category={category}
              loading={loading}
              favoriteProductIds={favoriteProductIds}
              onSearchChange={setSearch}
              onCategoryChange={setCategory}
              onLoadCatalog={loadCatalog}
              onOpenProduct={openProduct}
              onAddToCart={addToCart}
              onToggleFavorite={toggleFavorite}
            />
          )}
        />
        <Route
          path="/favorites"
          element={(
            <FavoritesPage
              user={user}
              favorites={favorites}
              favoriteProductIds={favoriteProductIds}
              onOpenProduct={openProduct}
              onAddToCart={addToCart}
              onToggleFavorite={toggleFavorite}
            />
          )}
        />
        <Route
          path="/cart"
          element={(
            <CartPage
              user={user}
              cart={cart}
              deliveryCity={deliveryCity}
              selectedCity={selectedCity}
              onDeliveryCityChange={setDeliveryCity}
              onCheckout={checkout}
              onUpdateCartItem={updateCartItem}
              onRemoveCartItem={removeCartItem}
            />
          )}
        />
        <Route path="/orders" element={<OrdersPage user={user} orders={orders} />} />
        <Route
          path="/profile"
          element={(
            <ProfilePage
              user={user}
              authMode={authMode}
              onAuthModeChange={setAuthMode}
              onSubmitAuth={submitAuth}
              onGoogleLogin={googleLogin}
              onUpdateProfile={updateProfile}
              onChangePassword={changePassword}
            />
          )}
        />
        <Route
          path="/admin"
          element={user?.role === 'Admin' ? (
            <AdminPage
              categories={categories}
              products={products}
              users={users}
              onCreateProduct={createProduct}
              onDeleteProduct={deleteProduct}
              onCreateCategory={createCategory}
              onCreateAdmin={createAdmin}
              onToggleUserBlock={toggleUserBlock}
              onToggleUserRole={toggleUserRole}
            />
          ) : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {selectedProduct && (
        <ProductDetailsModal
          user={user}
          product={selectedProduct}
          reviews={reviews}
          isFavorite={favoriteProductIds.has(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
          onCreateReview={createReview}
        />
      )}
    </main>
  );
}
