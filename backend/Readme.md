# Cash Management System (نظام إدارة الصندوق)

A comprehensive financial management system for hotels and businesses to track all cash inflows (قبض) and outflows (صرف) with proper authorization, documentation, and real-time monitoring.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [User Roles & Permissions](#user-roles--permissions)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Order Workflow](#order-workflow)
- [WebSocket Events](#websocket-events)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)

---

## 🔍 Overview

The Cash Management System is designed to provide hotels and businesses with complete control over their financial operations. It tracks every financial transaction from creation to execution, ensuring proper authorization at each step. The system supports 5 user roles, real-time notifications, document management, and comprehensive reporting.

### Purpose

- Track all cash inflows (income) and outflows (expenses)
- Enforce approval workflows for financial transactions
- Maintain real-time cash balance tracking
- Provide role-based dashboards and reports
- Store supporting documents (invoices, receipts)
- Ensure audit compliance with complete activity logs

---

## 🛠 Tech Stack

| Technology                | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| **Node.js + Express.js**  | Backend server and REST API                 |
| **TypeScript**            | Type safety and better developer experience |
| **PostgreSQL**            | Primary database for all financial data     |
| **Prisma ORM**            | Database modeling, migrations, and queries  |
| **JWT (JSON Web Tokens)** | Authentication and session management       |
| **bcryptjs**              | Password hashing for security               |
| **Socket.IO**             | Real-time notifications and live updates    |
| **Multer**                | File upload handling for documents          |
| **Zod**                   | Request validation and data integrity       |
| **Docker**                | Containerization for consistent deployment  |
| **Docker Compose**        | Multi-container orchestration               |

---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based login/logout system
- Refresh token for extended sessions
- Role-based access control (RBAC) with 5 roles
- Cookie-based token storage for web security

### 📊 Order Management

- Create income (قبض) and expense (صرف) orders
- Add multiple line items per order
- Auto-calculate order totals
- Complete approval workflow: Draft → Pending → Approved → Executed
- Rejection with required comments
- Auto-generate order numbers: `ORD-YYYYMMDD-XXXX`

### 📎 Document Management

- Upload supporting documents (invoices, receipts)
- Support multiple file formats (PDF, images, Word, Excel)
- Document verification by Finance Manager
- Document-to-order linking
- Secure file storage with unique filenames

### 📈 Reports (8 Reports)

| Report                        | For             | Description                         |
| ----------------------------- | --------------- | ----------------------------------- |
| Daily Movement Reconciliation | Admin           | Daily cash flow with pending orders |
| Financial Summary             | Admin, Investor | Income, expenses, cash balance      |
| Income/Expense Analysis       | Admin, Investor | Category-wise breakdown             |
| Orders & Document Status      | Admin           | Orders missing required documents   |
| Pending Commitments           | Admin, Investor | Required liquidity tracking         |
| Audit Log                     | Admin           | Complete user activity trail        |
| User Permissions              | Admin           | User roles and access rights        |
| Client Transaction History    | Client          | Personal transaction records        |

### 📊 Dashboards (5 Dashboards)

| Dashboard       | For             | Key Metrics                                    |
| --------------- | --------------- | ---------------------------------------------- |
| Admin           | Admin           | System overview, KPIs, charts, recent activity |
| Investor        | Investor        | Financial overview, income/expense charts      |
| Finance Manager | Finance Manager | Pending approvals, today's transactions        |
| Employee        | Employee        | Personal orders and task status                |
| Client          | Client          | Personal transactions and receipts             |

### 🔔 Real-time Features

- Instant notifications on order status changes
- Live dashboard updates via WebSocket
- Role-based event broadcasting
- Online user tracking

### 📝 Audit System

- Complete activity logging for all critical actions
- Track data modifications (old/new values)
- IP address and user agent logging
- Searchable and filterable audit trail

---

## 👥 User Roles & Permissions

| Action                | Admin | Investor  | Finance Mgr | Employee | Client  |
| --------------------- | ----- | --------- | ----------- | -------- | ------- |
| View Dashboard        | Full  | Financial | Full/Ops    | Personal | Limited |
| Create Users          | ✅    | ❌        | ❌          | ❌       | ❌      |
| Edit Users            | ✅    | ❌        | ❌          | ❌       | ❌      |
| Delete Users          | ✅    | ❌        | ❌          | ❌       | ❌      |
| Manage Roles          | ✅    | ❌        | ❌          | ❌       | ❌      |
| Create Orders         | ✅    | ❌        | ✅          | ✅       | ❌      |
| Edit Own Orders       | ✅    | ❌        | ✅          | ✅       | ❌      |
| Edit Others' Orders   | ✅    | ❌        | ✅          | ❌       | ❌      |
| Delete Orders         | ✅    | ❌        | ❌          | ❌       | ❌      |
| Approve Orders        | ✅    | ❌        | ✅          | ❌       | ❌      |
| Reject Orders         | ✅    | ❌        | ✅          | ❌       | ❌      |
| Execute Orders        | ✅    | ❌        | ✅          | ❌       | ❌      |
| View All Orders       | ✅    | ✅        | ✅          | ❌       | ❌      |
| View Own Orders       | ✅    | ✅        | ✅          | ✅       | ✅      |
| Upload Documents      | ✅    | ❌        | ✅          | ✅       | ❌      |
| Verify Documents      | ✅    | ❌        | ✅          | ❌       | ❌      |
| Generate Reports      | ✅    | ✅        | ✅          | ❌       | ❌      |
| View Audit Logs       | ✅    | ❌        | ❌          | ❌       | ❌      |
| System Settings       | ✅    | ❌        | ❌          | ❌       | ❌      |
| Receive Notifications | ✅    | ✅        | ✅          | ✅       | ✅      |

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cash_management
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cash_management

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=24h

# Client
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Installation Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd cash-management-system/backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Initialize with seed data
node src/initDb.js
```

4. **Create uploads directory**

```bash
mkdir uploads
```

5. **Start the server**

```bash
# Development
npm run dev

# Production
npm start
```

6. **Verify installation**

```bash
curl http://localhost:5000/api/health
```

### Default Test Users

| Role            | Username | Password    |
| --------------- | -------- | ----------- |
| Admin           | admin    | admin123    |
| Finance Manager | finance  | finance123  |
| Employee        | employee | employee123 |
| Client          | client   | client123   |

---

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Headers

For protected routes, include:

```
Authorization: Bearer <your_jwt_token>
```

---

### 🔐 Authentication Endpoints

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**Response:** Returns user data and JWT token

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
    "currentPassword": "old_password",
    "newPassword": "new_password"
}
```

---

### 👥 User Management Endpoints

| Method | Endpoint                       | Description               | Access |
| ------ | ------------------------------ | ------------------------- | ------ |
| GET    | `/api/users`                   | Get all users (paginated) | Admin  |
| GET    | `/api/users/:id`               | Get single user           | Admin  |
| POST   | `/api/users`                   | Create new user           | Admin  |
| PUT    | `/api/users/:id`               | Update user               | Admin  |
| DELETE | `/api/users/:id`               | Delete user               | Admin  |
| PUT    | `/api/users/:id/toggle-status` | Enable/disable user       | Admin  |

**Query Parameters for GET /api/users:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by username, email, or name
- `role` - Filter by role ID
- `isActive` - Filter by active status

---

### 🎭 Roles Management Endpoints

| Method | Endpoint         | Description                 | Access |
| ------ | ---------------- | --------------------------- | ------ |
| GET    | `/api/roles`     | Get all roles               | Admin  |
| GET    | `/api/roles/:id` | Get role details with users | Admin  |
| POST   | `/api/roles`     | Create new role             | Admin  |
| PUT    | `/api/roles/:id` | Update role permissions     | Admin  |
| DELETE | `/api/roles/:id` | Delete role (if no users)   | Admin  |

---

### 📂 Categories Endpoints

| Method | Endpoint              | Description          | Access            |
| ------ | --------------------- | -------------------- | ----------------- |
| GET    | `/api/categories`     | Get all categories   | Authenticated     |
| GET    | `/api/categories/:id` | Get category details | Authenticated     |
| POST   | `/api/categories`     | Create category      | Admin/Finance Mgr |
| PUT    | `/api/categories/:id` | Update category      | Admin/Finance Mgr |
| DELETE | `/api/categories/:id` | Delete category      | Admin/Finance Mgr |

**Query Parameters:**

- `type` - Filter by `INCOME` or `EXPENSE`
- `isActive` - Filter by active status

---

### 📋 Orders Endpoints

| Method | Endpoint                | Description               | Access                 |
| ------ | ----------------------- | ------------------------- | ---------------------- |
| GET    | `/api/orders`           | Get all orders (filtered) | Admin/Finance/Investor |
| GET    | `/api/orders/my-orders` | Get user's own orders     | Authenticated          |
| GET    | `/api/orders/pending`   | Get pending approvals     | Finance Mgr            |
| GET    | `/api/orders/:id`       | Get order details         | Authenticated          |
| POST   | `/api/orders`           | Create new order          | Admin/Finance/Employee |
| PUT    | `/api/orders/:id`       | Update draft order        | Owner/Admin            |
| DELETE | `/api/orders/:id`       | Delete draft order        | Owner/Admin            |

**Workflow Endpoints:**
| Method | Endpoint | Description | From Status | To Status |
|--------|----------|-------------|-------------|-----------|
| POST | `/api/orders/:id/submit` | Submit for approval | DRAFT | PENDING |
| POST | `/api/orders/:id/approve` | Approve order | PENDING | APPROVED |
| POST | `/api/orders/:id/reject` | Reject order | PENDING | REJECTED |
| POST | `/api/orders/:id/execute` | Execute order | APPROVED | EXECUTED |

**Create Order Body:**

```json
{
  "type": "INCOME",
  "description": "Room booking payment",
  "items": [
    {
      "categoryId": 1,
      "description": "Deluxe Room - 3 nights",
      "quantity": 3,
      "unitPrice": 150.0
    }
  ]
}
```

---

### 📎 Documents Endpoints

| Method | Endpoint                         | Description           |
| ------ | -------------------------------- | --------------------- |
| POST   | `/api/documents/upload`          | Upload single file    |
| POST   | `/api/documents/upload-multiple` | Upload multiple files |
| GET    | `/api/documents`                 | Get all documents     |
| GET    | `/api/documents/:id`             | Get document details  |
| GET    | `/api/documents/:id/download`    | Download file         |
| PUT    | `/api/documents/:id/verify`      | Verify document       |
| DELETE | `/api/documents/:id`             | Delete document       |

**Upload (multipart/form-data):**

```
file: [file]
orderId: 1
description: Invoice for services
```

---

### 📊 Reports Endpoints

| Endpoint                               | Description                    | Access          |
| -------------------------------------- | ------------------------------ | --------------- |
| `/api/reports/daily-movement`          | Daily cash flow reconciliation | Admin           |
| `/api/reports/financial-summary`       | Financial overview             | Admin, Investor |
| `/api/reports/income-expense-analysis` | Category breakdown             | Admin, Investor |
| `/api/reports/orders-documents`        | Missing documents report       | Admin           |
| `/api/reports/pending-commitments`     | Required liquidity             | Admin, Investor |
| `/api/reports/audit-log`               | User activity trail            | Admin           |
| `/api/reports/user-permissions`        | Role access report             | Admin           |
| `/api/reports/client-transactions`     | Personal transactions          | Client          |

---

### 📊 Dashboard Endpoints

| Endpoint                         | Description                   | Access          |
| -------------------------------- | ----------------------------- | --------------- |
| `/api/dashboard/admin`           | System overview, KPIs, charts | Admin           |
| `/api/dashboard/investor`        | Financial overview            | Admin, Investor |
| `/api/dashboard/finance-manager` | Pending approvals             | Finance Mgr     |
| `/api/dashboard/employee`        | Personal orders               | Employee        |
| `/api/dashboard/client`          | Personal transactions         | Client          |

---

### 🔔 Notifications Endpoints

| Method | Endpoint                          | Description           |
| ------ | --------------------------------- | --------------------- |
| GET    | `/api/notifications`              | Get all notifications |
| GET    | `/api/notifications/unread-count` | Get unread count      |
| PUT    | `/api/notifications/:id/read`     | Mark one as read      |
| PUT    | `/api/notifications/read-all`     | Mark all as read      |
| DELETE | `/api/notifications/:id`          | Delete notification   |

---

### ⚙️ Settings Endpoints

| Method | Endpoint                | Description          | Access        |
| ------ | ----------------------- | -------------------- | ------------- |
| GET    | `/api/settings/company` | Get company settings | Authenticated |
| PUT    | `/api/settings/company` | Update settings      | Admin         |

---

## 🔄 Order Workflow

```
┌─────────┐    Submit     ┌──────────┐    Approve    ┌───────────┐
│  DRAFT   │──────────────>│ PENDING  │──────────────>│ APPROVED  │
└─────────┘               └──────────┘               └───────────┘
     │                         │                           │
     │                         │ Reject                    │ Execute
     │                         ▼                           ▼
     │                    ┌──────────┐              ┌───────────┐
     │                    │ REJECTED │              │ EXECUTED  │
     │                    └──────────┘              └───────────┘
     │                         │
     │      Resubmit           │
     └─────────────────────────┘
```

**Status Descriptions:**

- **DRAFT** - Order is being created, can be edited
- **PENDING** - Submitted for approval, waiting for Finance Manager
- **APPROVED** - Approved by Finance Manager, ready to execute
- **REJECTED** - Rejected by Finance Manager, can be revised
- **EXECUTED** - Order has been executed, balance updated

---

## 🔌 WebSocket Events

### Connection

```javascript
const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" },
});
```

### Events (Server → Client)

| Event              | Trigger             | Recipient                      |
| ------------------ | ------------------- | ------------------------------ |
| `order:new`        | New order submitted | Finance Manager, Admin         |
| `order:approved`   | Order approved      | Order Creator                  |
| `order:rejected`   | Order rejected      | Order Creator                  |
| `order:executed`   | Order executed      | Order Creator, Admin, Investor |
| `dashboard:update` | Any status change   | Relevant role users            |
| `notification:new` | New notification    | Target User                    |

### Rooms

- `user:{userId}` - User-specific events
- `role:Admin` - Admin-only events
- `role:Finance Manager` - Finance Manager events
- `role:Investor` - Investor events

---

## 🗄 Database Schema

### Core Tables

| Table         | Description                              |
| ------------- | ---------------------------------------- |
| `users`       | System users with role assignments       |
| `roles`       | User roles with JSON permissions         |
| `categories`  | Income/expense categories (hierarchical) |
| `orders`      | Main transaction records                 |
| `order_items` | Line items within orders                 |
| `documents`   | Uploaded supporting files                |

### Tracking Tables

| Table             | Description                   |
| ----------------- | ----------------------------- |
| `daily_movements` | Daily cash balance tracking   |
| `audit_logs`      | Complete activity audit trail |
| `notifications`   | User notification records     |

### Configuration Tables

| Table              | Description           |
| ------------------ | --------------------- |
| `company_settings` | Company configuration |

### Key Relationships

- User → Role (many-to-one)
- Order → User (createdBy, approvedBy, executedBy)
- Order → OrderItem (one-to-many)
- Order → Document (one-to-many)
- OrderItem → Category (many-to-one)
- DailyMovement → Order (many-to-one)

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── upload.js              # Multer configuration
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── userController.js      # User management
│   │   ├── roleController.js      # Role management
│   │   ├── categoryController.js  # Category management
│   │   ├── orderController.js     # Order management & workflow
│   │   ├── documentController.js  # Document upload & management
│   │   ├── reportController.js    # 8 report generators
│   │   ├── dashboardController.js # 5 role-based dashboards
│   │   ├── notificationController.js # Notification management
│   │   └── settingsController.js  # Company settings
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication & RBAC
│   │   ├── validate.js            # Request validation
│   │   ├── errorHandler.js        # Global error handling
│   │   └── auditLogger.js         # Automatic audit logging
│   ├── routes/
│   │   ├── auth.js                # Auth routes
│   │   ├── users.js               # User routes
│   │   ├── roles.js               # Role routes
│   │   ├── categories.js          # Category routes
│   │   ├── orders.js              # Order routes
│   │   ├── documents.js           # Document routes
│   │   ├── reports.js             # Report routes
│   │   ├── dashboard.js           # Dashboard routes
│   │   ├── notifications.js       # Notification routes
│   │   └── settings.js            # Settings routes
│   ├── sockets/
│   │   ├── index.js               # Socket.IO setup & rooms
│   │   └── eventHandlers.js       # Real-time event handlers
│   ├── validators/
│   │   ├── authValidators.js      # Auth validation schemas
│   │   ├── userValidators.js      # User validation schemas
│   │   ├── roleValidators.js      # Role validation schemas
│   │   ├── categoryValidators.js  # Category validation schemas
│   │   ├── orderValidators.js     # Order validation schemas
│   │   └── documentValidators.js  # Document validation schemas
│   ├── index.js                   # Main server entry point
│   └── initDb.js                  # Database seeding script
├── prisma/
│   └── schema.prisma              # Database models & relations
├── uploads/                       # Document storage directory
├── .env                           # Environment variables
├── .gitignore
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

## 🔒 Security Features

- **Password Hashing** - bcryptjs with salt rounds
- **JWT Authentication** - Token-based with expiration
- **Role-Based Access** - 5 roles with granular permissions
- **Request Validation** - All inputs validated
- **File Validation** - Type and size restrictions
- **Audit Logging** - All critical actions tracked
- **Ownership Checks** - Users can only modify their own data
- **Balance Protection** - Prevents negative balance
- **CORS Protection** - Configured allowed origins
- **Cookie Security** - HTTP-only, secure flags

---

## 🧪 Testing

The API has been tested with Postman. Import the provided Postman collection for complete endpoint testing.

**Test Flow:**

1. Health check - `GET /api/health`
2. Login - `POST /api/auth/login`
3. Use token for protected routes
4. Test CRUD operations
5. Test order workflow
6. Test document uploads
7. Test reports
8. Test dashboards

---

## 📦 Dependencies

### Production

- `express` - Web framework
- `@prisma/client` - Database ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `socket.io` - Real-time communication
- `multer` - File uploads
- `cookie-parser` - Cookie management
- `cors` - Cross-origin support
- `dotenv` - Environment variables
- `express-validator` - Request validation
- `uuid` - Unique ID generation

### Development

- `prisma` - Database migrations
- `nodemon` - Auto-restart on changes
- `typescript` - Type checking
- `ts-node` - TypeScript execution

---

## 🚀 Deployment

### Docker Deployment

```bash
docker-compose up -d
```

### Manual Deployment

```bash
npm install
npm run build
npm start
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Author

Cash Management System Development Team

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** ✅ Complete Backend API
