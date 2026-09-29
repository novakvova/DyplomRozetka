import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

import { useForgotPasswordMutation } from '../store/api/authApi';
import { extractErrorMessage } from '../store/api/client';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const [forgotPassword, { isLoading }] =
        useForgotPasswordMutation();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            dispatch(messageSet('Введіть електронну пошту.'));
            return;
        }

        try {
            await forgotPassword({
                email: normalizedEmail,
            }).unwrap();

            setSent(true);
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося надіслати лист для відновлення пароля.',
                    ),
                ),
            );
        }
    }

    return (
        <section className="password-recovery-page">
            <div className="password-recovery-card">
                <button
                    type="button"
                    className="password-recovery-back"
                    onClick={() => navigate('/')}
                    aria-label="Назад"
                >
                    <ArrowLeft size={20} />
                </button>

                <div
                    className="brand-word password-recovery-logo"
                    aria-label="Lumio"
                >
                    Lum
                    <span className="brand-i">
                        ı<i className="brand-star">★</i>
                    </span>
                    o
                </div>

                {!sent ? (
                    <>
                        <h1>Відновлення пароля</h1>

                        <p className="password-recovery-description">
                            Введіть електронну пошту, вказану під час
                            реєстрації. Ми надішлемо посилання для
                            створення нового пароля.
                        </p>

                        <form
                            className="password-recovery-form"
                            onSubmit={handleSubmit}
                        >
                            <label>
                                Електронна пошта

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="example@gmail.com"
                                    autoComplete="email"
                                    required
                                />
                            </label>

                            <button
                                type="submit"
                                className="password-recovery-submit"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? 'Надсилаємо...'
                                    : 'Відновити пароль'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="password-recovery-success">
                        <div className="password-recovery-mail-icon">
                            <Mail size={32} />
                        </div>

                        <h1>Перевірте пошту</h1>

                        <p>
                            Якщо акаунт з адресою
                            <strong> {email}</strong> існує, ми
                            надіслали на нього посилання для
                            відновлення пароля.
                        </p>

                        <button
                            type="button"
                            className="password-recovery-submit"
                            onClick={() => navigate('/')}
                        >
                            Повернутися на головну
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}