# Use Node.js base image
FROM node:18

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
