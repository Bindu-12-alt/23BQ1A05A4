const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.BIGINT, primaryKey: true },
  email: { type: DataTypes.STRING(255), allowNull: false },
  name: { type: DataTypes.STRING(255) }
}, { tableName: 'students', timestamps: false });

module.exports = Student;
