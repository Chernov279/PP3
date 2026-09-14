# КиноРек — Frontend

Клиентская часть сервиса персональных рекомендаций фильмов. Работает поверх готового FastAPI-бэкенда.

> **Локально:** `http://localhost:3000` (dev) | **Docker:** `http://localhost:3000` | **API:** `http://localhost:8000/docs`

## Описание

SPA на React + TypeScript + Vite. Пользователь авторизуется, подключает Кинопоиск, настраивает веса рекомендаций, управляет избранным (фильмы, жанры, персоны), загружает аватар и ищет контент через единый поиск.

## Технологический стек

| Компонент | Технология |
| :--- | :--- |
| **UI** | React 18, TypeScript |
| **Сборка** | Vite 6 |
| **Стили** | Tailwind CSS 4, shadcn/ui (Radix) |
| **Тема** | next-themes (светлая / тёмная) |
| **HTTP** | fetch + JWT (access / refresh) |
| **DevOps** | Docker (nginx), переменная `VITE_API_BASE_URL` |

## Быстрый старт

### Разработка (бэкенд в Docker)

```bash
# из корня репозитория
docker compose up -d

cd frontend
npm install
npm run dev
```

Создайте в корне проекта `.env` (если ещё нет) и для фронта укажите:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Полный стек в Docker

```bash
docker compose up -d --build
```

- Frontend: http://localhost:3000  
- API: http://localhost:8000  
- MinIO Console: http://localhost:9001  

## Соответствие API бэкенда

| Модуль бэкенда | Экран / компонент |
| :--- | :--- |
| Auth (login, register, refresh) | `AuthDialog`, `AuthContext` |
| Users `/users/me`, avatar | `AccountPage`, `ProfileAvatar`, `Header` |
| Films, recommendations | `MovieCatalog`, `MovieDetailsDialog` |
| Genres favorite | вкладка «Жанры» в `AccountPage` |
| Persons search / favorite | `SearchDialog`, вкладка «Актёры», `PersonCard` |
| Kinopoisk sync | диалог подключения в профиле |

---

## Task Tracker & Sprint Plan

### Sprint 1 — MVP интерфейса

*Цель: показать сквозной сценарий «вход → профиль → рекомендации».*

**Реализовано:**
- [x] **Auth UI:** регистрация, вход, хранение JWT, авто-refresh.
- [x] **Каталог:** рекомендации с фильтрами (популярность, персонализация, год, жанры).
- [x] **Профиль:** вкладки подключений, просмотрено, избранное, жанры.
- [x] **Карточки фильмов:** `MovieCard`, детали в модальном окне.

**Отчёт:**
- Plan vs Fact: 4 / 4.
- Блокеры: без синхронизации Кинопоиска рекомендации недоступны (ожидаемое поведение API).

---

### Sprint 2 — Избранное и поиск

*Цель: закрыть пользовательские списки и поиск по каталогу.*

**Реализовано:**
- [x] **Избранные фильмы:** добавление / удаление из карточки и синхронизация с `/films/favorite`.
- [x] **Любимые жанры:** CRUD через `/genres/favorite`.
- [x] **Поиск фильмов:** `/films/search` в `SearchDialog`.
- [x] **История просмотров:** `/users/{id}/films` на вкладке «Просмотрено».

**Отчёт:**
- Plan vs Fact: 4 / 4.
- План на Sprint 3: медиа-профиль (аватар) и персоны.

---

### Sprint 3 — Аватар, тема, Docker

*Цель: визуальная персонализация и деплой UI рядом с API.*

**Реализовано:**
- [x] **Аватар:** загрузка и удаление (`POST/DELETE /users/me/avatar`), отображение в шапке и профиле.
- [x] **Тема:** переключатель светлая / тёмная (`next-themes`, класс `.dark` на `<html>`).
- [x] **Docker:** `frontend/Dockerfile`, nginx, сервис `frontend` в `docker-compose.yml`.
- [x] **Toasts:** уведомления через `sonner` с учётом темы.

**Отчёт:**
- Plan vs Fact: 4 / 4.
- Примечание: URL аватаров отдаёт MinIO (`MINIO_PUBLIC_URL` на бэкенде, обычно `http://localhost:9000`).

---

### Sprint 4 — Персоны как карточки

*Цель: паритет с бэкенд-модулем Persons.*

**Реализовано:**
- [x] **PersonCard** — карточки персон по аналогии с фильмами.
- [x] **Поиск персон:** `/persons/search` во вкладке поиска.
- [x] **Избранные актёры:** сетка карточек + удаление через `/persons/favorite/{id}`.
- [x] **PersonDetailsDialog:** детали персоны и избранное.

**Отчёт:**
- Plan vs Fact: 4 / 4.
- План на следующий спринт (идеи): коллекции пользователя, пагинация списков, E2E-тесты.

---

## Структура (основное)

```
frontend/
├── src/
│   ├── components/     # UI и страницы
│   ├── contexts/       # AuthContext
│   ├── hooks/          # useApi
│   ├── services/api.ts # клиент REST API
│   └── types/          # Movie, Person, auth
├── Dockerfile
└── nginx.conf
```

## Скрипты

| Команда | Описание |
| :--- | :--- |
| `npm run dev` | Dev-сервер на порту 3000 |
| `npm run build` | Production-сборка в `build/` |
