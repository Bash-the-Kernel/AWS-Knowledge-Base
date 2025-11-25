import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    const { documentId, objectKey, textLength } = event;

    console.log(`Saving metadata for document: ${documentId}`);

    const command = new PutItemCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Item: {
        documentId: { S: documentId },
        filename: { S: objectKey.split('/').pop() || objectKey },
        userId: { S: 'system' }, // In real app, extract from JWT token
        timestamp: { S: new Date().toISOString() },
        textLength: { N: textLength.toString() },
        indexStatus: { S: 'completed' },
      },
    });

    await dynamoClient.send(command);

    return {
      documentId,
      metadataSaved: true,
    };
  } catch (error) {
    console.error('Metadata save error:', error);
    throw error;
  }
};