import { TextractClient, GetDocumentTextDetectionCommand } from '@aws-sdk/client-textract';

const textractClient = new TextractClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    const { jobId, bucketName, objectKey, documentId } = event;

    console.log(`Processing Textract job: ${jobId}`);

    const command = new GetDocumentTextDetectionCommand({
      JobId: jobId,
    });

    const response = await textractClient.send(command);

    if (response.JobStatus !== 'SUCCEEDED') {
      throw new Error(`Textract job failed with status: ${response.JobStatus}`);
    }

    let extractedText = '';
    const blocks = response.Blocks || [];

    for (const block of blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        extractedText += block.Text + '\n';
      }
    }

    // Clean and process text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim();

    return {
      documentId,
      bucketName,
      objectKey,
      extractedText: cleanedText,
      textLength: cleanedText.length,
    };
  } catch (error) {
    console.error('Text processing error:', error);
    throw error;
  }
};