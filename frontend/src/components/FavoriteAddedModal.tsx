import { useNavigate } from 'react-router-dom';
import { Heart, X } from 'lucide-react';
import { favoriteModalClosed } from '../store/uiSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function FavoriteAddedModal() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const open = useAppSelector((state) => state.ui.favoriteModalOpen);

    if (!open) return null;

    function close() {
        dispatch(favoriteModalClosed());
    }

    function goToFavorites() {
        close();
        navigate('/favorites');
    }

    return (
        <div className="cart-modal-backdrop" onClick={close}>
            <div
                className="cart-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Товар додано до вибраного"
                onClick={(event) => event.stopPropagation()}
            >
                <button type="button" className="cart-modal-close" onClick={close} aria-label="Закрити">
                    <X size={16} />
                </button>

                <div className="cart-modal-art" aria-hidden="true">
                    <span className="cart-modal-spark cart-modal-spark-1">✦</span>
                    <span className="cart-modal-spark cart-modal-spark-2">✦</span>
                    <span className="cart-modal-spark cart-modal-spark-3">✦</span>
                    <div className="cart-modal-circle">
                        <Heart size={34} strokeWidth={1.6} fill="currentColor" />
                        <span className="cart-modal-check cart-modal-check-outline">
                            <Heart size={12} strokeWidth={2.4} />
                        </span>
                    </div>
                </div>

                <strong className="cart-modal-title">Товар додано до вибраного!</strong>
                <p className="cart-modal-subtitle">Ви можете переглянути його в розділі «вибране»</p>

                <div className="cart-modal-actions">
                    <button type="button" className="primary" onClick={goToFavorites}>
                        Перейти до вибраного
                    </button>
                    <button type="button" className="cart-modal-secondary" onClick={close}>
                        Продовжити покупки
                    </button>
                </div>
            </div>
        </div>
    );
}