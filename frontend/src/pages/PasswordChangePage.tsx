import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';
import { extractErrorMessage } from '../store/api/client';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { useChangePasswordMutation } from '../store/api/authApi';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

const REQUIREMENTS = [
    { id: 'length', label: 'Мінімум 8 символів', test: (value: string) => value.length >= 8 },
    { id: 'case', label: 'Містить великі та малі літери', test: (value: string) => /[a-zа-яіїєґ]/.test(value) && /[A-ZА-ЯІЇЄҐ]/.test(value) },
    { id: 'digit', label: 'Містить цифри', test: (value: string) => /\d/.test(value) },
    { id: 'special', label: 'Містить спеціальні символи', test: (value: string) => /[^A-Za-zА-Яа-яІіЇїЄєҐґ0-9]/.test(value) },
];

function useStrength(password: string) {
    return useMemo(() => {
        const results = REQUIREMENTS.map((req) => ({ ...req, met: req.test(password) }));
        const metCount = results.filter((item) => item.met).length;
        let level: 'empty' | 'weak' | 'medium' | 'strong' = 'empty';
        if (password.length > 0) {
            if (metCount <= 2) level = 'weak';
            else if (metCount === 3) level = 'medium';
            else level = 'strong';
        }
        return { results, metCount, level };
    }, [password]);
}

function PasswordField({
                           label, placeholder, value, onChange, note,
                       }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; note?: string }) {
    const [visible, setVisible] = useState(false);
    return (
        <label className="password-field-label">
            {label}
            <div className="password-field-input">
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={visible ? 'text' : 'password'}
                    placeholder={placeholder}
                    required
                />
                <button type="button" onClick={() => setVisible((v) => !v)} aria-label="Показати пароль">
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
            {note && <span className="password-field-note">{note}</span>}
        </label>
    );
}

export function PasswordChangePage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [changePassword, { isLoading }] = useChangePasswordMutation();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const strength = useStrength(newPassword);
    const touched = newPassword.length > 0;
    const passwordsMatch = confirmPassword.length === 0 || confirmPassword === newPassword;
    const canSubmit = currentPassword.length > 0 && strength.level === 'strong' && confirmPassword.length > 0 && confirmPassword === newPassword;

    const levelLabel = { empty: 'Пароль не введено', weak: 'Ненадійний', medium: 'Середній', strong: 'Надійний' }[strength.level];
    const levelClass = { empty: '', weak: 'password-strength-weak', medium: 'password-strength-medium', strong: 'password-strength-strong' }[strength.level];

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canSubmit) return;

        try {
            await changePassword({ currentPassword, newPassword }).unwrap();
            dispatch(messageSet('Пароль змінено.'));
            navigate('/profile');
        } catch (error) {
            dispatch(messageSet(extractErrorMessage(error, 'Не вдалося змінити пароль.')));
        }
    }

    return (
        <section className="profile-page">
            <div className="profile-layout">
                <ProfileSidebar />

                <div className="profile-content">
                    <h1 className="address-form-title">Змінити пароль</h1>
                    <p className="address-form-subtitle">Створіть новий надійний пароль для захисту вашого акаунту</p>

                    <form className="password-form-card" onSubmit={handleSubmit}>
                        <PasswordField
                            label="Поточний пароль"
                            placeholder="Введіть поточний пароль"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            note="Введіть пароль, який ви використовуєте для входу в акаунт"
                        />

                        <PasswordField
                            label="Новий пароль"
                            placeholder="Введіть новий пароль"
                            value={newPassword}
                            onChange={setNewPassword}
                            note={strength.level === 'empty' ? 'Пароль повинен містити мінімум 8 символів' : undefined}
                        />

                        {touched && (
                            <>
                                <div className="password-strength-row">
                                    <span>Надійність пароля:</span>
                                    <div className="password-strength-bar">
                                        <span className={`password-strength-fill ${levelClass}`} style={{ width: `${(strength.metCount / REQUIREMENTS.length) * 100}%` }} />
                                    </div>
                                    <strong className={levelClass}>{levelLabel}</strong>
                                </div>

                                <div className={`password-requirements-box${strength.level === 'strong' ? ' password-requirements-box-ok' : ' password-requirements-box-bad'}`}>
                                    <p className="password-requirements-headline">
                                        {strength.level === 'strong'
                                            ? <><CheckCircle2 size={16} /> Чудово! Ваш пароль надійний.</>
                                            : <><AlertTriangle size={16} /> Пароль ненадійний. Спробуйте щось надійніше</>}
                                    </p>
                                    <span className="password-requirements-title">Вимоги до паролю:</span>
                                    <ul className="password-requirements-list">
                                        {strength.results.map((req) => (
                                            <li key={req.id} className={req.met ? 'password-requirement-met' : 'password-requirement-unmet'}>
                                                {req.met ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {req.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {!touched && (
                            <div className="password-requirements-box">
                                <span className="password-requirements-title">Вимоги до паролю:</span>
                                <ul className="password-requirements-list">
                                    {REQUIREMENTS.map((req) => (
                                        <li key={req.id} className="password-requirement-neutral">
                                            <span className="password-requirement-dot" /> {req.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <PasswordField
                            label="Підтвердіть новий пароль"
                            placeholder="Підтвердіть новий пароль"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            note={!passwordsMatch ? 'Паролі не збігаються' : undefined}
                        />

                        <div className="address-form-actions">
                            <button type="button" onClick={() => navigate('/profile')}>Скасувати</button>
                            <button type="submit" className="primary" disabled={!canSubmit || isLoading}>
                                {isLoading ? 'Зберігаємо...' : 'Змінити пароль'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}