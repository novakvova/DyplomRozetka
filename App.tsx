import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { resolveUserRole } from './src/data/admin';
import { AdminScreen } from './src/screens/admin-screen';
import { CartScreen } from './src/screens/cart-screen';
import { ChangePasswordScreen } from './src/screens/change-password-screen';
import { CheckoutScreen } from './src/screens/checkout-screen';
import { HomeScreen } from './src/screens/home-screen';
import { LoginScreen } from './src/screens/login-screen';
import { OrdersScreen } from './src/screens/orders-screen';
import { ProfileScreen } from './src/screens/profile-screen';
import { ProductDetailsScreen } from './src/screens/product-details-screen';
import { RecoveryScreen } from './src/screens/recovery-screen';
import { RegisterScreen } from './src/screens/register-screen';
import { seedCatalogDatabase } from './src/storage/catalog-storage';
import { loadUserProfile, saveUserProfile } from './src/storage/profile-storage';
import { clearSession, loadSession, saveSession } from './src/storage/session-storage';
import { loadRegisteredUsers, saveRegisteredUsers } from './src/storage/users-storage';
import { colors } from './src/theme/colors';
import type {
  AuthActionResult,
  AuthProvider,
  AuthSession,
  GoogleLoginPayload,
  RegisteredUser,
  UserRole,
} from './src/types/auth';

type AuthScreen = 'login' | 'register' | 'recovery';
type CabinetScreen =
  | 'home'
  | 'profile'
  | 'change-password'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'admin'
  | 'product-details';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [lastEmail, setLastEmail] = useState('');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [loginNotice, setLoginNotice] = useState('');
  const [cabinetScreen, setCabinetScreen] = useState<CabinetScreen>('home');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cabinetNotice, setCabinetNotice] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      const [storedSession, users] = await Promise.all([
        loadSession(),
        seedCatalogDatabase().then(() => loadRegisteredUsers()),
      ]);

      if (!isMounted) {
        return;
      }

      setSession(storedSession);
      setLastEmail(storedSession?.email ?? '');
      setCurrentUserRole(
        storedSession
          ? users.find(
              (user) => user.email.trim().toLowerCase() === storedSession.email.trim().toLowerCase()
            )?.role ?? resolveUserRole(storedSession.email)
          : 'user'
      );
      setIsHydrating(false);
    };

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthActionResult> => {
    const users = await loadRegisteredUsers();
    const registeredUser = users.find(
      (user) => user.email.trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (!registeredUser) {
      return {
        ok: false,
        message: 'Користувача з таким email не знайдено. Спочатку створіть акаунт.',
      };
    }

    if (!registeredUser.authMethods.includes('credentials') || !registeredUser.password) {
      return {
        ok: false,
        message:
          'Для цього акаунта налаштовано вхід через Google. Скористайтеся кнопкою Google-входу.',
      };
    }

    if (registeredUser.password !== password) {
      return {
        ok: false,
        message: 'Невірний пароль. Спробуйте ще раз.',
      };
    }

    const nextSession: AuthSession = {
      email: registeredUser.email,
      loggedInAt: new Date().toISOString(),
    };

    setLoginNotice('');
    setCabinetNotice('');
    setCabinetScreen('home');
    setCurrentUserRole(registeredUser.role);
    setLastEmail(nextSession.email);
    setSession(nextSession);
    await saveSession(nextSession);

    return { ok: true };
  };

  const handleRegister = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthActionResult> => {
    const users = await loadRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = users.some(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    if (userExists) {
      return {
        ok: false,
        message: 'Користувач з таким email уже існує. Увійдіть у свій акаунт.',
      };
    }

    const timestamp = new Date().toISOString();
    const nextUser: RegisteredUser = {
      email: normalizedEmail,
      authMethods: ['credentials'],
      role: resolveUserRole(normalizedEmail),
      password,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await saveRegisteredUsers([...users, nextUser]);

    const nextSession: AuthSession = {
      email: nextUser.email,
      loggedInAt: timestamp,
    };

    setLoginNotice('');
    setCabinetNotice('');
    setCabinetScreen('home');
    setCurrentUserRole(nextUser.role);
    setLastEmail(nextUser.email);
    setSession(nextSession);
    await saveSession(nextSession);

    return { ok: true };
  };

  const handleRecoverPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthActionResult> => {
    const users = await loadRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const userIndex = users.findIndex(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    if (userIndex === -1) {
      return {
        ok: false,
        message: 'Користувача з таким email не знайдено. Спочатку створіть акаунт.',
      };
    }

    if (!users[userIndex].authMethods.includes('credentials') || !users[userIndex].password) {
      return {
        ok: false,
        message:
          'Для цього акаунта пароль не використовується. Увійдіть через Google замість відновлення пароля.',
      };
    }

    if (users[userIndex].password === password) {
      return {
        ok: false,
        message: 'Новий пароль має відрізнятися від поточного.',
      };
    }

    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password,
      updatedAt: new Date().toISOString(),
    };

    await saveRegisteredUsers(updatedUsers);
    setLastEmail(normalizedEmail);
    setLoginNotice('Пароль оновлено. Тепер увійдіть з новим паролем.');
    setAuthScreen('login');

    return { ok: true };
  };

  const handleChangePassword = async ({
    currentPassword,
    nextPassword,
  }: {
    currentPassword: string;
    nextPassword: string;
  }): Promise<AuthActionResult> => {
    if (!session) {
      return {
        ok: false,
        message: 'Спочатку увійдіть у свій акаунт.',
      };
    }

    const users = await loadRegisteredUsers();
    const normalizedEmail = session.email.trim().toLowerCase();
    const userIndex = users.findIndex(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    if (userIndex === -1) {
      return {
        ok: false,
        message: 'Користувача не знайдено. Спробуйте увійти ще раз.',
      };
    }

    if (!users[userIndex].authMethods.includes('credentials') || !users[userIndex].password) {
      return {
        ok: false,
        message:
          'Цей акаунт працює через Google-вхід. Змінювати пароль для нього не потрібно.',
      };
    }

    if (users[userIndex].password !== currentPassword) {
      return {
        ok: false,
        message: 'Поточний пароль введено невірно.',
      };
    }

    if (currentPassword === nextPassword) {
      return {
        ok: false,
        message: 'Новий пароль має відрізнятися від поточного.',
      };
    }

    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: nextPassword,
      updatedAt: new Date().toISOString(),
    };

    await saveRegisteredUsers(updatedUsers);
    setCabinetNotice('Пароль успішно змінено. Нові дані вже активні.');
    setCabinetScreen('home');

    return { ok: true };
  };

  const handleGoogleLogin = async ({
    email,
    fullName,
    avatarUrl,
    googleSubject,
  }: GoogleLoginPayload): Promise<AuthActionResult> => {
    const users = await loadRegisteredUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const timestamp = new Date().toISOString();
    const userIndex = users.findIndex(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );

    let nextUser: RegisteredUser;
    let updatedUsers: RegisteredUser[];

    if (userIndex === -1) {
      nextUser = {
        email: normalizedEmail,
        authMethods: ['google'],
        role: resolveUserRole(normalizedEmail),
        fullName: fullName.trim(),
        avatarUrl: avatarUrl?.trim() || undefined,
        googleSubject: googleSubject?.trim() || undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      updatedUsers = [...users, nextUser];
    } else {
      const currentUser = users[userIndex];
      const nextAuthMethods = Array.from(
        new Set<AuthProvider>([...currentUser.authMethods, 'google'])
      );

      nextUser = {
        ...currentUser,
        authMethods: nextAuthMethods,
        fullName: fullName.trim() || currentUser.fullName,
        avatarUrl: avatarUrl?.trim() || currentUser.avatarUrl,
        googleSubject: googleSubject?.trim() || currentUser.googleSubject,
        updatedAt: timestamp,
      };

      updatedUsers = [...users];
      updatedUsers[userIndex] = nextUser;
    }

    await saveRegisteredUsers(updatedUsers);

    const storedProfile = await loadUserProfile(normalizedEmail);
    await saveUserProfile({
      email: normalizedEmail,
      fullName: fullName.trim() || storedProfile?.fullName || 'Покупець Rozetka',
      phone: storedProfile?.phone ?? '',
      city: storedProfile?.city ?? 'Київ',
      novaPoshta: storedProfile?.novaPoshta,
      updatedAt: timestamp,
    });

    const nextSession: AuthSession = {
      email: normalizedEmail,
      loggedInAt: timestamp,
    };

    setLoginNotice('');
    setCabinetNotice('Вхід через Google виконано успішно.');
    setCabinetScreen('home');
    setCurrentUserRole(nextUser.role);
    setLastEmail(normalizedEmail);
    setSession(nextSession);
    await saveSession(nextSession);

    return { ok: true };
  };

  const handleProfileSaved = (message: string) => {
    setCabinetNotice(message);
    setCabinetScreen('home');
  };

  const handleOrderPlaced = (message: string) => {
    setCabinetNotice(message);
    setCabinetScreen('home');
  };

  const handleLogout = async () => {
    setLastEmail(session?.email ?? lastEmail);
    setSession(null);
    setLoginNotice('');
    setCabinetNotice('');
    setCabinetScreen('home');
    setCurrentUserRole('user');
    setAuthScreen('login');
    await clearSession();
  };

  const openLogin = () => {
    setLoginNotice('');
    setAuthScreen('login');
  };

  const openRegister = () => {
    setLoginNotice('');
    setAuthScreen('register');
  };

  const openRecovery = () => {
    setLoginNotice('');
    setAuthScreen('recovery');
  };

  const openChangePassword = () => {
    setCabinetNotice('');
    setCabinetScreen('change-password');
  };

  const openProfile = () => {
    setCabinetNotice('');
    setCabinetScreen('profile');
  };

  const openCart = () => {
    setCabinetNotice('');
    setCabinetScreen('cart');
  };

  const openCheckout = () => {
    setCabinetNotice('');
    setCabinetScreen('checkout');
  };

  const openOrders = () => {
    setCabinetNotice('');
    setCabinetScreen('orders');
  };

  const openAdmin = () => {
    if (currentUserRole !== 'admin') {
      setCabinetNotice('Доступ до адмін-панелі відкрито лише для адміністратора.');
      setCabinetScreen('home');
      return;
    }

    setCabinetNotice('');
    setCabinetScreen('admin');
  };

  const openProductDetails = (productId: string) => {
    setCabinetNotice('');
    setSelectedProductId(productId);
    setCabinetScreen('product-details');
  };

  const openCabinetHome = () => {
    setCabinetNotice('');
    setCabinetScreen('home');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {isHydrating ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : session ? (
        cabinetScreen === 'orders' ? (
          <OrdersScreen
            email={session.email}
            onBack={openCabinetHome}
            onOpenCart={openCart}
          />
        ) : cabinetScreen === 'admin' ? (
          <AdminScreen currentEmail={session.email} onBack={openCabinetHome} />
        ) : cabinetScreen === 'product-details' ? (
          <ProductDetailsScreen
            email={session.email}
            productId={selectedProductId}
            onBack={openCabinetHome}
            onOpenCart={openCart}
            onOpenProduct={openProductDetails}
          />
        ) : cabinetScreen === 'checkout' ? (
          <CheckoutScreen
            email={session.email}
            onBack={openCart}
            onPlaced={handleOrderPlaced}
          />
        ) : cabinetScreen === 'cart' ? (
          <CartScreen email={session.email} onBack={openCabinetHome} onOpenCheckout={openCheckout} />
        ) : cabinetScreen === 'profile' ? (
          <ProfileScreen
            email={session.email}
            onBack={openCabinetHome}
            onSaved={handleProfileSaved}
          />
        ) : cabinetScreen === 'change-password' ? (
          <ChangePasswordScreen
            email={session.email}
            onChangePassword={handleChangePassword}
            onBack={openCabinetHome}
          />
        ) : (
          <HomeScreen
            session={session}
            isAdmin={currentUserRole === 'admin'}
            notice={cabinetNotice}
            onOpenAdmin={openAdmin}
            onOpenOrders={openOrders}
            onOpenCart={openCart}
            onOpenProduct={openProductDetails}
            onOpenProfile={openProfile}
            onOpenChangePassword={openChangePassword}
            onLogout={handleLogout}
          />
        )
      ) : authScreen === 'recovery' ? (
        <RecoveryScreen
          initialEmail={lastEmail}
          onRecoverPassword={handleRecoverPassword}
          onOpenLogin={openLogin}
          onOpenRegister={openRegister}
        />
      ) : authScreen === 'register' ? (
        <RegisterScreen
          initialEmail={lastEmail}
          onRegister={handleRegister}
          onOpenLogin={openLogin}
        />
      ) : (
        <LoginScreen
          initialEmail={lastEmail}
          notice={loginNotice}
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onOpenRegister={openRegister}
          onOpenRecovery={openRecovery}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
