import { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../api/client';
import {
  useChangePasswordMutation,
  useGoogleLoginMutation,
  useLoginMutation,
  useRecoverPasswordMutation,
  useRegisterMutation,
  useUpdateProfileMutation,
} from '../store/api/authApi';
import { credentialsSet, userUpdated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authModeSet, messageSet } from '../store/uiSlice';
import type { AuthResponse } from '../types';

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

export function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const authMode = useAppSelector((state) => state.ui.authMode);
  const [login] = useLoginMutation();
  const [register] = useRegisterMutation();
  const [recoverPassword] = useRecoverPasswordMutation();
  const [googleLoginMutation] = useGoogleLoginMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();

  function saveAuth(response: AuthResponse) {
    dispatch(credentialsSet(response));
    dispatch(authModeSet('login'));
    dispatch(messageSet(`Вітаємо, ${response.user.fullName}!`));
    navigate('/');
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      if (authMode === 'recover') {
        await recoverPassword({
          email: data.get('email') as string,
          newPassword: data.get('password') as string,
        }).unwrap();
        form.reset();
        dispatch(authModeSet('login'));
        dispatch(messageSet('Пароль оновлено. Тепер можна увійти.'));
        return;
      }

      if (authMode === 'register' && data.get('password') !== data.get('passwordConfirm')) {
        dispatch(messageSet('Підтвердження паролю не збігається.'));
        return;
      }

      const payload = Object.fromEntries(data.entries()) as Record<string, string>;
      const response = authMode === 'login'
          ? await login({ email: payload.email, password: payload.password }).unwrap()
          : await register({
            email: payload.email,
            password: payload.password,
            fullName: payload.fullName,
            phone: payload.phone,
            city: payload.city,
          }).unwrap();

      saveAuth(response);
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Помилка авторизації.')));
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
            dispatch(messageSet('Google не повернув access token.'));
            return;
          }

          const profile = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }).then((response) => response.json() as Promise<{ email: string; name: string }>);

          const response = await googleLoginMutation({
            email: profile.email,
            fullName: profile.name,
            googleToken: tokenResponse.access_token,
          }).unwrap();
          saveAuth(response);
        },
      }).requestAccessToken();
      return;
    }

    const email = window.prompt('Введіть Google email для демонстраційного входу');
    if (!email) return;

    const response = await googleLoginMutation({
      email,
      fullName: email.split('@')[0],
      googleToken: 'google-demo-token',
    }).unwrap();
    saveAuth(response);
  }

  async function updateProfileHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as {
      fullName: string;
      phone: string;
      city: string;
    };

    try {
      const nextUser = await updateProfile(data).unwrap();
      dispatch(userUpdated(nextUser));
      dispatch(messageSet('Профіль оновлено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оновити профіль.')));
    }
  }

  async function changePasswordHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as {
      currentPassword: string;
      newPassword: string;
    };

    try {
      await changePassword(data).unwrap();
      event.currentTarget.reset();
      dispatch(messageSet('Пароль змінено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося змінити пароль.')));
    }
  }

  return (
      <section className="split">
        {!user ? (
            <form onSubmit={submitAuth}>
              <div className="tabs">
                <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => dispatch(authModeSet('login'))}>Вхід</button>
                <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => dispatch(authModeSet('register'))}>Реєстрація</button>
                <button type="button" className={authMode === 'recover' ? 'active' : ''} onClick={() => dispatch(authModeSet('recover'))}>Recovery</button>
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
              <form onSubmit={updateProfileHandler}>
                <h1>Профіль</h1>
                <input name="fullName" defaultValue={user.fullName} placeholder="ПІБ" required />
                <input name="phone" defaultValue={user.phone} placeholder="Телефон" />
                <input name="city" defaultValue={user.city} placeholder="Місто" />
                <button className="primary">Зберегти профіль</button>
              </form>
              <form onSubmit={changePasswordHandler}>
                <h2>Зміна паролю</h2>
                <input name="currentPassword" type="password" placeholder="Поточний пароль" required />
                <input name="newPassword" type="password" placeholder="Новий пароль" required />
                <button>Змінити пароль</button>
              </form>
            </>
        )}
      </section>
  );
}