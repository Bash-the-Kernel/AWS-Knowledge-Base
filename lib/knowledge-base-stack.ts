import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export class KnowledgeBaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const projectName = 'aws-knowledge-base';

    // S3 Bucket for uploads
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `${projectName}-uploads-${this.account}`,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket for frontend hosting
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${projectName}-frontend-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table
    const documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: 'Documents',
      partitionKey: { name: 'documentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${projectName}-users`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // OpenSearch Serverless Collection
    const opensearchCollection = new opensearch.CfnCollection(this, 'DocumentSearchCollection', {
      name: 'document-search',
      type: 'SEARCH',
    });

    // OpenSearch access policy
    const opensearchAccessPolicy = new opensearch.CfnAccessPolicy(this, 'OpenSearchAccessPolicy', {
      name: 'document-search-access',
      type: 'data',
      policy: JSON.stringify([{
        Rules: [{
          ResourceType: 'collection',
          Resource: [`collection/document-search`],
          Permission: ['aoss:*']
        }, {
          ResourceType: 'index',
          Resource: [`index/document-search/*`],
          Permission: ['aoss:*']
        }],
        Principal: [`arn:aws:iam::${this.account}:root`]
      }])
    });

    // OpenSearch network policy
    const opensearchNetworkPolicy = new opensearch.CfnSecurityPolicy(this, 'OpenSearchNetworkPolicy', {
      name: 'document-search-network',
      type: 'network',
      policy: JSON.stringify([{
        Rules: [{
          ResourceType: 'collection',
          Resource: [`collection/document-search`]
        }],
        AllowFromPublic: true
      }])
    });

    // OpenSearch encryption policy
    const opensearchEncryptionPolicy = new opensearch.CfnSecurityPolicy(this, 'OpenSearchEncryptionPolicy', {
      name: 'document-search-encryption',
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [{
          ResourceType: 'collection',
          Resource: [`collection/document-search`]
        }],
        AWSOwnedKey: true
      })
    });

    opensearchCollection.addDependency(opensearchAccessPolicy);
    opensearchCollection.addDependency(opensearchNetworkPolicy);
    opensearchCollection.addDependency(opensearchEncryptionPolicy);

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
              resources: [documentsTable.tableArn],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${uploadsBucket.bucketArn}/*`],
            }),
          ],
        }),
        TextractAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'textract:StartDocumentTextDetection',
                'textract:GetDocumentTextDetection',
              ],
              resources: ['*'],
            }),
          ],
        }),
        OpenSearchAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['aoss:*'],
              resources: [`${opensearchCollection.attrArn}/*`],
            }),
          ],
        }),
      },
    });

    // Lambda functions
    const getUploadUrlFunction = new lambda.Function(this, 'GetUploadUrlFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get-upload-url.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      environment: {
        BUCKET_NAME: uploadsBucket.bucketName,
      },
    });

    const searchFunction = new lambda.Function(this, 'SearchFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'search.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      environment: {
        OPENSEARCH_ENDPOINT: opensearchCollection.attrCollectionEndpoint,
        DOCUMENTS_TABLE: documentsTable.tableName,
      },
    });

    const textractStartFunction = new lambda.Function(this, 'TextractStartFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'textract-start.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
    });

    const processTextFunction = new lambda.Function(this, 'ProcessTextFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'process-text.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
    });

    const indexToOpenSearchFunction = new lambda.Function(this, 'IndexToOpenSearchFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index-to-opensearch.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      environment: {
        OPENSEARCH_ENDPOINT: opensearchCollection.attrCollectionEndpoint,
      },
      timeout: cdk.Duration.minutes(5),
    });

    const saveMetadataFunction = new lambda.Function(this, 'SaveMetadataFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'save-metadata.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      environment: {
        DOCUMENTS_TABLE: documentsTable.tableName,
      },
    });

    // Step Functions State Machine
    const textractStartTask = new sfnTasks.LambdaInvoke(this, 'TextractStartTask', {
      lambdaFunction: textractStartFunction,
      outputPath: '$.Payload',
    });

    const waitForTextract = new stepfunctions.Wait(this, 'WaitForTextract', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(30)),
    });

    const processTextTask = new sfnTasks.LambdaInvoke(this, 'ProcessTextTask', {
      lambdaFunction: processTextFunction,
      outputPath: '$.Payload',
    });

    const indexTask = new sfnTasks.LambdaInvoke(this, 'IndexTask', {
      lambdaFunction: indexToOpenSearchFunction,
      outputPath: '$.Payload',
    });

    const saveMetadataTask = new sfnTasks.LambdaInvoke(this, 'SaveMetadataTask', {
      lambdaFunction: saveMetadataFunction,
    });

    const definition = textractStartTask
      .next(waitForTextract)
      .next(processTextTask)
      .next(indexTask)
      .next(saveMetadataTask);

    const stateMachine = new stepfunctions.StateMachine(this, 'DocumentProcessingStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(30),
    });

    // S3 notification to trigger Step Functions
    uploadsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SfnDestination(stateMachine)
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'KnowledgeBaseApi', {
      restApiName: 'Knowledge Base API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': '{"status": "healthy"}',
        },
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }), {
      methodResponses: [{ statusCode: '200' }],
    });

    const uploadUrlResource = api.root.addResource('upload-url');
    uploadUrlResource.addMethod('POST', new apigateway.LambdaIntegration(getUploadUrlFunction));

    const searchResource = api.root.addResource('search');
    searchResource.addMethod('POST', new apigateway.LambdaIntegration(searchFunction));

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [{
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
      }],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: 'UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      exportName: 'ApiUrl',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      exportName: 'FrontendUrl',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      exportName: 'FrontendBucketName',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      exportName: 'Region',
    });
  }
}