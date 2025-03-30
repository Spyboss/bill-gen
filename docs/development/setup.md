# Development Environment Setup

## System Requirements

- Node.js (v16 or later)
- npm (v8 or later)
- MongoDB (local instance or MongoDB Atlas account)
- Git

## Repository Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/bill-gen.git
   cd bill-gen
   ```

2. Create branch structure:
   ```bash
   git checkout -b dev
   ```

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:
   ```
   # Server settings
   PORT=8080
   NODE_ENV=development

   # MongoDB settings - update with your MongoDB connection string
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/bill-gen?retryWrites=true&w=majority

   # CORS settings - update with your frontend URL
   CORS_ORIGIN=http://localhost:5173

   # Logging
   LOG_LEVEL=debug
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

   The server should start on port 8080 (or the port you specified in the .env file).

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:
   ```
   # API Configuration
   VITE_API_URL=http://localhost:8080/api

   # Application Configuration
   VITE_APP_NAME=BillGen
   VITE_APP_DESCRIPTION=Professional Bill Generation System
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend should start on port 5173 and automatically open in your browser.

## Database Setup

If you're using a local MongoDB instance, ensure MongoDB is running:

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service if needed
# On Windows:
net start MongoDB

# On MacOS/Linux:
sudo service mongod start
# or
brew services start mongodb-community
```

## Verifying Setup

1. Backend health check:
   - Open your browser and navigate to: `http://localhost:8080/api/health`
   - You should see a JSON response with status "ok"

2. Frontend connection:
   - The frontend should automatically connect to the backend
   - You should be able to navigate through the application

## Working Across Multiple Environments

If you work across multiple environments (home and workplace):

1. Keep your MongoDB Atlas connection string in a secure location
2. Ensure you commit and push changes before switching environments
3. Pull the latest changes when starting work in a different environment
4. Use the same branch names across environments

## Troubleshooting

- **MongoDB Connection Issues**: Verify network access and whitelist IP addresses in MongoDB Atlas
- **CORS Errors**: Check that CORS_ORIGIN in backend matches your frontend URL exactly
- **Module Not Found Errors**: Ensure all dependencies are installed (`npm install` in both directories)
- **Port Already In Use**: Change the port in .env files if the default ports are already in use 