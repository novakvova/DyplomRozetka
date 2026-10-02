import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { extractErrorMessage } from '../store/api/client';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { SelectField } from '../components/SelectField';
import { useCreatePaymentCardMutation, useGetPaymentCardsQuery, useUpdatePaymentCardMutation } from '../store/api/paymentCardsApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const YEARS = Array.from({ length: 16 }, (_, index) => String(new Date().getFullYear() + index));

function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return (digits.match(/.{1,4}/g) ?? []).join(' ');
}

function detectBrand(digits: string): 'Visa' | 'Mastercard' | '' {
    if (digits.length < 2) return '';
    if (digits.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(digits) || /^2(2[2-9][1-9]|2[3-9]\d{2}|[3-6]\d{3}|7[0-1]\d{2}|720\d)/.test(digits)) return 'Mastercard';
    return '';
}

export function PaymentCardFormPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const returnState = location.state as { returnTo?: string; checkoutDraft?: unknown } | null;
    const returnTo = returnState?.returnTo;
    const goBack = () => {
        if (returnTo) {
            navigate(returnTo, { state: { checkoutDraft: returnState?.checkoutDraft } });
        } else {
            navigate('/profile');
        }
    };
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const { id: editId } = useParams<{ id: string }>();
    const isEdit = Boolean(editId);
    const { data: cards = [], isLoading: cardsLoading } = useGetPaymentCardsQuery(undefined, { skip: !user });
    const editingCard = isEdit ? cards.find((card) => card.id === editId) : undefined;
    const [createPaymentCard, { isLoading: creating }] = useCreatePaymentCardMutation();
    const [updatePaymentCard, { isLoading: updating }] = useUpdatePaymentCardMutation();
    const isLoading = creating || updating;

    const [cardholderName, setCardholderName] = useState(user?.fullName ?? '');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!editingCard) return;
        setCardholderName(editingCard.cardholderName);
        setExpiryMonth(String(editingCard.expiryMonth).padStart(2, '0'));
        setExpiryYear(String(editingCard.expiryYear));
        setIsDefault(editingCard.isDefault);
    }, [editingCard?.id]);

    const digits = cardNumber.replace(/\D/g, '');
    const brand = useMemo(() => detectBrand(digits), [digits]);

    if (!user) {
        return (
            <section className="profile-page profile-guest">
                <h1>Увійдіть, щоб додати картку</h1>
                <button type="button" className="primary" onClick={() => navigate('/profile')}>До профілю</button>
            </section>
        );
    }

    if (isEdit && !cardsLoading && !editingCard) {
        return (
            <section className="profile-page profile-guest">
                <h1>Картку не знайдено</h1>
                <button type="button" className="primary" onClick={() => navigate('/profile')}>До профілю</button>
            </section>
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        if (isEdit && editId) {
            if (digits.length > 0 && digits.length < 13) {
                setFormError('Введіть повний номер картки або залиште поле порожнім.');
                return;
            }

            if (!expiryMonth || !expiryYear) {
                setFormError('Оберіть місяць і рік дії картки.');
                return;
            }

            try {
                await updatePaymentCard({
                    id: editId,
                    cardholderName,
                    cardNumber: digits || null,
                    expiryMonth: Number(expiryMonth),
                    expiryYear: Number(expiryYear),
                    isDefault,
                }).unwrap();
                dispatch(messageSet('Дані картки оновлено.'));
                goBack();
            } catch (error) {
                setFormError(extractErrorMessage(error, 'Не вдалося оновити картку.'));
            }
            return;
        }

        if (digits.length < 13) {
            setFormError('Введіть повний номер картки.');
            return;
        }

        if (!expiryMonth || !expiryYear) {
            setFormError('Оберіть місяць і рік дії картки.');
            return;
        }

        if (cvv.replace(/\D/g, '').length < 3) {
            setFormError('Введіть CVV-код з 3 або 4 цифр.');
            return;
        }

        try {
            await createPaymentCard({
                cardholderName,
                cardNumber: digits,
                expiryMonth: Number(expiryMonth),
                expiryYear: Number(expiryYear),
                cvv,
                isDefault,
            }).unwrap();
            dispatch(messageSet('Картку збережено.'));
            goBack();
        } catch (error) {
            setFormError(extractErrorMessage(error, 'Не вдалося зберегти картку.'));
        }
    }

    return (
        <section className="profile-page">
            <div className="profile-layout">
                <ProfileSidebar />

                <div className="profile-content">
                    <h1 className="address-form-title">{isEdit ? 'Редагувати картку' : returnTo ? 'Дані картки' : 'Додати картку'}</h1>
                    <p className="address-form-subtitle">
                        Дані картки шифруються і використовуються лише для оплати замовлень
                    </p>

                    <form className="address-form" onSubmit={handleSubmit}>
                        <div className="address-form-body">
                            <label className="address-field address-field-wide">
                                Ім'я власника картки
                                <input
                                    value={cardholderName}
                                    onChange={(event) => setCardholderName(event.target.value)}
                                    placeholder="Як вказано на картці"
                                    autoComplete="cc-name"
                                    required
                                />
                            </label>

                            <label className="address-field address-field-wide">
                                Номер картки
                                <span className="payment-card-number-field">
                                    <input
                                        value={formatCardNumber(cardNumber)}
                                        onChange={(event) => setCardNumber(event.target.value)}
                                        placeholder={isEdit && editingCard ? `•••• •••• •••• ${editingCard.last4}` : '0000 0000 0000 0000'}
                                        inputMode="numeric"
                                        autoComplete="cc-number"
                                        maxLength={23}
                                        required={!isEdit}
                                    />
                                    {brand && <span className="payment-card-brand-badge">{brand}</span>}
                                    {!brand && <CreditCard size={18} className="payment-card-generic-icon" />}
                                </span>
                            </label>

                            <label className="address-field">
                                Місяць дії
                                <SelectField value={expiryMonth} onChange={setExpiryMonth} options={MONTHS} placeholder="ММ" />
                            </label>

                            <label className="address-field">
                                Рік дії
                                <SelectField value={expiryYear} onChange={setExpiryYear} options={YEARS} placeholder="РРРР" />
                            </label>

                            {!isEdit && (
                                <label className="address-field">
                                    CVV
                                    <input
                                        value={cvv}
                                        onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="•••"
                                        inputMode="numeric"
                                        autoComplete="cc-csc"
                                        type="password"
                                        maxLength={4}
                                        required
                                    />
                                </label>
                            )}
                        </div>

                        <label className="address-default-check">
                            <input type="checkbox" checked={isDefault} disabled={Boolean(editingCard?.isDefault)} onChange={(event) => setIsDefault(event.target.checked)} />
                            Зробити цю картку основною
                        </label>

                        {formError && <p className="form-error-banner">{formError}</p>}

                        <div className="address-form-actions">
                            <button type="button" onClick={goBack}>Скасувати</button>
                            <button type="submit" className="primary" disabled={isLoading}>
                                {isLoading ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Зберегти картку'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}