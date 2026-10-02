import { FormEvent, useRef, useState } from 'react';
import { Pencil, Search, Trash2, X } from 'lucide-react';

import {
  extractErrorMessage,
  resolveAssetUrl,
} from '../store/api/client';

import { ProductImagesManager } from '../components/ProductImagesManager';

import {
  useCreateAdminMutation,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useDeleteCategoryMutation,
  useDeleteProductMutation,
  useGetUsersQuery,
  useToggleUserBlockMutation,
  useToggleUserRoleMutation,
  useUpdateCategoryMutation,
  useUpdateProductMutation,
  useUploadProductImagesMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
} from '../store/api/adminApi';

import {
  useGetCategoriesQuery,
  useGetProductsQuery,
} from '../store/api/catalogApi';

import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';
import type {
  Category,
  OrderStatus,
  Product,
} from '../types';


export function AdminPage() {
  const dispatch = useAppDispatch();

  // ============================================================
  // DATA
  // ============================================================

  const { data: categories = [] } = useGetCategoriesQuery();

  const { data: productsPage } = useGetProductsQuery({
    pageSize: 100,
  });

  const products = productsPage?.items ?? [];

  const { data: users = [] } = useGetUsersQuery();
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
  } = useGetAdminOrdersQuery();

  // ============================================================
  // MUTATIONS
  // ============================================================

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [uploadProductImages] =
    useUploadProductImagesMutation();

  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [createAdmin] = useCreateAdminMutation();

  const [toggleUserBlock] =
    useToggleUserBlockMutation();

  const [toggleUserRole] =
    useToggleUserRoleMutation();
  const [updateOrderStatus] =
  useUpdateOrderStatusMutation();


  // ============================================================
  // STATE
  // ============================================================

  const [productSearch, setProductSearch] =
    useState('');

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [
    categoryImagePreview,
    setCategoryImagePreview,
  ] = useState<string | null>(null);

  const categoryImageInputRefs =
    useRef<Record<string, HTMLInputElement | null>>({});


  // ============================================================
  // PRODUCT SEARCH
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
    }
  );


  // ============================================================
  // CREATE PRODUCT
  // ============================================================

  async function handleCreateProduct(
    event: FormEvent<HTMLFormElement>
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
          Number(data.get('previousPrice')) || null,

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

      dispatch(
        messageSet('Товар додано.')
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося додати товар.'
          )
        )
      );
    }
  }


  // ============================================================
  // UPDATE PRODUCT
  // ============================================================

  async function handleUpdateProduct(
    event: FormEvent<HTMLFormElement>
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
          Number(data.get('previousPrice')) || null,

        badge:
          data.get('badge') as string,

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

      setEditingProduct(null);

      dispatch(
        messageSet(
          'Товар успішно оновлено.'
        )
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося оновити товар.'
          )
        )
      );
    }
  }


  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  async function handleDeleteProduct(
    id: string,
    title: string
  ) {
    const confirmed =
      window.confirm(
        `Видалити товар "${title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(id).unwrap();

      dispatch(
        messageSet('Товар видалено.')
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося видалити товар.'
          )
        )
      );
    }
  }


  // ============================================================
  // CREATE CATEGORY
  // ============================================================

  async function handleCreateCategory(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;

    const data =
      new FormData(form);

    const imageFile =
      data.get('image') as File | null;

    try {
      await createCategory({
        slug:
          data.get('slug') as string,

        title:
          data.get('title') as string,

        description:
          (data.get('description') as string) ??
          '',

        image:
          imageFile && imageFile.size > 0
            ? imageFile
            : null,
      }).unwrap();

      form.reset();

      setCategoryImagePreview(null);

      dispatch(
        messageSet(
          'Категорію додано.'
        )
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося додати категорію.'
          )
        )
      );
    }
  }


  // ============================================================
  // UPDATE CATEGORY
  // ============================================================

  async function handleUpdateCategory(
    event: FormEvent<HTMLFormElement>
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
          (data.get('description') as string) ??
          '',

        image:
          image && image.size > 0
            ? image
            : null,
      }).unwrap();

      setEditingCategory(null);

      dispatch(
        messageSet(
          'Категорію оновлено.'
        )
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося оновити категорію.'
          )
        )
      );
    }
  }


  // ============================================================
  // DELETE CATEGORY
  // ============================================================

  async function handleDeleteCategory(
    id: string,
    title: string
  ) {
    const confirmed =
      window.confirm(
        `Видалити категорію "${title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCategory(id).unwrap();

      dispatch(
        messageSet(
          'Категорію видалено.'
        )
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося видалити категорію. Перевірте, чи немає товарів у цій категорії.'
          )
        )
      );
    }
  }


  // ============================================================
  // CATEGORY IMAGE PREVIEW
  // ============================================================

  function handleCategoryImagePreview(
    event: FormEvent<HTMLInputElement>
  ) {
    const file =
      event.currentTarget.files?.[0];

    if (!file) {
      setCategoryImagePreview(null);
      return;
    }

    setCategoryImagePreview(
      URL.createObjectURL(file)
    );
  }


  // ============================================================
  // REPLACE CATEGORY IMAGE
  // ============================================================

  async function handleReplaceCategoryImage(
    categoryId: string,
    slug: string,
    title: string,
    description: string,
    file: File
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
          'Фото категорії оновлено.'
        )
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося оновити фото категорії.'
          )
        )
      );
    }
  }


  // ============================================================
  // CREATE ADMIN
  // ============================================================

  async function handleCreateAdmin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const data = Object.fromEntries(
      new FormData(
        event.currentTarget
      ).entries()
    ) as {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      city: string;
    };

    try {
      await createAdmin(data).unwrap();

      event.currentTarget.reset();

      dispatch(
        messageSet(
          'Нового адміністратора додано.'
        )
      );
    } catch (error) {
      dispatch(
        messageSet(
          extractErrorMessage(
            error,
            'Не вдалося додати адміністратора.'
          )
        )
      );
    }
  }
async function handleOrderStatusChange(
  orderId: string,
  status: OrderStatus
) {
  try {
    await updateOrderStatus({
      id: orderId,
      status,
    }).unwrap();

    dispatch(
      messageSet(
        'Статус замовлення успішно змінено.'
      )
    );
  } catch (error) {
    dispatch(
      messageSet(
        extractErrorMessage(
          error,
          'Не вдалося змінити статус замовлення.'
        )
      )
    );
  }
}

  // ============================================================
  // JSX
  // ============================================================

  return (
    <>
      <section className="admin-grid">

        {/* ======================================================
            CREATE PRODUCT
        ====================================================== */}

        <form onSubmit={handleCreateProduct}>

          <h2>Додати товар</h2>

          <input
            name="sku"
            placeholder="SKU"
            required
          />

          <input
            name="title"
            placeholder="Назва"
            required
          />

          <input
            name="subtitle"
            placeholder="Короткий опис"
            required
          />

          <input
            name="brand"
            placeholder="Бренд"
            required
          />

          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ціна"
            required
          />

          <input
            name="previousPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="Стара ціна"
          />

          <input
            name="badge"
            placeholder="Бейдж"
          />

          <input
            name="imageUrl"
            placeholder="URL зображення"
            defaultValue="https://placehold.co/640x480/f5f7fb/1f2937?text=Rozetka"
          />

          <label className="file-field">

            <span>
              Додаткові фото
              (можна вибрати декілька)
            </span>

            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
            />

          </label>

          <input
            name="manufacturerUrl"
            placeholder="Офіційний сайт виробника"
          />

          <textarea
            name="specifications"
            placeholder="Характеристики"
            defaultValue="Гарантія: 12 місяців"
          />

          <textarea
            name="description"
            placeholder="Опис товару"
          />

          <input
            name="stockQuantity"
            type="number"
            min="0"
            placeholder="Залишок"
            defaultValue="10"
            required
          />

          <select
            name="categoryId"
            required
          >
            {categories.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.title}
              </option>
            ))}
          </select>

          <button
            className="primary"
            type="submit"
          >
            Зберегти товар
          </button>

        </form>


        {/* ======================================================
            PRODUCTS LIST
        ====================================================== */}

        <div className="panel admin-products-panel">

          <div className="admin-panel-header">

            <div>
              <h2>Список товарів</h2>

              <span>
                Всього товарів: {products.length}
              </span>
            </div>

          </div>


          {/* SEARCH */}

          <div className="admin-search">

            <Search size={19} />

            <input
              type="search"
              placeholder="Пошук за назвою, SKU або брендом..."
              value={productSearch}
              onChange={(event) =>
                setProductSearch(
                  event.target.value
                )
              }
            />

          </div>


          {/* PRODUCTS */}

          {filteredProducts.length === 0 ? (

            <div className="admin-empty">
              Товарів не знайдено
            </div>

          ) : (

            filteredProducts.map((item) => (

              <article
                className="row product-admin-row"
                key={item.id}
              >

                <div className="product-admin-row-head">

                  <div className="admin-product-info">

                    <strong>
                      {item.title}
                    </strong>

                    <span>
                      {item.category.title}
                    </span>

                    <small>
                      SKU: {item.sku}
                    </small>

                    <small>
                      {item.price.toLocaleString(
                        'uk-UA'
                      )}{' '}
                      ₴
                    </small>

                  </div>


                  <div className="admin-row-actions">

                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={() =>
                        setEditingProduct(item)
                      }
                    >
                      <Pencil size={16} />

                      Редагувати
                    </button>

                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        handleDeleteProduct(
                          item.id,
                          item.title
                        )
                      }
                    >
                      <Trash2 size={16} />

                      Видалити
                    </button>

                  </div>

                </div>

                <ProductImagesManager
                  productId={item.id}
                />

              </article>

            ))

          )}

        </div>


        {/* ======================================================
            CATEGORIES
        ====================================================== */}

        <form onSubmit={handleCreateCategory}>

          <h2>Категорії</h2>

          <input
            name="slug"
            placeholder="slug"
            required
          />

          <input
            name="title"
            placeholder="Назва категорії"
            required
          />

          <textarea
            name="description"
            placeholder="Опис"
          />


          <label className="file-field">

            <span>
              Фото категорії
            </span>

            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={
                handleCategoryImagePreview
              }
            />

          </label>


          {categoryImagePreview && (

            <img
              className="category-photo-preview"
              src={categoryImagePreview}
              alt="Попередній перегляд"
            />

          )}


          <button
            className="primary"
            type="submit"
          >
            Додати категорію
          </button>


          {/* CATEGORY LIST */}

          <div className="category-admin-list">

            {categories.map((item) => (

              <div
                className="category-admin-row"
                key={item.id}
              >

                {item.imageUrl ? (

                  <img
                    className="category-admin-thumb"
                    src={resolveAssetUrl(
                      item.imageUrl
                    )}
                    alt={item.title}
                  />

                ) : (

                  <div className="category-admin-thumb category-admin-thumb-empty">
                    Немає фото
                  </div>

                )}


                <div className="category-admin-info">

                  <strong>
                    {item.title}
                  </strong>

                  <span>
                    {item.slug}
                  </span>

                </div>


                {/* Hidden image input */}

                <input
                  ref={(node) => {
                    categoryImageInputRefs.current[
                      item.id
                    ] = node;
                  }}
                  type="file"
                  accept="image/*"
                  className="category-admin-file-input"
                  onChange={(event) => {
                    const file =
                      event.currentTarget.files?.[0];

                    if (file) {
                      handleReplaceCategoryImage(
                        item.id,
                        item.slug,
                        item.title,
                        item.description,
                        file
                      );
                    }
                  }}
                />


                <div className="admin-row-actions">

                  <button
                    type="button"
                    onClick={() =>
                      categoryImageInputRefs
                        .current[item.id]
                        ?.click()
                    }
                  >
                    {item.imageUrl
                      ? 'Змінити фото'
                      : 'Додати фото'}
                  </button>


                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() =>
                      setEditingCategory(item)
                    }
                  >
                    <Pencil size={16} />

                    Редагувати
                  </button>


                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() =>
                      handleDeleteCategory(
                        item.id,
                        item.title
                      )
                    }
                  >
                    <Trash2 size={16} />

                    Видалити
                  </button>

                </div>

              </div>

            ))}

          </div>

        </form>
{/* ======================================================
    ORDERS
====================================================== */}

<div className="panel admin-orders-panel">

  <div className="admin-panel-header">
    <div>
      <h2>Замовлення</h2>

      <span>
        Всього замовлень: {orders.length}
      </span>
    </div>
  </div>

  {ordersLoading && (
    <div className="admin-empty">
      Завантаження замовлень...
    </div>
  )}

  {ordersError && (
    <div className="admin-empty">
      Не вдалося завантажити замовлення.
    </div>
  )}

  {!ordersLoading &&
    !ordersError &&
    orders.length === 0 && (
      <div className="admin-empty">
        Замовлень поки немає.
      </div>
    )}

  {!ordersLoading &&
    !ordersError &&
    orders.map((order) => (

      <article
        key={order.id}
        className="admin-order-row"
      >

        <div className="admin-order-main">

          <strong>
            Замовлення {order.number}
          </strong>

          <span>
            {order.recipientFullName}
          </span>

          <small>
            {new Date(
              order.createdAt
            ).toLocaleString('uk-UA')}
          </small>

        </div>

        <div className="admin-order-total">
          <span>Сума</span>

          <strong>
            {order.total.toLocaleString(
              'uk-UA'
            )}{' '}
            ₴
          </strong>
        </div>

        <div className="admin-order-status">

          <label
            htmlFor={`order-status-${order.id}`}
          >
            Статус
          </label>

         <select
  id={`order-status-${order.id}`}
  value={order.status}
  onChange={(event) =>
    handleOrderStatusChange(
      order.id,
      event.target.value as OrderStatus
    )
  }
>
  <option value="Placed">
    Очікує оплати
  </option>

  <option value="Processing">
    В обробці
  </option>

  <option value="Shipped">
    Відправлено
  </option>

  <option value="Completed">
    Завершено
  </option>

  <option value="Cancelled">
    Скасовано
  </option>
</select>

        </div>

      </article>

    ))}

</div>

        {/* ======================================================
            USERS
        ====================================================== */}

        <div className="panel">

          <h2>Користувачі</h2>

          {users.map((item) => (

            <article
              className="row"
              key={item.id}
            >

              <strong>
                {item.email}
              </strong>

              <span>
                {item.role}

                {item.isBlocked
                  ? ' · blocked'
                  : ''}
              </span>


              <button
                type="button"
                onClick={() =>
                  toggleUserBlock(item.id)
                }
              >
                {item.isBlocked
                  ? 'Розблокувати'
                  : 'Блокувати'}
              </button>


              <button
                type="button"
                onClick={() =>
                  toggleUserRole(item.id)
                }
              >
                Змінити роль
              </button>

            </article>

          ))}

        </div>


        {/* ======================================================
            CREATE ADMIN
        ====================================================== */}

        <form onSubmit={handleCreateAdmin}>

          <h2>Новий адміністратор</h2>

          <input
            name="email"
            type="email"
            placeholder="Email"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Пароль"
            required
          />

          <input
            name="fullName"
            placeholder="ПІБ"
            required
          />

          <input
            name="phone"
            placeholder="Телефон"
          />

          <input
            name="city"
            placeholder="Місто"
          />

          <button
            type="submit"
            className="primary"
          >
            Додати адміністратора
          </button>

        </form>

      </section>


      {/* ========================================================
          EDIT PRODUCT MODAL
      ======================================================== */}

      {editingProduct && (

        <div
          className="admin-modal-backdrop"
          onMouseDown={() =>
            setEditingProduct(null)
          }
        >

          <div
            className="admin-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-modal-header">

              <div>
                <h2>
                  Редагування товару
                </h2>

                <span>
                  {editingProduct.title}
                </span>
              </div>


              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setEditingProduct(null)
                }
                aria-label="Закрити"
              >
                <X size={20} />
              </button>

            </div>


            <form
              className="admin-edit-form"
              onSubmit={handleUpdateProduct}
            >

              <label>
                <span>SKU</span>

                <input
                  name="sku"
                  defaultValue={
                    editingProduct.sku
                  }
                  required
                />
              </label>


              <label>
                <span>Назва</span>

                <input
                  name="title"
                  defaultValue={
                    editingProduct.title
                  }
                  required
                />
              </label>


              <label>
                <span>Короткий опис</span>

                <input
                  name="subtitle"
                  defaultValue={
                    editingProduct.subtitle
                  }
                />
              </label>


              <label>
                <span>Бренд</span>

                <input
                  name="brand"
                  defaultValue={
                    editingProduct.brand
                  }
                />
              </label>


              <div className="admin-form-columns">

                <label>
                  <span>Ціна</span>

                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={
                      editingProduct.price
                    }
                    required
                  />
                </label>


                <label>
                  <span>Стара ціна</span>

                  <input
                    name="previousPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={
                      editingProduct.previousPrice ??
                      ''
                    }
                  />
                </label>

              </div>


              <label>
                <span>Категорія</span>

                <select
                  name="categoryId"
                  defaultValue={
                    editingProduct.category.id
                  }
                  required
                >

                  {categories.map(
                    (category) => (

                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.title}
                      </option>

                    )
                  )}

                </select>
              </label>


              <label>
                <span>
                  Кількість на складі
                </span>

                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  defaultValue={
                    editingProduct.stockQuantity
                  }
                  required
                />
              </label>


              <label>
                <span>Бейдж</span>

                <input
                  name="badge"
                  defaultValue={
                    editingProduct.badge ?? ''
                  }
                />
              </label>


              <label>
                <span>
                  Основне зображення
                </span>

                <input
                  name="imageUrl"
                  defaultValue={
                    editingProduct.imageUrl ??
                    ''
                  }
                />
              </label>


              <label>
                <span>
                  Сайт виробника
                </span>

                <input
                  name="manufacturerUrl"
                  defaultValue={
                    editingProduct
                      .manufacturerUrl ?? ''
                  }
                />
              </label>


              <label>
                <span>
                  Характеристики
                </span>

                <textarea
                  name="specifications"
                  rows={5}
                  defaultValue={
                    editingProduct
                      .specifications ?? ''
                  }
                />
              </label>


              <label>
                <span>Опис</span>

                <textarea
                  name="description"
                  rows={6}
                  defaultValue={
                    editingProduct
                      .description ?? ''
                  }
                />
              </label>


              <div className="admin-modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct(null)
                  }
                >
                  Скасувати
                </button>


                <button
                  type="submit"
                  className="primary"
                >
                  Зберегти зміни
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ========================================================
          EDIT CATEGORY MODAL
      ======================================================== */}

      {editingCategory && (

        <div
          className="admin-modal-backdrop"
          onMouseDown={() =>
            setEditingCategory(null)
          }
        >

          <div
            className="admin-modal admin-category-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-modal-header">

              <div>
                <h2>
                  Редагування категорії
                </h2>

                <span>
                  {editingCategory.title}
                </span>
              </div>


              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setEditingCategory(null)
                }
                aria-label="Закрити"
              >
                <X size={20} />
              </button>

            </div>


            <form
              className="admin-edit-form"
              onSubmit={handleUpdateCategory}
            >

              <label>
                <span>Slug</span>

                <input
                  name="slug"
                  defaultValue={
                    editingCategory.slug
                  }
                  required
                />
              </label>


              <label>
                <span>
                  Назва категорії
                </span>

                <input
                  name="title"
                  defaultValue={
                    editingCategory.title
                  }
                  required
                />
              </label>


              <label>
                <span>Опис</span>

                <textarea
                  name="description"
                  rows={5}
                  defaultValue={
                    editingCategory.description ??
                    ''
                  }
                />
              </label>


              {editingCategory.imageUrl && (

                <div className="admin-current-image">

                  <span>
                    Поточне фото
                  </span>

                  <img
                    src={resolveAssetUrl(
                      editingCategory.imageUrl
                    )}
                    alt={
                      editingCategory.title
                    }
                  />

                </div>

              )}


              <label className="file-field">

                <span>
                  Нове фото
                  (необов'язково)
                </span>

                <input
                  name="image"
                  type="file"
                  accept="image/*"
                />

              </label>


              <div className="admin-modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    setEditingCategory(null)
                  }
                >
                  Скасувати
                </button>


                <button
                  type="submit"
                  className="primary"
                >
                  Зберегти зміни
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
}