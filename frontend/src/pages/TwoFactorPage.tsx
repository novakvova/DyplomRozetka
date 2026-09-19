import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, Mail, ScanLine, ShieldCheck, ShieldOff, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { extractErrorMessage } from '../store/api/client';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { useSetTwoFactorMutation } from '../store/api/authApi';
import { userUpdated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

const STEPS = [
    { title: 'Введіть пароль', note: 'Введіть свій пароль від Lumio під час входу.' },
    { title: 'Підтвердіть особу', note: 'Введіть код підтвердження з застосунку або SMS.' },
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
    const [setTwoFactor, { isLoading }] = useSetTwoFactorMutation();
    const [modalOpen, setModalOpen] = useState(false);

    if (!user) return null;

    async function handleEnable() {
        try {
            const nextUser = await setTwoFactor({ enabled: true }).unwrap();
            dispatch(userUpdated(nextUser));
            dispatch(messageSet('Двоетапну автентифікацію увімкнено.'));
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося увімкнути 2FA.')));
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
                                onClick={() => (user.twoFactorEnabled ? setModalOpen(true) : handleEnable())}
                                disabled={isLoading}
                            >
                                {user.twoFactorEnabled ? 'Вимкнути 2FA' : (isLoading ? 'Зачекайте...' : 'Увімкнути 2FA')}
                            </button>
                        </div>
                    </div>

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
                                onClick={() => dispatch(messageSet('Цей спосіб підтвердження ще в розробці.'))}
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
                            Після вимкнення 2FA вам потрібно буде вводити код підтвердження щоразу під час входу з нового пристрою або браузера.
                        </span>
                    </div>
                </div>
            </div>

            <DisableTwoFactorModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleDisable}
                loading={isLoading}
            />
        </section>
    );
}