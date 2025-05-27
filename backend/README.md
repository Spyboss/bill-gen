# 🚀 Gunawardhana Motors Backend API

**Enterprise-grade backend API for the Gunawardhana Motors Business Management System**

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/mongodb-6.3.0-green.svg)](https://www.mongodb.com/)

## 🌟 Overview

This is the backend API that powers the Gunawardhana Motors Business Management System. Built with modern technologies and enterprise-grade security, it provides a robust foundation for managing sales, inventory, quotations, and user operations.

## ✨ Key Features

### 🏢 **Business Operations**
- **Sales Management** - Complete bill lifecycle management
- **Inventory Control** - Real-time stock tracking and analytics
- **Quotation System** - Insurance claims and estimate management
- **Customer Management** - Secure customer data handling

### 🔐 **Security & Compliance**
- **Field-level Encryption** - Sensitive data protection
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Rate Limiting** - API abuse prevention
- **GDPR Compliance** - Complete data protection framework
- **Activity Logging** - Comprehensive audit trails

### 📊 **Advanced Features**
- **PDF Generation** - Professional document creation
- **Real-time Analytics** - Business intelligence and reporting
- **Batch Operations** - Efficient bulk data processing
- **Role-based Access** - Granular permission system

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **Security**: Helmet, CORS, Rate limiting, Data encryption
- **Logging**: Winston with structured logging
- **Testing**: Vitest for unit and integration tests
- **Deployment**: Railway with Docker containerization

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** (Atlas recommended)
- **Git**

### Local Development

1. **Clone and navigate**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:8080`

### Docker Development

```bash
docker-compose up
```

This starts both the API and MongoDB services in containers.

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | User logout |

### Bills Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills` | Get all bills with filtering |
| GET | `/api/bills/:id` | Get bill by ID |
| POST | `/api/bills` | Create new bill |
| PUT | `/api/bills/:id` | Update bill |
| DELETE | `/api/bills/:id` | Delete bill |
| GET | `/api/bills/:id/pdf` | Generate PDF |

### Inventory Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get inventory with filters |
| GET | `/api/inventory/summary` | Get inventory summary |
| GET | `/api/inventory/analytics` | Get inventory analytics |
| POST | `/api/inventory` | Add inventory item |
| POST | `/api/inventory/batch` | Batch add items |
| PUT | `/api/inventory/:id` | Update inventory item |
| DELETE | `/api/inventory/:id` | Delete inventory item |

### Quotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quotations` | Get all quotations |
| GET | `/api/quotations/:id` | Get quotation by ID |
| POST | `/api/quotations` | Create quotation |
| PUT | `/api/quotations/:id` | Update quotation |
| DELETE | `/api/quotations/:id` | Delete quotation |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/activity` | Get user activity |
| DELETE | `/api/gdpr/delete-account` | Delete user account |

## 🌐 Production Deployment

### Railway Deployment

1. **Connect Repository**
   - Link your GitHub repository to Railway
   - Configure automatic deployments

2. **Environment Variables**
   ```env
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   ENCRYPTION_KEY=your-encryption-key
   NODE_ENV=production
   ```

3. **Build Configuration**
   - Railway automatically detects the Node.js app
   - Uses the `npm run build:prod` script
   - Serves from the `dist` directory

### Health Monitoring

- **Health Check**: `GET /api/health`
- **Metrics**: Built-in performance monitoring
- **Logging**: Structured logs with Winston

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📄 License

MIT - see [LICENSE](../LICENSE) for details.