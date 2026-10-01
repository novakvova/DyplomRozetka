import { FormEvent, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CreditCard, Home, Briefcase, KeyRound, MapPin, Plus, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { extractErrorMessage, resolveAssetUrl } from '../store/api/client';
import { AuthModal } from '../components/AuthModal';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { useDeleteAddressMutation, useGetAddressesQuery } from '../store/api/addressesApi';
import {
  useDeletePaymentCardMutation,
  useGetPaymentCardsQuery,
  useSetDefaultPaymentCardMutation,
} from '../store/api/paymentCardsApi';
import { useDeleteAvatarMutation, useUpdateProfileMutation, useUploadAvatarMutation } from '../store/api/authApi';
import { userUpdated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

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
  const { data: paymentCards = [] } = useGetPaymentCardsQuery(undefined, { skip: !user });
  const [deletePaymentCard] = useDeletePaymentCardMutation();
  const [setDefaultPaymentCard] = useSetDefaultPaymentCardMutation();

  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadAvatar, { isLoading: avatarUploading }] = useUploadAvatarMutation();
  const [deleteAvatar, { isLoading: avatarDeleting }] = useDeleteAvatarMutation();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const nextUser = await uploadAvatar(file).unwrap();
      dispatch(userUpdated(nextUser));
      dispatch(messageSet('Фото профілю оновлено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося завантажити фото.')));
    }
  }

  async function handleAvatarDelete() {
    try {
      const nextUser = await deleteAvatar().unwrap();
      dispatch(userUpdated(nextUser));
      dispatch(messageSet('Фото профілю видалено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося видалити фото.')));
    }
  }

  async function updateProfileHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      city: string;
      birthDate: string;
      gender: string;
    };

    const fullName = [data.firstName, data.lastName].map((part) => part.trim()).filter(Boolean).join(' ');

    try {
      const nextUser = await updateProfile({
        fullName,
        phone: data.phone.trim(),
        email: data.email.trim(),
        city: data.city.trim(),
        birthDate: data.birthDate || null,
        gender: data.gender || null,
      }).unwrap();
      dispatch(userUpdated(nextUser));
      setEditing(false);
      dispatch(messageSet('Профіль оновлено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оновити профіль.')));
    }
  }

  async function handleSetDefaultCard(id: string) {
    try {
      await setDefaultPaymentCard(id).unwrap();
      dispatch(messageSet('Основну картку оновлено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оновити картку.')));
    }
  }

  async function handleDeleteCard(id: string) {
    try {
      await deletePaymentCard(id).unwrap();
      dispatch(messageSet('Картку видалено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося видалити картку.')));
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
  const defaultCard = paymentCards.find((card) => card.isDefault) ?? paymentCards[0];

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

                <div className="profile-avatar-row">
                  <div className="profile-avatar-preview">
                    {user.avatarUrl ? (
                        <img src={resolveAssetUrl(user.avatarUrl)} alt={user.fullName} />
                    ) : (
                        <span>{initials(user.fullName)}</span>
                    )}
                  </div>
                  <div className="profile-avatar-actions">
                    <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading || avatarDeleting}
                    >
                      <Camera size={15} /> {avatarUploading ? 'Завантаження...' : user.avatarUrl ? 'Змінити фото' : 'Додати фото'}
                    </button>
                    {user.avatarUrl && (
                        <button
                            type="button"
                            className="profile-avatar-remove"
                            onClick={handleAvatarDelete}
                            disabled={avatarUploading || avatarDeleting}
                        >
                          <Trash2 size={15} /> {avatarDeleting ? 'Видалення...' : 'Видалити'}
                        </button>
                    )}
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                {editing ? (
                    <form className="profile-edit-form" onSubmit={updateProfileHandler}>
                      <label>
                        Ім'я
                        <input name="firstName" defaultValue={firstName} required />
                      </label>
                      <label>
                        Прізвище
                        <input name="lastName" defaultValue={restName.join(' ')} />
                      </label>
                      <label>
                        Дата народження
                        <input
                            name="birthDate"
                            type="date"
                            defaultValue={user.birthDate ? user.birthDate.slice(0, 10) : ''}
                            max={new Date().toISOString().slice(0, 10)}
                        />
                      </label>
                      <label>
                        Телефон
                        <input name="phone" defaultValue={user.phone} />
                      </label>
                      <label>
                        Email
                        <input name="email" type="email" defaultValue={user.email} required />
                      </label>
                      <label>
                        Місто
                        <input name="city" defaultValue={user.city} />
                      </label>

                      <div className="auth-modal-field-label">
                        Стать
                        <div className="auth-modal-gender-row">
                          <label className="auth-modal-radio">
                            <input type="radio" name="gender" value="male" defaultChecked={user.gender === 'male'} />
                            Чоловіча
                          </label>
                          <label className="auth-modal-radio">
                            <input type="radio" name="gender" value="female" defaultChecked={user.gender === 'female'} />
                            Жіноча
                          </label>
                        </div>
                      </div>

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
                      <div>
                        <dt>Картка</dt>
                        <dd>
                          {defaultCard ? (
                              `•••• ${defaultCard.last4}`
                          ) : (
                              <button
                                  type="button"
                                  className="profile-data-list-link"
                                  onClick={() => navigate('/profile/payment-cards/new')}
                              >
                                Додати картку
                              </button>
                          )}
                        </dd>
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

            <div className="profile-card">
              <div className="profile-card-head">
                <h2>Оплата</h2>
              </div>

              <div className="profile-payment-cards">
                {paymentCards.map((card) => (
                    <div className="profile-payment-card" key={card.id}>
                      <span className="profile-payment-brand">{card.brand === 'Card' ? <CreditCard size={18} /> : card.brand}</span>
                      <div className="profile-address-body">
                        <strong>
                          •••• {card.last4}
                          {card.isDefault && <span className="profile-address-default">основна</span>}
                        </strong>
                        <span>
                          {card.cardholderName} · дійсна до {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                        </span>
                      </div>
                      <div className="profile-payment-actions">
                        {!card.isDefault && (
                            <button type="button" onClick={() => handleSetDefaultCard(card.id)}>
                              Зробити основною
                            </button>
                        )}
                        <button
                            type="button"
                            className="profile-address-delete"
                            onClick={() => handleDeleteCard(card.id)}
                            aria-label="Видалити картку"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                ))}

                {paymentCards.length === 0 && (
                    <p className="profile-empty-note">У вас ще немає збережених карток.</p>
                )}

                <button type="button" className="profile-add-address" onClick={() => navigate('/profile/payment-cards/new')}>
                  <Plus size={17} /> Додати картку
                </button>
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