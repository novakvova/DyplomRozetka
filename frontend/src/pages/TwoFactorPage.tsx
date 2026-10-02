import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Copy, Info, Mail, ScanLine, ShieldCheck, ShieldOff } from 'lucide-react';
import { createPortal } from 'react-dom';
import { extractErrorMessage } from '../store/api/client';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { useEnableTwoFactorMutation, useSetTwoFactorMutation, useSetupTwoFactorMutation } from '../store/api/authApi';
import type { TwoFactorSetup } from '../types';
import { userUpdated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

const PENDING_SETUP_KEY = 'lumio-2fa-pending-setup';

function loadPendingSetup(): TwoFactorSetup | null {
    try {
        const raw = window.sessionStorage.getItem(PENDING_SETUP_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.secret === 'string' && typeof parsed?.otpAuthUri === 'string') {
            return parsed as TwoFactorSetup;
        }
        return null;
    } catch {
        return null;
    }
}

function savePendingSetup(setup: TwoFactorSetup | null) {
    try {
        if (setup) {
            window.sessionStorage.setItem(PENDING_SETUP_KEY, JSON.stringify(setup));
        } else {
            window.sessionStorage.removeItem(PENDING_SETUP_KEY);
        }
    } catch {
        // sessionStorage може бути недоступний (приватний режим тощо) — просто ігноруємо
    }
}

const STEPS = [
    { title: 'Введіть пароль', note: 'Введіть свій пароль від Lumio під час входу.' },
    { title: 'Підтвердіть особу', note: 'Введіть 6-значний код із застосунку-автентифікатора.' },
    { title: 'Доступ дозволено', note: 'Після успішного підтвердження ви потрапите у свій акаунт.' },
];

const METHODS = [
    { icon: ScanLine, title: 'Застосунок-автентифікатор (рекомендовано)', note: 'Отримайте коди підтвердження в застосунку, наприклад Google Authenticator, Authy тощо.' },
    { icon: Mail, title: 'SMS-підтвердження', note: 'Отримайте коди підтвердження на ваш номер телефону.' },
];

function DisableTwoFactorModal({ open, onClose, onConfirm, loading }: { open: boolean; onClose: () => void; onConfirm: (password: string) => void; loading: boolean }) {
    const [password, setPassword] = useState('');
    if (!open) return null;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onConfirm(password);
    }

    return createPortal(
        <div className="account-drawer-backdrop" onClick={onClose}>
            <div className="twofa-modal" onClick={(event) => event.stopPropagation()}>
                <span className="twofa-modal-icon"><AlertTriangle size={22} /></span>
                <h2>Вимкнути двоетапну автентифікацію?</h2>
                <p>Якщо ви вимкнете 2FA, ваш акаунт стане менш захищеним. Ви зможете увійти лише за допомогою пароля.</p>
                <form onSubmit={handleSubmit}>
                    <label>
                        Щоб продовжити, підтвердьте свою особу.
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="Введіть ваш пароль"
                            required
                        />
                    </label>
                    <div className="twofa-modal-actions">
                        <button type="button" onClick={onClose}>Скасувати</button>
                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? 'Зачекайте...' : 'Вимкнути 2FA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

export function TwoFactorPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [setTwoFactor, { isLoading: disabling }] = useSetTwoFactorMutation();
    const [setupTwoFactor, { isLoading: settingUp }] = useSetupTwoFactorMutation();
    const [enableTwoFactor, { isLoading: enabling }] = useEnableTwoFactorMutation();
    const [modalOpen, setModalOpen] = useState(false);
    const [setup, setSetup] = useState<TwoFactorSetup | null>(() => loadPendingSetup());
    const [code, setCode] = useState('');

    useEffect(() => {
        if (user?.twoFactorEnabled) {
            savePendingSetup(null);
        }
    }, [user?.twoFactorEnabled]);

    if (!user) return null;

    const isLoading = disabling || settingUp;

    async function handleStartSetup() {
        try {
            const result = await setupTwoFactor().unwrap();
            setSetup(result);
            savePendingSetup(result);
            setCode('');
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося розпочати налаштування 2FA.')));
        }
    }

    function handleCancelSetup() {
        setSetup(null);
        savePendingSetup(null);
        setCode('');
    }

    function handleOpenCodePage() {
        if (!setup) return;
        navigate(`/2fa-code#${setup.secret}`);
    }

    async function handleConfirmSetup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const nextUser = await enableTwoFactor({ code }).unwrap();
            dispatch(userUpdated(nextUser));
            savePendingSetup(null);
            setSetup(null);
            setCode('');
            dispatch(messageSet('Двоетапну автентифікацію увімкнено.'));
        } catch (error) {
            setCode('');
            dispatch(messageSet(extractErrorMessage(error, 'Невірний код підтвердження.')));
        }
    }

    async function handleCopySecret() {
        if (!setup) return;
        try {
            await navigator.clipboard.writeText(setup.secret);
            dispatch(messageSet('Ключ скопійовано.'));
        } catch {
            dispatch(messageSet('Не вдалося скопіювати ключ.'));
        }
    }

    async function handleDisable(password: string) {
        try {
            const nextUser = await setTwoFactor({ enabled: false, password }).unwrap();
            dispatch(userUpdated(nextUser));
            setModalOpen(false);
            dispatch(messageSet('Двоетапну автентифікацію вимкнено.'));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Невірний пароль.')));
        }
    }

    return (
        <section className="profile-page">
            <div className="profile-layout">
                <ProfileSidebar />

                <div className="profile-content">
                    <h1 className="address-form-title">Двоетапна аутентифікація</h1>
                    <p className="address-form-subtitle">
                        Двоетапна аутентифікація (2FA) додає додатковий рівень захисту до вашого акаунту.
                    </p>

                    <div className={`twofa-status-card${user.twoFactorEnabled ? ' twofa-status-on' : ''}`}>
                        <span className="twofa-status-icon">
                            {user.twoFactorEnabled ? <ShieldCheck size={22} /> : <ShieldOff size={22} />}
                        </span>
                        <div className="twofa-status-body">
                            <strong>
                                {user.twoFactorEnabled ? 'Двоетапна аутентифікація увімкнена' : 'Двоетапна аутентифікація вимкнена'}
                            </strong>
                            <span>
                                {user.twoFactorEnabled
                                    ? 'Ваш акаунт захищений додатковим рівнем безпеки. Під час входу вам потрібно буде підтвердити особу за допомогою другого способу.'
                                    : 'Увімкніть 2FA, щоб додати ще один рівень захисту вашого акаунту.'}
                            </span>
                            <button
                                type="button"
                                className={user.twoFactorEnabled ? '' : 'primary'}
                                onClick={() => (user.twoFactorEnabled ? setModalOpen(true) : handleStartSetup())}
                                disabled={isLoading || (!user.twoFactorEnabled && setup !== null)}
                            >
                                {user.twoFactorEnabled ? 'Вимкнути 2FA' : (isLoading ? 'Зачекайте...' : 'Увімкнути 2FA')}
                            </button>
                        </div>
                    </div>

                    {setup && !user.twoFactorEnabled && (
                        <form className="twofa-setup-card" onSubmit={handleConfirmSetup}>
                            <h2>Налаштування застосунку-автентифікатора</h2>
                            <ol className="twofa-setup-list">
                                <li>Натисніть «Отримати код» — відкриється сторінка з кодом підтвердження.</li>
                                <li>Скопіюйте код і поверніться на цю сторінку.</li>
                                <li>Введіть код нижче, щоб підтвердити.</li>
                            </ol>
                            <div className="twofa-setup-body">
                                <div className="twofa-qr-block">
                                    <div className="twofa-code-cta">
                                        <ScanLine size={26} />
                                        <p>Відкриє сторінку з кодом підтвердження, який можна ввести нижче.</p>
                                        <button type="button" className="primary" onClick={handleOpenCodePage}>
                                            Отримати код
                                        </button>
                                    </div>
                                </div>
                                <div className="twofa-setup-secret">
                                    <span>Ключ для ручного введення</span>
                                    <code>{setup.secret.match(/.{1,4}/g)?.join(' ')}</code>
                                    <button type="button" onClick={handleCopySecret}>
                                        <Copy size={14} /> Скопіювати ключ
                                    </button>
                                </div>
                            </div>
                            <input
                                className="twofa-code-input"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                            <div className="twofa-modal-actions">
                                <button type="button" onClick={handleCancelSetup}>Скасувати</button>
                                <button type="submit" className="primary" disabled={enabling || code.length !== 6}>
                                    {enabling ? 'Зачекайте...' : 'Підтвердити та увімкнути'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="twofa-steps-card">
                        {STEPS.map((step, index) => (
                            <div className="twofa-step" key={step.title}>
                                <span className="twofa-step-number">{index + 1}</span>
                                <div>
                                    <strong>{step.title}</strong>
                                    <span>{step.note}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="twofa-methods-card">
                        <h2>Способи підтвердження</h2>
                        {METHODS.map(({ icon: Icon, title, note }) => (
                            <button
                                type="button"
                                className="twofa-method-row"
                                key={title}
                                onClick={() => {
                                    if (Icon === ScanLine) {
                                        if (user.twoFactorEnabled) {
                                            dispatch(messageSet('Застосунок-автентифікатор уже підключено.'));
                                        } else if (!setup) {
                                            handleStartSetup();
                                        }
                                    } else {
                                        dispatch(messageSet('Цей спосіб підтвердження ще в розробці.'));
                                    }
                                }}
                            >
                                <span className="twofa-method-icon"><Icon size={18} /></span>
                                <div>
                                    <strong>{title}</strong>
                                    <span>{note}</span>
                                </div>
                                <span className="twofa-method-arrow">›</span>
                            </button>
                        ))}
                    </div>

                    <div className="twofa-info-note">
                        <Info size={16} />
                        <span>
                            Коли 2FA увімкнена, під час кожного входу потрібно вводити код із застосунку-автентифікатора. Якщо втратите доступ до застосунку — зверніться до адміністратора.
                        </span>
                    </div>
                </div>
            </div>

            <DisableTwoFactorModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleDisable}
                loading={disabling}
            />
        </section>
    );
}