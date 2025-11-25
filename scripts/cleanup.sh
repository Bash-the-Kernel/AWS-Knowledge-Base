#!/bin/bash

# AWS Knowledge Base Cleanup Script

set -e

echo "🧹 Starting AWS Knowledge Base cleanup..."

# Get stack outputs before deletion
echo "📋 Getting stack outputs..."
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text 2>/dev/null || echo "")
UPLOADS_BUCKET=$(aws cloudformation describe-stacks --stack-name KnowledgeBaseStack --query 'Stacks[0].Outputs[?OutputKey==`UploadsBucketName`].OutputValue' --output text 2>/dev/null || echo "")

# Empty S3 buckets if they exist
if [ ! -z "$FRONTEND_BUCKET" ]; then
    echo "🗑️ Emptying frontend bucket: $FRONTEND_BUCKET"
    aws s3 rm s3://$FRONTEND_BUCKET --recursive || true
fi

if [ ! -z "$UPLOADS_BUCKET" ]; then
    echo "🗑️ Emptying uploads bucket: $UPLOADS_BUCKET"
    aws s3 rm s3://$UPLOADS_BUCKET --recursive || true
fi

# Destroy CDK stack
echo "☁️ Destroying CDK stack..."
cdk destroy --all --force

echo "✅ Cleanup complete!"
echo ""
echo "⚠️ Note: Some resources like CloudWatch logs may persist and incur minimal charges."
echo "   You can manually delete log groups from the AWS Console if needed."