FROM node:18-alpine

WORKDIR /app

# Copy the entire project
COPY . .

# Copy production environment variables
RUN cp backend/.env.production backend/.env

# Install backend dependencies and build the application
RUN cd backend && npm install && npm run build

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["sh", "-c", "cd backend && npm start"] 