# Rozetka Unified Fullstack

Актуальна інструкція знаходиться у файлі `README.md` на корені проєкту.

Ця версія є окремим фінальним fullstack-проєктом:

- backend: `backend/Rozetka.Api`
- frontend: `frontend`
- database: `database/schema.sql`
- Docker PostgreSQL: `docker-compose.yml`

Основний локальний запуск:

```bash
cd "/Users/radonnazar/Documents/Командний проєкт Rozetka Unified"
docker compose up -d
```

```bash
cd "/Users/radonnazar/Documents/Командний проєкт Rozetka Unified/backend/Rozetka.Api"
dotnet run --urls http://localhost:5051
```

```bash
cd "/Users/radonnazar/Documents/Командний проєкт Rozetka Unified/frontend"
VITE_API_URL="http://localhost:5051/api" npm run dev -- --host 127.0.0.1 --port 5174
```
