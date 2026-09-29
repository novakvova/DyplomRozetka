import { FormEvent, useState } from 'react';
import {
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';

import { ProductImagesManager } from '../../components/ProductImagesManager';

import {
    useCreateProductMutation,
    useDeleteProductMutation,
    useUpdateProductMutation,
    useUploadProductImagesMutation,
} from '../../store/api/adminApi';

import {
    useGetCategoriesQuery,
    useGetProductsQuery,
} from '../../store/api/catalogApi';

import { extractErrorMessage } from '../../store/api/client';
import { useAppDispatch } from '../../store/hooks';
import { messageSet } from '../../store/uiSlice';

import type { Product } from '../../types';

export function AdminProductsPage() {
    const dispatch = useAppDispatch();

    // ============================================================
    // DATA
    // ============================================================

    const { data: categories = [] } =
        useGetCategoriesQuery();

    const { data: productsPage } =
        useGetProductsQuery({
            pageSize: 100,
        });

    const products = productsPage?.items ?? [];

    // ============================================================
    // MUTATIONS
    // ============================================================

    const [createProduct, { isLoading: isCreating }] =
        useCreateProductMutation();

    const [updateProduct, { isLoading: isUpdating }] =
        useUpdateProductMutation();

    const [deleteProduct] =
        useDeleteProductMutation();

    const [uploadProductImages] =
        useUploadProductImagesMutation();

    // ============================================================
    // STATE
    // ============================================================

    const [productSearch, setProductSearch] =
        useState('');

    const [editingProduct, setEditingProduct] =
        useState<Product | null>(null);

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    // ============================================================
    // SEARCH
    // ============================================================

    const filteredProducts = products.filter(
        (product) => {
            const search =
                productSearch.trim().toLowerCase();

            if (!search) {
                return true;
            }

            return (
                product.title
                    .toLowerCase()
                    .includes(search) ||
                product.sku
                    .toLowerCase()
                    .includes(search) ||
                product.brand
                    .toLowerCase()
                    .includes(search)
            );
        },
    );

    // ============================================================
    // CREATE
    // ============================================================

    async function handleCreateProduct(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = new FormData(form);

        const imageFiles = (
            data.getAll('images') as File[]
        ).filter((file) => file.size > 0);

        try {
            const product = await createProduct({
                sku: data.get('sku') as string,
                title: data.get('title') as string,
                subtitle: data.get('subtitle') as string,
                brand: data.get('brand') as string,

                price: Number(data.get('price')),

                previousPrice:
                    Number(data.get('previousPrice')) ||
                    null,

                badge: data.get('badge') as string,

                imageUrl:
                    data.get('imageUrl') as string,

                description:
                    data.get('description') as string,

                manufacturerUrl:
                    data.get('manufacturerUrl') as string,

                specifications:
                    data.get('specifications') as string,

                stockQuantity:
                    Number(data.get('stockQuantity')),

                categoryId:
                    data.get('categoryId') as string,
            }).unwrap();

            if (imageFiles.length > 0) {
                await uploadProductImages({
                    productId: product.id,
                    files: imageFiles,
                }).unwrap();
            }

            form.reset();
            setShowCreateForm(false);

            dispatch(
                messageSet('Товар додано.'),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося додати товар.',
                    ),
                ),
            );
        }
    }

    // ============================================================
    // UPDATE
    // ============================================================

    async function handleUpdateProduct(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!editingProduct) {
            return;
        }

        const data =
            new FormData(event.currentTarget);

        try {
            await updateProduct({
                id: editingProduct.id,

                sku: data.get('sku') as string,

                title:
                    data.get('title') as string,

                subtitle:
                    data.get('subtitle') as string,

                brand:
                    data.get('brand') as string,

                price:
                    Number(data.get('price')),

                previousPrice:
                    Number(
                        data.get('previousPrice'),
                    ) || null,

                badge:
                    data.get('badge') as string,

                imageUrl:
                    data.get('imageUrl') as string,

                description:
                    data.get('description') as string,

                manufacturerUrl:
                    data.get(
                        'manufacturerUrl',
                    ) as string,

                specifications:
                    data.get(
                        'specifications',
                    ) as string,

                stockQuantity:
                    Number(
                        data.get('stockQuantity'),
                    ),

                categoryId:
                    data.get('categoryId') as string,
            }).unwrap();

            setEditingProduct(null);

            dispatch(
                messageSet(
                    'Товар успішно оновлено.',
                ),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося оновити товар.',
                    ),
                ),
            );
        }
    }

    // ============================================================
    // DELETE
    // ============================================================

    async function handleDeleteProduct(
        id: string,
        title: string,
    ) {
        const confirmed = window.confirm(
            `Видалити товар "${title}"?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteProduct(id).unwrap();

            dispatch(
                messageSet('Товар видалено.'),
            );
        } catch (error) {
            dispatch(
                messageSet(
                    extractErrorMessage(
                        error,
                        'Не вдалося видалити товар.',
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
                {/* PAGE HEADER */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="m-0 text-2xl font-bold text-gray-900">
                            Товари
                        </h1>

                        <p className="mb-0 mt-1 text-sm text-gray-500">
                            Керування товарами магазину
                            Lumio
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setShowCreateForm(true)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                        <Plus size={18} />
                        Додати товар
                    </button>
                </div>

                {/* STAT */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Всього товарів"
                        value={products.length}
                    />

                    <StatCard
                        label="Категорій"
                        value={categories.length}
                    />

                    <StatCard
                        label="Знайдено"
                        value={filteredProducts.length}
                    />
                </div>

                {/* PRODUCTS PANEL */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="m-0 text-lg font-semibold text-gray-900">
                                    Список товарів
                                </h2>

                                <p className="mb-0 mt-1 text-sm text-gray-500">
                                    Перегляд, редагування та
                                    видалення товарів
                                </p>
                            </div>

                            <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5">
                                <Search
                                    size={19}
                                    className="shrink-0 text-gray-400"
                                />

                                <input
                                    type="search"
                                    placeholder="Назва, SKU або бренд..."
                                    value={productSearch}
                                    onChange={(event) =>
                                        setProductSearch(
                                            event.target
                                                .value,
                                        )
                                    }
                                    className="w-full border-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="m-0 text-sm text-gray-500">
                                Товарів не знайдено.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredProducts.map(
                                (item) => (
                                    <div
                                        key={item.id}
                                        className="p-5"
                                    >
                                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="m-0 text-base font-semibold text-gray-900">
                                                        {
                                                            item.title
                                                        }
                                                    </h3>

                                                    {item.badge && (
                                                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                                                            {
                                                                item.badge
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                                                    <span>
                                                        SKU:{' '}
                                                        {
                                                            item.sku
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            item
                                                                .category
                                                                .title
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            item.brand
                                                        }
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                                    <strong className="text-base text-gray-900">
                                                        {item.price.toLocaleString(
                                                            'uk-UA',
                                                        )}{' '}
                                                        ₴
                                                    </strong>

                                                    {item.previousPrice !=
                                                        null && (
                                                        <span className="text-sm text-gray-400 line-through">
                                                            {item.previousPrice.toLocaleString(
                                                                'uk-UA',
                                                            )}{' '}
                                                            ₴
                                                        </span>
                                                    )}

                                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                        На складі:{' '}
                                                        {
                                                            item.stockQuantity
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingProduct(
                                                            item,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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
                                                        handleDeleteProduct(
                                                            item.id,
                                                            item.title,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
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

                                        <div className="mt-5 border-t border-gray-100 pt-5">
                                            <ProductImagesManager
                                                productId={
                                                    item.id
                                                }
                                            />
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ====================================================
                CREATE PRODUCT MODAL
            ==================================================== */}

            {showCreateForm && (
                <Modal
                    title="Новий товар"
                    subtitle="Додайте новий товар до каталогу"
                    onClose={() =>
                        setShowCreateForm(false)
                    }
                >
                    <form
                        onSubmit={handleCreateProduct}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="SKU">
                                <input
                                    name="sku"
                                    required
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Бренд">
                                <input
                                    name="brand"
                                    required
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        <Field label="Назва товару">
                            <input
                                name="title"
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Короткий опис">
                            <input
                                name="subtitle"
                                required
                                className={inputClass}
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Ціна">
                                <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>

                            <Field label="Стара ціна">
                                <input
                                    name="previousPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Категорія">
                                <select
                                    name="categoryId"
                                    required
                                    className={
                                        inputClass
                                    }
                                >
                                    <option value="">
                                        Оберіть категорію
                                    </option>

                                    {categories.map(
                                        (category) => (
                                            <option
                                                key={
                                                    category.id
                                                }
                                                value={
                                                    category.id
                                                }
                                            >
                                                {
                                                    category.title
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </Field>

                            <Field label="Кількість на складі">
                                <input
                                    name="stockQuantity"
                                    type="number"
                                    min="0"
                                    defaultValue="10"
                                    required
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Бейдж">
                            <input
                                name="badge"
                                placeholder="Наприклад: Хіт"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="URL основного зображення">
                            <input
                                name="imageUrl"
                                placeholder="https://..."
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Додаткові фото">
                            <input
                                name="images"
                                type="file"
                                accept="image/*"
                                multiple
                                className={fileClass}
                            />
                        </Field>

                        <Field label="Офіційний сайт виробника">
                            <input
                                name="manufacturerUrl"
                                placeholder="https://..."
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Характеристики">
                            <textarea
                                name="specifications"
                                rows={4}
                                defaultValue="Гарантія: 12 місяців"
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

                        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateForm(
                                        false,
                                    )
                                }
                                className={secondaryButtonClass}
                            >
                                Скасувати
                            </button>

                            <button
                                type="submit"
                                disabled={isCreating}
                                className={primaryButtonClass}
                            >
                                {isCreating
                                    ? 'Збереження...'
                                    : 'Зберегти товар'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ====================================================
                EDIT PRODUCT MODAL
            ==================================================== */}

            {editingProduct && (
                <Modal
                    title="Редагування товару"
                    subtitle={editingProduct.title}
                    onClose={() =>
                        setEditingProduct(null)
                    }
                >
                    <form
                        onSubmit={handleUpdateProduct}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="SKU">
                                <input
                                    name="sku"
                                    defaultValue={
                                        editingProduct.sku
                                    }
                                    required
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>

                            <Field label="Бренд">
                                <input
                                    name="brand"
                                    defaultValue={
                                        editingProduct.brand
                                    }
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Назва">
                            <input
                                name="title"
                                defaultValue={
                                    editingProduct.title
                                }
                                required
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Короткий опис">
                            <input
                                name="subtitle"
                                defaultValue={
                                    editingProduct.subtitle
                                }
                                className={inputClass}
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Ціна">
                                <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={
                                        editingProduct.price
                                    }
                                    required
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>

                            <Field label="Стара ціна">
                                <input
                                    name="previousPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={
                                        editingProduct.previousPrice ??
                                        ''
                                    }
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Категорія">
                                <select
                                    name="categoryId"
                                    defaultValue={
                                        editingProduct
                                            .category.id
                                    }
                                    required
                                    className={
                                        inputClass
                                    }
                                >
                                    {categories.map(
                                        (category) => (
                                            <option
                                                key={
                                                    category.id
                                                }
                                                value={
                                                    category.id
                                                }
                                            >
                                                {
                                                    category.title
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </Field>

                            <Field label="Кількість на складі">
                                <input
                                    name="stockQuantity"
                                    type="number"
                                    min="0"
                                    defaultValue={
                                        editingProduct.stockQuantity
                                    }
                                    required
                                    className={
                                        inputClass
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Бейдж">
                            <input
                                name="badge"
                                defaultValue={
                                    editingProduct.badge ??
                                    ''
                                }
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Основне зображення">
                            <input
                                name="imageUrl"
                                defaultValue={
                                    editingProduct.imageUrl ??
                                    ''
                                }
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Сайт виробника">
                            <input
                                name="manufacturerUrl"
                                defaultValue={
                                    editingProduct.manufacturerUrl ??
                                    ''
                                }
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Характеристики">
                            <textarea
                                name="specifications"
                                rows={5}
                                defaultValue={
                                    editingProduct.specifications ??
                                    ''
                                }
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Опис">
                            <textarea
                                name="description"
                                rows={6}
                                defaultValue={
                                    editingProduct.description ??
                                    ''
                                }
                                className={inputClass}
                            />
                        </Field>

                        <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                            <button
                                type="button"
                                onClick={() =>
                                    setEditingProduct(
                                        null,
                                    )
                                }
                                className={secondaryButtonClass}
                            >
                                Скасувати
                            </button>

                            <button
                                type="submit"
                                disabled={isUpdating}
                                className={primaryButtonClass}
                            >
                                {isUpdating
                                    ? 'Збереження...'
                                    : 'Зберегти зміни'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function StatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="m-0 text-sm text-gray-500">
                {label}
            </p>

            <p className="mb-0 mt-2 text-2xl font-bold text-gray-900">
                {value}
            </p>
        </div>
    );
}

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
                className="w-full max-w-3xl rounded-2xl bg-white shadow-xl"
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
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                        aria-label="Закрити"
                    >
                        <X size={20} />
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
    'rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClass =
    'rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50';