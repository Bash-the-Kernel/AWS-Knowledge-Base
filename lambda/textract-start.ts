import { TextractClient, StartDocumentTextDetectionCommand } from '@aws-sdk/client-textract';

const textractClient = new TextractClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    const s3Event = event.Records[0].s3;
    const bucketName = s3Event.bucket.name;
    const objectKey = decodeURIComponent(s3Event.object.key.replace(/\+/g, ' '));

    console.log(`Starting Textract for: ${bucketName}/${objectKey}`);

    const command = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucketName,
          Name: objectKey,
        },
      },
    });

    const response = await textractClient.send(command);

    return {
      jobId: response.JobId,
      bucketName,
      objectKey,
      documentId: objectKey.split('/').pop()?.split('-').slice(1).join('-') || objectKey,
    };
  } catch (error) {
    console.error('Textract start error:', error);
    throw error;
  }
};