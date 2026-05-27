import { FormEvent } from 'react';
import type { Category, Product, User } from '../types';

type AdminPageProps = {
  categories: Category[];
  products: Product[];
  users: User[];
  onCreateProduct: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteProduct: (id: string) => void;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void;
  onCreateAdmin: (event: FormEvent<HTMLFormElement>) => void;
  onToggleUserBlock: (id: string) => void;
  onToggleUserRole: (id: string) => void;
};

export function AdminPage({
  categories,
  products,
  users,
  onCreateProduct,
  onDeleteProduct,
  onCreateCategory,
  onCreateAdmin,
  onToggleUserBlock,
  onToggleUserRole,
}: AdminPageProps) {
  return (
    <section className="admin-grid">
      <form onSubmit={onCreateProduct}>
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
            <button onClick={() => onDeleteProduct(item.id)}>Видалити</button>
          </article>
        ))}
      </div>

      <form onSubmit={onCreateCategory}>
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
            <button onClick={() => onToggleUserBlock(item.id)}>{item.isBlocked ? 'Розблокувати' : 'Блокувати'}</button>
            <button onClick={() => onToggleUserRole(item.id)}>Змінити роль</button>
          </article>
        ))}
      </div>

      <form onSubmit={onCreateAdmin}>
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
