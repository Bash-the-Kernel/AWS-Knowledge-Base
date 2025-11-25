import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export const handler = async (event: any) => {
  try {
    const { documentId, extractedText, objectKey } = event;

    console.log(`Indexing document: ${documentId}`);

    const client = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION!,
        service: 'aoss',
        getCredentials: () => {
          const credentialsProvider = defaultProvider();
          return credentialsProvider();
        },
      }),
      node: process.env.OPENSEARCH_ENDPOINT,
    });

    // Create index if it doesn't exist
    try {
      await client.indices.create({
        index: 'documents',
        body: {
          mappings: {
            properties: {
              documentId: { type: 'keyword' },
              text: { type: 'text' },
              filename: { type: 'text' },
              userId: { type: 'keyword' },
              timestamp: { type: 'date' },
            },
          },
        },
      });
    } catch (error) {
      // Index might already exist, ignore error
      console.log('Index creation result:', error);
    }

    // Index the document
    await client.index({
      index: 'documents',
      id: documentId,
      body: {
        documentId,
        text: extractedText,
        filename: objectKey.split('/').pop(),
        userId: 'system', // In real app, extract from JWT token
        timestamp: new Date().toISOString(),
      },
    });

    return {
      documentId,
      indexed: true,
      textLength: extractedText.length,
    };
  } catch (error) {
    console.error('OpenSearch indexing error:', error);
    throw error;
  }
};