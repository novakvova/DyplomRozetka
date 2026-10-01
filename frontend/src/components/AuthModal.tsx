import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, ChevronLeft, Eye, EyeOff, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

import { extractErrorMessage } from '../store/api/client';
import { useGoogleLoginMutation, useLoginMutation, useLoginTwoFactorMutation, useRegisterMutation, useResendLoginCodeMutation, useUploadAvatarMutation } from '../store/api/authApi';
import { credentialsSet, userUpdated } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';
import type { LoginResult } from '../types';

type AuthModalProps = {
    open: boolean;
    onClose: () => void;
};

type RegisterStep = 1 | 2 | 3 | 4;

type RegisterForm = {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    passwordConfirm: string;
    birthDate: string;
    gender: 'male' | 'female';
};

const EMPTY_FORM: RegisterForm = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirm: '',
    birthDate: '',
    gender: 'male',
};

function Logo() {
    return (
        <span className="brand-word auth-modal-logo" aria-label="Lumio">
            Lum
            <span className="brand-i">
                ı<i className="brand-star">★</i>
            </span>
            o
        </span>
    );
}

function Dots({ step }: { step: RegisterStep }) {
    return (
        <div className="auth-modal-dots">
            {[1, 2, 3, 4].map((dot) => (
                <span
                    key={dot}
                    className={`auth-modal-dot${
                        dot <= step ? ' auth-modal-dot-filled' : ''
                    }`}
                />
            ))}
        </div>
    );
}

export function AuthModal({ open, onClose }: AuthModalProps) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [login, { isLoading: loginLoading }] = useLoginMutation();
    const [googleLogin] = useGoogleLoginMutation();
    const [loginTwoFactor, { isLoading: twoFactorLoading }] = useLoginTwoFactorMutation();
    const [resendLoginCode, { isLoading: resendLoading }] = useResendLoginCodeMutation();
    const [register, { isLoading: registerLoading }] = useRegisterMutation();
    const [uploadAvatar, { isLoading: avatarUploading }] = useUploadAvatarMutation();

    const [mode, setMode] = useState<'login' | 'register'>('register');
    const [step, setStep] = useState<RegisterStep>(1);

    const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarStepDone, setAvatarStepDone] = useState(false);
    const [pendingLogin, setPendingLogin] = useState<{ email: string; password: string } | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setMode('register');
            setStep(1);
            setForm(EMPTY_FORM);
            setAvatarPreview(null);
            setAvatarStepDone(false);
            setPendingLogin(null);
            setTwoFactorCode('');
            setMaskedEmail(null);
            setResendCooldown(0);
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = window.setInterval(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [resendCooldown]);

    if (!open) return null;

    function update<K extends keyof RegisterForm>(
        key: K,
        value: RegisterForm[K],
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function handleStep1(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStep(2);
    }

    function handleStep2(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form.password !== form.passwordConfirm) {
            dispatch(messageSet('Паролі не збігаються.'));
            return;
        }

        const strongEnough =
            form.password.length >= 8 &&
            /\d/.test(form.password) &&
            /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(form.password);

        if (!strongEnough) {
            dispatch(
                messageSet(
                    'Пароль повинен містити щонайменше 8 символів, цифр та літер.',
                ),
            );
            return;
        }

        setStep(3);
    }

    async function handleStep3(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            const response = await register({
                email: form.email,
                password: form.password,
                fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
                phone: form.phone,
                city: '',
                birthDate: form.birthDate || null,
                gender: form.gender,
            }).unwrap();

            dispatch(credentialsSet(response));
            setStep(4);
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося зареєструватися.',
                    ),
                ),
            );
        }
    }

    function handleFinish() {
        onClose();
        navigate('/catalog');
    }

    async function handleAvatarSelected(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(URL.createObjectURL(file));

        try {
            const nextUser = await uploadAvatar(file).unwrap();
            dispatch(userUpdated(nextUser));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося завантажити фото.')));
        }
    }

    function handleAvatarStepDone() {
        setAvatarStepDone(true);
    }

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const data = new FormData(event.currentTarget);
        const credentials = {
            email: data.get('email') as string,
            password: data.get('password') as string,
        };
        try {
            const response = await login(credentials).unwrap();
            if (response.requiresTwoFactor) {
                setPendingLogin(credentials);
                setTwoFactorCode('');
                setMaskedEmail(response.maskedEmail ?? null);
                setResendCooldown(30);
                if (!response.emailSent) {
                    dispatch(messageSet('Не вдалося надіслати код на пошту. Спробуйте ще раз.'));
                }
                return;
            }
            finishLogin(response);
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося увійти.',
                    ),
                ),
            );
        }
    }

    async function handleGoogleLogin(credential: string) {
        try {
            const response = await googleLogin({ credential }).unwrap();
            finishLogin({ requiresTwoFactor: false, emailSent: false, token: response.token, user: response.user });
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося увійти через Google.')));
        }
    }

    async function handleTwoFactorSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!pendingLogin) return;
        try {
            const response = await loginTwoFactor({ ...pendingLogin, code: twoFactorCode }).unwrap();
            finishLogin(response);
        } catch (error) {
            setTwoFactorCode('');
            dispatch(messageSet(extractErrorMessage(error, 'Невірний код підтвердження.')));
        }
    }

    async function handleResendCode() {
        if (!pendingLogin || resendCooldown > 0) return;
        try {
            const response = await resendLoginCode(pendingLogin).unwrap();
            setMaskedEmail(response.maskedEmail ?? maskedEmail);
            setResendCooldown(30);
            dispatch(messageSet(response.emailSent ? 'Код надіслано повторно.' : 'Не вдалося надіслати код.'));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося надіслати код.')));
        }
    }

    function finishLogin(response: LoginResult) {
        if (!response.token || !response.user) {
            dispatch(messageSet('Не вдалося увійти.'));
            return;
        }
        dispatch(credentialsSet({ token: response.token, user: response.user }));
        dispatch(messageSet(`Вітаємо, ${response.user.fullName}!`));
        setPendingLogin(null);
        onClose();
    }

    function goBack() {
        setStep((current) =>
            current > 1
                ? ((current - 1) as RegisterStep)
                : current,
        );
    }

    return createPortal(
        <div
            className="auth-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="auth-modal"
                onClick={(event) => event.stopPropagation()}
            >
                {/* HEADER */}

                <div className="auth-modal-top">
                    {mode === 'register' &&
                    step > 1 &&
                    step < 4 ? (
                        <button
                            type="button"
                            className="auth-modal-nav-button"
                            onClick={goBack}
                            aria-label="Назад"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    ) : (
                        <span />
                    )}

                    <Logo />

                    <button
                        type="button"
                        className="auth-modal-nav-button"
                        onClick={onClose}
                        aria-label="Закрити"
                    >
                        <X size={18} />
                    </button>
                </div>

                {mode === 'login' && pendingLogin && (
                    <div className="auth-modal-step" key="login-2fa">
                        <h2 className="auth-modal-title">Підтвердження входу</h2>
                        <p className="auth-modal-subtitle">
                            {maskedEmail
                                ? <>Ми надіслали код на <strong>{maskedEmail}</strong>. Також підійде код із застосунку-автентифікатора, якщо він у вас підключений.</>
                                : 'Введіть 6-значний код із застосунку-автентифікатора'}
                        </p>
                        <form onSubmit={handleTwoFactorSubmit} className="auth-modal-form">
                            <input
                                className="auth-modal-code-input"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                                required
                            />
                            <button className="primary auth-modal-submit" disabled={twoFactorLoading || twoFactorCode.length !== 6}>
                                {twoFactorLoading ? 'Зачекайте...' : 'Підтвердити'}
                            </button>
                        </form>
                        <p className="auth-modal-switch">
                            <button type="button" onClick={handleResendCode} disabled={resendLoading || resendCooldown > 0}>
                                {resendCooldown > 0 ? `Надіслати ще раз (${resendCooldown} с)` : 'Надіслати код ще раз'}
                            </button>
                        </p>
                        <p className="auth-modal-switch">
                            <button type="button" onClick={() => setPendingLogin(null)}>Назад до входу</button>
                        </p>
                    </div>
                )}

                {mode === 'login' && !pendingLogin && (
                    <div className="auth-modal-step" key="login">
                        <h2 className="auth-modal-title">Вхід</h2>
                        <form onSubmit={handleLogin} className="auth-modal-form">
                            <input name="email" type="email" placeholder="E-mail" required />
                            <input name="password" type="password" placeholder="Пароль" required />
                            <button className="primary auth-modal-submit" disabled={loginLoading}>
                                {loginLoading ? 'Зачекайте...' : 'Увійти'}
                            </button>
                        </form>

                        {/* DIVIDER */}

                        <div className="auth-login-divider">
                            <span>
                                Або увійти за допомогою
                            </span>
                        </div>

                        {/* SOCIAL LOGIN */}

                        <div className="auth-login-socials auth-login-socials-single">
                            <div className="auth-login-google">
                                <GoogleLogin
                                    onSuccess={(credentialResponse) => {
                                        if (!credentialResponse.credential) {
                                            dispatch(
                                                messageSet(
                                                    'Google не повернув дані авторизації.'
                                                )
                                            );
                                            return;
                                        }

                                        void handleGoogleLogin(
                                            credentialResponse.credential
                                        );
                                    }}
                                    onError={() => {
                                        dispatch(
                                            messageSet(
                                                'Не вдалося увійти через Google.'
                                            )
                                        );
                                    }}
                                    text="signin_with"
                                    shape="rectangular"
                                    size="large"
                                    width="342"
                                />
                            </div>
                        </div>

                        {/* REGISTER LINK */}

                        <div className="auth-login-register">
                            <strong>
                                Ще не маєте акаунта?
                            </strong>

                            <button
                                type="button"
                                onClick={() => {
                                    setMode('register');
                                    setStep(1);
                                    setShowPassword(false);
                                }}
                            >
                                Зареєструватися
                            </button>
                        </div>
                    </div>
                )}

                {/* =========================================
                    REGISTER — STEP 1
                ========================================= */}

                {mode === 'register' && step === 1 && (
                    <div
                        className="auth-modal-step"
                        key="step1"
                    >
                        <h2 className="auth-modal-title">
                            Зареєструватись
                        </h2>

                        <form
                            onSubmit={handleStep1}
                            className="auth-modal-form"
                        >
                            <input
                                value={form.firstName}
                                onChange={(event) =>
                                    update(
                                        'firstName',
                                        event.target.value,
                                    )
                                }
                                placeholder="Ім'я"
                                required
                            />

                            <input
                                value={form.lastName}
                                onChange={(event) =>
                                    update(
                                        'lastName',
                                        event.target.value,
                                    )
                                }
                                placeholder="Прізвище"
                                required
                            />

                            <input
                                value={form.phone}
                                onChange={(event) =>
                                    update(
                                        'phone',
                                        event.target.value,
                                    )
                                }
                                placeholder="Телефон"
                                type="tel"
                                required
                            />

                            <input
                                value={form.email}
                                onChange={(event) =>
                                    update(
                                        'email',
                                        event.target.value,
                                    )
                                }
                                placeholder="E-mail"
                                type="email"
                                required
                            />

                            <button
                                type="submit"
                                className="primary auth-modal-submit"
                            >
                                Далі
                            </button>
                        </form>

                        <p className="auth-modal-disclaimer">
                            Продовжуючи, ви підтверджуєте,
                            що згідні увійти до облікового
                            запису Lumio та надасте згоду на
                            обробку персональних даних
                        </p>

                        <p className="auth-modal-switch">
                            Вже є акаунт?{' '}
                            <button
                                type="button"
                                onClick={() =>
                                    setMode('login')
                                }
                            >
                                Увійти
                            </button>
                        </p>

                        <Dots step={1} />
                    </div>
                )}

                {/* =========================================
                    REGISTER — STEP 2
                ========================================= */}

                {mode === 'register' && step === 2 && (
                    <div
                        className="auth-modal-step"
                        key="step2"
                    >
                        <h2 className="auth-modal-title">
                            Створіть пароль
                        </h2>

                        <p className="auth-modal-subtitle">
                            Пароль повинен містити щонайменше
                            8 символів, цифр та літер
                        </p>

                        <form
                            onSubmit={handleStep2}
                            className="auth-modal-form"
                        >
                            <div className="auth-modal-password-field">
                                <input
                                    value={form.password}
                                    onChange={(event) =>
                                        update(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Пароль"
                                    type={
                                        showPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (value) => !value,
                                        )
                                    }
                                    aria-label="Показати пароль"
                                >
                                    {showPassword ? (
                                        <EyeOff size={17} />
                                    ) : (
                                        <Eye size={17} />
                                    )}
                                </button>
                            </div>

                            <div className="auth-modal-password-field">
                                <input
                                    value={
                                        form.passwordConfirm
                                    }
                                    onChange={(event) =>
                                        update(
                                            'passwordConfirm',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Підтвердьте пароль"
                                    type={
                                        showPasswordConfirm
                                            ? 'text'
                                            : 'password'
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPasswordConfirm(
                                            (value) => !value,
                                        )
                                    }
                                    aria-label="Показати пароль"
                                >
                                    {showPasswordConfirm ? (
                                        <EyeOff size={17} />
                                    ) : (
                                        <Eye size={17} />
                                    )}
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="primary auth-modal-submit"
                            >
                                Далі
                            </button>
                        </form>

                        <Dots step={2} />
                    </div>
                )}

                {/* =========================================
                    REGISTER — STEP 3
                ========================================= */}

                {mode === 'register' && step === 3 && (
                    <div
                        className="auth-modal-step"
                        key="step3"
                    >
                        <h2 className="auth-modal-title">
                            Дата народження
                        </h2>

                        <p className="auth-modal-subtitle">
                            Заповніть додаткову інформацію,
                            щоб зробити покупки ще зручнішими
                        </p>

                        <form
                            onSubmit={handleStep3}
                            className="auth-modal-form"
                        >
                            <label className="auth-modal-field-label">
                                День народження

                                <input
                                    value={form.birthDate}
                                    onChange={(event) =>
                                        update(
                                            'birthDate',
                                            event.target.value,
                                        )
                                    }
                                    type="date"
                                    max={new Date()
                                        .toISOString()
                                        .slice(0, 10)}
                                />
                            </label>

                            <div className="auth-modal-field-label">
                                Стать

                                <div className="auth-modal-gender-row">
                                    <label className="auth-modal-radio">
                                        <input
                                            type="radio"
                                            name="gender"
                                            checked={
                                                form.gender ===
                                                'male'
                                            }
                                            onChange={() =>
                                                update(
                                                    'gender',
                                                    'male',
                                                )
                                            }
                                        />

                                        Чоловіча
                                    </label>

                                    <label className="auth-modal-radio">
                                        <input
                                            type="radio"
                                            name="gender"
                                            checked={
                                                form.gender ===
                                                'female'
                                            }
                                            onChange={() =>
                                                update(
                                                    'gender',
                                                    'female',
                                                )
                                            }
                                        />

                                        Жіноча
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="primary auth-modal-submit"
                                disabled={registerLoading}
                            >
                                {registerLoading
                                    ? 'Зачекайте...'
                                    : 'Далі'}
                            </button>
                        </form>

                        <Dots step={3} />
                    </div>
                )}

                {mode === 'register' && step === 4 && !avatarStepDone && (
                    <div className="auth-modal-step" key="step-avatar">
                        <h2 className="auth-modal-title">Додайте фото профілю</h2>
                        <p className="auth-modal-subtitle">Це не обов'язково, але допоможе персоналізувати ваш акаунт</p>
                        <div className="auth-modal-avatar-picker">
                            <label className="auth-modal-avatar-upload" aria-label="Завантажити фото">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Попередній перегляд фото профілю" />
                                ) : (
                                    <Camera size={26} />
                                )}
                                <input type="file" accept="image/*" onChange={handleAvatarSelected} hidden />
                            </label>
                            {avatarUploading && <span className="auth-modal-avatar-status">Завантаження...</span>}
                        </div>
                        <button className="primary auth-modal-submit" type="button" onClick={handleAvatarStepDone} disabled={avatarUploading}>
                            {avatarPreview ? 'Готово' : 'Пропустити'}
                        </button>
                        <Dots step={4} />
                    </div>
                )}

                {mode === 'register' && step === 4 && avatarStepDone && (
                    <div className="auth-modal-step auth-modal-success" key="step4">
                        <div className="auth-modal-checkmark">
                            <svg viewBox="0 0 52 52">
                                <circle
                                    cx="26"
                                    cy="26"
                                    r="24"
                                    className="auth-modal-checkmark-circle"
                                />

                                <path
                                    d="M14 27l8 8 16-16"
                                    className="auth-modal-checkmark-path"
                                />
                            </svg>

                            <span className="auth-modal-confetti auth-modal-confetti-1" />
                            <span className="auth-modal-confetti auth-modal-confetti-2" />
                            <span className="auth-modal-confetti auth-modal-confetti-3" />
                            <span className="auth-modal-confetti auth-modal-confetti-4" />
                        </div>

                        <h2 className="auth-modal-title">
                            Реєстрація успішна!
                        </h2>

                        <p className="auth-modal-subtitle">
                            Ласкаво просимо до Lumio, будемо
                            раді бачити вас знову.
                        </p>

                        <button
                            className="primary auth-modal-submit"
                            type="button"
                            onClick={handleFinish}
                        >
                            Перейти до покупок
                        </button>

                        <Dots step={4} />
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}