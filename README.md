# AgriTech — Empowering Farmers Through Digital Technology

A full-stack MERN (MongoDB, Express, React, Node.js) platform that helps farmers manage farms and crops, analyze soil health, check live weather, receive pest alerts, order resources, consult experts and share knowledge in a community forum. Admins get a complete management dashboard with role-based access control.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 (Create React App), React Router 6, Bootstrap 5, Recharts, Axios |
| Backend | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, express-validator |
| Database | MongoDB (local or Atlas) |
| Weather | Open-Meteo public API (no API key required) |
| i18n | English, Hindi and Tamil (client-side JSON dictionaries) |

## Features

### Farmer
- Register/login with JWT and a persisted session.
- Dashboard with crop and order charts and quick actions.
- Farm profiles with size, soil type, notes and activity logs.
- Crop monitoring with seasons, statuses, growth notes and soil snapshots.
- Rule-based soil analysis with health score, recommended crops and fertilizer advice, plus historical trends.
- Live weather, 7-day forecast, farming tips, weather alerts and local pest alerts (Open-Meteo, cached).
- Pest and disease alert filtering by crop, season and region.
- Resource marketplace with cart-style checkout and stock validation.
- Order tracking with status timeline and cancellation for pending orders.
- Expert consultation questions and answers.
- Community forum with categories, search, comments and moderation.
- Profile, password change and language preference (English/Hindi/Tamil).

### Admin
- Aggregated statistics dashboard with charts.
- User management (search, filter, change role, cascade delete).
- Resource catalog management, approval workflow, stock and pricing.
- Order management with status transitions and automatic stock restoration.
- Pest alert CRUD and activation toggles.
- Content moderation for forum posts and expert consultations.

### Security and quality
- Passwords hashed with bcryptjs; JWT bearer authentication.
- Role guards on every protected route (`farmer` / `admin`).
- Input validation with express-validator and centralised error handling.
- Ownership checks on farms, crops, soil reports, orders, consultations and posts.
- CORS restricted to `CLIENT_URL`, consistent JSON responses and pagination metadata.

## Project Structure

```
Smartbridge project/
├─ client/                     React application
│  ├─ public/
│  └─ src/
│     ├─ api/                  Axios instance and error helper
│     ├─ components/           Layout, navbar, cards, guards, tabs
│     ├─ context/              Auth and language providers
│     ├─ i18n/                 en.json, hi.json, ta.json
│     ├─ pages/                Farmer pages
│     │  └─ admin/             Admin pages
│     └─ utils/                Formatters and status colours
├─ server/                     Express REST API
│  ├─ config/                  MongoDB connection
│  ├─ controllers/             Route handlers
│  ├─ middleware/              Auth, validation, errors
│  ├─ models/                  10 Mongoose models
│  ├─ routes/                  REST route modules
│  ├─ seed/                    Demo data seeder
│  ├─ services/                Soil analysis and weather services
│  ├─ utils/                   Logger, JWT, pagination, async wrapper
│  └─ server.js
├─ postman/                    Ready-to-import API collection
├─ package.json                Root convenience scripts
└─ README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 26)
- npm 9+
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Install dependencies

```powershell
npm run install:all
```

Or install each app separately:

```powershell
npm install --prefix server
npm install --prefix client
```

### 2. Configure the backend

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` and set at least `JWT_SECRET`. The defaults work with a local MongoDB:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/agritech
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
WEATHER_CACHE_MINUTES=30
```

The frontend uses CRA's proxy to `http://localhost:5000`, so `client/.env` is optional. To point the UI at another API host:

```powershell
Copy-Item client/.env.example client/.env
```

### 3. Seed demo data

```powershell
npm run seed
```

This clears the AgriTech collections and inserts users, farms, crops, soil reports, resources, orders, pest alerts, consultations and forum posts.

### 4. Run the app

Open two terminals:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

- Frontend: http://localhost:3000
- API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@agritech.com` | `Admin@123` |
| Farmer | `farmer@agritech.com` | `Farmer@123` |
| Farmer | `meena@agritech.com` | `Farmer@123` |

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run install:all` | Install server and client dependencies |
| `npm run dev:server` | Start the API with nodemon |
| `npm run dev:client` | Start the React development server |
| `npm run seed` | Reset and seed the database |
| `npm run build` | Create a production build of the React app |

Server-only scripts (`server/`): `npm start`, `npm run dev`, `npm run seed`.
Client-only scripts (`client/`): `npm start`, `npm run build`, `npm test`.

## API Overview

Base URL: `http://localhost:5000/api`

| Module | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password`, `POST /auth/logout` |
| Farms | `GET/POST /farms`, `GET/PUT/DELETE /farms/:id`, `POST /farms/:id/logs` |
| Crops | `GET/POST /crops`, `GET/PUT/DELETE /crops/:id`, `POST /crops/:id/notes` |
| Soil | `POST /soil/analyze`, `GET /soil/reports`, `GET/DELETE /soil/reports/:id` |
| Weather | `GET /weather?location=...` or `?lat=...&lon=...` (`refresh=true` bypasses cache) |
| Pests | `GET /pests`, `GET /pests/:id`, `POST/PUT/DELETE /pests/:id` (admin writes) |
| Resources | `GET /resources`, `GET /resources/:id`, `POST/PUT/DELETE` (admin), `PATCH /resources/:id/approve` |
| Orders | `GET/POST /orders`, `GET /orders/:id`, `PATCH /orders/:id/status` (admin), `PATCH /orders/:id/cancel` |
| Consultations | `GET/POST /consultations`, `GET/DELETE /consultations/:id`, `PATCH /consultations/:id/reply` (admin) |
| Forum | `GET/POST /forum`, `GET/PUT/DELETE /forum/:id`, `POST /forum/:id/comments`, `DELETE /forum/:id/comments/:commentId`, `PATCH /forum/:id/moderate` (admin) |
| Admin | `GET /admin/stats`, `GET /admin/users`, `PATCH /admin/users/:id/role`, `DELETE /admin/users/:id` |

Responses use `{ success, data, meta?, message? }`. Send the JWT as `Authorization: Bearer <token>`.

## Postman Collection

Import `postman/AgriTech.postman_collection.json`. It includes all endpoints, a `{{baseUrl}}` variable and test scripts that save the JWT and created ids automatically. Start with **Auth → Login (Admin)** or **Login (Farmer)**, then run the folders in order.

## Notes

- **Weather**: Open-Meteo requires no key. Results are cached in MongoDB for `WEATHER_CACHE_MINUTES` (default 30). Location search is geocoded; coordinates are also supported.
- **Soil analysis**: deterministic rule engine in `server/services/soilService.js` (pH, N/P/K, moisture and soil type). It is advisory, not a laboratory test.
- **Multilingual UI**: language is stored in `localStorage` and can be changed in the navbar or profile. New UI strings must be added to all three files in `client/src/i18n/`.
- **Stock safety**: order creation uses conditional `$inc` updates, and rejected/cancelled orders restore stock.
- **Seed warning**: `npm run seed` deletes all documents in the AgriTech collections before inserting demo data.

## Troubleshooting

- **`MongoServerError: connect ECONNREFUSED`** — start MongoDB locally or set `MONGO_URI` to an Atlas connection string.
- **401 responses after seeding** — log in again; seeded users invalidate old tokens.
- **CORS error** — make sure `CLIENT_URL` in `server/.env` matches the frontend origin exactly.
- **Weather request fails** — the server needs outbound internet access to `api.open-meteo.com`.
- **Port already in use** — change `PORT` in `server/.env`, then update `client/.env` or the CRA proxy.

## License

MIT.
