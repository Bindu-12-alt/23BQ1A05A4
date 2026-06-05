const service = require('../services/notificationService');
const { getPriorityInbox } = require('../services/priorityInboxService');

const createNotification = async (req, res, next) => {
  try {
    const result = await service.createNotification(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { page, limit } = req.query;
    const notifications = await service.getNotifications(studentId, page, limit);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const result = await service.markRead(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const countData = await service.getUnreadCount(req.params.studentId);
    res.json(countData);
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const result = await service.deleteNotification(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const priorityInbox = async (req, res, next) => {
  try {
    // default to top 10 if n not passed in query
    const topN = parseInt(req.query.n) || 10;
    const data = await getPriorityInbox(topN);
    res.json({ notifications: data });
  } catch (err) {
    next(err);
  }
};

module.exports = { createNotification, getNotifications, markRead, getUnreadCount, deleteNotification, priorityInbox };
