import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as KnowledgeBase from '../lib/knowledge-base-stack';

test('Stack creates required resources', () => {
  const app = new cdk.App();
  const stack = new KnowledgeBase.KnowledgeBaseStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  // Test S3 buckets
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: {
      'Fn::Join': [
        '',
        [
          'aws-knowledge-base-uploads-',
          {
            Ref: 'AWS::AccountId'
          }
        ]
      ]
    }
  });

  // Test DynamoDB table
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'Documents',
    AttributeDefinitions: [
      {
        AttributeName: 'documentId',
        AttributeType: 'S'
      }
    ]
  });

  // Test Cognito User Pool
  template.hasResourceProperties('AWS::Cognito::UserPool', {
    UserPoolName: 'aws-knowledge-base-users'
  });

  // Test Lambda functions
  template.resourceCountIs('AWS::Lambda::Function', 5);

  // Test Step Functions
  template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

  // Test API Gateway
  template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
});