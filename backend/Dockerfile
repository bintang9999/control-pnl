FROM node:18-alpine

# Install build dependencies for node-pty and tailscale execution
RUN apk add --no-cache build-base python3 make g++ linux-headers

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build TypeScript
RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/index.js"]
