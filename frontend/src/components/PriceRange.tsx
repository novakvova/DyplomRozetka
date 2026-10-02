
import { useEffect, useState } from 'react';

type PriceRangeProps = {
    min: number;
    max: number;
    valueMin: number | undefined;
    valueMax: number | undefined;
    onCommit: (min: number | undefined, max: number | undefined) => void;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function PriceRange({ min, max, valueMin, valueMax, onCommit }: PriceRangeProps) {
    const [low, setLow] = useState(valueMin ?? min);
    const [high, setHigh] = useState(valueMax ?? max);

    useEffect(() => {
        setLow(valueMin ?? min);
        setHigh(valueMax ?? max);
    }, [valueMin, valueMax, min, max]);

    const span = Math.max(max - min, 1);
    const leftPercent = ((low - min) / span) * 100;
    const rightPercent = ((high - min) / span) * 100;

    function commit(nextLow: number, nextHigh: number) {
        onCommit(nextLow <= min ? undefined : nextLow, nextHigh >= max ? undefined : nextHigh);
    }

    function handleLowInput(raw: string) {
        const parsed = Number(raw.replace(/\D/g, ''));
        setLow(clamp(parsed, min, high));
    }

    function handleHighInput(raw: string) {
        const parsed = Number(raw.replace(/\D/g, ''));
        setHigh(clamp(parsed, low, max));
    }

    const disabled = max <= min;

    return (
        <div className={`price-range${disabled ? ' price-range-disabled' : ''}`}>
            <div className="price-range-inputs">
                <label>
                    <span>від</span>
                    <input
                        inputMode="numeric"
                        value={low}
                        disabled={disabled}
                        onChange={(event) => handleLowInput(event.target.value)}
                        onBlur={() => commit(low, high)}
                        onKeyDown={(event) => event.key === 'Enter' && commit(low, high)}
                    />
                </label>
                <label>
                    <span>до</span>
                    <input
                        inputMode="numeric"
                        value={high}
                        disabled={disabled}
                        onChange={(event) => handleHighInput(event.target.value)}
                        onBlur={() => commit(low, high)}
                        onKeyDown={(event) => event.key === 'Enter' && commit(low, high)}
                    />
                </label>
            </div>

            <div className="price-range-slider">
                <div className="price-range-track" />
                <div
                    className="price-range-fill"
                    style={{ left: `${leftPercent}%`, width: `${Math.max(rightPercent - leftPercent, 0)}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={low}
                    disabled={disabled}
                    aria-label="Мінімальна ціна"
                    onChange={(event) => setLow(Math.min(Number(event.target.value), high))}
                    onPointerUp={() => commit(low, high)}
                    onKeyUp={() => commit(low, high)}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={high}
                    disabled={disabled}
                    aria-label="Максимальна ціна"
                    onChange={(event) => setHigh(Math.max(Number(event.target.value), low))}
                    onPointerUp={() => commit(low, high)}
                    onKeyUp={() => commit(low, high)}
                />
            </div>
        </div>
    );
}