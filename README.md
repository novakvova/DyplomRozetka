# Командний проєкт Rozetka Unified

Окрема обʼєднана fullstack-версія проєкту Rozetka.

## Стек

- ASP.NET Core 10.0 Backend
- React TypeScript Vite
- Tailwind CSS
- PostgreSQL
- Docker Compose

## Що реалізовано за ТЗ

- Реєстрація, вхід, відновлення паролю, зміна паролю
- Демонстраційний Google login endpoint
- Каталог доступний незареєстрованому покупцю
- Пошук, категорії, картка товару, повний перегляд товару
- Посилання на офіційний сайт виробника
- Кошик, зміна кількості, видалення товарів
- Обране
- Оформлення замовлення з вибором Нової Пошти
- Відгуки до товарів
- Історія замовлень
- Редагування профілю та вихід
- Адмінка: користувачі, блокування, ролі, категорії, список товарів, додавання товарів, додавання адміністратора

## Запуск

1. Запустити PostgreSQL:

```bash
cd "/Users/radonnazar/Documents/Командний проєкт Rozetka Unified"
docker compose up -d
```

2. Запустити backend:

```bash
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$PATH"
cd "/Users/radonnazar/Documents/Командний проєкт Rozetka Unified/backend/Rozetka.Api"
dotnet run --urls http://localhost:5051
```

3. Запустити frontend:

```bash
cd "/Users/radonnazar/Documents/Командний проєкт Rozetka Unified/frontend"
VITE_API_URL="http://localhost:5051/api" npm run dev -- --host 127.0.0.1 --port 5174
```

Для реального Google-входу у web-версії можна додати у `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5051/api
```

Відкрити:

```text
http://127.0.0.1:5174/
```

## Тестові акаунти

Адміністратор:

```text
email: radon.bogdan09@gmail.com
password: Admin12345
```

Користувач:

```text
email: user@example.com
password: User12345
```

## AWS

Для локального захисту проєкт працює без AWS. Для виконання пункту ТЗ у репозиторії передбачена структура, яку можна деплоїти:

- backend і PostgreSQL на AWS LightSail;
- зображення товарів можна винести в AWS S3 через поле `ImageUrl`;
- офіційні посилання виробників зберігаються в полі `ManufacturerUrl`.

## Примітка

Ця папка створена як окремий фінальний fullstack-проєкт. Основні сценарії реалізовані у React Vite + ASP.NET Core.
