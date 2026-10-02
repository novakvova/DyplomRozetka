import {
    FormEvent,
    useRef,
    useState,
} from 'react';

import {
    ImagePlus,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';

import {
    extractErrorMessage,
    resolveAssetUrl,
} from '../../store/api/client';

import {
    useCreateCategoryMutation,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation,
} from '../../store/api/adminApi';

import { useGetCategoriesQuery } from '../../store/api/catalogApi';

import { useAppDispatch } from '../../store/hooks';
import { messageSet } from '../../store/uiSlice';

import type { Category } from '../../types';

export function AdminCategoriesPage() {
    const dispatch = useAppDispatch();

    // ============================================================
    // DATA
    // ============================================================

    const {
        data: categories = [],
        isLoading,
        isError,
    } = useGetCategoriesQuery();

    // ============================================================
    // MUTATIONS
    // ============================================================

    const [
        createCategory,
        { isLoading: isCreating },
    ] = useCreateCategoryMutation();

    const [
        updateCategory,
        { isLoading: isUpdating },
    ] = useUpdateCategoryMutation();

    const [deleteCategory] =
        useDeleteCategoryMutation();

    // ============================================================
    // STATE
    // ============================================================

    const [
        showCreateForm,
        setShowCreateForm,
    ] = useState(false);

    const [
        editingCategory,
        setEditingCategory,
    ] = useState<Category | null>(null);

    const [
        categoryToDelete,
        setCategoryToDelete,
    ] = useState<Category | null>(null);

    const [
        categoryImagePreview,
        setCategoryImagePreview,
    ] = useState<string | null>(null);

    const categoryImageInputRefs =
        useRef<Record<string, HTMLInputElement | null>>(
            {},
        );

    // ============================================================
    // CREATE
    // ============================================================

    async function handleCreateCategory(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = new FormData(form);

        const imageFile =
            data.get('image') as File | null;

        try {
            await createCategory({
                slug:
                    data.get('slug') as string,

                title:
                    data.get('title') as string,

                description:
                    (data.get(
                        'description',
                    ) as string) ?? '',

                image:
                    imageFile &&
                    imageFile.size > 0
                        ? imageFile
                        : null,
            }).unwrap();

            form.reset();

            clearImagePreview();
            setShowCreateForm(false);

            dispatch(
                messageSet(
                    'Категорію додано.',
                ),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося додати категорію.',
                    ),
                ),
            );
        }
    }

    // ============================================================
    // UPDATE
    // ============================================================

    async function handleUpdateCategory(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!editingCategory) {
            return;
        }

        const data =
            new FormData(event.currentTarget);

        const image =
            data.get('image') as File | null;

        try {
            await updateCategory({
                id: editingCategory.id,

                slug:
                    data.get('slug') as string,

                title:
                    data.get('title') as string,

                description:
                    (data.get(
                        'description',
                    ) as string) ?? '',

                image:
                    image &&
                    image.size > 0
                        ? image
                        : null,
            }).unwrap();

            setEditingCategory(null);

            dispatch(
                messageSet(
                    'Категорію оновлено.',
                ),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося оновити категорію.',
                    ),
                ),
            );
        }
    }

    // ============================================================
    // DELETE
    // ============================================================

    async function handleDeleteCategory() {
        if (!categoryToDelete) {
            return;
        }

        try {
            await deleteCategory(
                categoryToDelete.id,
            ).unwrap();

            dispatch(
                messageSet(
                    'Категорію видалено.',
                ),
            );

            setCategoryToDelete(null);
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося видалити категорію. Перевірте, чи немає товарів у цій категорії.',
                    ),
                ),
            );
        }
    }

    // ============================================================
    // IMAGE PREVIEW
    // ============================================================

    function handleCategoryImagePreview(
        event: FormEvent<HTMLInputElement>,
    ) {
        const file =
            event.currentTarget.files?.[0];

        if (!file) {
            clearImagePreview();
            return;
        }

        if (categoryImagePreview) {
            URL.revokeObjectURL(
                categoryImagePreview,
            );
        }

        setCategoryImagePreview(
            URL.createObjectURL(file),
        );
    }

    function clearImagePreview() {
        if (categoryImagePreview) {
            URL.revokeObjectURL(
                categoryImagePreview,
            );
        }

        setCategoryImagePreview(null);
    }

    // ============================================================
    // REPLACE IMAGE
    // ============================================================

    async function handleReplaceCategoryImage(
        categoryId: string,
        slug: string,
        title: string,
        description: string,
        file: File,
    ) {
        try {
            await updateCategory({
                id: categoryId,
                slug,
                title,
                description,
                image: file,
            }).unwrap();

            dispatch(
                messageSet(
                    'Фото категорії оновлено.',
                ),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося оновити фото категорії.',
                    ),
                ),
            );
        }
    }

    // ============================================================
    // JSX
    // ============================================================

    return (
        <>
            <div className="space-y-6">
                {/* HEADER */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="m-0 text-2xl font-bold text-gray-900">
                            Категорії
                        </h1>

                        <p className="mb-0 mt-1 text-sm text-gray-500">
                            Керування категоріями
                            товарів Lumio
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setShowCreateForm(true)
                        }
                        className={primaryButtonClass}
                    >
                        <Plus size={18} />
                        Додати категорію
                    </button>
                </div>

                {/* STAT */}

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <p className="m-0 text-sm text-gray-500">
                        Всього категорій
                    </p>

                    <p className="mb-0 mt-2 text-2xl font-bold text-gray-900">
                        {categories.length}
                    </p>
                </div>

                {/* LIST */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="m-0 text-lg font-semibold text-gray-900">
                            Список категорій
                        </h2>

                        <p className="mb-0 mt-1 text-sm text-gray-500">
                            Редагування категорій та
                            їхніх зображень
                        </p>
                    </div>

                    {isLoading && (
                        <div className="p-10 text-center text-sm text-gray-500">
                            Завантаження...
                        </div>
                    )}

                    {isError && (
                        <div className="p-10 text-center text-sm text-red-500">
                            Не вдалося завантажити
                            категорії.
                        </div>
                    )}

                    {!isLoading &&
                        !isError &&
                        categories.length === 0 && (
                            <div className="p-10 text-center text-sm text-gray-500">
                                Категорій поки немає.
                            </div>
                        )}

                    {!isLoading &&
                        !isError &&
                        categories.length > 0 && (
                            <div className="divide-y divide-gray-100">
                                {categories.map(
                                    (item) => (
                                        <div
                                            key={
                                                item.id
                                            }
                                            className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                {item.imageUrl ? (
                                                    <img
                                                        src={resolveAssetUrl(
                                                            item.imageUrl,
                                                        )}
                                                        alt={
                                                            item.title
                                                        }
                                                        className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400">
                                                        <ImagePlus
                                                            size={
                                                                22
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <h3 className="m-0 truncate text-base font-semibold text-gray-900">
                                                        {
                                                            item.title
                                                        }
                                                    </h3>

                                                    <p className="mb-0 mt-1 text-sm text-gray-500">
                                                        Slug:{' '}
                                                        {
                                                            item.slug
                                                        }
                                                    </p>

                                                    {item.description && (
                                                        <p className="mb-0 mt-1 line-clamp-2 text-sm text-gray-500">
                                                            {
                                                                item.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <input
                                                ref={(
                                                    node,
                                                ) => {
                                                    categoryImageInputRefs.current[
                                                        item.id
                                                    ] =
                                                        node;
                                                }}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(
                                                    event,
                                                ) => {
                                                    const file =
                                                        event
                                                            .currentTarget
                                                            .files?.[0];

                                                    if (
                                                        file
                                                    ) {
                                                        void handleReplaceCategoryImage(
                                                            item.id,
                                                            item.slug,
                                                            item.title,
                                                            item.description,
                                                            file,
                                                        );
                                                    }

                                                    event.currentTarget.value =
                                                        '';
                                                }}
                                            />

                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        categoryImageInputRefs.current[
                                                            item
                                                                .id
                                                        ]?.click()
                                                    }
                                                    className={secondaryButtonClass}
                                                >
                                                    <ImagePlus
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    {item.imageUrl
                                                        ? 'Змінити фото'
                                                        : 'Додати фото'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingCategory(
                                                            item,
                                                        )
                                                    }
                                                    className={secondaryButtonClass}
                                                >
                                                    <Pencil
                                                        size={
                                                            16
                                                        }
                                                    />
                                                    Редагувати
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCategoryToDelete(
                                                            item,
                                                        )
                                                    }
                                                    className={deleteButtonClass}
                                                >
                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                    />
                                                    Видалити
                                                </button>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                </div>
            </div>

            {/* CREATE MODAL */}

            {showCreateForm && (
                <Modal
                    title="Нова категорія"
                    subtitle="Створення категорії товарів"
                    onClose={() => {
                        setShowCreateForm(false);
                        clearImagePreview();
                    }}
                >
                    <form
                        onSubmit={handleCreateCategory}
                        className="space-y-5"
                    >
                        <Field label="Slug">
                            <input
                                name="slug"
                                placeholder="smartphones"
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Назва категорії">
                            <input
                                name="title"
                                placeholder="Смартфони"
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Опис">
                            <textarea
                                name="description"
                                rows={5}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Фото категорії">
                            <input
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleCategoryImagePreview
                                }
                                className={fileClass}
                            />
                        </Field>

                        {categoryImagePreview && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    Попередній перегляд
                                </p>

                                <img
                                    src={
                                        categoryImagePreview
                                    }
                                    alt="Попередній перегляд"
                                    className="h-40 w-full rounded-xl border border-gray-200 object-cover"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(
                                        false,
                                    );
                                    clearImagePreview();
                                }}
                                className={
                                    secondaryButtonClass
                                }
                            >
                                Скасувати
                            </button>

                            <button
                                type="submit"
                                disabled={isCreating}
                                className={
                                    primaryButtonClass
                                }
                            >
                                {isCreating
                                    ? 'Збереження...'
                                    : 'Додати категорію'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* EDIT MODAL */}

            {editingCategory && (
                <Modal
                    title="Редагування категорії"
                    subtitle={
                        editingCategory.title
                    }
                    onClose={() =>
                        setEditingCategory(null)
                    }
                >
                    <form
                        onSubmit={
                            handleUpdateCategory
                        }
                        className="space-y-5"
                    >
                        <Field label="Slug">
                            <input
                                name="slug"
                                defaultValue={
                                    editingCategory.slug
                                }
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Назва категорії">
                            <input
                                name="title"
                                defaultValue={
                                    editingCategory.title
                                }
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Опис">
                            <textarea
                                name="description"
                                rows={5}
                                defaultValue={
                                    editingCategory.description ??
                                    ''
                                }
                                className={inputClass}
                            />
                        </Field>

                        {editingCategory.imageUrl && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    Поточне фото
                                </p>

                                <img
                                    src={resolveAssetUrl(
                                        editingCategory.imageUrl,
                                    )}
                                    alt={
                                        editingCategory.title
                                    }
                                    className="h-40 w-full rounded-xl border border-gray-200 object-cover"
                                />
                            </div>
                        )}

                        <Field label="Нове фото (необов'язково)">
                            <input
                                name="image"
                                type="file"
                                accept="image/*"
                                className={fileClass}
                            />
                        </Field>

                        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                            <button
                                type="button"
                                onClick={() =>
                                    setEditingCategory(
                                        null,
                                    )
                                }
                                className={
                                    secondaryButtonClass
                                }
                            >
                                Скасувати
                            </button>

                            <button
                                type="submit"
                                disabled={isUpdating}
                                className={
                                    primaryButtonClass
                                }
                            >
                                {isUpdating
                                    ? 'Збереження...'
                                    : 'Зберегти зміни'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* DELETE MODAL */}

            {categoryToDelete && (
                <Modal
                    title="Видалення категорії"
                    subtitle="Підтвердження видалення"
                    onClose={() =>
                        setCategoryToDelete(null)
                    }
                >
                    <div>
                        <p className="m-0 text-sm leading-6 text-gray-600">
                            Ви впевнені, що хочете видалити категорію{' '}
                            <span className="font-semibold text-gray-900">
                                «{categoryToDelete.title}»
                            </span>
                            ?
                        </p>

                        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                            <p className="m-0 text-sm text-red-600">
                                Цю дію неможливо скасувати. Категорію з товарами видалити не вдасться.
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5">
                            <button
                                type="button"
                                onClick={() =>
                                    setCategoryToDelete(null)
                                }
                                className={secondaryButtonClass}
                            >
                                Скасувати
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteCategory}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                            >
                                <Trash2 size={17} />
                                Видалити
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

// ============================================================
// UI HELPERS
// ============================================================

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">
                {label}
            </span>

            {children}
        </label>
    );
}

function Modal({
    title,
    subtitle,
    onClose,
    children,
}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8"
            onMouseDown={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                        <h2 className="m-0 text-xl font-semibold text-gray-900">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mb-0 mt-1 text-sm text-gray-500">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl font-medium leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                        aria-label="Закрити"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

const fileClass =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600';

const primaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50';

const deleteButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50';