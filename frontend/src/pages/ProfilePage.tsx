import { FormEvent } from 'react';
import type { AuthMode } from '../App';
import type { User } from '../types';

type ProfilePageProps = {
  user: User | null;
  authMode: AuthMode;
  onAuthModeChange: (mode: AuthMode) => void;
  onSubmitAuth: (event: FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  onUpdateProfile: (event: FormEvent<HTMLFormElement>) => void;
  onChangePassword: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProfilePage({
  user,
  authMode,
  onAuthModeChange,
  onSubmitAuth,
  onGoogleLogin,
  onUpdateProfile,
  onChangePassword,
}: ProfilePageProps) {
  return (
    <section className="split">
      {!user ? (
        <form onSubmit={onSubmitAuth}>
          <div className="tabs">
            <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => onAuthModeChange('login')}>Вхід</button>
            <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => onAuthModeChange('register')}>Реєстрація</button>
            <button type="button" className={authMode === 'recover' ? 'active' : ''} onClick={() => onAuthModeChange('recover')}>Recovery</button>
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
          <button type="button" onClick={onGoogleLogin}>Увійти через Google</button>
        </form>
      ) : (
        <>
          <form onSubmit={onUpdateProfile}>
            <h1>Профіль</h1>
            <input name="fullName" defaultValue={user.fullName} placeholder="ПІБ" required />
            <input name="phone" defaultValue={user.phone} placeholder="Телефон" />
            <input name="city" defaultValue={user.city} placeholder="Місто" />
            <button className="primary">Зберегти профіль</button>
          </form>
          <form onSubmit={onChangePassword}>
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
