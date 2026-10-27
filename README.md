# Planner — Android-приложения

| Приложение | Модуль | Исходник интерфейса |
|---|---|---|
| **Мои задачи** | `app/` | `app/src/main/assets/index.html` |
| **Конструктор лестниц** | `stairs/` | `web/stairs/` (index.html, main.js, model.js) |

## Готовые APK
Каждый push в `main` запускает GitHub Actions: тесты → сборка → публикация в **Releases**
(`MyTasks.apk`, `StairBuilder.apk`). Скриншоты конструктора из теста — в ветке `ci-screenshots`.

## Конструктор лестниц
- `model.js` — расчёт геометрии (мм), без зависимостей; покрыт тестами `npm test`.
- `main.js` — 3D (three.js 0.152), 2D-чертежи и интерфейс; собирается в `stairs/src/main/assets/app.js`:
  ```
  npm install
  npm run build:stairs
  ```
- `npm run smoke` — проверка собранной страницы в Chrome.

## Сборка локально
`npm install && npm run build:stairs`, затем Android Studio → Open → Build APK(s).
