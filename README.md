# LogiFlow – Smart Logistics & Supply Chain Management System

LogiFlow is a comprehensive logistics and supply chain management system designed to streamline shipment tracking, warehouse utilization, and fleet management. Built with a modern tech stack, it provides real-time analytics and route visualization.

## 🚀 Features

- **Authentication & Role-Based Access**: Secure JWT-based login with roles for Admin, Warehouse Manager, and Driver.
- **Dynamic Dashboard**: Real-time KPI monitoring with interactive charts (Recharts).
- **Shipment Tracking**: Full lifecycle management of shipments from creation to delivery.
- **Warehouse Management**: Capacity tracking and geospatial monitoring of storage hubs.
- **Fleet Management**: Driver status tracking and vehicle assignment.
- **Route Analytics**: Leaflet.js integration for map-based visualization of logistics networks.
- **Responsive Design**: Premium dark-mode UI built with Tailwind CSS.

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Axios, Lucide React, Recharts, Leaflet.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Security**: JWT, bcrypt

## 📁 Project Structure

```text
logiflow/
├── backend/
│   ├── seed.js             # MongoDB seed data
│   ├── src/
│   │   ├── controllers/    # API logic
│   │   ├── middleware/     # Auth & validation
│   │   ├── routes/         # Endpoint definitions
│   │   ├── services/       # Database connection
│   │   └── server.js       # Entry point
│   └── .env                # Server configuration
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI elements
    │   ├── context/        # Auth state management
    │   ├── pages/          # Main application views
    │   ├── services/       # API integration
    │   └── App.jsx         # Routing and layout
    └── tailwind.config.js  # Styling configuration
```

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB database

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure your `.env` file with `DATABASE_URL` or `MONGODB_URI`, and `JWT_SECRET`.
   - Example: `DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/logiflow?retryWrites=true&w=majority"`
4. Seed the database: `node seed.js`
5. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## 📊 API Documentation

### Auth
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user

### Warehouses
- `GET /api/warehouses` - List all warehouses
- `POST /api/warehouses` - Create new warehouse (Admin only)

### Shipments
- `GET /api/shipments` - List all shipments
- `PATCH /api/shipments/:id/status` - Update delivery status

### Analytics
- `GET /api/analytics/dashboard` - Fetch dashboard KPI data

---
*Developed for academic evaluation and portfolio showcase.*
