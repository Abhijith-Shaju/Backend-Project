# Smart Logistics Services

Full-stack logistics and supply-chain management scaffold based on the provided system design document.

## Stack

- Backend: Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT
- Frontend: React, Vite, CSS modules via plain CSS
- Modules: auth, users, shipments, inventory, orders, fleet, vendors, analytics, notifications

## Project Structure

```text
smart-logistics-services/
  backend/
  frontend/
```

## Run Locally

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:5000/api/v1`.

