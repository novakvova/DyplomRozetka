import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../store/api/client';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { SelectField } from '../components/SelectField';
import { useCreateAddressMutation } from '../store/api/addressesApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

const ADDRESS_TYPES = ['Домашня', 'Робоча', 'Інша'];
const COUNTRIES = ['Україна', 'Польща', 'Німеччина', 'Чехія', 'Молдова'];

export function AddressFormPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [createAddress, { isLoading }] = useCreateAddressMutation();

    const [addressType, setAddressType] = useState('');
    const [country, setCountry] = useState('');
    const [recipientName, setRecipientName] = useState(user?.fullName ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [city, setCity] = useState(user?.city ?? '');
    const [postalCode, setPostalCode] = useState('');
    const [street, setStreet] = useState('');
    const [house, setHouse] = useState('');
    const [apartment, setApartment] = useState('');
    const [notes, setNotes] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    if (!user) {
        return (
            <section className="profile-page profile-guest">
                <h1>Увійдіть, щоб додати адресу</h1>
                <button type="button" className="primary" onClick={() => navigate('/profile')}>До профілю</button>
            </section>
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!addressType || !country) {
            dispatch(messageSet('Оберіть тип адреси та країну.'));
            return;
        }

        try {
            await createAddress({
                addressType,
                recipientName,
                phone,
                country,
                city,
                postalCode,
                street,
                house,
                apartment,
                notes,
                isDefault,
            }).unwrap();
            dispatch(messageSet('Адресу збережено.'));
            navigate('/profile');
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося зберегти адресу.')));
        }
    }

    return (
        <section className="profile-page">
            <div className="profile-layout">
                <ProfileSidebar />

                <div className="profile-content">
                    <h1 className="address-form-title">Додати нову адресу</h1>
                    <p className="address-form-subtitle">
                        Заповніть інформацію для доставки замовлень на нову адресу
                    </p>

                    <form className="address-form" onSubmit={handleSubmit}>
                        <div className="address-form-body">
                            <label className="address-field address-field-wide">
                                Тип адреси
                                <SelectField
                                    value={addressType}
                                    onChange={setAddressType}
                                    options={ADDRESS_TYPES}
                                    placeholder="Оберіть тип адреси"
                                />
                            </label>

                            <label className="address-field">
                                Ім'я одержувача
                                <input
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    placeholder="Введіть ваше ім'я та прізвище"
                                    required
                                />
                            </label>

                            <label className="address-field">
                                Телефон
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+380 XX XXX XX XX"
                                    required
                                />
                            </label>

                            <label className="address-field address-field-wide">
                                Країна
                                <SelectField
                                    value={country}
                                    onChange={setCountry}
                                    options={COUNTRIES}
                                    placeholder="Оберіть країну"
                                />
                            </label>

                            <label className="address-field">
                                Місто
                                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Введіть місто" required />
                            </label>

                            <label className="address-field">
                                Індекс
                                <input
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    placeholder="Введіть поштовий індекс"
                                    required
                                />
                            </label>

                            <label className="address-field address-field-wide">
                                Вулиця
                                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Введіть назву вулиці" required />
                            </label>

                            <label className="address-field">
                                Будинок
                                <input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="№ будинку" required />
                            </label>

                            <label className="address-field">
                                Квартира або офіс <span className="address-field-optional">(необов'язково)</span>
                                <input value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="№ квартири або офісу" />
                            </label>

                            <label className="address-field address-field-wide">
                                Додаткова інформація <span className="address-field-optional">(необов'язково)</span>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Примітка для кур'єра, орієнтир тощо."
                                />
                            </label>
                        </div>

                        <label className="address-default-check">
                            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                            Зробити цю адресу за замовчуванням
                        </label>

                        <div className="address-form-actions">
                            <button type="button" onClick={() => navigate('/profile')}>Скасувати</button>
                            <button type="submit" className="primary" disabled={isLoading}>
                                {isLoading ? 'Збереження...' : 'Зберегти адресу'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}