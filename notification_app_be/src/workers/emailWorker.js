require('dotenv').config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const nodemailer = require('nodemailer');
const Student = require('../models/Student');
const logger = require('../utils/logger');

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const processMessage = async (msg) => {
  const { studentIds, title, type, message: body } = JSON.parse(msg.Body);
  const studentList = await Student.findAll({ where: { id: studentIds }, attributes: ['email'] });
  console.log(`[debug] emailing ${studentList.length} students`);

  for (const student of studentList) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: `[${type}] ${title}`,
      text: body
    });
  }
  logger.info(`Emails sent for ${studentIds.length} students`);
};

const poll = async () => {
  while (true) {
    try {
      const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        // long polling so we're not hammering SQS with empty requests
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
            logger.error(`Email worker error: ${err.message}`);
          }
        }
      }
    } catch (err) {
      logger.error(`SQS poll error: ${err.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
};

const sequelize = require('../config/db');
sequelize.authenticate().then(poll);
