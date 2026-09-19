import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, KeyRound, MapPin, Plus, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '../store/api/client';
import { AuthModal } from '../components/AuthModal';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { useDeleteAddressMutation, useGetAddressesQuery } from '../store/api/addressesApi';
import { useUpdateProfileMutation } from '../store/api/authApi';
import { userUpdated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

function formatBirthDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfile] = useUpdateProfileMutation();
  const { data: addresses = [] } = useGetAddressesQuery(undefined, { skip: !user });
  const [deleteAddress] = useDeleteAddressMutation();

  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  async function updateProfileHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as {
      fullName: string;
      phone: string;
      city: string;
    };

    try {
      const nextUser = await updateProfile(data).unwrap();
      dispatch(userUpdated(nextUser));
      setEditing(false);
      dispatch(messageSet('Профіль оновлено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оновити профіль.')));
    }
  }

  if (!user) {
    return (
        <section className="profile-page profile-guest">
          <h1>Увійдіть в акаунт Lumio</h1>
          <p>Щоб бачити профіль, замовлення, адреси та список бажань.</p>
          <button type="button" className="primary" onClick={() => setAuthOpen(true)}>
            Увійти або зареєструватися
          </button>
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </section>
    );
  }

  const [firstName, ...restName] = user.fullName.trim().split(/\s+/);

  return (
      <section className="profile-page">
        <div className="profile-layout">
          <ProfileSidebar />

          <div className="profile-content">
            <div className="profile-cards-row">
              <div className="profile-card">
                <div className="profile-card-head">
                  <h2>Особисті дані</h2>
                  <button type="button" onClick={() => setEditing((value) => !value)}>
                    {editing ? 'Скасувати' : 'Редагувати'}
                  </button>
                </div>

                {editing ? (
                    <form className="profile-edit-form" onSubmit={updateProfileHandler}>
                      <label>
                        ПІБ
                        <input name="fullName" defaultValue={user.fullName} required />
                      </label>
                      <label>
                        Телефон
                        <input name="phone" defaultValue={user.phone} />
                      </label>
                      <label>
                        Місто
                        <input name="city" defaultValue={user.city} />
                      </label>
                      <button className="primary">Зберегти</button>
                    </form>
                ) : (
                    <dl className="profile-data-list">
                      <div>
                        <dt>Ім'я</dt>
                        <dd>{firstName || '—'}</dd>
                      </div>
                      <div>
                        <dt>Прізвище</dt>
                        <dd>{restName.join(' ') || '—'}</dd>
                      </div>
                      <div>
                        <dt>Дата народження</dt>
                        <dd>{formatBirthDate(user.birthDate)}</dd>
                      </div>
                      <div>
                        <dt>Телефон</dt>
                        <dd>{user.phone || '—'}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{user.email}</dd>
                      </div>
                      <div>
                        <dt>Місто</dt>
                        <dd>{user.city || '—'}</dd>
                      </div>
                    </dl>
                )}
              </div>

              <div className="profile-card">
                <div className="profile-card-head">
                  <h2>Адреси</h2>
                </div>

                <div className="profile-addresses">
                  {addresses.map((address) => (
                      <div className="profile-address" key={address.id}>
                    <span className="profile-address-icon">
                      {address.addressType === 'Робоча' ? <Briefcase size={17} /> : <Home size={17} />}
                    </span>
                        <div className="profile-address-body">
                          <strong>
                            {address.addressType || 'Адреса'}
                            {address.isDefault && <span className="profile-address-default">за замовчуванням</span>}
                          </strong>
                          <span>
                        {address.street} {address.house}
                            {address.apartment ? `, кв. ${address.apartment}` : ''}
                      </span>
                          <span>{[address.postalCode, address.city, address.country].filter(Boolean).join(', ')}</span>
                        </div>
                        <button
                            type="button"
                            className="profile-address-delete"
                            onClick={() => deleteAddress(address.id)}
                            aria-label="Видалити адресу"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                  ))}

                  {addresses.length === 0 && (
                      <p className="profile-empty-note">У вас ще немає збережених адрес.</p>
                  )}

                  <button type="button" className="profile-add-address" onClick={() => navigate('/profile/addresses/new')}>
                    <Plus size={17} /> Додати нову адресу
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-card" id="security">
              <div className="profile-card-head">
                <h2>Безпека</h2>
              </div>

              <div className="profile-security-rows">
                <div className="profile-security-row">
                  <span className="profile-security-icon"><KeyRound size={17} /></span>
                  <div>
                    <strong>Пароль</strong>
                    <span>Рекомендуємо оновлювати пароль раз на кілька місяців</span>
                  </div>
                  <button type="button" onClick={() => navigate('/profile/password')}>Змінити</button>
                </div>

                <div className="profile-security-row">
                  <span className="profile-security-icon"><ShieldCheck size={17} /></span>
                  <div>
                    <strong>Двоетапна аутентифікація</strong>
                    <span>{user.twoFactorEnabled ? 'Увімкнена — ваш акаунт додатково захищено' : 'Підвищіть рівень захисту вашого акаунту'}</span>
                  </div>
                  <button type="button" onClick={() => navigate('/profile/2fa')}>
                    {user.twoFactorEnabled ? 'Керувати' : 'Увімкнути'}
                  </button>
                </div>

                <div className="profile-security-row">
                  <span className="profile-security-icon"><Smartphone size={17} /></span>
                  <div>
                    <strong>Активна сесія</strong>
                    <span>Ви увійшли в цьому браузері</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-card-head">
                <h2>Мої списки</h2>
              </div>
              <div className="profile-lists">
                <button type="button" onClick={() => navigate('/favorites')}>
                  <MapPin size={16} /> Обране
                </button>
                <button type="button" onClick={() => navigate('/orders')}>
                  <MapPin size={16} /> Замовлення
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}