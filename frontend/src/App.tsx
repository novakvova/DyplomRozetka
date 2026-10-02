import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { CartAddedModal } from './components/CartAddedModal';
import { FavoriteAddedModal } from './components/FavoriteAddedModal';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AddressFormPage } from './pages/AddressFormPage';
import { PaymentCardFormPage } from './pages/PaymentCardFormPage';
import { PasswordChangePage } from './pages/PasswordChangePage';
import { TwoFactorPage } from './pages/TwoFactorPage';
import { TwoFactorCodePage } from './pages/TwoFactorCodePage';
import { CatalogPage } from './pages/CatalogPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { MainPage } from './pages/MainPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductPage } from './pages/ProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { apiSlice } from './store/apiSlice';
import { useGetMeQuery } from './store/api/authApi';
import { sessionExpiredHandled, userUpdated } from './store/authSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { messageSet } from './store/uiSlice';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

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
    const sessionExpired = useAppSelector((state) => state.auth.sessionExpired);

    const { data: me } = useGetMeQuery(undefined, { skip: !user });
    const location = useLocation();

    useEffect(() => {
        if (me) dispatch(userUpdated(me));
    }, [me, dispatch]);

    useEffect(() => {
        if (sessionExpired) {
            dispatch(apiSlice.util.resetApiState());
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

            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/addresses/new" element={<AddressFormPage />} />
                <Route path="/profile/addresses" element={<ProfilePage />} />
                <Route path="/profile/payment-cards/new" element={<PaymentCardFormPage />} />
                <Route path="/profile/payment-cards/:id/edit" element={<PaymentCardFormPage />} />
                <Route path="/profile/password" element={<PasswordChangePage />} />
                <Route path="/profile/2fa" element={<TwoFactorPage />} />
                <Route path="/2fa-code" element={<TwoFactorCodePage />} />
                <Route
                    path="/admin"
                    element={user?.role === 'Admin' ? <AdminPage /> : <Navigate to="/" replace />}
                />
                <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
                <Route path="/reset-password" element={<ResetPasswordPage />}/>
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
                <Route path="/reset-password" element={<ResetPasswordPage />}/>
            </Routes>

            <Footer />
            <CartAddedModal />
            <FavoriteAddedModal />
        </main>
    );
}