import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { useGetMeQuery } from './store/api/authApi';
import { sessionExpiredHandled, userUpdated } from './store/authSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { messageSet } from './store/uiSlice';
import type { Product } from './types';

export function App() {
  return (
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const sessionExpired = useAppSelector((state) => state.auth.sessionExpired);
  const message = useAppSelector((state) => state.ui.message);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: me } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (me) dispatch(userUpdated(me));
  }, [me, dispatch]);

  useEffect(() => {
    if (sessionExpired) {
      dispatch(messageSet('Сесія застаріла. Увійдіть ще раз.'));
      navigate('/profile');
      dispatch(sessionExpiredHandled());
    }
  }, [sessionExpired, dispatch, navigate]);

  return (
      <main className="min-h-screen">
        <Header />
        {message && <p className="notice">{message}</p>}

        <Routes>
          <Route path="/" element={<CatalogPage onOpenProduct={setSelectedProduct} />} />
          <Route path="/favorites" element={<FavoritesPage onOpenProduct={setSelectedProduct} />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
              path="/admin"
              element={user?.role === 'Admin' ? <AdminPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {selectedProduct && (
            <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </main>
  );
}