const Notification = require('../models/Notification');
const { Op } = require('sequelize');

const create = (data) => Notification.create(data);

const findByStudent = (student_id, limit, offset) =>
  Notification.findAll({
    where: { student_id },
    order: [['created_at', 'DESC']],
    limit, offset
  });

const markRead = (id) =>
  Notification.update({ is_read: true }, { where: { id }, returning: true });

const unreadCount = (student_id) =>
  Notification.count({ where: { student_id, is_read: false } });

const remove = (id) => Notification.destroy({ where: { id } });

const bulkCreate = (records) => Notification.bulkCreate(records);

module.exports = { create, findByStudent, markRead, unreadCount, remove, bulkCreate };
