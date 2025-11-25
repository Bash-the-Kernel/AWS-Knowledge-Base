# AWS Knowledge Base

A fully serverless, zero-cost AWS-based Knowledge Base where users can upload documents (PDF, TXT), extract text using Amazon Textract, index content in OpenSearch Serverless, and search through documents using a React frontend.

## Architecture

```
User → React Frontend → API Gateway → Lambda Functions
                                    ↓
S3 Upload → Step Functions → Textract → OpenSearch Serverless
                          ↓
                      DynamoDB (Metadata)
```

## Tech Stack

### Frontend
- React + Vite
- TypeScript
- AWS Amplify Auth UI
- Axios for API calls
- TailwindCSS for UI

### Backend
- Node.js 20 Lambda functions
- API Gateway REST
- DynamoDB
- S3
- Step Functions
- Amazon Textract
- Amazon OpenSearch Serverless
- Amazon Cognito
- CloudWatch logging

### Infrastructure
- AWS CDK v2 (TypeScript)
- CloudFront + S3 hosting for frontend

## Prerequisites

- Node.js 20+
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS Account with appropriate permissions

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd AWS-Knowledge-Base

# Install CDK dependencies
npm install

# Install Lambda dependencies
cd lambda
npm install
cd ..

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Deploy Infrastructure

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy all stacks
npm run deploy
```

### 3. Get Stack Outputs

After deployment, note the outputs:
- `UserPoolId`
- `UserPoolClientId`
- `ApiUrl`
- `FrontendBucketName`
- `FrontendUrl`
- `Region`

### 4. Build and Deploy Frontend

```bash
cd frontend

# Create environment file
cat > .env << EOF
VITE_USER_POOL_ID=<UserPoolId>
VITE_USER_POOL_CLIENT_ID=<UserPoolClientId>
VITE_API_URL=<ApiUrl>
VITE_REGION=<Region>
EOF

# Build frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://<FrontendBucketName>/ --delete
```

### 5. Create Test User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <UserPoolId> \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

## Usage

1. **Access the Application**: Navigate to the CloudFront URL from the stack outputs
2. **Login**: Use the test user credentials (you'll be prompted to change password on first login)
3. **Upload Documents**: 
   - Click "Upload Documents" tab
   - Select a PDF or TXT file
   - Click "Upload Document"
   - Processing will begin automatically via Step Functions
4. **Search Documents**:
   - Click "Search Documents" tab
   - Enter search terms
   - View results with highlights

## API Endpoints

- `GET /health` - Health check
- `POST /upload-url` - Get presigned S3 upload URL
- `POST /search` - Search indexed documents

## Step Functions Workflow

1. **S3 Trigger** → Document uploaded to S3
2. **Textract Start** → Start document text detection
3. **Wait** → Wait for Textract job completion
4. **Process Text** → Clean and process extracted text
5. **Index to OpenSearch** → Index document content
6. **Save Metadata** → Store metadata in DynamoDB

## Project Structure

```
AWS-Knowledge-Base/
├── bin/
│   └── app.ts                 # CDK app entry point
├── lib/
│   └── knowledge-base-stack.ts # Main CDK stack
├── lambda/
│   ├── get-upload-url.ts      # Generate S3 presigned URLs
│   ├── search.ts              # Search OpenSearch
│   ├── textract-start.ts      # Start Textract job
│   ├── process-text.ts        # Process extracted text
│   ├── index-to-opensearch.ts # Index to OpenSearch
│   ├── save-metadata.ts       # Save to DynamoDB
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── SearchInterface.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── config.ts
│   ├── package.json
│   └── vite.config.ts
├── .github/
│   └── workflows/
│       ├── build.yml          # CI workflow
│       └── deploy.yml         # CD workflow
├── package.json
├── cdk.json
└── README.md
```

## Environment Variables

### Frontend (.env)
```
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_REGION=us-east-1
```

## Cost Optimization

This project is designed to run on AWS Free Tier:

- **Lambda**: 1M free requests/month
- **API Gateway**: 1M free requests/month
- **DynamoDB**: 25GB free storage
- **S3**: 5GB free storage
- **OpenSearch Serverless**: Pay per use (minimal for testing)
- **Textract**: 1,000 pages free/month
- **CloudFront**: 1TB free data transfer/month

## Security Features

- **IAM Least Privilege**: Each Lambda has minimal required permissions
- **Cognito Authentication**: Secure user authentication
- **CORS Configuration**: Proper CORS setup for API Gateway
- **S3 Security**: Presigned URLs for secure uploads
- **OpenSearch Security**: IAM-based access control

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Error**
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

2. **Lambda Dependencies**
   ```bash
   cd lambda && npm install
   ```

3. **Frontend Build Issues**
   ```bash
   cd frontend && npm install && npm run build
   ```

4. **OpenSearch Index Creation**
   - Index is created automatically on first document upload
   - Check CloudWatch logs if indexing fails

### Logs

- **Lambda Logs**: CloudWatch → Log Groups → `/aws/lambda/function-name`
- **Step Functions**: Step Functions Console → Executions
- **API Gateway**: CloudWatch → Log Groups → API Gateway logs

## Development

### Local Development

```bash
# Watch CDK changes
npm run watch

# Run frontend locally
cd frontend
npm run dev
```

### Testing

```bash
# Run CDK tests
npm test

# Test Lambda functions locally
cd lambda
npm test
```

## Cleanup

To avoid charges, destroy all resources:

```bash
# Empty S3 buckets first (if not using auto-delete)
aws s3 rm s3://BUCKET-NAME --recursive

# Destroy CDK stack
cdk destroy --all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review CloudWatch logs
3. Open an issue on GitHub

---

**Note**: This project is designed for educational and development purposes. For production use, consider additional security hardening, monitoring, and backup strategies.