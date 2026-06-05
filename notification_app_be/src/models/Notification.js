const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.BIGINT, allowNull: false },
  notification_type: { type: DataTypes.STRING(20) },
  title: { type: DataTypes.TEXT },
  message: { type: DataTypes.TEXT },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'notifications',
  timestamps: false,
  indexes: [
    { fields: ['student_id', 'is_read', 'created_at'] },
    { fields: ['notification_type', 'created_at'] }
  ]
});

module.exports = Notification;
