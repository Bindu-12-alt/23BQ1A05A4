require('dotenv').config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const logger = require('../utils/logger');

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const processMessage = async (msg) => {
  const payload = JSON.parse(msg.Body);
  // actual socket push happens in-process via notificationSocket when notification is created
  // this worker just logs it for audit trail
  logger.info(`Push notification delivered: ${JSON.stringify(payload)}`);
};

const poll = async () => {
  while (true) {
    try {
      const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
      }));

      if (Messages) {
        for (const msg of Messages) {
          try {
            await processMessage(msg);
            await sqsClient.send(new DeleteMessageCommand({
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
