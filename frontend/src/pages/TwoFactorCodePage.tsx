import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateTotp, secondsRemaining, TOTP_PERIOD_SECONDS } from '../totp';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

const SECRET_PATTERN = /^[A-Z2-7]{16,64}$/;

export function TwoFactorCodePage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [now, setNow] = useState(() => Date.now());

    const secret = useMemo(() => {
        const value = decodeURIComponent(window.location.hash.replace(/^#/, '')).replace(/\s/g, '').toUpperCase();
        return SECRET_PATTERN.test(value) ? value : null;
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const code = secret ? generateTotp(secret, now) : null;
    const remaining = secondsRemaining(now);

    async function copy(value: string, message: string) {
        try {
            await navigator.clipboard.writeText(value);
            dispatch(messageSet(message));
        } catch {
            dispatch(messageSet('Не вдалося скопіювати.'));
        }
    }

    return (
        <section className="twofa-code-page">
            <div className="twofa-code-card">
                <button type="button" className="twofa-code-back" onClick={() => navigate('/profile/2fa')}>
                    <ArrowLeft size={16} /> Назад до введення коду
                </button>
                <span className="twofa-code-icon"><KeyRound size={26} /></span>
                <h1>Код підтвердження</h1>
                {secret && code ? (
                    <>
                        <p className="twofa-code-lead">Введіть цей код на сайті у полі підтвердження 2FA.</p>
                        <code className="twofa-code-digits">{code.slice(0, 3)} {code.slice(3)}</code>
                        <div className="twofa-code-timer" aria-hidden="true">
                            <span style={{ width: `${(remaining / TOTP_PERIOD_SECONDS) * 100}%` }} />
                        </div>
                        <span className="twofa-code-timer-label">Оновиться через {remaining} с</span>
                        <button type="button" className="primary" onClick={() => copy(code, 'Код скопійовано.')}>
                            <Copy size={15} /> Скопіювати код
                        </button>
                        <div className="twofa-code-secret">
                            <span>Ключ для застосунку-автентифікатора</span>
                            <code>{secret.match(/.{1,4}/g)?.join(' ')}</code>
                            <button type="button" onClick={() => copy(secret, 'Ключ скопійовано.')}>
                                <Copy size={14} /> Скопіювати ключ
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="twofa-code-empty">Ключ не знайдено. Відскануйте QR-код зі сторінки налаштування 2FA ще раз.</p>
                )}
            </div>
        </section>
    );
}