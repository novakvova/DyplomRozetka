import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type SelectFieldProps = {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
};

export function SelectField({ value, onChange, options, placeholder }: SelectFieldProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;

        function handleClickOutside(event: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div className="select-field" ref={wrapRef}>
            <button
                type="button"
                className={`select-field-trigger${open ? ' select-field-trigger-open' : ''}`}
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
            >
                <span className={value ? '' : 'select-field-placeholder'}>{value || placeholder}</span>
                <ChevronDown size={18} className={`select-field-chevron${open ? ' select-field-chevron-open' : ''}`} />
            </button>

            {open && (
                <ul className="select-field-menu" role="listbox">
                    {options.map((option) => (
                        <li key={option}>
                            <button
                                type="button"
                                className={`select-field-option${option === value ? ' select-field-option-active' : ''}`}
                                onClick={() => {
                                    onChange(option);
                                    setOpen(false);
                                }}
                            >
                                {option}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}