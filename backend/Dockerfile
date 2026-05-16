FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev
COPY . .
# Don't copy .env - it must be injected at runtime
EXPOSE 5000
CMD ["node", "server.js"]
