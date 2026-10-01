import { useNavigate } from 'react-router-dom';
import { Check, ShoppingCart, X } from 'lucide-react';
import { cartModalClosed } from '../store/uiSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function CartAddedModal() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const open = useAppSelector((state) => state.ui.cartModalOpen);

    if (!open) return null;

    function close() {
        dispatch(cartModalClosed());
    }

    function goToCheckout() {
        close();
        navigate('/checkout');
    }

    return (
        <div className="cart-modal-backdrop" onClick={close}>
            <div className="cart-modal" role="dialog" aria-modal="true" aria-label="Товар додано до кошика" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="cart-modal-close" onClick={close} aria-label="Закрити">
                    <X size={16} />
                </button>

                <div className="cart-modal-art" aria-hidden="true">
                    <span className="cart-modal-spark cart-modal-spark-1">✦</span>
                    <span className="cart-modal-spark cart-modal-spark-2">✦</span>
                    <span className="cart-modal-spark cart-modal-spark-3">✦</span>
                    <div className="cart-modal-circle">
                        <ShoppingCart size={34} strokeWidth={1.6} />
                        <span className="cart-modal-check">
                            <Check size={13} strokeWidth={3.4} />
                        </span>
                    </div>
                </div>

                <strong className="cart-modal-title">Товар додано до кошика!</strong>
                <p className="cart-modal-subtitle">Ви можете переглянути його в кошику покупок</p>

                <div className="cart-modal-actions">
                    <button type="button" className="primary" onClick={goToCheckout}>
                        Оформити замовлення
                    </button>
                    <button type="button" className="cart-modal-secondary" onClick={close}>
                        Продовжити покупки
                    </button>
                </div>
            </div>
        </div>
    );
}