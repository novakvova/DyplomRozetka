import { FormEvent } from 'react';
import {
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    UserRound,
} from 'lucide-react';

import { useCreateAdminMutation } from '../../store/api/adminApi';
import { extractErrorMessage } from '../../store/api/client';
import { useAppDispatch } from '../../store/hooks';
import { messageSet } from '../../store/uiSlice';

export function AdminCreateAdminPage() {
    const dispatch = useAppDispatch();

    const [
        createAdmin,
        { isLoading },
    ] = useCreateAdminMutation();

    async function handleCreateAdmin(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const form = event.currentTarget;

        const data = Object.fromEntries(
            new FormData(form).entries(),
        ) as {
            email: string;
            password: string;
            fullName: string;
            phone: string;
            city: string;
        };

        try {
            await createAdmin(data).unwrap();

            form.reset();

            dispatch(
                messageSet(
                    'Нового адміністратора додано.',
                ),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося додати адміністратора.',
                    ),
                ),
            );
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="m-0 text-2xl font-bold text-gray-900">
                    Адміністратори
                </h1>

                <p className="mb-0 mt-1 text-sm text-gray-500">
                    Створення нового адміністратора
                    магазину
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,700px)_1fr]">
                <div className="rounded-2xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                <ShieldCheck
                                    size={22}
                                />
                            </div>

                            <div>
                                <h2 className="m-0 text-lg font-semibold text-gray-900">
                                    Новий адміністратор
                                </h2>

                                <p className="mb-0 mt-1 text-sm text-gray-500">
                                    Заповніть дані
                                    облікового запису
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleCreateAdmin}
                        className="space-y-5 p-6"
                    >
                        <Field
                            label="Email"
                            icon={<Mail size={17} />}
                        >
                            <input
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field
                            label="Пароль"
                            icon={
                                <ShieldCheck
                                    size={17}
                                />
                            }
                        >
                            <input
                                name="password"
                                type="password"
                                placeholder="Введіть пароль"
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field
                            label="ПІБ"
                            icon={
                                <UserRound size={17} />
                            }
                        >
                            <input
                                name="fullName"
                                placeholder="Ім'я та прізвище"
                                required
                                className={inputClass}
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field
                                label="Телефон"
                                icon={
                                    <Phone size={17} />
                                }
                            >
                                <input
                                    name="phone"
                                    placeholder="+380..."
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>

                            <Field
                                label="Місто"
                                icon={
                                    <MapPin size={17} />
                                }
                            >
                                <input
                                    name="city"
                                    placeholder="Львів"
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>
                        </div>

                        <div className="border-t border-gray-200 pt-5">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <ShieldCheck
                                    size={18}
                                />

                                {isLoading
                                    ? 'Створення...'
                                    : 'Додати адміністратора'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="m-0 text-lg font-semibold text-gray-900">
                        Права адміністратора
                    </h2>

                    <p className="mb-0 mt-3 text-sm leading-6 text-gray-500">
                        Новий адміністратор
                        створюється через існуючий
                        адміністративний API та отримує
                        адміністративний обліковий запис.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    icon,
    children,
}: {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <span className="text-gray-400">
                    {icon}
                </span>

                {label}
            </span>

            {children}
        </label>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100';