const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const logger = require('../utils/logger');
require('dotenv').config();

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const publishToQueue = async (payload) => {
  if (!process.env.SQS_QUEUE_URL || process.env.SQS_QUEUE_URL.includes('account-id')) {
    logger.info('SQS not configured, skipping queue publish');
    return;
  }
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(payload)
  });
  await sqs.send(command);
  logger.info(`SQS message sent: ${payload.notificationId}`);
};

module.exports = { publishToQueue };
