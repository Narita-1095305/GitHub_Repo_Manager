#!/bin/bash

# GitHub Repository Manager - Environment Setup Script

echo "🔧 Setting up environment variables..."

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

echo "📝 Please enter your GitHub OAuth App credentials:"
echo ""

# Get GitHub Client ID
read -p "GitHub Client ID: " GITHUB_CLIENT_ID

# Get GitHub Client Secret (hidden input)
echo -n "GitHub Client Secret: "
read -s GITHUB_CLIENT_SECRET
echo ""

echo ""
echo "🔐 Generated JWT Secret: $JWT_SECRET"
echo ""

# Create backend .env
echo "📁 Creating backend/.env..."
cat > backend/.env << EOF
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
JWT_SECRET=$JWT_SECRET
PORT=8080
FRONTEND_URL=http://localhost:3000
EOF

# Create frontend .env.local
echo "📁 Creating frontend/.env.local..."
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
EOF

# Create root .env for Docker
echo "📁 Creating .env (for Docker)..."
cat > .env << EOF
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
JWT_SECRET=$JWT_SECRET
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
EOF

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📋 Summary:"
echo "   - backend/.env created"
echo "   - frontend/.env.local created"
echo "   - .env (Docker) created"
echo ""
echo "🚀 You can now start the application:"
echo "   Local development: make dev"
echo "   Docker development: make docker-dev"
echo ""
echo "⚠️  Remember: Never commit these .env files to git!"