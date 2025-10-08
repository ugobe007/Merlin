# Use Node.js version with build tools
FROM node:20-alpine

# Install dependencies needed for better-sqlite3
RUN apk add --no-cache python3 py3-setuptools make g++ sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Explicitly ensure templates directory exists and is copied
RUN ls -la server/templates/ || echo "Templates directory not found"

# Build the React application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create data directory for SQLite database
RUN mkdir -p /app/server/data

# Expose port
EXPOSE 5001

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]