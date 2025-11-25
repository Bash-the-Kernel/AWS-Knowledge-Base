# AWS Knowledge Base - Project Overview

## 🎯 Project Summary

A complete, production-ready serverless AWS Knowledge Base application that allows users to:
- Upload PDF/TXT documents via secure presigned URLs
- Automatically extract text using Amazon Textract
- Index content in OpenSearch Serverless for fast search
- Search through documents with highlighted results
- Manage authentication via Amazon Cognito

## ✅ Requirements Fulfilled

### Frontend Requirements
- ✅ React + Vite with TypeScript
- ✅ AWS Amplify Auth UI integration
- ✅ Axios for API communication
- ✅ TailwindCSS for styling
- ✅ Login/logout with session persistence
- ✅ Document upload interface
- ✅ Search interface with results display

### Backend Requirements
- ✅ Node.js 20 Lambda functions
- ✅ API Gateway REST endpoints
- ✅ DynamoDB for metadata storage
- ✅ S3 for document storage
- ✅ Step Functions workflow orchestration
- ✅ Amazon Textract for text extraction
- ✅ OpenSearch Serverless for search indexing
- ✅ Amazon Cognito for authentication
- ✅ CloudWatch logging throughout

### Infrastructure Requirements
- ✅ AWS CDK v2 with TypeScript
- ✅ All required AWS services configured
- ✅ IAM least-privilege roles
- ✅ CloudFront distribution for frontend
- ✅ Proper CORS configuration
- ✅ Environment variable outputs

### DevOps Requirements
- ✅ GitHub Actions workflows (build.yml, deploy.yml)
- ✅ Automated testing setup
- ✅ Deployment scripts
- ✅ Cleanup scripts

## 🏗️ Architecture Components

### 1. Authentication Layer
- **Cognito User Pool**: User management and authentication
- **Amplify Auth UI**: Embedded login/signup interface
- **JWT Token Handling**: Automatic session management

### 2. Upload Flow
```
Frontend → API Gateway → Lambda (get-upload-url) → S3 Presigned URL
                                                   ↓
S3 Object Created → Step Functions Trigger → Document Processing Workflow
```

### 3. Document Processing Workflow (Step Functions)
```
1. Textract Start → Start document text detection job
2. Wait → 30-second wait for job completion
3. Process Text → Retrieve and clean extracted text
4. Index to OpenSearch → Store searchable content
5. Save Metadata → Store document info in DynamoDB
```

### 4. Search Flow
```
Frontend → API Gateway → Lambda (search) → OpenSearch Serverless → Results
```

### 5. Frontend Hosting
```
React Build → S3 Static Hosting → CloudFront CDN → Users
```

## 📁 File Structure

```
AWS-Knowledge-Base/
├── 📁 bin/                    # CDK app entry point
├── 📁 lib/                    # CDK stack definitions
├── 📁 lambda/                 # All Lambda function code
│   ├── get-upload-url.ts      # S3 presigned URL generation
│   ├── search.ts              # OpenSearch query handler
│   ├── textract-start.ts      # Textract job initiation
│   ├── process-text.ts        # Text processing and cleanup
│   ├── index-to-opensearch.ts # OpenSearch indexing
│   └── save-metadata.ts       # DynamoDB metadata storage
├── 📁 frontend/               # React application
│   ├── 📁 src/components/     # React components
│   │   ├── Dashboard.tsx      # Main dashboard with tabs
│   │   ├── FileUpload.tsx     # Document upload interface
│   │   └── SearchInterface.tsx # Search and results display
│   └── 📁 public/             # Static assets
├── 📁 .github/workflows/      # CI/CD pipelines
├── 📁 scripts/                # Deployment and cleanup scripts
├── 📁 test/                   # CDK unit tests
└── 📄 README.md               # Comprehensive documentation
```

## 🔧 Key Features Implemented

### Security
- **IAM Least Privilege**: Each Lambda has minimal required permissions
- **Cognito Authentication**: Secure user management
- **Presigned URLs**: Secure direct S3 uploads
- **CORS Configuration**: Proper cross-origin resource sharing

### Performance
- **Serverless Architecture**: Auto-scaling and cost-effective
- **CloudFront CDN**: Fast global content delivery
- **OpenSearch Serverless**: Efficient full-text search
- **Step Functions**: Reliable workflow orchestration

### User Experience
- **Responsive Design**: TailwindCSS responsive components
- **Real-time Feedback**: Upload progress and search results
- **Error Handling**: Comprehensive error messages
- **Session Persistence**: Automatic login state management

### Developer Experience
- **TypeScript**: Full type safety across all components
- **CDK Infrastructure**: Declarative infrastructure as code
- **Automated Testing**: Jest test framework setup
- **CI/CD Pipelines**: GitHub Actions for build and deploy
- **Comprehensive Documentation**: Detailed setup and usage guides

## 🚀 Deployment Process

1. **Infrastructure Deployment**: CDK deploys all AWS resources
2. **Lambda Packaging**: Automatic bundling with esbuild
3. **Frontend Build**: Vite builds optimized React bundle
4. **S3 Upload**: Frontend deployed to S3 with CloudFront
5. **Configuration**: Environment variables automatically configured

## 💰 Cost Optimization

Designed for AWS Free Tier usage:
- **Lambda**: 1M free requests/month
- **API Gateway**: 1M free requests/month  
- **DynamoDB**: 25GB free storage
- **S3**: 5GB free storage
- **Textract**: 1,000 pages free/month
- **CloudFront**: 1TB free data transfer/month

## 🧪 Testing Strategy

- **Unit Tests**: CDK stack validation
- **Integration Tests**: API endpoint testing
- **End-to-End**: Full workflow validation
- **CI Pipeline**: Automated testing on every commit

## 📊 Monitoring & Observability

- **CloudWatch Logs**: Structured logging in all Lambda functions
- **Step Functions Monitoring**: Workflow execution tracking
- **API Gateway Metrics**: Request/response monitoring
- **Error Tracking**: Comprehensive error handling and logging

## 🔄 Workflow States

The Step Functions workflow handles the complete document processing pipeline:

1. **STARTED**: Document uploaded to S3
2. **TEXTRACT_INITIATED**: Text extraction job started
3. **PROCESSING**: Waiting for Textract completion
4. **TEXT_EXTRACTED**: Raw text retrieved and cleaned
5. **INDEXED**: Content stored in OpenSearch
6. **COMPLETED**: Metadata saved to DynamoDB

## 🎨 UI Components

### Dashboard
- Tab-based navigation between Upload and Search
- Responsive design for mobile and desktop
- Clean, professional interface

### File Upload
- Drag-and-drop file selection
- File type validation (PDF/TXT only)
- Upload progress indication
- Success/error messaging

### Search Interface
- Real-time search input
- Highlighted search results
- Document metadata display
- Relevance scoring

This project represents a complete, production-ready serverless application demonstrating AWS best practices, modern frontend development, and comprehensive DevOps practices.