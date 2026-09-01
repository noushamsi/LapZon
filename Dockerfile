# Node.js LTS base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose default port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Start the full-stack server
CMD ["node", "server/server.js"]
