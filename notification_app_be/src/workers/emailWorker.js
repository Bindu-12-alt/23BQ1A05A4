require('dotenv').config();
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const nodemailer = require('nodemailer');
const Student = require('../models/Student');
const logger = require('../utils/logger');

const sqs = new SQSClient({
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

const processMessage = async (message) => {
  const { studentIds, title, type, message: body } = JSON.parse(message.Body);
  const students = await Student.findAll({ where: { id: studentIds }, attributes: ['email'] });

  for (const student of students) {
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
