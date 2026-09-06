import { FormEvent, useRef, useState } from 'react';
import { extractErrorMessage, resolveAssetUrl} from "../store/api/client";
import {
  useCreateAdminMutation,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetUsersQuery,
  useToggleUserBlockMutation,
  useToggleUserRoleMutation,
  useUpdateCategoryMutation,
} from '../store/api/adminApi';
import { useGetCategoriesQuery, useGetProductsQuery } from '../store/api/catalogApi';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

export function AdminPage() {
  const dispatch = useAppDispatch();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: productsPage } = useGetProductsQuery({ pageSize: 100 });
  const products = productsPage?.items ?? [];
  const { data: users = [] } = useGetUsersQuery();
  const [createProduct] = useCreateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [createAdmin] = useCreateAdminMutation();
  const [toggleUserBlock] = useToggleUserBlockMutation();
  const [toggleUserRole] = useToggleUserRoleMutation();
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const categoryImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    try {
      await createProduct({
        sku: data.get('sku') as string,
        title: data.get('title') as string,
        subtitle: data.get('subtitle') as string,
        brand: data.get('brand') as string,
        price: Number(data.get('price')),
        previousPrice: Number(data.get('previousPrice')) || null,
        badge: data.get('badge') as string,
        imageUrl: data.get('imageUrl') as string,
        description: data.get('description') as string,
        manufacturerUrl: data.get('manufacturerUrl') as string,
        specifications: data.get('specifications') as string,
        stockQuantity: Number(data.get('stockQuantity')),
        categoryId: data.get('categoryId') as string,
      }).unwrap();
      event.currentTarget.reset();
      dispatch(messageSet('Товар додано.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося додати товар.')));
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const imageFile = data.get('image') as File | null;

    try {
      await createCategory({
        slug: data.get('slug') as string,
        title: data.get('title') as string,
        description: (data.get('description') as string) ?? '',
        image: imageFile && imageFile.size > 0 ? imageFile : null,
      }).unwrap();
      form.reset();
      setCategoryImagePreview(null);
      dispatch(messageSet('Категорію додано.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося додати категорію.')));
    }
  }

  function handleCategoryImagePreview(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setCategoryImagePreview(null);
      return;
    }
    setCategoryImagePreview(URL.createObjectURL(file));
  }

  async function handleReplaceCategoryImage(categoryId: string, slug: string, title: string, description: string, file: File) {
    try {
      await updateCategory({ id: categoryId, slug, title, description, image: file }).unwrap();
      dispatch(messageSet('Фото категорії оновлено.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося оновити фото категорії.')));
    }
  }

  async function handleCreateAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      city: string;
    };

    try {
      await createAdmin(data).unwrap();
      event.currentTarget.reset();
      dispatch(messageSet('Нового адміністратора додано.'));
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося додати адміністратора.')));
    }
  }

  return (
      <section className="admin-grid">
        <form onSubmit={handleCreateProduct}>
          <h2>Додати товар</h2>
          <input name="sku" placeholder="SKU" required />
          <input name="title" placeholder="Назва" required />
          <input name="subtitle" placeholder="Короткий опис" required />
          <input name="brand" placeholder="Бренд" required />
          <input name="price" type="number" placeholder="Ціна" required />
          <input name="previousPrice" type="number" placeholder="Стара ціна" />
          <input name="badge" placeholder="Бейдж" />
          <input name="imageUrl" placeholder="URL зображення" defaultValue="https://placehold.co/640x480/f5f7fb/1f2937?text=Rozetka" />
          <input name="manufacturerUrl" placeholder="Офіційний сайт виробника" />
          <textarea name="specifications" placeholder="Характеристики" defaultValue="Гарантія: 12 місяців" />
          <textarea name="description" placeholder="Опис товару" />
          <input name="stockQuantity" type="number" placeholder="Залишок" defaultValue="10" required />
          <select name="categoryId" required>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <button className="primary">Зберегти товар</button>
        </form>

        <div className="panel">
          <h2>Список товарів</h2>
          {products.map((item) => (
              <article className="row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.category.title}</span>
                <button onClick={() => deleteProduct(item.id)}>Видалити</button>
              </article>
          ))}
        </div>

        <form onSubmit={handleCreateCategory}>
          <h2>Категорії</h2>
          <input name="slug" placeholder="slug" required />
          <input name="title" placeholder="Назва категорії" required />
          <textarea name="description" placeholder="Опис" />
          <label className="file-field">
            <span>Фото категорії</span>
            <input name="image" type="file" accept="image/*" onChange={handleCategoryImagePreview} />
          </label>
          {categoryImagePreview && (
              <img className="category-photo-preview" src={categoryImagePreview} alt="Попередній перегляд" />
          )}
          <button className="primary">Додати категорію</button>

          <div className="category-admin-list">
            {categories.map((item) => (
                <div className="category-admin-row" key={item.id}>
                  {item.imageUrl ? (
                      <img className="category-admin-thumb" src={resolveAssetUrl(item.imageUrl)} alt={item.title} />
                  ) : (
                      <div className="category-admin-thumb category-admin-thumb-empty">Немає фото</div>
                  )}
                  <div className="category-admin-info">
                    <strong>{item.title}</strong>
                    <span>{item.slug}</span>
                  </div>
                  <input
                      ref={(node) => { categoryImageInputRefs.current[item.id] = node; }}
                      type="file"
                      accept="image/*"
                      className="category-admin-file-input"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (file) {
                          handleReplaceCategoryImage(item.id, item.slug, item.title, item.description, file);
                        }
                      }}
                  />
                  <button
                      type="button"
                      onClick={() => categoryImageInputRefs.current[item.id]?.click()}
                  >
                    {item.imageUrl ? 'Змінити фото' : 'Додати фото'}
                  </button>
                </div>
            ))}
          </div>
        </form>

        <div className="panel">
          <h2>Користувачі</h2>
          {users.map((item) => (
              <article className="row" key={item.id}>
                <strong>{item.email}</strong>
                <span>{item.role}{item.isBlocked ? ' · blocked' : ''}</span>
                <button onClick={() => toggleUserBlock(item.id)}>{item.isBlocked ? 'Розблокувати' : 'Блокувати'}</button>
                <button onClick={() => toggleUserRole(item.id)}>Змінити роль</button>
              </article>
          ))}
        </div>

        <form onSubmit={handleCreateAdmin}>
          <h2>Новий адміністратор</h2>
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Пароль" required />
          <input name="fullName" placeholder="ПІБ" required />
          <input name="phone" placeholder="Телефон" />
          <input name="city" placeholder="Місто" />
          <button>Додати адміністратора</button>
        </form>
      </section>
  );
}