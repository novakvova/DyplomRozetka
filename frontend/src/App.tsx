import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { MainPage } from './pages/MainPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductPage } from './pages/ProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { useGetMeQuery } from './store/api/authApi';
import { sessionExpiredHandled, userUpdated } from './store/authSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { messageSet } from './store/uiSlice';

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

    const { data: me } = useGetMeQuery(undefined, { skip: !token });
    const location = useLocation();

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

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, [location.pathname]);

    return (
        <main className="min-h-screen">
            <Header />
            {message && <p className="notice notice-toast">{message}</p>}

            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                    path="/admin"
                    element={user?.role === 'Admin' ? <AdminPage /> : <Navigate to="/" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer />
        </main>
    );
}