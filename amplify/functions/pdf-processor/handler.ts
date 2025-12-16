import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
  // Placeholder handler implementation
  console.log('PDF Processor Lambda invoked', { event, context });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'PDF Processor Lambda - Handler placeholder',
    }),
  };
};
