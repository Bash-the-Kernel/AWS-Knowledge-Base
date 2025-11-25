import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { query } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: 'Query is required' }),
      };
    }

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

    const searchResponse = await client.search({
      index: 'documents',
      body: {
        query: {
          multi_match: {
            query,
            fields: ['text', 'filename'],
            fuzziness: 'AUTO',
          },
        },
        highlight: {
          fields: {
            text: {},
          },
        },
        size: 20,
      },
    });

    const results = searchResponse.body.hits.hits.map((hit: any) => ({
      documentId: hit._source.documentId,
      filename: hit._source.filename,
      userId: hit._source.userId,
      score: hit._score,
      highlight: hit.highlight?.text?.[0] || '',
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        results,
        total: searchResponse.body.hits.total.value,
      }),
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Search failed' }),
    };
  }
};