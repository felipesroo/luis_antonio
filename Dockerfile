FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy project files
COPY . .

# Generate Prisma Client and Build
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV PORT=3000

# Runs migrations and pushes the schema, then starts the Next.js server
CMD ["npm", "run", "start"]
