const { v4: uuidv4 } = require('uuid');
const repo = require('../repositories/notificationRepository');
const redisClient = require('../config/redis');
const { publishToQueue } = require('../queues/sqsProducer');
const Student = require('../models/Student');
const logger = require('../utils/logger');

const createNotification = async ({ type, title, message, targetAudience }) => {
  const notifId = uuidv4();

  if (targetAudience === 'all') {
    // fetch only IDs, no point pulling full student rows just to send notifications
    const allStudents = await Student.findAll({ attributes: ['id'] });
    console.log(`[debug] sending to ${allStudents.length} students`);

    const records = allStudents.map((s) => ({
      id: uuidv4(),
      student_id: s.id,
      notification_type: type,
      title,
      message
    }));
    await repo.bulkCreate(records);

    // push to SQS so email/push workers can pick it up async
    await publishToQueue({ notificationId: notifId, studentIds: allStudents.map(s => s.id), type, title, message });
    await redisClient.del('notifications:all');
  } else {
    await repo.create({ id: notifId, student_id: targetAudience, notification_type: type, title, message });
    await publishToQueue({ notificationId: notifId, studentIds: [targetAudience], type, title, message });
    // clear this student's cache so next fetch is fresh
    await redisClient.del(`notifications:${targetAudience}`);
  }

  return { notificationId: notifId, status: 'created' };
};

const getNotifications = async (studentId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const cacheKey = `notifications:${studentId}:${page}:${limit}`;

  // tried without cache first, DB was getting hammered on every page load
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  const data = await repo.findByStudent(studentId, parseInt(limit), parseInt(offset));
  await redisClient.setEx(cacheKey, 60, JSON.stringify(data));
  return data;
};

const markRead = async (notificationId) => {
  const [updatedCount, updatedRows] = await repo.markRead(notificationId);
  if (!updatedCount) return null;
  // bust the cache for this student so unread count updates immediately
  await redisClient.del(`notifications:${updatedRows[0].student_id}`);
  return { status: 'marked as read' };
};

const getUnreadCount = async (studentId) => {
  const cacheKey = `unread:${studentId}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return { unreadCount: parseInt(cached) };

  const count = await repo.unreadCount(studentId);
  // 30 sec TTL because unread count changes more frequently than full list
  await redisClient.setEx(cacheKey, 30, String(count));
  return { unreadCount: count };
};

const deleteNotification = async (notificationId) => {
  const deletedCount = await repo.remove(notificationId);
  if (!deletedCount) return null;
  return { status: 'deleted' };
};

module.exports = { createNotification, getNotifications, markRead, getUnreadCount, deleteNotification };
