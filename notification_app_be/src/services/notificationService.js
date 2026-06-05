const { v4: uuidv4 } = require('uuid');
const repo = require('../repositories/notificationRepository');
const redisClient = require('../config/redis');
const { publishToQueue } = require('../queues/sqsProducer');
const Student = require('../models/Student');
const logger = require('../utils/logger');

const createNotification = async ({ type, title, message, targetAudience }) => {
  const notificationId = uuidv4();

  if (targetAudience === 'all') {
    const students = await Student.findAll({ attributes: ['id'] });
    const records = students.map((s) => ({
      id: uuidv4(), student_id: s.id,
      notification_type: type, title, message
    }));
    await repo.bulkCreate(records);

    await publishToQueue({ notificationId, studentIds: students.map(s => s.id), type, title, message });
    await redisClient.del('notifications:all');
  } else {
    await repo.create({ id: notificationId, student_id: targetAudience, notification_type: type, title, message });
    await publishToQueue({ notificationId, studentIds: [targetAudience], type, title, message });
    await redisClient.del(`notifications:${targetAudience}`);
  }

  return { notificationId, status: 'created' };
};

const getNotifications = async (studentId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const cacheKey = `notifications:${studentId}:${page}:${limit}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const data = await repo.findByStudent(studentId, parseInt(limit), parseInt(offset));
  await redisClient.setEx(cacheKey, 60, JSON.stringify(data));
  return data;
};

const markRead = async (notificationId) => {
  const [count, rows] = await repo.markRead(notificationId);
  if (!count) return null;
  await redisClient.del(`notifications:${rows[0].student_id}`);
  return { status: 'marked as read' };
};

const getUnreadCount = async (studentId) => {
  const cacheKey = `unread:${studentId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return { unreadCount: parseInt(cached) };
  const count = await repo.unreadCount(studentId);
  await redisClient.setEx(cacheKey, 30, String(count));
  return { unreadCount: count };
};

const deleteNotification = async (notificationId) => {
  const count = await repo.remove(notificationId);
  if (!count) return null;
  return { status: 'deleted' };
};

module.exports = { createNotification, getNotifications, markRead, getUnreadCount, deleteNotification };
