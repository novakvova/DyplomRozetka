import {useEffect} from 'react';
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router-dom';

import {AdminLayout} from './admin/layout/AdminLayout';
import {AdminCreateAdminPage} from './admin/pages/AdminCreateAdminPage';
import {AdminCategoriesPage} from './admin/pages/AdminCategoriesPage';
import {AdminDashboardPage} from './admin/pages/AdminDashboardPage';
import {AdminOrdersPage} from './admin/pages/AdminOrdersPage';
import {AdminProductsPage} from './admin/pages/AdminProductsPage';
import {AdminUsersPage} from './admin/pages/AdminUsersPage';

import {CartAddedModal} from './components/CartAddedModal';
import {FavoriteAddedModal} from './components/FavoriteAddedModal';
import {Footer} from './components/Footer';
import {Header} from './components/Header';

import {AddressFormPage} from './pages/AddressFormPage';
import {CartPage} from './pages/CartPage';
import {CatalogPage} from './pages/CatalogPage';
import {CheckoutPage} from './pages/CheckoutPage';
import {FavoritesPage} from './pages/FavoritesPage';
import {ForgotPasswordPage} from './pages/ForgotPasswordPage';
import {MainPage} from './pages/MainPage';
import {OrdersPage} from './pages/OrdersPage';
import {PasswordChangePage} from './pages/PasswordChangePage';
import {PaymentCardFormPage} from './pages/PaymentCardFormPage';
import {ProductPage} from './pages/ProductPage';
import {ProfilePage} from './pages/ProfilePage';
import {ResetPasswordPage} from './pages/ResetPasswordPage';
import {TwoFactorCodePage} from './pages/TwoFactorCodePage';
import {TwoFactorPage} from './pages/TwoFactorPage';

import {apiSlice} from './store/apiSlice';
import {useGetMeQuery} from './store/api/authApi';
import {
    sessionExpiredHandled,
    userUpdated,
} from './store/authSlice';
import {
    useAppDispatch,
    useAppSelector,
} from './store/hooks';
import {messageSet} from './store/uiSlice';

export function App() {
    return (
        <BrowserRouter>
            <AppRoutes/>
        </BrowserRouter>
    );
}

function AppRoutes() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const user = useAppSelector(
        (state) => state.auth.user,
    );

    const sessionExpired = useAppSelector(
        (state) => state.auth.sessionExpired,
    );

    const message = useAppSelector(
        (state) => state.ui.message,
    );

    const {data: me} = useGetMeQuery(
        undefined,
        {
            skip: !user,
        },
    );

    const location = useLocation();

    const isAdminRoute =
        location.pathname.startsWith('/admin');

    useEffect(() => {
        if (me) {
            dispatch(userUpdated(me));
        }
    }, [me, dispatch]);

    useEffect(() => {
        if (sessionExpired) {
            dispatch(
                apiSlice.util.resetApiState(),
            );

            dispatch(
                messageSet(
                    'Сесія застаріла. Увійдіть ще раз.',
                ),
            );

            navigate('/profile');

            dispatch(sessionExpiredHandled());
        }
    }, [
        sessionExpired,
        dispatch,
        navigate,
    ]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant' as ScrollBehavior,
        });
    }, [location.pathname]);

    return (
        <main className="min-h-screen">
            {!isAdminRoute && <Header/>}

            {message && (
                <p className="notice notice-toast">
                    {message}
                </p>
            )}

            <Routes>
                <Route
                    path="/"
                    element={<MainPage/>}
                />

                <Route
                    path="/catalog"
                    element={<CatalogPage/>}
                />

                <Route
                    path="/product/:id"
                    element={<ProductPage/>}
                />

                <Route
                    path="/favorites"
                    element={<FavoritesPage/>}
                />

                <Route
                    path="/cart"
                    element={<CartPage/>}
                />

                <Route
                    path="/checkout"
                    element={<CheckoutPage/>}
                />

                <Route
                    path="/orders"
                    element={<OrdersPage/>}
                />

                <Route
                    path="/profile"
                    element={<ProfilePage/>}
                />

                <Route
                    path="/profile/addresses/new"
                    element={<AddressFormPage/>}
                />

                <Route
                    path="/profile/addresses"
                    element={<ProfilePage/>}
                />

                <Route
                    path="/profile/payment-cards/new"
                    element={<PaymentCardFormPage/>}
                />

                <Route
                    path="/profile/payment-cards/:id/edit"
                    element={<PaymentCardFormPage/>}
                />

                <Route
                    path="/profile/password"
                    element={<PasswordChangePage/>}
                />

                <Route
                    path="/profile/2fa"
                    element={<TwoFactorPage/>}
                />

                <Route
                    path="/2fa-code"
                    element={<TwoFactorCodePage/>}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage/>}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage/>}
                />

                <Route
                    path="/admin"
                    element={
                        user?.role === 'Admin' ? (
                            <AdminLayout/>
                        ) : (
                            <Navigate
                                to="/"
                                replace
                            />
                        )
                    }
                >
                    <Route
                        index
                        element={
                            <AdminDashboardPage/>
                        }
                    />

                    <Route
                        path="products"
                        element={
                            <AdminProductsPage/>
                        }
                    />

                    <Route
                        path="categories"
                        element={
                            <AdminCategoriesPage/>
                        }
                    />

                    <Route
                        path="orders"
                        element={
                            <AdminOrdersPage/>
                        }
                    />

                    <Route
                        path="users"
                        element={
                            <AdminUsersPage/>
                        }
                    />

                    <Route
                        path="admins"
                        element={
                            <AdminCreateAdminPage/>
                        }
                    />
                </Route>

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />
            </Routes>

            {!isAdminRoute && <Footer/>}

            <CartAddedModal/>
            <FavoriteAddedModal/>
        </main>
    );
}