# Bill Generator SaaS

A full-stack application for generating and managing bills.

## Project Structure

- **Frontend**: React application with Vite
  - Located in `/frontend`
  - Uses React, TailwindCSS, and TypeScript

- **Backend**: Node.js API with Express and MongoDB
  - Located in `/backend`
  - Uses Node.js, Express, and MongoDB

## Deployment Information

### Frontend
- Deployed on Cloudflare Pages
- Build command: `npm run build`
- Build directory: `dist`

### Backend
- Deployed on Railway
- Environment variables set in Railway dashboard

### Database
- MongoDB Atlas
- Connection string managed via environment variables

## Development Setup

### Prerequisites
- Node.js (v16+)
- npm

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

### Frontend
- `VITE_API_URL`: URL of the backend API

## License
MIT 