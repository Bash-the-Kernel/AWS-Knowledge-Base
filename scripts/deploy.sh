#!/bin/bash

# AWS Knowledge Base Deployment Script

set -e

echo "🚀 Starting AWS Knowledge Base deployment..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Install CDK dependencies
echo "📦 Installing CDK dependencies..."
npm install

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
cd lambda
npm install
cd ..

# Build CDK
echo "🔨 Building CDK..."
npm run build

# Deploy CDK stack
echo "☁️ Deploying CDK stack..."
npm run deploy

# Get stack outputs
echo "📋 Getting stack outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text)
FRONTEND_URL=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' --output text)
REGION=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`Region`].OutputValue' --output text)

# Create frontend environment file
echo "📝 Creating frontend environment file..."
cd frontend
cat > .env << EOF
VITE_API_URL=$API_URL
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_REGION=$REGION
EOF

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Deploy frontend to S3
echo "☁️ Deploying frontend to S3..."
aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete

cd ..

echo "✅ Deployment complete!"
echo ""
echo "📋 Stack Outputs:"
echo "  API URL: $API_URL"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Region: $REGION"
echo ""
echo "🔐 To create a test user, run:"
echo "  aws cognito-idp admin-create-user \\"
echo "    --user-pool-id $USER_POOL_ID \\"
echo "    --username testuser \\"
echo "    --user-attributes Name=email,Value=test@example.com \\"
echo "    --temporary-password TempPass123! \\"
echo "    --message-action SUPPRESS"
echo ""
echo "🌐 Access your application at: $FRONTEND_URL"