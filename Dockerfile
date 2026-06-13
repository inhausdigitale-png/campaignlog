# Use Node.js Alpine as base image for a light-weight container
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy all source files
COPY . .

# Run production build (Vite client build & Esbuild server build)
RUN npm run build

# Stage 2: Runner stage to keep the final image clean and small
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Bind to port 3000
ENV PORT=3000

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy build artifacts (both compiled server and static client assets) from builder
COPY --from=builder /app/dist ./dist

# Expose port (Cloud Run will route traffic here)
EXPOSE 3000

# Start the full-stack production server
CMD ["npm", "start"]
