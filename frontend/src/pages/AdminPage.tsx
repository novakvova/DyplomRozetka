import { FormEvent } from 'react';
import { extractErrorMessage } from '../api/client';
import {
  useCreateAdminMutation,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetUsersQuery,
  useToggleUserBlockMutation,
  useToggleUserRoleMutation,
} from '../store/api/adminApi';
import { useGetCategoriesQuery, useGetProductsQuery } from '../store/api/catalogApi';
import { useAppDispatch } from '../store/hooks';
import { messageSet } from '../store/uiSlice';

export function AdminPage() {
  const dispatch = useAppDispatch();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: products = [] } = useGetProductsQuery({});
  const { data: users = [] } = useGetUsersQuery();
  const [createProduct] = useCreateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [createAdmin] = useCreateAdminMutation();
  const [toggleUserBlock] = useToggleUserBlockMutation();
  const [toggleUserRole] = useToggleUserRoleMutation();

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
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as {
      slug: string;
      title: string;
      description: string;
    };

    try {
      await createCategory(data).unwrap();
      event.currentTarget.reset();
    } catch (error) {
      dispatch(messageSet(extractErrorMessage(error, 'Не вдалося додати категорію.')));
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
          <button>Додати категорію</button>
          {categories.map((item) => <small key={item.id}>{item.title} · {item.slug}</small>)}
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