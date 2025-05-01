# Bill Generator SaaS

A full-stack application for generating and managing bills and inventory for Gunawardhana Motors.

## Project Structure

- **Frontend**: React application with Vite
  - Located in `/frontend`
  - Uses React, TailwindCSS, and Ant Design components

- **Backend**: Node.js API with Express and MongoDB
  - Located in `/backend`
  - Uses Node.js, Express, and MongoDB

## Features

### Bill Generation
- Create and manage bills for motorcycle sales
- Support for different payment methods:
  - Cash sales with RMV charges (13,000 Rs)
  - Leasing with CPZ charges (13,500 Rs)
- Special handling for different vehicle types:
  - E-Motorcycles
  - E-Bicycles (COLA5, X01 models)
  - E-Tricycles
- PDF generation for bills with professional formatting
- Advance payment support with balance tracking
- Bill status management (pending, completed, cancelled)

### Inventory Management
- Complete bike inventory tracking system
- Add bikes to inventory individually or in batch mode
- Track bike status throughout lifecycle:
  - Available - Ready for sale
  - Reserved - Temporarily held for a customer
  - Sold - Linked to a completed bill
  - Damaged - Not available for sale
- Automatic inventory updates when bills are created/cancelled
- Comprehensive inventory reporting:
  - Current stock levels by model
  - Total inventory value
  - Status distribution statistics
- Integration with bill generation process
- Motor number and chassis number tracking

## Deployment Information

### Frontend
- Deployed on Cloudflare Pages
- URL: https://gunawardanamotors.pages.dev
- Build command: `npm run build`
- Build directory: `dist`

### Backend
- Deployed on Railway
- URL: https://bill-gen-production.up.railway.app
- Environment variables set in Railway dashboard

### Database
- MongoDB Atlas
- Connection string managed via environment variables

## Development Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (local instance or Atlas connection)

### Running Locally

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Port for the server (default: 8080)
- `NODE_ENV`: Environment (development, production)
- `JWT_SECRET`: Secret for JWT tokens
- `CORS_ORIGINS`: Allowed origins for CORS
- `REDIS_URL`: Redis connection string (optional, for caching)

### Frontend
- `VITE_API_URL`: URL of the backend API

## Documentation

Detailed documentation is available in the `/docs` directory:

- `/docs/models` - Database schema documentation
- `/docs/workflow` - Business process workflows
- `/docs/api` - API endpoint documentation

## Contributors
- Uminda H. (Spyboss)

## License
MIT