#!/bin/bash

echo "🚀 Setting up WhatsApp API for production deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update

# Install Chrome dependencies
echo "🔧 Installing Chrome dependencies..."
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

# Install Google Chrome
echo "🌐 Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Verify Chrome installation
echo "✅ Verifying Chrome installation..."
google-chrome-stable --version

# Set environment variables
echo "⚙️ Setting up environment variables..."
export NODE_ENV=production
export CHROME_BIN=/usr/bin/google-chrome-stable

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whatsapp-api
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CHROME_BIN=/usr/bin/google-chrome-stable
EOL
fi

# Install Node.js dependencies
echo "📚 Installing Node.js dependencies..."
npm install

# Build frontend if needed
if [ -d "frontend" ]; then
    echo "🏗️ Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p sessions uploads public

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod +x index.js
chmod 755 sessions uploads public

echo "✨ Setup complete! You can now start your WhatsApp API with:"
echo "   NODE_ENV=production CHROME_BIN=/usr/bin/google-chrome-stable node index.js"
echo ""
echo "Or with PM2:"
echo "   NODE_ENV=production CHROME_BIN=/usr/bin/google-chrome-stable pm2 start index.js --name whatsApi" 