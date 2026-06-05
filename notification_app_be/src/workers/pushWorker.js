require('dotenv').config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const logger = require('../utils/logger');

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Push worker logs events; Socket.IO push is handled in-process via notificationSocket
const processMessage = async (message) => {
  const payload = JSON.parse(message.Body);
  logger.info(`Push notification delivered: ${JSON.stringify(payload)}`);
};

const poll = async () => {
  while (true) {
    try {
      const { Messages } = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
      }));

      if (Messages) {
        for (const msg of Messages) {
          try {
            await processMessage(msg);
            await sqs.send(new DeleteMessageCommand({
              QueueUrl: process.env.SQS_QUEUE_URL,
              ReceiptHandle: msg.ReceiptHandle
            }));
          } catch (err) {
            logger.error(`Push worker error: ${err.message}`);
          }
        }
      }
    } catch (err) {
      logger.error(`SQS poll error: ${err.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
};

poll();
