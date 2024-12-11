FROM --platform=linux/amd64 node:18-bullseye-slim

# Install Chromium for ARM
RUN apt-get update && apt-get install -y chromium

# Set working directory
WORKDIR /usr/src/app

# Salin file yang diperlukan
COPY . .

# Instal bun
RUN npm install -g bun && bun install

# Ekspos port aplikasi
EXPOSE 3005

# Jalankan aplikasi
CMD ["bun", "run", "index.ts"]
