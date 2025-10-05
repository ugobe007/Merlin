# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the React application
RUN npm run build

# Create data directory for SQLite database
RUN mkdir -p /app/server/data

# Expose port
EXPOSE 5001

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]