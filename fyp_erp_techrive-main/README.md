# Techrive ERP System

This is the repository for the Techrive Enterprise Resource Planning (ERP) system. The project is split into a separate frontend and backend, using a modern full-stack TypeScript architecture.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (via Vite)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Validation**: Zod

---

## 📁 Folder Structure

```text
fyp_erp_techrive-main/
│
├── backend/                  # Express API Server
│   ├── src/                  # Backend source code (routes, controllers, models)
│   ├── .env                  # Environment variables (DB connection, JWT secret)
│   ├── package.json          # Backend dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
│
├── frontend/                 # React UI Client
│   ├── public/               # Static assets
│   ├── src/                  # React components, pages, hooks, and context
│   ├── package.json          # Frontend dependencies and scripts
│   ├── vite.config.ts        # Vite build tool configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
│
├── .gitignore                # Root Git ignore rules (node_modules, .env, etc.)
└── fyp_erp_postgresql (2).sql # Database backup/schema dump
```

---

## 🔄 Application Flow

1. **Client Interaction**: The user interacts with the React frontend (running on Vite). 
2. **API Requests**: The frontend uses `Axios` to send HTTP requests to the backend Express REST API. 
3. **Authentication**: Secure routes require a JWT token, which is passed in the request headers. 
4. **Validation & Processing**: The backend validates incoming data using `Zod` and processes business logic.
5. **Database Queries**: The backend uses the `Prisma ORM` to query and mutate data in the `PostgreSQL` database.
6. **Response**: The backend sends JSON responses back to the frontend to update the UI.

---

## 🚀 Commands to Run Properly

### 1. Database Setup
Ensure you have PostgreSQL installed and running.
1. Create a database named `fyp_erp` (or match whatever name is in your backend `.env`).
2. Restore the database using the provided SQL dump:
   ```bash
   psql -U postgres -d fyp_erp -f "fyp_erp_postgresql (2).sql"
   ```

### 2. Backend Setup
Open a terminal and navigate to the backend directory:
```bash
cd backend
```
Install the dependencies:
```bash
npm install
```
Generate the Prisma client:
```bash
npx prisma generate --schema=src/prisma/schema.prisma or 
npm prisma generate 
```
Start the backend development server:
```bash
npm run dev
```
*(The backend should now be running, typically on port 5000.)*

### 3. Frontend Setup
Open a **new** terminal and navigate to the frontend directory:
```bash
cd frontend
```
Install the dependencies:
```bash
npm install
```
Start the frontend development server:
```bash
npm run dev
```
*(The frontend should now be running, typically on port 5173.)*

---

## 🔒 Environment Variables
Make sure you have a `.env` file in your `backend/` directory with the following structure:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/fyp_erp"
JWT_SECRET="your_super_secret_jwt_key"
JWT_EXPIRES_IN="7d"
```
*(Never commit this file to version control. It is ignored by `.gitignore`.)*
