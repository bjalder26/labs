# Use Node.js base image
FROM node:18

# ✅ Install required system dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxdamage1 \
    libxfixes3 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-6 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    fonts-liberation \
    libappindicator3-1 \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Start your app
CMD ["node", "app.js"]
