import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useResetPasswordMutation } from '../store/api/authApi';
import { extractErrorMessage } from '../store/api/client';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();

    const email = searchParams.get('email') ?? '';
    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] =
        useState(false);

    const [success, setSuccess] = useState(false);

    const [resetPassword, { isLoading }] =
        useResetPasswordMutation();

    const linkIsValid = Boolean(email && token);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!linkIsValid) {
            dispatch(
                messageSet(
                    'Посилання для відновлення пароля недійсне.',
                ),
            );
            return;
        }

        if (password !== passwordConfirm) {
            dispatch(messageSet('Паролі не збігаються.'));
            return;
        }

        const strongEnough =
            password.length >= 8 &&
            /\d/.test(password) &&
            /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(password);

        if (!strongEnough) {
            dispatch(
                messageSet(
                    'Пароль повинен містити щонайменше 8 символів, цифри та літери.',
                ),
            );
            return;
        }

        try {
            await resetPassword({
                email,
                token,
                newPassword: password,
            }).unwrap();

            setSuccess(true);
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося змінити пароль. Посилання могло стати недійсним.',
                    ),
                ),
            );
        }
    }

    if (!linkIsValid) {
        return (
            <section className="password-recovery-page">
                <div className="password-recovery-card">
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

                    <h1>Недійсне посилання</h1>

                    <p className="password-recovery-description">
                        Посилання для відновлення пароля пошкоджене
                        або містить недостатньо даних.
                    </p>

                    <button
                        type="button"
                        className="password-recovery-submit"
                        onClick={() => navigate('/forgot-password')}
                    >
                        Отримати нове посилання
                    </button>
                </div>
            </section>
        );
    }

    if (success) {
        return (
            <section className="password-recovery-page">
                <div className="password-recovery-card">
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

                    <h1>Пароль змінено</h1>

                    <p className="password-recovery-description">
                        Новий пароль успішно встановлено.
                        Тепер ви можете увійти до свого акаунта.
                    </p>

                    <button
                        type="button"
                        className="password-recovery-submit"
                        onClick={() => navigate('/')}
                    >
                        Перейти до входу
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="password-recovery-page">
            <div className="password-recovery-card">
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

                <h1>Новий пароль</h1>

                <p className="password-recovery-description">
                    Створіть новий пароль для акаунта
                    <strong> {email}</strong>.
                </p>

                <form
                    className="password-recovery-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        Новий пароль

                        <div className="password-recovery-password">
                            <input
                                type={
                                    showPassword
                                        ? 'text'
                                        : 'password'
                                }
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Новий пароль"
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        (current) => !current,
                                    )
                                }
                                aria-label="Показати пароль"
                            >
                                {showPassword ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>
                        </div>
                    </label>

                    <label>
                        Повторіть пароль

                        <div className="password-recovery-password">
                            <input
                                type={
                                    showPasswordConfirm
                                        ? 'text'
                                        : 'password'
                                }
                                value={passwordConfirm}
                                onChange={(event) =>
                                    setPasswordConfirm(
                                        event.target.value,
                                    )
                                }
                                placeholder="Повторіть пароль"
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPasswordConfirm(
                                        (current) => !current,
                                    )
                                }
                                aria-label="Показати пароль"
                            >
                                {showPasswordConfirm ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>
                        </div>
                    </label>

                    <p className="password-recovery-hint">
                        Щонайменше 8 символів, цифри та літери.
                    </p>

                    <button
                        type="submit"
                        className="password-recovery-submit"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? 'Змінюємо...'
                            : 'Змінити пароль'}
                    </button>
                </form>
            </div>
        </section>
    );
}